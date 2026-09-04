"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  email: string | null;
  active: boolean;
  role: string | null;
};

export default function Admin() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criando, setCriando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function verificarAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: acesso, error } = await supabase
        .from("user_access")
        .select("id, email, active, role")
        .eq("email", user.email)
        .maybeSingle();

      if (
        error ||
        !acesso ||
        acesso.active !== true ||
        acesso.role !== "admin"
      ) {
        router.replace("/");
        return;
      }

      const { data: lista, error: listaError } = await supabase
        .from("user_access")
        .select("id, email, active, role")
        .order("id", { ascending: true });

      if (listaError) {
        setErro("Não foi possível carregar os usuários.");
      } else {
        setUsuarios(lista || []);
      }

      setCarregando(false);
    }

    verificarAdmin();
  }, [router]);

  async function alterarAcesso(id: number, ativoAtual: boolean) {
    const { error } = await supabase
      .from("user_access")
      .update({ active: !ativoAtual })
      .eq("id", id);

    if (error) {
      alert("Não foi possível alterar o acesso.");
      return;
    }

    setUsuarios((lista) =>
      lista.map((usuario) =>
        usuario.id === id
          ? { ...usuario, active: !ativoAtual }
          : usuario
      )
    );
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!email || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCriando(true);

    try {
     const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.access_token) {
  setErro("Sua sessão expirou. Faça login novamente.");
  setCriando(false);
  return;
}

const resposta = await fetch("/api/admin/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    email,
    password: senha,
  }),
});

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(resultado.error || "Não foi possível criar o usuário.");
        setCriando(false);
        return;
      }

      setMensagem("Usuário criado com sucesso.");

      setEmail("");
      setSenha("");

      const { data: lista } = await supabase
        .from("user_access")
        .select("id, email, active, role")
        .order("id", { ascending: true });

      setUsuarios(lista || []);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }

    setCriando(false);
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090d] text-white">
        Carregando área administrativa...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] p-8 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administração</h1>

            <p className="mt-2 text-gray-400">
              Gerencie os usuários e seus acessos.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-gray-800 px-4 py-2 hover:bg-gray-700"
          >
            Voltar
          </button>
        </div>

        {/* CRIAR USUÁRIO */}

        <div className="mb-8 rounded-xl border border-gray-800 bg-[#0b0e13] p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Criar novo usuário
          </h2>

          <form
            onSubmit={criarUsuario}
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={criando}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criando ? "Criando..." : "Criar usuário"}
            </button>
          </form>

          {mensagem && (
            <div className="mt-4 rounded-lg bg-green-900/30 p-3 text-green-400">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="mt-4 rounded-lg bg-red-900/30 p-3 text-red-400">
              {erro}
            </div>
          )}
        </div>

        {/* LISTA DE USUÁRIOS */}

        <div className="overflow-hidden rounded-xl border border-gray-800">
          <div className="grid grid-cols-4 bg-gray-900 p-4 font-semibold">
            <div>E-mail</div>
            <div>Status</div>
            <div>Função</div>
            <div>Ação</div>
          </div>

          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="grid grid-cols-4 items-center border-t border-gray-800 p-4"
            >
              <div className="break-all">
                {usuario.email}
              </div>

              <div>
                {usuario.active ? (
                  <span className="text-green-400">
                    Ativo
                  </span>
                ) : (
                  <span className="text-red-400">
                    Inativo
                  </span>
                )}
              </div>

              <div>
                {usuario.role || "user"}
              </div>

              <div>
                <button
                  onClick={() =>
                    alterarAcesso(usuario.id, usuario.active)
                  }
                  className="rounded-lg bg-gray-800 px-3 py-2 hover:bg-gray-700"
                >
                  {usuario.active ? "Bloquear" : "Liberar"}
                </button>
              </div>
            </div>
          ))}

          {usuarios.length === 0 && !erro && (
            <div className="p-6 text-center text-gray-400">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}