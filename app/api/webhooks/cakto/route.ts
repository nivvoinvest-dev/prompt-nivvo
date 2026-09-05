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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const secretRecebida = body?.secret;
    const secretEsperada = process.env.CAKTO_WEBHOOK_SECRET;

    if (!secretEsperada) {
      console.error("CAKTO_WEBHOOK_SECRET não configurada.");
      return NextResponse.json(
        { success: false, error: "Webhook não configurado." },
        { status: 500 }
      );
    }

    if (
      typeof secretRecebida !== "string" ||
      secretRecebida !== secretEsperada
    ) {
      console.error("Webhook Cakto rejeitado: chave inválida.");

      return NextResponse.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const event = body?.event;
    const email = body?.data?.customer?.email
      ?.trim()
      ?.toLowerCase();

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

    if (event === "purchase_approved") {
      const { error } = await supabaseAdmin
        .from("user_access")
        .upsert(
          {
            email,
            active: true,
          },
          {
            onConflict: "email",
          }
        );

      if (error) {
        console.error(
          "Erro ao liberar acesso pela Cakto:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error: "Não foi possível liberar o acesso.",
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
          message: "Acesso liberado.",
        },
        { status: 200 }
      );
    }

    if (
      event === "refund" ||
      event === "chargeback"
    ) {
      const { error } = await supabaseAdmin
        .from("user_access")
        .update({
          active: false,
        })
        .eq("email", email);

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
        },
        { status: 200 }
      );
    }

    console.log(
      `Evento Cakto recebido sem ação: ${event}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Evento recebido.",
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