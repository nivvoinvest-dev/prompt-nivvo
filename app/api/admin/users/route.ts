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
    return { autorizado: false, supabaseAdmin };
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    return { autorizado: false, supabaseAdmin };
  }

  const { data: acesso, error: acessoError } = await supabaseAdmin
    .from("user_access")
    .select("active, role")
    .eq("email", user.email)
    .maybeSingle();

  if (
    acessoError ||
    !acesso ||
    acesso.active !== true ||
    acesso.role !== "admin"
  ) {
    return { autorizado: false, supabaseAdmin };
  }

  return {
    autorizado: true,
    supabaseAdmin,
    emailAdmin: user.email,
  };
}

// LISTAR USUÁRIOS
export async function GET(request: Request) {
  try {
    const { autorizado, supabaseAdmin } =
      await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem acessar os usuários." },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Não foi possível carregar os usuários." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      usuarios: data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar usuários." },
      { status: 500 }
    );
  }
}

// CRIAR USUÁRIO
export async function POST(request: Request) {
  try {
    const { autorizado, supabaseAdmin } =
      await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar usuários." },
        { status: 403 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}

// ALTERAR ACESSO
export async function PATCH(request: Request) {
  try {
    const {
      autorizado,
      supabaseAdmin,
      emailAdmin,
    } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar acessos." },
        { status: 403 }
      );
    }

    const { id, active } = await request.json();

    if (typeof id !== "number" || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      );
    }

    // Busca o usuário que será alterado
    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from("user_access")
        .select("id, email, active, role")
        .eq("id", id)
        .maybeSingle();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Impede o administrador de bloquear a própria conta
    if (
      usuario.email?.toLowerCase() ===
        emailAdmin?.toLowerCase() &&
      active === false
    ) {
      return NextResponse.json(
        { error: "Você não pode bloquear sua própria conta." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_access")
      .update({ active })
      .eq("id", id)
      .select("id, email, active, role")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Não foi possível alterar o acesso." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao alterar acesso." },
      { status: 500 }
    );
  }
}