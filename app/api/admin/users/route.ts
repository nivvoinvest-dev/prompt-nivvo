import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function criarSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verificarAdmin(request: Request) {
  const supabaseAdmin = criarSupabaseAdmin();

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      autorizado: false,
      supabaseAdmin,
    };
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    return {
      autorizado: false,
      supabaseAdmin,
    };
  }

  const { data: acesso, error: acessoError } =
    await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .eq("email", user.email)
      .maybeSingle();

  if (
    acessoError ||
    !acesso ||
    acesso.active !== true ||
    acesso.role !== "admin"
  ) {
    return {
      autorizado: false,
      supabaseAdmin,
    };
  }

  return {
    autorizado: true,
    supabaseAdmin,
  };
}

/*
 * LISTAR USUÁRIOS
 */
export async function GET(request: Request) {
  try {
    const { autorizado, supabaseAdmin } =
      await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        {
          error:
            "Apenas administradores podem acessar os usuários.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      usuarios: data || [],
    });
  } catch {
    return NextResponse.json(
      {
        error: "Erro interno ao carregar usuários.",
      },
      { status: 500 }
    );
  }
}

/*
 * CRIAR USUÁRIO
 */
export async function POST(request: Request) {
  try {
    const { autorizado, supabaseAdmin } =
      await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        {
          error:
            "Apenas administradores podem criar usuários.",
        },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "E-mail e senha são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "A senha precisa ter pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const emailNormalizado = email.trim().toLowerCase();

    const { data: acessoExistente } =
      await supabaseAdmin
        .from("user_access")
        .select("id, email, active, role")
        .eq("email", emailNormalizado)
        .maybeSingle();

    if (acessoExistente) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já possui acesso cadastrado.",
        },
        { status: 400 }
      );
    }

    const { data: novoUsuario, error: criarErro } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailNormalizado,
        password,
        email_confirm: true,
      });

    if (criarErro || !novoUsuario.user) {
      return NextResponse.json(
        {
          error:
            criarErro?.message ||
            "Não foi possível criar o usuário.",
        },
        { status: 400 }
      );
    }

    const { data: acesso, error: acessoError } =
      await supabaseAdmin
        .from("user_access")
        .insert({
          email: emailNormalizado,
          active: true,
          role: "user",
        })
        .select("id, email, active, role")
        .single();

    if (acessoError) {
      await supabaseAdmin.auth.admin.deleteUser(
        novoUsuario.user.id
      );

      return NextResponse.json(
        {
          error: acessoError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: acesso,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Erro interno ao criar usuário.",
      },
      { status: 500 }
    );
  }
}

/*
 * ALTERAR STATUS DO USUÁRIO
 */
export async function PATCH(request: Request) {
  try {
    const { autorizado, supabaseAdmin } =
      await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        {
          error:
            "Apenas administradores podem alterar usuários.",
        },
        { status: 403 }
      );
    }

    const { id, active } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          error: "ID do usuário é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        {
          error: "O status do usuário é inválido.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_access")
      .update({
        active,
      })
      .eq("id", id)
      .select("id, email, active, role")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: data,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Erro interno ao alterar usuário.",
      },
      { status: 500 }
    );
  }
}