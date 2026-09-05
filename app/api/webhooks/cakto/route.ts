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

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const secretRecebida = body?.secret;
    const secretEsperada = process.env.CAKTO_WEBHOOK_SECRET;

    if (!secretEsperada) {
      console.error("CAKTO_WEBHOOK_SECRET não configurada.");

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
      console.error("Webhook Cakto rejeitado: chave inválida.");

      return NextResponse.json(
        {
          success: false,
          error: "Não autorizado.",
        },
        { status: 401 }
      );
    }

    const event = body?.event;

    const email =
      typeof body?.data?.customer?.email === "string"
        ? normalizarEmail(body.data.customer.email)
        : "";

    if (!event || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Evento ou e-mail do cliente não encontrado.",
        },
        { status: 400 }
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
       * 1. Procurar o usuário no Authentication.
       */

      const {
        data: usuarios,
        error: buscaAuthError,
      } = await supabaseAdmin.auth.admin.listUsers({
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
            error: "Não foi possível verificar o usuário.",
          },
          { status: 500 }
        );
      }

      const usuarioExistente = usuarios.users.find(
        (usuario) =>
          usuario.email?.trim().toLowerCase() === email
      );

      /*
       * 2. Se não existir, criar o usuário.
       *
       * A senha é temporária e aleatória.
       * O usuário não deve receber essa senha.
       */

      if (!usuarioExistente) {
        const senhaTemporaria =
          `${crypto.randomUUID()}Aa1!`;

        const {
          data: novoUsuario,
          error: criarUsuarioError,
        } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: senhaTemporaria,
          email_confirm: true,
        });

        if (criarUsuarioError || !novoUsuario.user) {
          console.error(
            "Erro ao criar usuário no Authentication:",
            criarUsuarioError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                criarUsuarioError?.message ||
                "Não foi possível criar o usuário.",
            },
            { status: 500 }
          );
        }

        console.log(
          `Usuário criado no Authentication: ${email}`
        );
      }

      /*
       * 3. Ativar o acesso.
       *
       * Se já existir, preserva o role atual.
       * Se não existir, entra como user.
       */

      const {
        data: acessoExistente,
        error: acessoConsultaError,
      } = await supabaseAdmin
        .from("user_access")
        .select("id, email, active, role")
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
            error: "Não foi possível verificar o acesso.",
          },
          { status: 500 }
        );
      }

      const roleFinal =
        acessoExistente?.role || "user";

      const {
        data: acessoFinal,
        error: acessoUpsertError,
      } = await supabaseAdmin
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
        .select("id, email, active, role")
        .single();

      if (acessoUpsertError || !acessoFinal) {
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
        `Acesso liberado pela Cakto para: ${email}`
      );

      return NextResponse.json(
        {
          success: true,
          message: "Compra aprovada e acesso liberado.",
          email,
          usuario_criado: !usuarioExistente,
          acesso: acessoFinal,
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
      } = await supabaseAdmin
        .from("user_access")
        .update({
          active: false,
        })
        .eq("email", email)
        .select("id, email, active, role")
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao bloquear acesso pela Cakto:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error: "Não foi possível bloquear o acesso.",
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
        error: "Erro interno ao processar webhook.",
      },
      { status: 500 }
    );
  }
}