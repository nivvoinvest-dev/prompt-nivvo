import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Descobre quem está fazendo a requisição
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verifica o usuário logado
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Sessão inválida." },
        { status: 401 }
      );
    }

    // Verifica se o usuário é administrador
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
      return NextResponse.json(
        { error: "Apenas administradores podem criar usuários." },
        { status: 403 }
      );
    }

    // Dados do novo usuário
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

    // Cria o novo usuário
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