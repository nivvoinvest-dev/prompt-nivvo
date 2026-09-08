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

    // ============================================================
    // COMPRA APROVADA
    // ============================================================

    if (event === "purchase_approved") {
      // 1. Procurar usuário existente
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

      let userId: string;
      let usuarioCriado = false;

      // 2. Criar usuário se ainda não existir
      if (!usuarioExistente) {
        const {
          data: novoUsuario,
          error: usuarioError,
        } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
        });

        if (usuarioError || !novoUsuario.user) {
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

        userId = novoUsuario.user.id;
        usuarioCriado = true;

        console.log(
          `Usuário criado no Supabase: ${email}`
        );
      } else {
        userId = usuarioExistente.id;

        console.log(
          `Usuário já existente no Supabase: ${email}`
        );
      }

      // 3. Consultar acesso existente
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

      // 4. Preservar role ou usar "user"
      const roleFinal =
        acessoExistente?.role || "user";

      // 5. Liberar acesso
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
          user_id: userId,
          usuario_criado: usuarioCriado,
          acesso: acessoFinal,
        },
        { status: 200 }
      );
    }

    // ============================================================
    // REEMBOLSO / CHARGEBACK
    // ============================================================

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

    // ============================================================
    // EVENTO NÃO TRATADO
    // ============================================================

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