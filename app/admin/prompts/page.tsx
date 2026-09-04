"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  email: string | null;
  active: boolean;
  role: string | null;
};

type Prompt = {
  id: number;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  active: boolean;
  image_url: string | null;
  video_url: string | null;
  media_type: "image" | "video" | "both";
};

export default function Admin() {
  const router = useRouter();

  const [aba, setAba] = useState<"usuarios" | "prompts">("usuarios");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [buscaPrompt, setBuscaPrompt] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criando, setCriando] = useState(false);

  const [mostrarFormularioPrompt, setMostrarFormularioPrompt] =
    useState(false);
  const [editandoPrompt, setEditandoPrompt] =
    useState<Prompt | null>(null);

  const [tituloPrompt, setTituloPrompt] = useState("");
  const [descricaoPrompt, setDescricaoPrompt] = useState("");
  const [categoriaPrompt, setCategoriaPrompt] = useState("");
  const [conteudoPrompt, setConteudoPrompt] = useState("");
  const [ativoPrompt, setAtivoPrompt] = useState(true);
  const [salvandoPrompt, setSalvandoPrompt] = useState(false);

  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [videoArquivo, setVideoArquivo] = useState<File | null>(null);
  const [imagemUrl, setImagemUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tipoMidiaPrompt, setTipoMidiaPrompt] = useState<"image" | "video" | "both">("image");

  useEffect(() => {
    async function carregarAdmin() {
      try {
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

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.replace("/login");
          return;
        }

        await carregarUsuarios(session.access_token);
        await carregarPrompts(session.access_token);
      } catch {
        setErro("Não foi possível carregar a área administrativa.");
      } finally {
        setCarregando(false);
      }
    }

    carregarAdmin();
  }, [router]);

  async function carregarUsuarios(token: string) {
    const resposta = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      setErro(
        resultado.error || "Não foi possível carregar os usuários."
      );
      return;
    }

    setUsuarios(resultado.usuarios || []);
  }

  async function carregarPrompts(token: string) {
    const resposta = await fetch("/api/admin/prompts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      setErro(
        resultado.error || "Não foi possível carregar os prompts."
      );
      return;
    }

    setPrompts(resultado.prompts || []);
  }

  async function obterToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErro("Sua sessão expirou. Faça login novamente.");
      router.replace("/login");
      return null;
    }

    return session.access_token;
  }

  async function alterarAcesso(
    id: number,
    ativoAtual: boolean
  ) {
    try {
      const token = await obterToken();

      if (!token) return;

      const resposta = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          active: !ativoAtual,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        alert(
          resultado.error ||
            "Não foi possível alterar o acesso."
        );
        return;
      }

      setUsuarios((lista) =>
        lista.map((usuario) =>
          usuario.id === id
            ? {
                ...usuario,
                active: resultado.usuario.active,
              }
            : usuario
        )
      );
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCriando(true);

    try {
      const token = await obterToken();

      if (!token) {
        setCriando(false);
        return;
      }

      const resposta = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: senha,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(
          resultado.error ||
            "Não foi possível criar o usuário."
        );
        setCriando(false);
        return;
      }

      setMensagem("Usuário criado com sucesso.");
      setEmail("");
      setSenha("");

      await carregarUsuarios(token);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }

    setCriando(false);
  }

  function limparFormularioPrompt() {
    setEditandoPrompt(null);
    setTituloPrompt("");
    setDescricaoPrompt("");
    setCategoriaPrompt("");
    setConteudoPrompt("");
    setAtivoPrompt(true);
    setImagemArquivo(null);
    setVideoArquivo(null);
    setImagemUrl("");
    setVideoUrl("");
    setTipoMidiaPrompt("image");
  }

  function abrirNovoPrompt() {
    limparFormularioPrompt();
    setErro("");
    setMensagem("");
    setMostrarFormularioPrompt(true);
  }

  function abrirEditarPrompt(prompt: Prompt) {
    setEditandoPrompt(prompt);
    setTituloPrompt(prompt.title);
    setDescricaoPrompt(prompt.description || "");
    setCategoriaPrompt(prompt.category || "");
    setConteudoPrompt(prompt.content);
    setAtivoPrompt(prompt.active);
    setImagemArquivo(null);
    setVideoArquivo(null);
    setImagemUrl(prompt.image_url || "");
    setVideoUrl(prompt.video_url || "");
    setTipoMidiaPrompt(prompt.media_type || (prompt.video_url && prompt.image_url ? "both" : prompt.video_url ? "video" : "image"));
    setErro("");
    setMensagem("");
    setMostrarFormularioPrompt(true);
  }

  function fecharFormularioPrompt() {
    setMostrarFormularioPrompt(false);
    limparFormularioPrompt();
  }

  async function enviarArquivo(
    arquivo: File,
    pasta: "images" | "videos"
  ) {
    const extensao =
      arquivo.name.split(".").pop()?.toLowerCase() || "bin";

    const nomeArquivo =
      `${pasta}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("prompt-media")
      .upload(nomeArquivo, arquivo, {
        upsert: false,
        contentType: arquivo.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("prompt-media")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

  async function salvarPrompt(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!tituloPrompt.trim()) {
      setErro("Informe o título do prompt.");
      return;
    }

    if (!conteudoPrompt.trim()) {
      setErro("Informe o conteúdo do prompt.");
      return;
    }

    setSalvandoPrompt(true);

    try {
      const token = await obterToken();

      if (!token) {
        setSalvandoPrompt(false);
        return;
      }

      let novaImagemUrl = imagemUrl.trim();
      let novoVideoUrl = videoUrl.trim();

      if (imagemArquivo) {
        try {
          novaImagemUrl = await enviarArquivo(
            imagemArquivo,
            "images"
          );
        } catch (error) {
          setErro(
            "Não foi possível enviar a imagem: " +
              (error instanceof Error
                ? error.message
                : "erro desconhecido.")
          );
          setSalvandoPrompt(false);
          return;
        }
      }

      if (videoArquivo) {
        try {
          novoVideoUrl = await enviarArquivo(
            videoArquivo,
            "videos"
          );
        } catch (error) {
          setErro(
            "Não foi possível enviar o vídeo: " +
              (error instanceof Error
                ? error.message
                : "erro desconhecido.")
          );
          setSalvandoPrompt(false);
          return;
        }
      }

      const metodo = editandoPrompt ? "PATCH" : "POST";

      const corpo = editandoPrompt
        ? {
            id: editandoPrompt.id,
            title: tituloPrompt.trim(),
            description: descricaoPrompt.trim(),
            category: categoriaPrompt.trim(),
            content: conteudoPrompt.trim(),
            active: ativoPrompt,
            image_url: novaImagemUrl || null,
            video_url: novoVideoUrl || null,
            media_type: tipoMidiaPrompt,
          }
        : {
            title: tituloPrompt.trim(),
            description: descricaoPrompt.trim(),
            category: categoriaPrompt.trim(),
            content: conteudoPrompt.trim(),
            active: ativoPrompt,
            image_url: novaImagemUrl || null,
            video_url: novoVideoUrl || null,
            media_type: tipoMidiaPrompt,
          };

      const resposta = await fetch("/api/admin/prompts", {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corpo),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setErro(
          resultado.error ||
            "Não foi possível salvar o prompt."
        );
        setSalvandoPrompt(false);
        return;
      }

      setMensagem(
        editandoPrompt
          ? "Prompt atualizado com sucesso."
          : "Prompt criado com sucesso."
      );

      await carregarPrompts(token);

      fecharFormularioPrompt();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    }

    setSalvandoPrompt(false);
  }

  async function alterarStatusPrompt(prompt: Prompt) {
    try {
      const token = await obterToken();

      if (!token) return;

      const resposta = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: prompt.id,
          active: !prompt.active,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        alert(
          resultado.error ||
            "Não foi possível alterar o status."
        );
        return;
      }

      setPrompts((lista) =>
        lista.map((item) =>
          item.id === prompt.id
            ? {
                ...item,
                active: resultado.prompt.active,
              }
            : item
        )
      );
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  }

  async function excluirPrompt(prompt: Prompt) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o prompt "${prompt.title}"?`
    );

    if (!confirmar) return;

    try {
      const token = await obterToken();

      if (!token) return;

      const resposta = await fetch("/api/admin/prompts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: prompt.id,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        alert(
          resultado.error ||
            "Não foi possível excluir o prompt."
        );
        return;
      }

      setPrompts((lista) =>
        lista.filter((item) => item.id !== prompt.id)
      );

      setMensagem("Prompt excluído com sucesso.");
    } catch {
      alert("Erro ao conectar com o servidor.");
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) =>
    (usuario.email || "")
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  const promptsFiltrados = prompts.filter((prompt) => {
    const termo = buscaPrompt.toLowerCase();

    return (
      prompt.title.toLowerCase().includes(termo) ||
      (prompt.category || "").toLowerCase().includes(termo) ||
      (prompt.description || "").toLowerCase().includes(termo)
    );
  });

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090d] text-white">
        Carregando área administrativa...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] p-8 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Administração
            </h1>

            <p className="mt-2 text-gray-400">
              Gerencie usuários e prompts.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-gray-800 px-4 py-2 hover:bg-gray-700"
          >
            Voltar
          </button>
        </div>

        <div className="mb-8 flex gap-2 border-b border-gray-800">
          <button
            onClick={() => {
              setAba("usuarios");
              setErro("");
              setMensagem("");
            }}
            className={`px-5 py-3 font-semibold ${
              aba === "usuarios"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Usuários
          </button>

          <button
            onClick={() => {
              setAba("prompts");
              setErro("");
              setMensagem("");
            }}
            className={`px-5 py-3 font-semibold ${
              aba === "prompts"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Prompts
          </button>
        </div>

        {erro && (
          <div className="mb-6 rounded-lg bg-red-900/30 p-4 text-red-400">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-lg bg-green-900/30 p-4 text-green-400">
            {mensagem}
          </div>
        )}

        {aba === "usuarios" && (
          <>
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
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) =>
                    setSenha(e.target.value)
                  }
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
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar usuário por e-mail..."
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                className="w-full rounded-lg border border-gray-700 bg-[#0b0e13] px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800">
              <div className="grid grid-cols-4 bg-gray-900 p-4 font-semibold">
                <div>E-mail</div>
                <div>Status</div>
                <div>Função</div>
                <div>Ação</div>
              </div>

              {usuariosFiltrados.map((usuario) => (
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
                        alterarAcesso(
                          usuario.id,
                          usuario.active
                        )
                      }
                      className="rounded-lg bg-gray-800 px-3 py-2 hover:bg-gray-700"
                    >
                      {usuario.active
                        ? "Bloquear"
                        : "Liberar"}
                    </button>
                  </div>
                </div>
              ))}

              {usuariosFiltrados.length === 0 && (
                <div className="p-6 text-center text-gray-400">
                  Nenhum usuário encontrado.
                </div>
              )}
            </div>
          </>
        )}

        {aba === "prompts" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  Prompts
                </h2>

                <p className="mt-1 text-gray-400">
                  Cadastre e gerencie os prompts da plataforma.
                </p>
              </div>

              <button
                onClick={abrirNovoPrompt}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
              >
                + Novo prompt
              </button>
            </div>

            {mostrarFormularioPrompt && (
              <div className="mb-8 rounded-xl border border-gray-800 bg-[#0b0e13] p-6">
                <h3 className="mb-5 text-xl font-semibold">
                  {editandoPrompt
                    ? "Editar prompt"
                    : "Novo prompt"}
                </h3>

                <form
                  onSubmit={salvarPrompt}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Título
                    </label>

                    <input
                      type="text"
                      value={tituloPrompt}
                      onChange={(e) =>
                        setTituloPrompt(e.target.value)
                      }
                      placeholder="Ex.: Análise fundamentalista"
                      className="w-full rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Imagem de capa
                    </label>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) =>
                        setImagemArquivo(
                          e.target.files?.[0] || null
                        )
                      }
                      className="w-full rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-sm text-gray-300"
                    />

                    {imagemArquivo && (
                      <p className="mt-2 text-sm text-green-400">
                        Imagem selecionada:{" "}
                        {imagemArquivo.name}
                      </p>
                    )}

                    {!imagemArquivo && imagemUrl && (
                      <p className="mt-2 truncate text-sm text-gray-500">
                        Imagem atual: {imagemUrl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Vídeo
                    </label>

                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) =>
                        setVideoArquivo(
                          e.target.files?.[0] || null
                        )
                      }
                      className="w-full rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-sm text-gray-300"
                    />

                    {videoArquivo && (
                      <p className="mt-2 text-sm text-green-400">
                        Vídeo selecionado:{" "}
                        {videoArquivo.name}
                      </p>
                    )}

                    {!videoArquivo && videoUrl && (
                      <p className="mt-2 truncate text-sm text-gray-500">
                        Vídeo atual: {videoUrl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Tipo de mídia do prompt
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${tipoMidiaPrompt === "image" ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-[#07090d]"}`}>
                        <input type="radio" name="tipoMidiaPrompt" value="image" checked={tipoMidiaPrompt === "image"} onChange={() => setTipoMidiaPrompt("image")} />
                        <span>🖼️ Imagem</span>
                      </label>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${tipoMidiaPrompt === "video" ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-[#07090d]"}`}>
                        <input type="radio" name="tipoMidiaPrompt" value="video" checked={tipoMidiaPrompt === "video"} onChange={() => setTipoMidiaPrompt("video")} />
                        <span>🎥 Vídeo</span>
                      </label>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${tipoMidiaPrompt === "both" ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-[#07090d]"}`}>
                        <input type="radio" name="tipoMidiaPrompt" value="both" checked={tipoMidiaPrompt === "both"} onChange={() => setTipoMidiaPrompt("both")} />
                        <span>🎥🖼️ Ambos</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Descrição
                    </label>

                    <input
                      type="text"
                      value={descricaoPrompt}
                      onChange={(e) =>
                        setDescricaoPrompt(e.target.value)
                      }
                      placeholder="Breve descrição do prompt"
                      className="w-full rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Categoria
                    </label>

                    <input
                      type="text"
                      value={categoriaPrompt}
                      onChange={(e) =>
                        setCategoriaPrompt(e.target.value)
                      }
                      placeholder="Ex.: Investimentos"
                      className="w-full rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-400">
                      Conteúdo do prompt
                    </label>

                    <textarea
                      value={conteudoPrompt}
                      onChange={(e) =>
                        setConteudoPrompt(e.target.value)
                      }
                      placeholder="Digite aqui o prompt completo..."
                      rows={12}
                      className="w-full resize-y rounded-lg border border-gray-700 bg-[#07090d] px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={ativoPrompt}
                      onChange={(e) =>
                        setAtivoPrompt(e.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <span>Prompt ativo</span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={salvandoPrompt}
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {salvandoPrompt
                        ? "Salvando..."
                        : editandoPrompt
                        ? "Salvar alterações"
                        : "Salvar prompt"}
                    </button>

                    <button
                      type="button"
                      onClick={fecharFormularioPrompt}
                      className="rounded-lg bg-gray-800 px-6 py-3 hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar prompt por título, categoria ou descrição..."
                value={buscaPrompt}
                onChange={(e) =>
                  setBuscaPrompt(e.target.value)
                }
                className="w-full rounded-lg border border-gray-700 bg-[#0b0e13] px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800">
              <div className="grid grid-cols-[2fr_1fr_1fr_2fr] bg-gray-900 p-4 font-semibold">
                <div>Prompt</div>
                <div>Categoria</div>
                <div>Status</div>
                <div>Ações</div>
              </div>

              {promptsFiltrados.map((prompt) => (
                <div
                  key={prompt.id}
                  className="grid grid-cols-[2fr_1fr_1fr_2fr] items-center border-t border-gray-800 p-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {prompt.title}
                    </div>

                    {prompt.description && (
                      <div className="mt-1 truncate text-sm text-gray-400">
                        {prompt.description}
                      </div>
                    )}

                    <div className="mt-2 flex gap-2 text-xs text-gray-500">
                      {prompt.image_url && (
                        <span>Imagem</span>
                      )}
                      {prompt.video_url && (
                        <span>Vídeo</span>
                      )}
                      <span>{prompt.media_type === "both" ? "Imagem + Vídeo" : prompt.media_type === "video" ? "Vídeo" : "Imagem"}</span>
                    </div>
                  </div>

                  <div className="text-gray-300">
                    {prompt.category || "Sem categoria"}
                  </div>

                  <div>
                    {prompt.active ? (
                      <span className="text-green-400">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-red-400">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        abrirEditarPrompt(prompt)
                      }
                      className="rounded-lg bg-gray-800 px-3 py-2 hover:bg-gray-700"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        alterarStatusPrompt(prompt)
                      }
                      className="rounded-lg bg-gray-800 px-3 py-2 hover:bg-gray-700"
                    >
                      {prompt.active
                        ? "Desativar"
                        : "Ativar"}
                    </button>

                    <button
                      onClick={() =>
                        excluirPrompt(prompt)
                      }
                      className="rounded-lg bg-red-900/50 px-3 py-2 text-red-300 hover:bg-red-900"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {promptsFiltrados.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  Nenhum prompt encontrado.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}