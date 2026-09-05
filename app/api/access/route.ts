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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          autorizado: false,
          error: "Sessão não encontrada.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        {
          autorizado: false,
          error: "Token não encontrado.",
        },
        { status: 401 }
      );
    }

    const supabaseAdmin = criarSupabaseAdmin();

    /*
     * Verifica o usuário diretamente no Supabase Auth.
     */
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.email) {
      console.error(
        "Erro ao verificar usuário:",
        userError
      );

      return NextResponse.json(
        {
          autorizado: false,
          error: "Sessão inválida ou expirada.",
        },
        { status: 401 }
      );
    }

    const emailNormalizado = user.email
      .trim()
      .toLowerCase();

    /*
     * Consulta user_access usando Service Role.
     *
     * Dessa forma o login não depende de RLS.
     */
    const {
      data: acesso,
      error: acessoError,
    } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .eq("email", emailNormalizado)
      .maybeSingle();

    if (acessoError) {
      console.error(
        "Erro ao consultar user_access:",
        acessoError
      );

      return NextResponse.json(
        {
          autorizado: false,
          error: "Não foi possível verificar seu acesso.",
        },
        { status: 500 }
      );
    }

    if (!acesso) {
      return NextResponse.json(
        {
          autorizado: false,
          error: "Seu acesso não está autorizado ou está inativo.",
        },
        { status: 403 }
      );
    }

    if (acesso.active !== true) {
      return NextResponse.json(
        {
          autorizado: false,
          error: "Seu acesso não está autorizado ou está inativo.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        autorizado: true,
        usuario: {
          id: acesso.id,
          email: acesso.email,
          active: acesso.active,
          role: acesso.role,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro interno ao verificar acesso:",
      error
    );

    return NextResponse.json(
      {
        autorizado: false,
        error: "Erro interno ao verificar seu acesso.",
      },
      { status: 500 }
    );
  }
}