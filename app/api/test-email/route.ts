import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function criarSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const secret = body?.secret;
    const email = body?.email?.trim().toLowerCase();

    if (
      !secret ||
      secret !== process.env.CAKTO_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autorizado.",
        },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail não informado.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = criarSupabaseAdmin();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.knightslab.com.br";

    /*
     * Procurar usuário
     */

    const {
      data: usuarios,
      error: buscaError,
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (buscaError) {
      throw buscaError;
    }

    const usuarioExistente =
      usuarios.users.find(
        (usuario) =>
          usuario.email?.trim().toLowerCase() === email
      );

    /*
     * Gerar senha
     */

    const senha = gerarSenhaAleatoria();

    let userId: string;

    /*
     * Criar ou atualizar usuário
     */

    if (!usuarioExistente) {
      const {
        data,
        error,
      } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });

      if (error || !data.user) {
        throw error || new Error("Não foi possível criar o usuário.");
      }

      userId = data.user.id;
    } else {
      userId = usuarioExistente.id;

      const {
        error,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password: senha,
            email_confirm: true,
          }
        );

      if (error) {
        throw error;
      }
    }

    /*
     * Liberar acesso
     */

    const {
      data: acesso,
      error: acessoError,
    } = await supabaseAdmin
      .from("user_access")
      .upsert(
        {
          email,
          active: true,
          role: "user",
        },
        {
          onConflict: "email",
        }
      )
      .select("id, email, active, role")
      .single();

    if (acessoError) {
      throw acessoError;
    }

    /*
     * Enviar pelo Resend
     */

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY não configurada."
      );
    }

    if (!fromEmail) {
      throw new Error(
        "RESEND_FROM_EMAIL não configurada."
      );
    }

    const respostaResend = await fetch(
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
            "Teste — seu acesso ao Knights Lab",

          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">

              <h1>
                Seu acesso ao Knights Lab
              </h1>

              <p>
                Este é um teste do sistema de envio de acesso.
              </p>

              <p>
                Seu acesso está liberado.
              </p>

              <div style="padding: 20px; background: #f4f4f4; border-radius: 10px;">

                <p>
                  <strong>E-mail:</strong><br>
                  ${email}
                </p>

                <p>
                  <strong>Senha:</strong><br>
                  ${senha}
                </p>

              </div>

              <br>

              <a
                href="${siteUrl}/login"
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:bold;
                "
              >
                Acessar minha área de membros
              </a>

              <p style="margin-top:30px;color:#777;">
                Knights Lab
              </p>

            </div>
          `,

          text: `
Seu acesso ao Knights Lab está liberado.

E-mail:
${email}

Senha:
${senha}

Acesse:
${siteUrl}/login
          `,
        }),
      }
    );

    const resultado =
      await respostaResend.json();

    if (!respostaResend.ok) {
      console.error(
        "Erro do Resend:",
        resultado
      );

      throw new Error(
        resultado?.message ||
          resultado?.error ||
          "Erro ao enviar e-mail."
      );
    }

    console.log(
      "TESTE DE E-MAIL CONCLUÍDO:",
      {
        email,
        userId,
        resendId: resultado?.id,
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Usuário configurado e e-mail enviado.",
      email,
      userId,
      resendId: resultado?.id || null,
      acesso,
    });
  } catch (error) {
    console.error(
      "ERRO NO TESTE DE E-MAIL:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno.",
      },
      { status: 500 }
    );
  }
}