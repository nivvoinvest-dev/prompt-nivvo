"use client";

import { FormEvent, useState } from "react";
import { supabase } from "./lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data.user) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    const { data: acesso, error: acessoError } = await supabase
      .from("user_access")
      .select("active")
      .eq("email", data.user.email)
      .maybeSingle();

    if (acessoError || !acesso || acesso.active !== true) {
      await supabase.auth.signOut();
      setErro("Seu acesso não está autorizado ou está inativo.");
      setCarregando(false);
      return;
    }

    window.location.href = "/";
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
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
              placeholder="Sua senha"
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
