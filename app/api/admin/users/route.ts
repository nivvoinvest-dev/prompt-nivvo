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

/*
 * Procura um usuário no Supabase Authentication pelo e-mail.
 *
 * O Supabase Admin não possui uma busca direta por e-mail
 * em todas as versões da SDK, então percorremos as páginas.
 */
async function encontrarUsuarioAuth(
  supabaseAdmin: ReturnType<typeof criarSupabaseAdmin>,
  email: string
) {
  const emailNormalizado = email.trim().toLowerCase();

  let pagina = 1;
  const porPagina = 1000;

  while (true) {
    const {
      data,
      error,
    } = await supabaseAdmin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });

    if (error) {
      throw error;
    }

    const usuario = data.users.find(
      (item) =>
        item.email?.trim().toLowerCase() === emailNormalizado
    );

    if (usuario) {
      return usuario;
    }

    if (data.users.length < porPagina) {
      return null;
    }

    pagina++;
  }
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

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      autorizado: false,
      supabaseAdmin,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user?.email) {
    console.error(
      "Erro ao verificar administrador:",
      userError
    );

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
    .limit(1)
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

    const {
      data,
      error,
    } = await supabaseAdmin
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
      { status: 500 }
    );
  }
}

/*
 * CRIAR / REPARAR USUÁRIO
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
     * 1. Verificar se já existe registro em user_access.
     */
    const {
      data: acessoExistente,
      error: consultaAcessoError,
    } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .eq("email", emailNormalizado)
      .limit(1)
      .maybeSingle();

    if (consultaAcessoError) {
      console.error(
        "Erro ao consultar user_access:",
        consultaAcessoError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o acesso do usuário.",
        },
        { status: 500 }
      );
    }

    /*
     * 2. Verificar se já existe no Authentication.
     */
    let usuarioAuth;

    try {
      usuarioAuth = await encontrarUsuarioAuth(
        supabaseAdmin,
        emailNormalizado
      );
    } catch (error) {
      console.error(
        "Erro ao consultar Authentication:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o usuário no Authentication.",
        },
        { status: 500 }
      );
    }

    /*
     * CASO A:
     *
     * Existe no Authentication E existe no user_access.
     *
     * Então está realmente cadastrado.
     */
    if (usuarioAuth && acessoExistente) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já possui acesso cadastrado.",
        },
        { status: 409 }
      );
    }

    /*
     * CASO B:
     *
     * Existe em user_access,
     * MAS NÃO existe no Authentication.
     *
     * Esse é exatamente o problema que encontramos.
     *
     * Vamos REPARAR o cadastro em vez de bloquear.
     */
    if (acessoExistente && !usuarioAuth) {
      const {
        data: novoUsuario,
        error: criarErro,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email: emailNormalizado,
          password,
          email_confirm: true,
        });

      if (criarErro || !novoUsuario.user) {
        console.error(
          "Erro ao reparar usuário no Authentication:",
          criarErro
        );

        return NextResponse.json(
          {
            error:
              criarErro?.message ||
              "Não foi possível criar o usuário no Authentication.",
          },
          { status: 400 }
        );
      }

      /*
       * Mantemos o registro existente de user_access.
       * Apenas garantimos que ele está ativo.
       */
      const {
        data: acessoAtualizado,
        error: atualizarErro,
      } = await supabaseAdmin
        .from("user_access")
        .update({
          email: emailNormalizado,
          active: true,
          role:
            acessoExistente.role || "user",
        })
        .eq("id", acessoExistente.id)
        .select("id, email, active, role")
        .single();

      if (atualizarErro || !acessoAtualizado) {
        console.error(
          "Erro ao atualizar user_access:",
          atualizarErro
        );

        /*
         * Se não conseguimos finalizar o acesso,
         * removemos o usuário recém-criado do Auth.
         */
        await supabaseAdmin.auth.admin.deleteUser(
          novoUsuario.user.id
        );

        return NextResponse.json(
          {
            error:
              atualizarErro?.message ||
              "Não foi possível finalizar o acesso do usuário.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          reparado: true,
          usuario: acessoAtualizado,
        },
        { status: 201 }
      );
    }

    /*
     * CASO C:
     *
     * Não existe nem no Authentication
     * nem no user_access.
     *
     * Criar normalmente.
     */
    if (!usuarioAuth && !acessoExistente) {
      const {
        data: novoUsuario,
        error: criarErro,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email: emailNormalizado,
          password,
          email_confirm: true,
        });

      if (criarErro || !novoUsuario.user) {
        console.error(
          "Erro ao criar usuário no Authentication:",
          criarErro
        );

        return NextResponse.json(
          {
            error:
              criarErro?.message ||
              "Não foi possível criar o usuário.",
          },
          { status: 400 }
        );
      }

      const {
        data: novoAcesso,
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

      if (acessoError || !novoAcesso) {
        console.error(
          "Erro ao criar user_access:",
          acessoError
        );

        await supabaseAdmin.auth.admin.deleteUser(
          novoUsuario.user.id
        );

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
          reparado: false,
          usuario: novoAcesso,
        },
        { status: 201 }
      );
    }

    /*
     * CASO D:
     *
     * Existe no Authentication,
     * mas não existe no user_access.
     *
     * Vamos sincronizar o acesso.
     */
    if (usuarioAuth && !acessoExistente) {
      const {
        data: novoAcesso,
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

      if (acessoError || !novoAcesso) {
        console.error(
          "Erro ao sincronizar user_access:",
          acessoError
        );

        return NextResponse.json(
          {
            error:
              acessoError?.message ||
              "Não foi possível sincronizar o acesso.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          reparado: true,
          usuario: novoAcesso,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        error: "Não foi possível determinar o estado do usuário.",
      },
      { status: 500 }
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

    return NextResponse.json({
      success: true,
      usuario: data,
    });
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