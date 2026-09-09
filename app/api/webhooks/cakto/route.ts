import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function criarSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

function gerarSenhaAleatoria(tamanho = 14) {
  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const valores = new Uint32Array(tamanho);
  crypto.getRandomValues(valores);

  return Array.from(valores)
    .map((valor) => caracteres[valor % caracteres.length])
    .join("");
}

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function enviarEmailAcesso({
  email,
  senha,
  siteUrl,
}: {
  email: string;
  senha: string;
  siteUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada na Vercel."
    );
  }

  if (!fromEmail) {
    throw new Error(
      "RESEND_FROM_EMAIL não configurada na Vercel."
    );
  }

  if (!fromEmail.includes("@")) {
    throw new Error(
      "RESEND_FROM_EMAIL está inválida. Use um endereço de e-mail válido."
    );
  }

  const emailSeguro = escaparHtml(email);
  const senhaSegura = escaparHtml(senha);
  const siteUrlSeguro = escaparHtml(siteUrl);

  console.log(
    `Iniciando envio do e-mail pelo Resend para: ${email}`
  );

  console.log(
    `Remetente configurado no Resend: ${fromEmail}`
  );

  const resposta = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],

        subject:
          "Seu acesso ao Knights Lab está liberado",

        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Seu acesso ao Knights Lab</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#0b0b0b;
    font-family:Arial,Helvetica,sans-serif;
    color:#ffffff;
  "
>
  <div
    style="
      max-width:600px;
      margin:0 auto;
      padding:40px 20px;
    "
  >
    <div
      style="
        background:#151515;
        border:1px solid #292929;
        border-radius:16px;
        padding:32px;
      "
    >

      <h1
        style="
          margin:0 0 16px;
          font-size:28px;
          color:#ffffff;
        "
      >
        Seu acesso está liberado! 🎉
      </h1>

      <p
        style="
          font-size:16px;
          line-height:1.6;
          color:#d0d0d0;
        "
      >
        Sua compra foi confirmada e seu acesso ao
        <strong>Knights Lab</strong>
        está liberado.
      </p>

      <div
        style="
          margin:28px 0;
          padding:20px;
          background:#0d0d0d;
          border:1px solid #333333;
          border-radius:12px;
        "
      >

        <p
          style="
            margin:0 0 10px;
            color:#999999;
            font-size:14px;
          "
        >
          E-mail de acesso
        </p>

        <p
          style="
            margin:0 0 22px;
            color:#ffffff;
            font-size:16px;
            word-break:break-word;
          "
        >
          ${emailSeguro}
        </p>

        <p
          style="
            margin:0 0 10px;
            color:#999999;
            font-size:14px;
          "
        >
          Sua senha
        </p>

        <p
          style="
            margin:0;
            color:#ffffff;
            font-size:18px;
            font-weight:bold;
            letter-spacing:1px;
            word-break:break-word;
          "
        >
          ${senhaSegura}
        </p>

      </div>

      <div
        style="
          text-align:center;
          margin:32px 0;
        "
      >
        <a
          href="${siteUrlSeguro}/login"
          style="
            display:inline-block;
            padding:15px 28px;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
            font-size:16px;
          "
        >
          Acessar minha área de membros
        </a>
      </div>

      <p
        style="
          font-size:14px;
          line-height:1.6;
          color:#999999;
        "
      >
        Clique no botão acima para acessar sua área de membros.
      </p>

      <p
        style="
          font-size:14px;
          line-height:1.6;
          color:#999999;
        "
      >
        Use o e-mail e a senha informados neste e-mail para entrar.
      </p>

      <p
        style="
          font-size:14px;
          line-height:1.6;
          color:#999999;
        "
      >
        Guarde este e-mail para consultar seus dados de acesso.
      </p>

      <p
        style="
          font-size:14px;
          line-height:1.6;
          color:#999999;
        "
      >
        Se você não reconhece esta compra, entre em contato com nosso suporte.
      </p>

    </div>

    <p
      style="
        text-align:center;
        margin-top:24px;
        color:#666666;
        font-size:12px;
      "
    >
      Knights Lab
    </p>

  </div>
</body>
</html>
        `,

        text: `
Seu acesso ao Knights Lab está liberado!

Sua compra foi confirmada e seu acesso está liberado.

E-mail:
${email}

Senha:
${senha}

Acesse sua área de membros:
${siteUrl}/login

Guarde este e-mail para consultar seus dados de acesso.

