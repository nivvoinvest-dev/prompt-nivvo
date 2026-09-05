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
    console.error("Erro ao verificar usuário:", userError);

    return {
      autorizado: false,
      supabaseAdmin,
    };
  }

  const emailAdmin = user.email.trim().toLowerCase();

  const { data: acesso, error: acessoError } =
    await supabaseAdmin
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
            "Cache-Control": "no-store",
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
            "Cache-Control": "no-store",
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

    /*
     * PRIMEIRO:
     * verificar se já existe registro em user_access.
     *
     * Se existir, não criamos outro.
     */
    const {
      data: acessoExistente,
      error: consultaExistenteError,
    } = await supabaseAdmin
      .from("user_access")
      .select("id, email, active, role")
      .eq("email", email)
      .maybeSingle();

    if (consultaExistenteError) {
      console.error(
        "Erro ao consultar user_access:",
        consultaExistenteError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o acesso desse usuário.",
        },
        { status: 500 }
      );
    }

    /*
     * Se já existe em user_access, precisamos verificar
     * se também existe no Authentication.
     *
     * Se não existir no Authentication, tentaremos
     * reparar o registro criando a conta.
     */
    if (acessoExistente) {
      console.log(
        "Registro já existe em user_access:",
        email
      );

      const {
        data: authUsuarios,
        error: authBuscaError,
      } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (authBuscaError) {
        console.error(
          "Erro ao consultar Authentication:",
          authBuscaError
        );

        return NextResponse.json(
          {
            error:
              "O acesso já existe, mas não foi possível verificar o Authentication.",
          },
          { status: 500 }
        );
      }

      const usuarioAuth = authUsuarios.users.find(
        (usuario) =>
          usuario.email?.trim().toLowerCase() === email
      );

      /*
       * Já existe nos dois lugares.
       */
      if (usuarioAuth) {
        return NextResponse.json({
          success: true,
          existente: true,
          usuario: acessoExistente,
          message:
            "Este usuário já está cadastrado.",
        });
      }

      /*
       * Existe somente em user_access.
       *
       * Vamos reparar o registro criando a conta
       * no Authentication.
       */
      console.log(
        "Registro órfão encontrado. Criando Authentication:",
        email
      );

      const {
        data: novoUsuarioOrfao,
        error: criarOrfaoError,
      } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (
        criarOrfaoError ||
        !novoUsuarioOrfao.user
      ) {
        console.error(
          "Erro ao reparar Authentication:",
          criarOrfaoError
        );

        return NextResponse.json(
          {
            error:
              criarOrfaoError?.message ||
              "Não foi possível criar o usuário no Authentication.",
          },
          { status: 400 }
        );
      }

      /*
       * O user_access já existe.
       * NÃO fazemos insert novamente.
       *
       * Apenas garantimos que está ativo.
       */
      const {
        data: acessoReparado,
        error: acessoReparadoError,
      } = await supabaseAdmin
        .from("user_access")
        .update({
          active: true,
        })
        .eq("id", acessoExistente.id)
        .select("id, email, active, role")
        .single();

      if (acessoReparadoError) {
        console.error(
          "Erro ao atualizar acesso reparado:",
          acessoReparadoError
        );

        /*
         * Aqui NÃO apagamos o Authentication.
         *
         * O usuário Auth foi criado corretamente.
         * Se houver algum problema no acesso, ele será
         * tratado sem destruir a conta.
         */
        return NextResponse.json(
          {
            error:
              "A conta foi criada no Authentication, mas houve um problema ao atualizar o acesso.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          reparado: true,
          usuario: acessoReparado,
          message:
            "Usuário sincronizado com sucesso.",
        },
        { status: 201 }
      );
    }

    /*
     * NÃO existe em user_access.
     *
     * Agora criamos no Authentication.
     */
    console.log(
      "Criando novo usuário no Authentication:",
      email
    );

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

      const mensagem =
        criarErro?.message?.toLowerCase() || "";

      /*
       * Caso exista no Auth, mas não exista em
       * user_access, tentamos sincronizar.
       */
      if (
        mensagem.includes("already") ||
        mensagem.includes("exists") ||
        mensagem.includes("registered")
      ) {
        const {
          data: acessoDepoisDoConflito,
          error: acessoDepoisError,
        } = await supabaseAdmin
          .from("user_access")
          .select("id, email, active, role")
          .eq("email", email)
          .maybeSingle();

        if (
          !acessoDepoisError &&
          acessoDepoisDoConflito
        ) {
          return NextResponse.json({
            success: true,
            existente: true,
            usuario: acessoDepoisDoConflito,
            message:
              "Este usuário já estava cadastrado.",
          });
        }

        return NextResponse.json(
          {
            error:
              "Este e-mail já possui uma conta no Authentication.",
          },
          { status: 409 }
        );
      }

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
     * Authentication criado.
     *
     * Agora criamos user_access.
     */
    const {
      data: novoAcesso,
      error: novoAcessoError,
    } = await supabaseAdmin
      .from("user_access")
      .insert({
        email,
        active: true,
        role: "user",
      })
      .select("id, email, active, role")
      .single();

    if (novoAcessoError || !novoAcesso) {
      console.error(
        "Erro ao criar user_access:",
        novoAcessoError
      );

      /*
       * 23505 = e-mail já existe em user_access.
       *
       * IMPORTANTE:
       * NÃO apagamos o usuário do Authentication.
       *
       * Em vez disso, buscamos o registro existente
       * e consideramos o cadastro sincronizado.
       */
      if (novoAcessoError?.code === "23505") {
        const {
          data: acessoExistenteDepois,
          error: acessoDepoisError,
        } = await supabaseAdmin
          .from("user_access")
          .select("id, email, active, role")
          .eq("email", email)
          .maybeSingle();

        if (
          !acessoDepoisError &&
          acessoExistenteDepois
        ) {
          console.log(
            "Conflito 23505 tratado sem apagar Authentication:",
            email
          );

          return NextResponse.json({
            success: true,
            sincronizado: true,
            usuario: acessoExistenteDepois,
            message:
              "Usuário já estava cadastrado e foi sincronizado.",
          });
        }
      }

      /*
       * Não apagamos Authentication aqui.
       *
       * Isso é proposital.
       * A conta Auth deve permanecer para evitar
       * exatamente o problema que tivemos antes.
       */
      return NextResponse.json(
        {
          error:
            novoAcessoError?.message ||
            "A conta foi criada no Authentication, mas não foi possível criar o acesso.",
        },
        { status: 500 }
      );
    }

    console.log(
      "Usuário criado e sincronizado:",
      email
    );

    return NextResponse.json(
      {
        success: true,
        usuario: novoAcesso,
      },
      { status: 201 }
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

    const body = await request.json();

    const id = body?.id;
    const active = body?.active;

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