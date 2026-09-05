"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErro(
          "Este link de acesso é inválido ou expirou. Solicite um novo link."
        );
      }

      setSessaoPronta(true);
    }

    verificarSessao();
  }, []);

  async function alterarSenha(event: FormEvent) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        console.error("Erro ao definir senha:", error);
        setErro("Não foi possível definir sua senha. Tente novamente.");
        setCarregando(false);
        return;
      }

      setSucesso(
        "Senha definida com sucesso! Agora você já pode entrar no NIVVO."
      );

      setSenha("");
      setConfirmacao("");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Erro inesperado:", error);

      setErro(
        "Não foi possível definir sua senha. Tente novamente."
      );

      setCarregando(false);
    }
  }

  if (!sessaoPronta) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-6 text-white">
        <p className="text-sm text-gray-400">
          Verificando seu acesso...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1016] p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold">
            N
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Defina sua senha
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Crie uma senha para acessar sua biblioteca NIVVO.
          </p>
        </div>

        {erro && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {sucesso}
          </div>
        )}

        {!sucesso && !erro && (
          <form onSubmit={alterarSenha} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Nova senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
                placeholder="Digite sua senha"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Confirmar senha
              </label>

              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
                placeholder="Digite novamente"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? "Salvando..." : "Definir senha"}
            </button>

          </form>
        )}

        {erro && (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="mt-5 w-full rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
          >
            Voltar para o login
          </button>
        )}

      </div>
    </main>
  );
}