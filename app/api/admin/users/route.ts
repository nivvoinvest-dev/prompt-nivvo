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

  const emailAdmin = user.email.trim().toLowerCase();

  const {
    data: acesso,
    error: acessoError,
  } = await supabaseAdmin
    .from("user_access")
    .select("id, email, active, role")
    .eq("email", emailAdmin)
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
        {
          status: 403,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .order("id", { ascending: true });

    if (error) {
      console.error(
        "Erro ao listar usuários:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json(
      {
        usuarios: data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro interno ao carregar usuários:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno ao carregar usuários.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
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

    const body = await request.json();

    const email = body?.email;
    const password = body?.password;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        {
          error: "E-mail e senha são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!emailNormalizado) {
      return NextResponse.json(
        {
          error: "Informe um e-mail válido.",
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

    /*
     * PRIMEIRA PROTEÇÃO:
     * verificar se já existe acesso na tabela.
     */
    const {
      data: acessoExistente,
      error: consultaExistenteError,
    } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .eq("email", emailNormalizado)
      .maybeSingle();

    if (consultaExistenteError) {
      console.error(
        "Erro ao verificar usuário existente:",
        consultaExistenteError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar se o usuário já existe.",
        },
        { status: 500 }
      );
    }

    if (acessoExistente) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já possui acesso cadastrado.",
        },
        { status: 409 }
      );
    }

    /*
     * SEGUNDA PROTEÇÃO:
     * criar o usuário no Supabase Auth.
     */
    const {
      data: novoUsuario,
      error: criarErro,
    } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalizado,
      password,
      email_confirm: true,
    });

    if (criarErro || !novoUsuario.user) {
      console.error(
        "Erro ao criar usuário no Auth:",
        criarErro
      );

      const mensagem =
        criarErro?.message?.toLowerCase() || "";

      if (
        mensagem.includes("already") ||
        mensagem.includes("exists") ||
        mensagem.includes("registered") ||
        mensagem.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            error:
              "Este e-mail já possui uma conta cadastrada. Verifique a lista de usuários.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            criarErro?.message ||
            "Não foi possível criar o usuário.",
        },
        { status: 400 }
      );
    }

    /*
     * CRIAR REGISTRO DE ACESSO
     */
    const {
      data: acesso,
      error: acessoError,
    } = await supabaseAdmin
      .from("user_access")
      .insert({
        email: emailNormalizado,
        active: true,
        role: "user",
      })
      .select("id, email, active, role")
      .single();

    /*
     * Se falhar a criação do acesso,
     * apagar a conta criada no Auth.
     */
    if (acessoError || !acesso) {
      console.error(
        "Erro ao criar acesso:",
        acessoError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        novoUsuario.user.id
      );

      if (acessoError?.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Este e-mail já possui acesso cadastrado.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            acessoError?.message ||
            "Não foi possível criar o acesso do usuário.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        usuario: acesso,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro interno ao criar usuário:",
      error
    );

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

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("user_access")
      .update({
        active,
      })
      .eq("id", id)
      .select("id, email, active, role")
      .single();

    if (error) {
      console.error(
        "Erro ao alterar usuário:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        usuario: data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro interno ao alterar usuário:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno ao alterar usuário.",
      },
      { status: 500 }
    );
  }
}