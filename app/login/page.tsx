"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  async function entrar(event: FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");
    setCarregando(true);

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      setErro("Informe o e-mail e a senha.");
      setCarregando(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password: senha,
      });

      if (error || !data.user) {
        console.error("Erro no login:", error);

        setErro("E-mail ou senha incorretos.");
        setCarregando(false);
        return;
      }

      const { data: acesso, error: acessoError } = await supabase
        .from("user_access")
        .select("id, email, active, role")
        .eq("email", emailNormalizado)
        .maybeSingle();

      if (acessoError) {
        console.error("Erro ao verificar acesso:", acessoError);

        await supabase.auth.signOut();

        setErro(
          "Não foi possível verificar seu acesso. Tente novamente."
        );

        setCarregando(false);
        return;
      }

      if (!acesso || acesso.active !== true) {
        await supabase.auth.signOut();

        setErro(
          "Seu acesso não está autorizado ou está inativo."
        );

        setCarregando(false);
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Erro inesperado no login:", error);

      setErro(
        "Não foi possível verificar seu acesso. Tente novamente."
      );

      setCarregando(false);
    }
  }

  async function recuperarSenha(event: FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado) {
      setErro("Digite seu e-mail para recuperar a senha.");
      return;
    }

    setRecuperandoSenha(true);

    try {
      /*
       * Usa o domínio atual automaticamente.
       *
       * Hoje:
       * https://prompt-nivvo.vercel.app/reset-password
       *
       * Futuramente:
       * https://seu-dominio.com.br/reset-password
       */
      const redirectTo =
        `${window.location.origin}/reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          emailNormalizado,
          {
            redirectTo,
          }
        );

      if (error) {
        console.error(
          "Erro ao enviar recuperação de senha:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível enviar o e-mail de recuperação."
        );

        setRecuperandoSenha(false);
        return;
      }

      setMensagem(
        "Enviamos um link para redefinir sua senha. Verifique seu e-mail."
      );
    } catch (error) {
      console.error(
        "Erro inesperado na recuperação de senha:",
        error
      );

      setErro(
        "Não foi possível enviar o e-mail de recuperação. Tente novamente."
      );
    }

    setRecuperandoSenha(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090d] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1016] p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold">
            N
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            PROMPTS NIVVO
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Entre para acessar sua biblioteca
          </p>
        </div>

        <form onSubmit={entrar} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
              placeholder="Sua senha"
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || recuperandoSenha}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

        </form>

        <form
          onSubmit={recuperarSenha}
          className="mt-4"
        >
          <button
            type="submit"
            disabled={carregando || recuperandoSenha}
            className="w-full py-2 text-sm text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
          >
            {recuperandoSenha
              ? "Enviando..."
              : "Esqueci minha senha"}
          </button>
        </form>

      </div>
    </main>
  );
}