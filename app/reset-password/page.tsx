"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    async function prepararRecuperacao() {
      try {
        /*
         * No fluxo implicit, o Supabase retorna:
         *
         * /reset-password#access_token=...&refresh_token=...&type=recovery
         *
         * O cliente Supabase já detecta esses tokens automaticamente
         * porque detectSessionInUrl está habilitado.
         */

        const hash = window.location.hash;

        if (!hash) {
          setErro(
            "Este link de acesso é inválido ou expirou. Solicite um novo link."
          );
          setCarregando(false);
          return;
        }

        const params = new URLSearchParams(hash.substring(1));

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (!accessToken || !refreshToken) {
          setErro(
            "Este link de acesso é inválido ou expirou. Solicite um novo link."
          );
          setCarregando(false);
          return;
        }

        if (type !== "recovery") {
          setErro(
            "Este link não é válido para redefinir sua senha."
          );
          setCarregando(false);
          return;
        }

        /*
         * Estabelece a sessão usando os tokens recebidos.
         */
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error(
            "Erro ao estabelecer sessão de recuperação:",
            error
          );

          setErro(
            "Este link de acesso é inválido ou expirou. Solicite um novo link."
          );

          setCarregando(false);
          return;
        }

        setTokenValido(true);
        setCarregando(false);

        /*
         * Remove os tokens da barra de endereço
         * depois que a sessão foi criada.
         */
        window.history.replaceState(
          {},
          document.title,
          "/reset-password"
        );
      } catch (error) {
        console.error(
          "Erro ao preparar recuperação:",
          error
        );

        setErro(
          "Não foi possível validar este link. Solicite um novo."
        );

        setCarregando(false);
      }
    }

    prepararRecuperacao();
  }, []);

  async function alterarSenha(event: FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (senha.length < 6) {
      setErro(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: senha,
        });

      if (error) {
        console.error(
          "Erro ao alterar senha:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível alterar sua senha."
        );

        setCarregando(false);
        return;
      }

      setMensagem(
        "Senha definida com sucesso! Você já pode entrar."
      );

      setSenha("");
      setConfirmarSenha("");

      await supabase.auth.signOut();

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error(
        "Erro inesperado ao alterar senha:",
        error
      );

      setErro(
        "Não foi possível alterar sua senha. Tente novamente."
      );

      setCarregando(false);
    }
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

        {carregando && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm text-gray-400">
            Validando seu link...
          </div>
        )}

        {!carregando && erro && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        {!carregando && mensagem && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {mensagem}
          </div>
        )}

        {!carregando && tokenValido && !mensagem && (
          <form
            onSubmit={alterarSenha}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Nova senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
                placeholder="Digite sua nova senha"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Confirmar senha
              </label>

              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) =>
                  setConfirmarSenha(e.target.value)
                }
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
                placeholder="Digite novamente sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando
                ? "Salvando..."
                : "Definir senha"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="mt-5 w-full rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
        >
          Voltar para o login
        </button>

      </div>
    </main>
  );
}