Knights Lab
        `,
      }),
    }
  );

  const resultado = await resposta
    .json()
    .catch(() => null);

  if (!resposta.ok) {
    console.error(
      "RESEND REJEITOU O ENVIO:",
      {
        status: resposta.status,
        resultado,
      }
    );

    throw new Error(
      resultado?.message ||
        resultado?.error ||
        `Resend retornou HTTP ${resposta.status}.`
    );
  }

  if (!resultado?.id) {
    console.error(
      "Resend respondeu sem ID:",
      resultado
    );

    throw new Error(
      "O Resend respondeu sem fornecer o ID do e-mail."
    );
  }

  console.log(
    `E-mail enviado pelo Resend com sucesso. ID: ${resultado.id}`
  );

  return resultado;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /*
     * ============================================================
     * 1. VALIDAR WEBHOOK DA CAKTO
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
     * 2. PEGAR EVENTO E E-MAIL
     * ============================================================
     */

    const event = body?.event;

    const email =
      typeof body?.data?.customer?.email === "string"
        ? normalizarEmail(
            body.data.customer.email
          )
        : "";

    console.log(
      "Webhook recebido:",
      {
        event,
        email,
      }
    );

    if (!event || !email) {
      console.error(
        "Webhook sem evento ou e-mail."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Evento ou e-mail do cliente não encontrado.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin =
      criarSupabaseAdmin();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.knightslab.com.br";

    /*
     * ============================================================
     * 3. COMPRA APROVADA
     * ============================================================
     */

    if (event === "purchase_approved") {
      console.log(
        `COMPRA APROVADA: ${email}`
      );

      /*
       * ----------------------------------------------------------
       * 3.1 Procurar usuário existente
       * ----------------------------------------------------------
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
              buscaAuthError.message ||
              "Não foi possível verificar o usuário.",
          },
          { status: 500 }
        );
      }

      const usuarioExistente =
        usuarios.users.find(
          (usuario) =>
            usuario.email
              ?.trim()
              .toLowerCase() === email
        );

      /*
       * ----------------------------------------------------------
       * 3.2 Gerar senha
       * ----------------------------------------------------------
       */

      const senhaGerada =
        gerarSenhaAleatoria();

      let usuarioId: string;
      let usuarioCriado = false;

      /*
       * ----------------------------------------------------------
       * 3.3 Criar ou atualizar usuário
       * ----------------------------------------------------------
       */

      if (!usuarioExistente) {
        console.log(
          `Usuário não existe. Criando: ${email}`
        );

        const {
          data: novoUsuario,
          error: usuarioError,
        } =
          await supabaseAdmin.auth.admin.createUser(
            {
              email,
              password: senhaGerada,
              email_confirm: true,
            }
          );

        if (
          usuarioError ||
          !novoUsuario.user
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

        usuarioId =
          novoUsuario.user.id;

        usuarioCriado = true;

        console.log(
          `Usuário criado no Supabase: ${email}`
        );
      } else {
        usuarioId =
          usuarioExistente.id;

        console.log(
          `Usuário já existe. Atualizando senha: ${email}`
        );

        const {
          data: usuarioAtualizado,
          error: atualizarSenhaError,
        } =
          await supabaseAdmin.auth.admin.updateUserById(
            usuarioId,
            {
              password: senhaGerada,
              email_confirm: true,
            }
          );

        if (
          atualizarSenhaError ||
          !usuarioAtualizado.user
        ) {
          console.error(
            "Erro ao atualizar senha:",
            atualizarSenhaError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                atualizarSenhaError?.message ||
                "Não foi possível atualizar a senha do usuário.",
            },
            { status: 500 }
          );
        }

        console.log(
          `Senha atualizada com sucesso: ${email}`
        );
      }

      /*
       * ----------------------------------------------------------
       * 3.4 Liberar acesso
       * ----------------------------------------------------------
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
              acessoConsultaError.message ||
              "Não foi possível verificar o acesso.",
          },
          { status: 500 }
        );
      }

      const roleFinal =
        acessoExistente?.role ||
        "user";

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

      console.log(
        `Acesso liberado: ${email}`
      );

      /*
       * ----------------------------------------------------------
       * 3.5 Enviar e-mail pelo Resend
       * ----------------------------------------------------------
       */

      console.log(
        `Preparando e-mail de acesso para: ${email}`
      );

      const resultadoEmail =
        await enviarEmailAcesso({
          email,
          senha: senhaGerada,
          siteUrl,
        });

      /*
       * ----------------------------------------------------------
       * 3.6 SUCESSO
       * ----------------------------------------------------------
       */

      console.log(
        `PROCESSO COMPLETO: ${email}`
      );

      return NextResponse.json(
        {
          success: true,

          message:
            "Compra aprovada, usuário configurado, acesso liberado e e-mail enviado.",

          email,

          usuario_criado:
            usuarioCriado,

          usuario_id:
            usuarioId,

          acesso_liberado:
            true,

          email_enviado:
            true,

          resend_id:
            resultadoEmail.id,

          acesso:
            acessoFinal,
        },
        { status: 200 }
      );
    }

    /*
     * ============================================================
     * 4. REEMBOLSO / CHARGEBACK
     * ============================================================
     */

    if (
      event === "refund" ||
      event === "chargeback"
    ) {
      console.log(
        `Evento ${event} recebido para: ${email}`
      );

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
          "Erro ao bloquear acesso:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              error.message ||
              "Não foi possível bloquear o acesso.",
          },
          { status: 500 }
        );
      }

      console.log(
        `Acesso bloqueado: ${email}`
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Acesso bloqueado.",
          email,
          acesso: data,
        },
        { status: 200 }
      );
    }

    /*
     * ============================================================
     * 5. EVENTO NÃO TRATADO
     * ============================================================
     */

    console.log(
      `Evento Cakto recebido sem ação: ${event}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Evento recebido sem ação.",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "ERRO COMPLETO NO WEBHOOK CAKTO:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}