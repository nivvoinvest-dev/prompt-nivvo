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
 * Localiza um usuário no Supabase Authentication pelo e-mail.
 */
async function encontrarUsuarioAuth(
  supabaseAdmin: ReturnType<typeof criarSupabaseAdmin>,
  email: string
) {
  const { data, error } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (error) {
    return {
      user: null,
      error,
    };
  }

  const emailNormalizado = email.trim().toLowerCase();

  const user =
    data.users.find(
      (usuario) =>
        usuario.email?.trim().toLowerCase() ===
        emailNormalizado
    ) || null;

  return {
    user,
    error: null,
  };
}

/*
 * Verifica se quem está fazendo a requisição é administrador.
 */
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
 * ============================================================
 * GET
 * Lista os usuários autorizados.
 * ============================================================
 */
export async function GET(request: Request) {
  try {
    const {
      autorizado,
      supabaseAdmin,
    } = await verificarAdmin(request);

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
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        usuarios: data || [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
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
        error:
          "Erro interno ao carregar usuários.",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * POST
 * Cria/sincroniza usuário.
 *
 * REGRA:
 *
 * 1. Se não existe no Auth:
 *      cria no Auth.
 *
 * 2. Se já existe no Auth:
 *      reutiliza a conta.
 *
 * 3. Se existe no user_access:
 *      NÃO tenta inserir outra linha.
 *      Atualiza a existente.
 *
 * 4. Se não existe no user_access:
 *      cria a autorização.
 *
 * Assim evitamos usuário órfão e erro de UNIQUE.
 * ============================================================
 */
export async function POST(request: Request) {
  try {
    const {
      autorizado,
      supabaseAdmin,
    } = await verificarAdmin(request);

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

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "E-mail e senha são obrigatórios.",
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
     * ========================================================
     * PASSO 1
     * Verifica se já existe registro no user_access.
     * ========================================================
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
          error:
            "Não foi possível verificar o acesso do usuário.",
        },
        { status: 500 }
      );
    }

    /*
     * ========================================================
     * PASSO 2
     * Procura a conta correspondente no Authentication.
     * ========================================================
     */
    const {
      user: usuarioAuth,
      error: authBuscaError,
    } = await encontrarUsuarioAuth(
      supabaseAdmin,
      email
    );

    if (authBuscaError) {
      console.error(
        "Erro ao procurar usuário no Authentication:",
        authBuscaError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o usuário no Authentication.",
        },
        { status: 500 }
      );
    }

    let usuarioFinal = usuarioAuth;

    /*
     * ========================================================
     * PASSO 3
     * Se não existe no Authentication, cria.
     *
     * IMPORTANTE:
     * Não bloqueamos a criação só porque user_access
     * já possui o e-mail.
     *
     * Isso resolve exatamente o problema atual.
     * ========================================================
     */
    if (!usuarioFinal) {
      const {
        data: novoUsuario,
        error: criarErro,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email,
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
              "Não foi possível criar o usuário no Authentication.",
          },
          { status: 400 }
        );
      }

      usuarioFinal = novoUsuario.user;
    }

    /*
     * ========================================================
     * PASSO 4
     * Agora garantimos o user_access.
     *
     * Se já existe:
     *      atualiza para ativo.
     *
     * Se não existe:
     *      cria.
     *
     * Portanto nunca tentamos inserir uma segunda linha
     * com o mesmo e-mail.
     * ========================================================
     */
    let acessoFinal = acessoExistente;

    if (acessoExistente) {
      const {
        data: acessoAtualizado,
        error: atualizarAcessoError,
      } = await supabaseAdmin
        .from("user_access")
        .update({
          email,
          active: true,
          role:
            acessoExistente.role || "user",
        })
        .eq("id", acessoExistente.id)
        .select("id, email, active, role")
        .single();

      if (atualizarAcessoError || !acessoAtualizado) {
        console.error(
          "Erro ao atualizar user_access:",
          atualizarAcessoError
        );

        return NextResponse.json(
          {
            error:
              atualizarAcessoError?.message ||
              "Não foi possível atualizar o acesso do usuário.",
          },
          { status: 500 }
        );
      }

      acessoFinal = acessoAtualizado;
    } else {
      const {
        data: novoAcesso,
        error: criarAcessoError,
      } = await supabaseAdmin
        .from("user_access")
        .insert({
          email,
          active: true,
          role: "user",
        })
        .select("id, email, active, role")
        .single();

      if (criarAcessoError || !novoAcesso) {
        console.error(
          "Erro ao criar user_access:",
          criarAcessoError
        );

        /*
         * Se acabamos de criar o Auth e falhou a criação
         * do acesso, removemos a conta recém-criada.
         *
         * Isso evita deixar uma conta Auth sem autorização.
         */
        if (!usuarioAuth && usuarioFinal?.id) {
          await supabaseAdmin.auth.admin.deleteUser(
            usuarioFinal.id
          );
        }

        return NextResponse.json(
          {
            error:
              criarAcessoError?.message ||
              "Não foi possível criar o acesso do usuário.",
          },
          { status: 500 }
        );
      }

      acessoFinal = novoAcesso;
    }

    /*
     * ========================================================
     * SUCESSO
     * ========================================================
     */
    return NextResponse.json(
      {
        success: true,
        usuario: acessoFinal,
        auth_user_id: usuarioFinal.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro interno ao criar/sincronizar usuário:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao criar usuário.",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * PATCH
 * Ativa / bloqueia acesso.
 * ============================================================
 */
export async function PATCH(request: Request) {
  try {
    const {
      autorizado,
      supabaseAdmin,
    } = await verificarAdmin(request);

    if (!autorizado) {
      return NextResponse.json(
        {
          error:
            "Apenas administradores podem alterar usuários.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = body?.id;
    const active = body?.active;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID do usuário é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        {
          error:
            "O status do usuário é inválido.",
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
        error:
          "Erro interno ao alterar usuário.",
      },
      { status: 500 }
    );
  }
}