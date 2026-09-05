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
 * ============================================================
 * NORMALIZAR E-MAIL
 * ============================================================
 */
function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

/*
 * ============================================================
 * ENCONTRAR USUÁRIO NO AUTHENTICATION
 *
 * Procura pelo e-mail usando a API administrativa do Supabase.
 * ============================================================
 */
async function encontrarUsuarioAuth(
  supabaseAdmin: ReturnType<typeof criarSupabaseAdmin>,
  email: string
) {
  const emailNormalizado = normalizarEmail(email);

  let pagina = 1;

  while (true) {
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page: pagina,
        perPage: 1000,
      });

    if (error) {
      return {
        user: null,
        error,
      };
    }

    const usuario = data.users.find(
      (item) =>
        item.email?.trim().toLowerCase() === emailNormalizado
    );

    if (usuario) {
      return {
        user: usuario,
        error: null,
      };
    }

    if (data.users.length < 1000) {
      break;
    }

    pagina++;
  }

  return {
    user: null,
    error: null,
  };
}

/*
 * ============================================================
 * VERIFICAR ADMIN
 * ============================================================
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

  const token = authHeader
    .replace("Bearer ", "")
    .trim();

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

  const emailAdmin = normalizarEmail(user.email);

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
      .order("id", {
        ascending: true,
      });

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
 *
 * CRIA / SINCRONIZA USUÁRIO
 *
 * Regras:
 *
 * 1. Procura o e-mail no user_access.
 *
 * 2. Procura o e-mail no Authentication.
 *
 * 3. Se não existir no Authentication:
 *      cria.
 *
 * 4. Se já existir no Authentication:
 *      reutiliza.
 *
 * 5. Se existir user_access:
 *      atualiza o registro.
 *
 * 6. Se não existir user_access:
 *      faz upsert usando o e-mail como chave única.
 *
 * O upsert é importante porque evita o problema de duas
 * requisições simultâneas gerarem:
 *
 * duplicate key value violates unique constraint
 *
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
        ? normalizarEmail(body.email)
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
     * Procurar acesso existente.
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
     * Procurar no Authentication.
     * ========================================================
     */
    const {
      user: usuarioAuthExistente,
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

    let usuarioFinal = usuarioAuthExistente;

    /*
     * ========================================================
     * PASSO 3
     * Criar Authentication se ainda não existir.
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

      if (!criarErro && novoUsuario.user) {
        usuarioFinal = novoUsuario.user;
      } else {
        /*
         * Pode acontecer de outra requisição ter criado o
         * usuário exatamente ao mesmo tempo.
         *
         * Nesse caso, procuramos novamente antes de retornar
         * erro.
         */
        console.warn(
          "Falha na criação inicial do Authentication. Tentando localizar novamente:",
          criarErro
        );

        const {
          user: usuarioDepois,
          error: novaBuscaError,
        } = await encontrarUsuarioAuth(
          supabaseAdmin,
          email
        );

        if (novaBuscaError) {
          console.error(
            "Erro ao procurar usuário novamente no Authentication:",
            novaBuscaError
          );

          return NextResponse.json(
            {
              error:
                "Não foi possível verificar o usuário no Authentication.",
            },
            { status: 500 }
          );
        }

        if (!usuarioDepois) {
          return NextResponse.json(
            {
              error:
                criarErro?.message ||
                "Não foi possível criar o usuário no Authentication.",
            },
            { status: 400 }
          );
        }

        usuarioFinal = usuarioDepois;
      }
    }

    /*
     * ========================================================
     * SEGURANÇA
     *
     * Neste ponto precisamos obrigatoriamente ter um usuário
     * válido no Authentication.
     * ========================================================
     */
    if (!usuarioFinal) {
      return NextResponse.json(
        {
          error:
            "Não foi possível obter o usuário no Authentication.",
        },
        { status: 500 }
      );
    }

    /*
     * ========================================================
     * PASSO 4
     *
     * SINCRONIZAR user_access
     *
     * Se já existe:
     *   atualiza somente active/email e preserva role.
     *
     * Se não existe:
     *   cria usando upsert.
     *
     * O upsert elimina a condição de corrida que estava
     * causando o erro 23505.
     * ========================================================
     */

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
          error:
            acessoUpsertError?.message ||
            "Não foi possível sincronizar o acesso do usuário.",
        },
        { status: 500 }
      );
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
      {
        status: acessoExistente ? 200 : 201,
      }
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