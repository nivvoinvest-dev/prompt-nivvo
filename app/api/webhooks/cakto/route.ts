import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function criarSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Variáveis do Supabase não configuradas na Vercel."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function criarResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada na Vercel."
    );
  }

  return new Resend(apiKey);
}

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

function gerarSenhaAleatoria() {
  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  let senha = "";

  for (let i = 0; i < 14; i++) {
    const indice = Math.floor(
      Math.random() * caracteres.length
    );

    senha += caracteres[indice];
  }

  return senha;
}

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /*
     * ============================================================
     * SEGURANÇA DO WEBHOOK
     * ============================================================
     */

    const secretRecebida = body?.secret;
    const secretEsperada =
      process.env.CAKTO_WEBHOOK_SECRET;

    if (!secretEsperada) {
      console.error(
        "CAKTO_WEBHOOK_SECRET não configurada."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Webhook não configurado.",
        },
        { status: 500 }
      );
    }

    if (
      typeof secretRecebida !== "string" ||
      secretRecebida !== secretEsperada
    ) {
      console.error(
        "Webhook Cakto rejeitado: chave inválida."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Não autorizado.",
        },
        { status: 401 }
      );
    }

    /*
     * ============================================================
     * DADOS DO EVENTO
     * ============================================================
     */

    const event = body?.event;

    const email =
      typeof body?.data?.customer?.email === "string"
        ? normalizarEmail(
            body.data.customer.email
          )
        : "";

    if (!event || !email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Evento ou e-mail do cliente não encontrado.",
        },
        { status: 400 }
      );
    }

    /*
     * ============================================================
     * TESTE INTERNO DA CAKTO
     *
     * A Cakto usa e-mails example.com nos testes.
     * O Resend rejeita esses domínios.
     *
     * Por isso confirmamos o webhook sem enviar e-mail.
     * ============================================================
     */

    const dominioTeste =
      email.endsWith("@example.com") ||
      email.endsWith("@example.org") ||
      email.endsWith("@example.net");

    if (dominioTeste) {
      console.log(
        `Teste da Cakto detectado para ${email}.`
      );

      return NextResponse.json(
        {
          success: true,
          test: true,
          message:
            "Teste da Cakto recebido com sucesso. E-mail fictício ignorado.",
          email,
          event,
        },
        { status: 200 }
      );
    }

    const supabaseAdmin = criarSupabaseAdmin();

    /*
     * ============================================================
     * COMPRA APROVADA
     * ============================================================
     */

    if (event === "purchase_approved") {
      /*
       * 1. Procurar usuário no Authentication.
       *
       * Usamos listUsers porque é compatível com a versão
       * do supabase-js utilizada pelo projeto.
       */

      const {
        data: usuarios,
        error: buscaAuthError,
      } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (buscaAuthError) {
        console.error(
          "Erro ao procurar usuário no Authentication:",
          buscaAuthError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Não foi possível verificar o usuário.",
          },
          { status: 500 }
        );
      }

      const usuarioExistente =
        usuarios.users.find(
          (usuario) =>
            usuario.email?.trim().toLowerCase() ===
            email
        );

      let usuarioCriado = false;
      let senhaTemporaria = "";

      /*
       * 2. Criar usuário se ele ainda não existir.
       */

      if (!usuarioExistente) {
        senhaTemporaria =
          gerarSenhaAleatoria();

        const {
          data: novoUsuario,
          error: usuarioError,
        } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: senhaTemporaria,
            email_confirm: true,
          });

        if (
          usuarioError ||
          !novoUsuario?.user
        ) {
          console.error(
            "Erro ao criar usuário:",
            usuarioError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                usuarioError?.message ||
                "Não foi possível criar o usuário.",
            },
            { status: 500 }
          );
        }

        usuarioCriado = true;

        console.log(
          `Usuário criado no Supabase: ${email}`
        );
      }

      /*
       * 3. Consultar acesso atual.
       */

      const {
        data: acessoExistente,
        error: acessoConsultaError,
      } =
        await supabaseAdmin
          .from("user_access")
          .select(
            "id, email, active, role"
          )
          .eq("email", email)
          .maybeSingle();

      if (acessoConsultaError) {
        console.error(
          "Erro ao consultar user_access:",
          acessoConsultaError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Não foi possível verificar o acesso.",
          },
          { status: 500 }
        );
      }

      const roleFinal =
        acessoExistente?.role || "user";

      /*
       * 4. Liberar acesso.
       */

      const {
        data: acessoFinal,
        error: acessoUpsertError,
      } =
        await supabaseAdmin
          .from("user_access")
          .upsert(
            {
              email,
              active: true,
              role: roleFinal,
            },
            {
              onConflict: "email",
            }
          )
          .select(
            "id, email, active, role"
          )
          .single();

      if (
        acessoUpsertError ||
        !acessoFinal
      ) {
        console.error(
          "Erro ao sincronizar user_access:",
          acessoUpsertError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              acessoUpsertError?.message ||
              "Não foi possível liberar o acesso.",
          },
          { status: 500 }
        );
      }

      /*
       * 5. Configurar remetente do Resend.
       */

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://www.knightslab.com.br";

      const fromEmail =
        process.env.RESEND_FROM_EMAIL;

      if (!fromEmail) {
        console.error(
          "RESEND_FROM_EMAIL não configurada na Vercel."
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "RESEND_FROM_EMAIL não configurada na Vercel.",
          },
          { status: 500 }
        );
      }

      /*
       * 6. Enviar e-mail.
       */

      const resend = criarResend();

      let htmlEmail = "";

      if (usuarioCriado) {
        htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu acesso NIVVO</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:12px;
    padding:40px;
  ">

    <h1 style="
      margin-top:0;
      color:#111111;
    ">
      Seu acesso foi liberado!
    </h1>

    <p style="
      color:#444444;
      font-size:16px;
      line-height:1.6;
    ">
      Olá! Sua compra foi confirmada e
      seu acesso à NIVVO já está disponível.
    </p>

    <div style="
      background:#f4f4f4;
      border-radius:8px;
      padding:20px;
      margin:25px 0;
    ">

      <p style="margin:0 0 15px 0;">
        <strong>E-mail:</strong><br>
        ${escaparHtml(email)}
      </p>

      <p style="margin:0;">
        <strong>Senha:</strong><br>
        ${escaparHtml(senhaTemporaria)}
      </p>

    </div>

    <p style="
      color:#444444;
      font-size:15px;
      line-height:1.6;
    ">
      Clique no botão abaixo para acessar sua área.
    </p>

    <div style="
      text-align:center;
      margin:30px 0;
    ">

      <a
        href="${siteUrl}/login"
        style="
          display:inline-block;
          background:#0f9d8a;
          color:#ffffff;
          text-decoration:none;
          padding:15px 25px;
          border-radius:8px;
          font-weight:bold;
        "
      >
        Acessar minha área
      </a>

    </div>

    <p style="
      color:#777777;
      font-size:13px;
      line-height:1.5;
    ">
      Recomendamos que você altere sua senha
      depois do primeiro acesso.
    </p>

  </div>

</body>
</html>
        `;
      } else {
        htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso NIVVO</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:12px;
    padding:40px;
  ">

    <h1 style="
      margin-top:0;
      color:#111111;
    ">
      Seu acesso está liberado!
    </h1>

    <p style="
      color:#444444;
      font-size:16px;
      line-height:1.6;
    ">
      Sua compra foi confirmada e seu acesso
      à NIVVO continua ativo.
    </p>

    <div style="
      text-align:center;
      margin:30px 0;
    ">

      <a
        href="${siteUrl}/login"
        style="
          display:inline-block;
          background:#0f9d8a;
          color:#ffffff;
          text-decoration:none;
          padding:15px 25px;
          border-radius:8px;
          font-weight:bold;
        "
      >
        Acessar minha área
      </a>

    </div>

    <p style="
      color:#777777;
      font-size:13px;
    ">
      Use seu e-mail e sua senha já cadastrados.
    </p>

  </div>

</body>
</html>
        `;
      }

      const {
        data: emailEnviado,
        error: emailError,
      } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: usuarioCriado
          ? "Seu acesso à NIVVO foi liberado"
          : "Seu acesso à NIVVO está ativo",
        html: htmlEmail,
      });

      if (emailError) {
        console.error(
          "Erro ao enviar e-mail pelo Resend:",
          emailError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              emailError.message ||
              "Não foi possível enviar o e-mail de acesso.",
          },
          { status: 500 }
        );
      }

      console.log(
        `E-mail de acesso enviado para: ${email}`,
        emailEnviado
      );

      /*
       * 7. Resposta final.
       */

      return NextResponse.json(
        {
          success: true,
          message:
            "Compra aprovada, acesso liberado e e-mail enviado.",
          email,
          usuario_criado: usuarioCriado,
          acesso: acessoFinal,
          email_enviado: true,
        },
        { status: 200 }
      );
    }

    /*
     * ============================================================
     * REEMBOLSO / CHARGEBACK
     * ============================================================
     */

    if (
      event === "refund" ||
      event === "chargeback"
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from("user_access")
          .update({
            active: false,
          })
          .eq("email", email)
          .select(
            "id, email, active, role"
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Erro ao bloquear acesso pela Cakto:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Não foi possível bloquear o acesso.",
          },
          { status: 500 }
        );
      }

      console.log(
        `Acesso bloqueado pela Cakto para: ${email}`
      );

      return NextResponse.json(
        {
          success: true,
          message: "Acesso bloqueado.",
          email,
          acesso: data,
        },
        { status: 200 }
      );
    }

    /*
     * ============================================================
     * EVENTO NÃO TRATADO
     * ============================================================
     */

    console.log(
      `Evento Cakto recebido sem ação: ${event}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Evento recebido.",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro ao processar webhook da Cakto:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao processar webhook.",
      },
      { status: 500 }
    );
  }
}