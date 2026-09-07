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
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b0d11] p-8 shadow-2xl">

        {/* IDENTIDADE */}
<div className="mb-8 text-center">
  <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
    <img
      src="/logo.jpeg.png"
      alt="KNIGHTS LAB"
      className="h-full w-full object-contain"
    />
  </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            KNIGHTS LAB
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-400">
            Entre com seu e-mail e senha para acessar a Biblioteca de Prompts.
          </p>
        </div>

        <form onSubmit={entrar} className="space-y-5">

          {/* E-MAIL */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          {/* SENHA */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              placeholder="••••••••"
            />
          </div>

          {/* OPÇÕES */}
          <div className="flex items-center justify-between gap-4 pt-0.5">

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-black/20 accent-yellow-400"
              />
              <span>Manter conectado</span>
            </label>

            <button
              type="button"
              onClick={() => {
                const form = document.getElementById(
                  "recuperar-senha-form"
                ) as HTMLFormElement | null;

                form?.requestSubmit();
              }}
              disabled={carregando || recuperandoSenha}
              className="text-sm text-gray-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Esqueci minha senha
            </button>

          </div>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {erro}
            </div>
          )}

          {/* MENSAGEM DE SUCESSO */}
          {mensagem && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {mensagem}
            </div>
          )}

          {/* BOTÃO ENTRAR */}
          <button
            type="submit"
            disabled={carregando || recuperandoSenha}
           className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-[0_0_28px_rgba(37,99,235,0.28)] transition duration-200 hover:scale-[1.01] hover:bg-blue-500 hover:shadow-[0_0_36px_rgba(37,99,235,0.38)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

        </form>

        {/* RECUPERAÇÃO DE SENHA
            Mantida separada para preservar a lógica atual.
        */}
        <form
          id="recuperar-senha-form"
          onSubmit={recuperarSenha}
          className="hidden"
        >
          <button
            type="submit"
            disabled={carregando || recuperandoSenha}
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