"use client";

import { useEffect, useState } from "react";
import { prompts } from "./prompts";

  
export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<number[]>([]);
  const [activePage, setActivePage] = useState("home");
  const [showFavorites, setShowFavorites] = useState(false);
  const addRecent = (id: number) => {
  setRecentPrompts((prev) => {
    const updated = [
      id,
      ...prev.filter((item) => item !== id),
    ].slice(0, 12);

    localStorage.setItem(
      "recentPrompts",
      JSON.stringify(updated)
    );

    return updated;
  });
};


 useEffect(() => {
  const savedFavorites = localStorage.getItem("favorites");

  if (savedFavorites) {
    setFavorites(JSON.parse(savedFavorites));
  }

  const savedRecentPrompts =
    localStorage.getItem("recentPrompts");

  if (savedRecentPrompts) {
    setRecentPrompts(JSON.parse(savedRecentPrompts));
  }
}, []);
useEffect(() => {
  if (showFavorites) {
    setTimeout(() => {
      document.getElementById("lista-prompts")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  }
}, [showFavorites]);


const [copiedId, setCopiedId] = useState<number | null>(null);
const aiOptions = ["Todas", ...new Set(prompts.map((prompt) => prompt.ai))];
const [selectedAI, setSelectedAI] = useState("Todas");
const categoryOptions = [
  "Todas",
  ...new Set(prompts.map((prompt) => prompt.category)),
];

const [selectedCategory, setSelectedCategory] = useState("Todas");

  const filteredPrompts = prompts.filter((prompt) => {
  const text = (
  prompt.title +
  " " +
  prompt.description +
  " " +
  prompt.category +
  " " +
  prompt.platform +
  " " +
  prompt.ai +
  " " +
  prompt.prompt
).toLowerCase();

const matchesSearch = text.includes(search.toLowerCase());


    const matchesFilter =
  filter === "Todos" || prompt.type === filter;

const matchesAI =
  selectedAI === "Todas" || prompt.ai === selectedAI;

const matchesCategory =
  selectedCategory === "Todas" ||
  prompt.category === selectedCategory;
const matchesFavorites =
  !showFavorites || favorites.includes(prompt.id);

return (
  matchesSearch &&
  matchesFilter &&
  matchesAI &&
  matchesCategory &&
  matchesFavorites
);

});
function toggleFavorite(promptId: number) {
  setFavorites((current) => {
    const updated = current.includes(promptId)
      ? current.filter((id) => id !== promptId)
      : [...current, promptId];

    localStorage.setItem("favorites", JSON.stringify(updated));

    return updated;
  });
}


  async function copyPrompt(prompt: (typeof prompts)[number]) {
  try {
    await navigator.clipboard.writeText(
      `${prompt.title}\n\n${prompt.description}\n\n${prompt.prompt}`
    );

    addRecent(prompt.id);

    setCopiedId(prompt.id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);

  } catch (error) {
    console.error("Erro ao copiar o prompt:", error);
  }
}





  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_35%),#07090d] text-white">


  <div className="flex min-h-screen">


    {/* SIDEBAR */}

<aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[#080a0f] lg:flex lg:flex-col">

  <div className="border-b border-white/10 px-6 py-7">

    <div className="flex items-center gap-3">

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
        N
      </div>

      <div>

        <h1 className="text-sm font-bold tracking-[0.15em] text-white">
          PROMPTS
        </h1>

        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-500">
          NIVVO
        </p>

      </div>

    </div>

  </div>



{/* MENU */}


<nav className="flex-1 px-4 py-6">

  {/* INÍCIO — ATIVO */}

  <button
  onClick={() => {
  setActivePage("home");
  setShowFavorites(false);

  setTimeout(() => {
    document.getElementById("categorias")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}}


  className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
    !showFavorites
      ? "bg-blue-500/10 font-medium text-blue-400 shadow-lg shadow-blue-500/5"
      : "text-gray-500 hover:bg-white/5 hover:text-white"
  }`}
>
  <span className="text-base">⌂</span>
  Início
</button>




  {/* EXPLORAR */}

  <button
  onClick={() => {
    setShowFavorites(false);
    document.getElementById("biblioteca")?.scrollIntoView({
      behavior: "smooth",
    });
  }}
  className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 transition-all duration-200 hover:bg-white/5 hover:text-white"
>
  <span className="text-base">⌕</span>
  Explorar
</button>



  {/* FAVORITOS */}

<button
  onClick={() => {
    setActivePage("home");
    setShowFavorites(true);
  }}
  className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
    showFavorites
      ? "bg-blue-500/10 font-medium text-blue-400 shadow-lg shadow-blue-500/5"
      : "text-gray-500 hover:bg-white/5 hover:text-white"
  }`}
>
  <span className="text-base">
    {showFavorites ? "♥" : "♡"}
  </span>

  Favoritos
</button>



  {/* RECENTES */}

<button
  onClick={() => {
  setActivePage("recentes");
  setShowFavorites(false);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}}

  className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
    activePage === "recentes"
      ? "bg-blue-500/10 font-medium text-blue-400 shadow-lg shadow-blue-500/5"
      : "text-gray-500 hover:bg-white/5 hover:text-white"
  }`}
>
  <span className="text-base">◷</span>
  Recentes
</button>



  {/* MEUS PROMPTS */}

  <button className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 transition-all duration-200 hover:bg-white/5 hover:text-white">
    <span className="text-base">▣</span>
    Meus Prompts
  </button>


  {/* COLEÇÕES */}

<button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 transition-all duration-200 hover:bg-white/5 hover:text-white">
  <span className="text-base">□</span>
  Coleções
</button>


{/* SEPARADOR */}

<div className="my-5 border-t border-white/10" />


{/* Hub Boss IA´s Ilimitadas */}

<button
  onClick={() => setActivePage("hub-boss")}
  className="flex w-full items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10"
>
  <span className="text-base">🔥</span>
  Hub Boss IA´s Ilimitadas
</button>


</nav>


{/* SIDEBAR FOOTER */}


<div className="border-t border-white/10 p-4">
  <div className="flex items-center gap-3 rounded-xl px-3 py-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-gray-300">
      N
    </div>


    <div>
      <p className="text-xs font-medium text-gray-300">
        NIVVO
      </p>


      <p className="text-[10px] text-gray-600">
        Biblioteca de Prompts
      </p>
    </div>
  </div>
</div>

    </aside>


    <div className="min-w-0 flex-1">


      {/* TOP BAR */}

<header className="border-b border-white/10 bg-[#07090d]/80 backdrop-blur-xl">
  <div className="flex items-center justify-between px-6 py-5 lg:px-10">

    {/* ESQUERDA */}

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        PROMPTS NIVVO
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Sua biblioteca criativa
      </p>
    </div>

    {/* DIREITA — QUANTIDADE DE PROMPTS */}

    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-gray-400">
      {prompts.length} prompts disponíveis
    </div>

  </div>
</header>
{/* PÁGINA RECENTES */}


{activePage === "recentes" && (
  <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-10 lg:pt-20">


    {/* TÍTULO */}

<div id="recentes" className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Sua atividade
      </p>


      <h2 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
        Prompts recentes
      </h2>


      <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">
        Aqui você encontrará os últimos prompts que copiou.
      </p>
    </div>




    {/* LISTA DE RECENTES */}


    {recentPrompts.length === 0 ? (


      /* NENHUM RECENTE */


      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">


        <div className="text-4xl">
          ◷
        </div>


        <h3 className="mt-5 text-xl font-semibold text-white">
          Nenhum prompt recente
        </h3>


        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
          Os prompts que você copiar aparecerão aqui para facilitar
          seu acesso depois.
        </p>


        <button
          onClick={() => {
            setActivePage("home");
            setShowFavorites(false);
          }}
          className="mt-7 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
        >
          Explorar prompts →
        </button>


      </div>


    ) : (


      /* CARDS DOS RECENTES */


      <div
  id="lista-prompts"
  className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
>



        {recentPrompts.map((id) => {


          const prompt = prompts.find(
            (item) => item.id === id
          );


          if (!prompt) return null;


          return (


            <div
              key={prompt.id}
              className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:border-blue-500/30"
            >


              <span className="text-xs font-semibold text-blue-400">
                {prompt.type}
              </span>


              <h3 className="mt-3 text-lg font-semibold text-white">
                {prompt.title}
              </h3>


              <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                {prompt.prompt}
              </p>


              <button
  onClick={() => copyPrompt(prompt)}
  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500"
>
  {copiedId === prompt.id ? "✓ Copiado!" : "Copiar novamente"}
</button>



            </div>


          );


        })}


      </div>


    )}


  </section>
)}


{activePage === "hub-boss" && (
  <>
    <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-10 lg:pt-20">


  {/* HERO HUB BOSS */}

  <div className="overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-white/[0.02] to-transparent shadow-2xl shadow-black/30">

    <div className="px-6 py-12 md:px-12 md:py-16">

      {/* BADGE */}

      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400">
        🔥 HUB BOSS • IA'S ILIMITADAS
      </div>


      {/* TÍTULO */}

      <h2 className="mt-7 max-w-5xl text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
        Suas ferramentas de IA.

        <span className="block text-blue-500">
          Sempre ao seu alcance.
        </span>
      </h2>


      {/* DESCRIÇÃO */}

      <p className="mt-7 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
        Tenha acesso a diversas ferramentas de inteligência artificial,
        criação, design e conteúdo através de um único painel.
      </p>


      {/* ACESSO EM QUALQUER DISPOSITIVO */}

      <div className="mt-8 flex flex-wrap gap-3">

        <span className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs font-semibold text-blue-400">
          📱 Use também pelo celular
        </span>

        <span className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-gray-300">
          💻 Computador
        </span>

        <span className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-gray-300">
          ⚡ Acesso prático
        </span>

      </div>


      {/* BOTÕES */}

      <div className="mt-10 flex flex-wrap gap-4">

        <a
          href="https://pay.ferramentasboss.com.br/87d8dh?utm_source=prompts-nivvo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/30"
        >
          🔥 Quero participar
          <span>→</span>
        </a>

        <button
          onClick={() =>
            document
              .getElementById("ferramentas-hub")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          Ver ferramentas ↓
        </button>

      </div>

    </div>


    {/* DESTAQUES */}

    <div className="grid border-t border-white/10 md:grid-cols-4">

      <div className="border-b border-white/10 px-6 py-6 md:border-b-0 md:border-r md:px-8">

        <p className="text-2xl">📱</p>

        <h3 className="mt-3 font-semibold text-white">
          Use no celular
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Tenha a praticidade de acessar suas ferramentas também pelo celular.
        </p>

      </div>


      <div className="border-b border-white/10 px-6 py-6 md:border-b-0 md:border-r md:px-8">

        <p className="text-2xl">💻</p>

        <h3 className="mt-3 font-semibold text-white">
          Use no computador
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Aproveite a experiência completa através do painel.
        </p>

      </div>


      <div className="border-b border-white/10 px-6 py-6 md:border-b-0 md:border-r md:px-8">

        <p className="text-2xl">🔐</p>

        <h3 className="mt-3 font-semibold text-white">
          Login individual
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Tenha seu próprio acesso para entrar na plataforma.
        </p>

      </div>


      <div className="px-6 py-6 md:px-8">

        <p className="text-2xl">🔄</p>

        <h3 className="mt-3 font-semibold text-white">
          Sempre atualizado
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Novas ferramentas e recursos podem ser adicionados ao painel.
        </p>

      </div>

    </div>

  </div>

</section>

  {/* FERRAMENTAS DISPONÍVEIS */}

  <section
    id="ferramentas-hub"
    className="mx-auto max-w-7xl px-6 pb-20 lg:px-10"
  >
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-10">

      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Ferramentas disponíveis
        </p>

        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
          Tudo o que você precisa.
          <span className="block text-gray-500">
            Em um único lugar.
          </span>
        </h2>

        <p className="mt-5 text-sm leading-7 text-gray-400 md:text-base">
          Explore algumas das principais ferramentas disponíveis para criação,
          inteligência artificial, imagens, vídeos e conteúdo.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {[
          ["💬", "ChatGPT", "IA para ideias, textos e produtividade."],
          ["✨", "Gemini", "Recursos avançados de inteligência artificial."],
          ["⚡", "Grok", "Assistência com IA para diversas tarefas."],
          ["🎥", "Veo3", "Criação de vídeos com inteligência artificial."],
          ["🎨", "Midjourney", "Criação de imagens com IA."],
          ["🖼️", "Leonardo IA", "Ferramentas para criação visual."],
          ["🎬", "Runway", "Criação e edição de vídeos."],
          ["🎵", "Suno", "Criação de músicas com inteligência artificial."],
        ].map(([icon, name, description]) => (
          <div
            key={name}
            className="rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="text-2xl">{icon}</div>

            <h3 className="mt-4 font-semibold text-white">
              {name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {description}
            </p>
          </div>
        ))}

      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-6 md:flex-row md:items-center">

        <div>
          <h3 className="font-semibold text-white">
            E muito mais ferramentas.
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Explore os recursos disponíveis dentro do Hub Boss.
          </p>
        </div>

        <a
          href="https://pay.ferramentasboss.com.br/87d8dh?utm_source=prompts-nivvo"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500"
        >
          🔥 Quero participar →
        </a>

      </div>

    </div>
  </section>
{/* COMO FUNCIONA */}

<section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">

  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-10">

    {/* TÍTULO */}

    <div className="max-w-2xl">

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Como funciona
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Simples. Rápido.
        <span className="block text-gray-500">
          Tudo organizado para você.
        </span>
      </h2>

      <p className="mt-5 text-sm leading-7 text-gray-400 md:text-base">
        Entre para o Hub Boss, receba suas informações de acesso e comece
        a explorar o melhor painel deferramentas do mercado.
      </p>

    </div>


    {/* PASSOS */}

    <div className="mt-12 grid gap-6 md:grid-cols-3">


      {/* PASSO 1 */}

      <div className="relative rounded-2xl border border-white/10 bg-[#0d1016] p-6">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
          01
        </div>

        <div className="mt-6 text-3xl">
          🔥
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white">
          Entre para o Hub
        </h3>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Clique no botão de quero participar e siga para o site oficial
          do Hub Boss.
        </p>

      </div>


      {/* PASSO 2 */}

      <div className="relative rounded-2xl border border-white/10 bg-[#0d1016] p-6">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
          02
        </div>

        <div className="mt-6 text-3xl">
          🔐
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white">
          Receba seu acesso
        </h3>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Após a confirmação, você recebe as informações necessárias
          para acessar a plataforma direto no e-mail.
        </p>

      </div>


      {/* PASSO 3 */}

      <div className="relative rounded-2xl border border-white/10 bg-[#0d1016] p-6">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
          03
        </div>

        <div className="mt-6 text-3xl">
          🚀
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white">
          Explore as ferramentas
        </h3>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Entre no painel e explore as melhores ferramentas disponíveis de
          inteligência artificial, criação e produtividade.
        </p>

      </div>


    </div>


    {/* CTA */}

    <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-6 md:flex-row md:items-center">

      <div>

        <h3 className="text-lg font-semibold text-white">
          Pronto para começar?
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          Entre para o Hub Boss e confira todas as informações.
        </p>

      </div>


      <a
        href="https://pay.ferramentasboss.com.br/87d8dh?utm_source=prompts-nivvo"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
      >
        🔥 Quero participar →
      </a>

    </div>

  </div>

</section>
{/* BENEFÍCIOS */}

<section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">

  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-10">

    {/* TÍTULO */}

    <div className="max-w-2xl">

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Benefícios
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Mais praticidade.
        <span className="block text-gray-500">
          Mais possibilidades.
        </span>
      </h2>

      <p className="mt-5 text-sm leading-7 text-gray-400 md:text-base">
        Tenha uma experiência organizada para acessar ferramentas e recursos
        em um único lugar.
      </p>

    </div>


    {/* CARDS */}

    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


      {/* BENEFÍCIO 1 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          ⚡
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Acesso rápido
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Tenha acesso às informações necessárias para começar a utilizar a plataforma.
        </p>

      </div>


      {/* BENEFÍCIO 2 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          🔐
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Login individual
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Tenha seu próprio acesso para entrar e utilizar o painel.
        </p>

      </div>


      {/* BENEFÍCIO 3 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          📱
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Use no celular
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Tenha a praticidade de acessar suas ferramentas também pelo celular.
        </p>

      </div>


      {/* BENEFÍCIO 4 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          💻
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Use no computador
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Aproveite uma experiência completa através do painel.
        </p>

      </div>


      {/* BENEFÍCIO 5 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          🔄
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Sempre atualizado
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Novas ferramentas e recursos podem ser adicionados à plataforma.
        </p>

      </div>


      {/* BENEFÍCIO 6 */}

      <div className="rounded-2xl border border-white/10 bg-[#0d1016] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          🛟
        </div>

        <h3 className="mt-5 text-lg font-semibold text-white">
          Suporte
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Conte com suporte para tirar dúvidas e receber orientações quando precisar.
        </p>

      </div>

    </div>

  </div>

</section>
{/* PLANOS */}

{/* PLANOS */}

<section
  id="planos-hub"
  className="mx-auto max-w-7xl px-6 pb-20 lg:px-10"
>


  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-10">

    {/* TÍTULO */}

    <div className="max-w-2xl">

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Planos
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Escolha o plano ideal
        <span className="block text-gray-500">
          para você.
        </span>
      </h2>

      <p className="mt-5 text-sm leading-7 text-gray-400 md:text-base">
        Escolha a opção que mais combina com você e tenha acesso ao Hub Boss.
      </p>

    </div>


    {/* CARDS DOS PLANOS */}

    <div className="mt-12 grid gap-6 lg:grid-cols-2">


      {/* PLANO MENSAL */}

      <div className="rounded-3xl border border-white/10 bg-[#0d1016] p-7 md:p-8">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Plano mensal
        </p>

        <h3 className="mt-4 text-2xl font-bold text-white">
          Mensal
        </h3>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          Tenha acesso ao Hub Boss com renovação mensal.
        </p>


        {/* PREÇO */}

        <div className="mt-8">

          <span className="text-4xl font-bold text-white">
            R$ 87
          </span>

          <span className="ml-2 text-sm text-gray-500">
            / mês
          </span>

        </div>


        {/* BENEFÍCIOS */}

        <div className="mt-8 space-y-4 text-sm text-gray-400">

          <div className="flex items-center gap-3">
            <span className="text-blue-500">✓</span>
            Acesso às ferramentas disponíveis
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-500">✓</span>
            Login individual
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-500">✓</span>
            Acesso pelo celular e computador
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-500">✓</span>
            Suporte e atualizações
          </div>

        </div>


        {/* BOTÃO */}

        <a
          href="https://pay.ferramentasboss.com.br/5nvb2v?utm_source=site-prompts"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10"
        >
          Escolher plano mensal →
        </a>

      </div>



      {/* PLANO ANUAL */}

      <div className="relative overflow-hidden rounded-3xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-[#0d1016] to-[#0d1016] p-7 shadow-xl shadow-blue-500/10 md:p-8">


        {/* BADGE */}

        <div className="absolute right-5 top-5 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Mais vantajoso 🔥
        </div>


        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Plano anual
        </p>

        <h3 className="mt-4 text-2xl font-bold text-white">
          Anual
        </h3>

        <p className="mt-4 text-sm leading-6 text-gray-400">
          Mais economia para aproveitar o Hub Boss durante todo o ano.
        </p>


        {/* PREÇO */}

        <div className="mt-8">

          <div>
            <span className="text-4xl font-bold text-white">
              12x R$ 70,93
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            ou R$ 697 à vista
          </p>

        </div>


        {/* BENEFÍCIOS */}

        <div className="mt-8 space-y-4 text-sm text-gray-300">

          <div className="flex items-center gap-3">
            <span className="text-blue-400">✓</span>
            Acesso às ferramentas disponíveis
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-400">✓</span>
            Login individual
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-400">✓</span>
            Acesso pelo celular e computador
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-400">✓</span>
            Economia no plano anual
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-400">✓</span>
            Suporte e atualizações
          </div>

        </div>


        {/* BOTÃO */}

        <a
          href="https://pay.ferramentasboss.com.br/sskkac?utm_source=site-prompts-anual"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
        >
          🔥 Escolher plano anual
        </a>

      </div>

    </div>

  </div>

</section>
{/* FAQ */}

<section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">

  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-10">

    {/* TÍTULO */}

    <div className="max-w-2xl">

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Perguntas frequentes
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Ficou com alguma dúvida?
        <span className="block text-gray-500">
          A gente responde.
        </span>
      </h2>

      <p className="mt-5 text-sm leading-7 text-gray-400 md:text-base">
        Confira algumas das dúvidas mais comuns sobre o Hub Boss.
      </p>

    </div>


    {/* PERGUNTAS */}

    <div className="mt-10 space-y-3">


      {/* PERGUNTA 1 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          Funciona no celular?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Sim. Você pode acessar a plataforma também pelo celular,
          trazendo mais praticidade para utilizar os recursos onde estiver.
        </p>

      </details>


      {/* PERGUNTA 2 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          Posso usar no computador?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Sim. O Hub Boss também pode ser acessado pelo computador,
          permitindo uma experiência completa através do painel.
        </p>

      </details>


      {/* PERGUNTA 3 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          Como recebo meu acesso?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Após a confirmação da sua participação, você recebe as informações
          necessárias para acessar a plataforma.
        </p>

      </details>


      {/* PERGUNTA 4 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          As ferramentas podem receber atualizações?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Sim. Novas ferramentas e recursos podem ser adicionados e atualizados
          ao longo do tempo dentro da plataforma.
        </p>

      </details>


      {/* PERGUNTA 5 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          Meu acesso é individual?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Sim. Cada participante possui suas próprias informações de acesso
          para utilizar a plataforma.
        </p>

      </details>


      {/* PERGUNTA 6 */}

      <details className="group rounded-2xl border border-white/10 bg-[#0d1016] p-5 transition-all duration-300 hover:border-blue-500/30">

        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">

          Ainda tenho dúvidas. Como posso pedir ajuda?

          <span className="text-xl text-blue-400 transition-transform duration-300 group-open:rotate-45">
            +
          </span>

        </summary>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
          Caso tenha alguma dúvida, você poderá entrar em contato com o suporte
          para receber orientações e informações.
        </p>

      </details>

    </div>


    {/* CTA FINAL */}

    <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-6 md:flex-row md:items-center">

      <div>

        <h3 className="text-lg font-semibold text-white">
          Pronto para conhecer o Hub Boss?
        </h3>

        <p className="mt-2 text-sm text-gray-400">
          Escolha o plano ideal para você e comece agora.
        </p>

      </div>

      <button
  onClick={() =>
    document
      .getElementById("planos-hub")
      ?.scrollIntoView({ behavior: "smooth" })
  }
  className="shrink-0 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
>
  Ver planos ↑
</button>


    </div>

  </div>

</section>
{/* FOOTER */}

<footer className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">

  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1016]">

    {/* PARTE SUPERIOR */}

    <div className="grid gap-10 px-6 py-10 md:grid-cols-2 md:px-10 lg:grid-cols-4">

      {/* MARCA */}

      <div className="lg:col-span-2">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
            N
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-[0.15em] text-white">
              PROMPTS
            </h3>

            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-500">
              NIVVO
            </p>
          </div>

        </div>


        <p className="mt-6 max-w-md text-sm leading-7 text-gray-500">
          Sua biblioteca criativa e seu espaço para explorar ferramentas de
          inteligência artificial, criação, produtividade e muito mais.
        </p>


        {/* BOTÃO */}

        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
        >
          ↑ Voltar ao topo
        </button>

      </div>


      {/* NAVEGAÇÃO */}

      <div>

        <h4 className="text-sm font-semibold text-white">
          Navegação
        </h4>

        <div className="mt-5 flex flex-col gap-3">

          <button
            onClick={() =>
              document
                .getElementById("ferramentas-hub")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="w-fit text-left text-sm text-gray-500 transition-colors hover:text-white"
          >
            Ferramentas
          </button>

          <button
            onClick={() =>
              document
                .getElementById("planos-hub")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="w-fit text-left text-sm text-gray-500 transition-colors hover:text-white"
          >
            Planos
          </button>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-fit text-left text-sm text-gray-500 transition-colors hover:text-white"
          >
            Como funciona
          </button>

        </div>

      </div>


      {/* HUB BOSS */}

      <div>

        <h4 className="text-sm font-semibold text-white">
          Hub Boss
        </h4>

        <div className="mt-5 space-y-3 text-sm text-gray-500">

          <p>
            📱 Acesso pelo celular
          </p>

          <p>
            💻 Acesso pelo computador
          </p>

          <p>
            🔐 Login individual
          </p>

          <p>
            🔄 Recursos atualizados
          </p>

        </div>

      </div>

    </div>


    {/* LINHA INFERIOR */}

    <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-6 text-xs text-gray-600 md:flex-row md:items-center md:justify-between md:px-10">

      <p>
        © 2026 NIVVO. Todos os direitos reservados.
      </p>

      <div className="flex items-center gap-5">

        <span>
          Hub Boss • IA's Ilimitadas
        </span>

        <span className="hidden h-1 w-1 rounded-full bg-gray-700 md:block" />

        <span>
          Feito para criadores
        </span>

      </div>

    </div>

  </div>

</footer>

  </>
)}


      {/* HERO */}

<section
  id="biblioteca"
  className={`mx-auto max-w-7xl px-6 pb-12 pt-16 lg:px-10 lg:pt-20 ${
  activePage === "hub-boss" ? "hidden" : ""
}`}

>


  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/20 md:p-8">

    <div className="flex flex-col gap-8">

      {/* HERO */}

      <div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Biblioteca NIVVO
        </p>

        <h2 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Sua biblioteca de
          <span className="block text-gray-500">
            prompts para IA.
          </span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
          Encontre prompts prontos para criação de imagens,
          vídeos e conteúdos com inteligência artificial.
        </p>

      </div>

      {/* SEARCH */}

      <div className="flex w-full items-center rounded-2xl border border-white/10 bg-[#0d1016] px-5 py-1 shadow-lg shadow-black/20 transition-all duration-300 focus-within:border-blue-500/50 focus-within:bg-[#10141c] focus-within:shadow-blue-500/10">

        <span className="mr-3 text-lg text-gray-500">
          🔎
        </span>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar prompts..."
          className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-gray-600"
        />

      </div>

      {/* FILTERS */}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Tipo
          </span>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/10 bg-[#0d1016] px-5 py-3 pr-10 text-sm font-medium text-gray-300 shadow-lg shadow-black/20 outline-none transition-all duration-300 hover:border-blue-500/30 hover:bg-[#10141c] focus:border-blue-500/50 focus:bg-[#10141c] focus:ring-2 focus:ring-blue-500/10"
          >
            <option value="Todos">Todos</option>
            <option value="Vídeos">Vídeos</option>
            <option value="Imagens">Imagens</option>
          </select>

        </div>

        <span className="text-xs text-gray-600">
          Use a busca e os filtros para encontrar o prompt ideal
        </span>

      </div>

    </div>

  </div>

</section>


    {/* CATEGORIES */}

<section
  id="categorias"
  className="mx-auto max-w-7xl px-6 pb-16 lg:px-10 lg:pt-8"
>


  <div className="mb-4 flex items-center gap-3">

    <div className="h-px w-8 bg-blue-500/50" />

    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
      Categorias
    </p>

  </div>

  <div className="flex flex-wrap gap-2.5">

    {[
      "POV",
      "UGC",
      "Mirror Self",
      "Ultrarrealista",
      "Outros",
    ].map((category) => (
      <button
  key={category}
  onClick={() => setSelectedCategory(category)}
 className={`rounded-xl border px-4 py-2.5 text-xs font-medium transition-all duration-300 ${
  selectedCategory === category
    ? "border-blue-500/60 bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/20"
    : "border-white/10 bg-white/[0.02] text-gray-400 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 hover:shadow-md hover:shadow-blue-500/5"
}`}

>
  {category}
</button>

    ))}
  </div>
</section>


      {/* PROMPTS */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10 lg:pt-12">

  <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">

    <div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
        Biblioteca
      </p>

      <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Explore os prompts
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {filteredPrompts.length} prompts encontrados
      </p>

    </div>

    <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400 sm:block">
      Biblioteca NIVVO
    </div>

  </div>


        {/* GRID */}

{filteredPrompts.length > 0 ? (

  <div
  id="lista-prompts"
  className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
>


    {filteredPrompts.map((prompt) => (

      <article
        key={prompt.id}
        className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0d1016]/95 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
      >

        {/* IMAGE */}

        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950/40 via-[#10131a] to-[#07090d]">

          <img
            src={prompt.image}
            alt={prompt.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-70" />

          {/* TYPE */}

          <span className="absolute left-3 top-3 rounded-lg border border-blue-500/20 bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 backdrop-blur">
            {prompt.type}
          </span>

          {/* FAVORITE */}

          <button
            onClick={() => toggleFavorite(prompt.id)}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border text-lg backdrop-blur transition-all duration-200 ${
              favorites.includes(prompt.id)
                ? "scale-110 border-red-500/50 bg-red-500/20 text-red-400"
                : "border-white/10 bg-black/60 text-white hover:scale-105 hover:border-red-500/40 hover:text-red-400"
            }`}
          >
            {favorites.includes(prompt.id) ? "♥" : "♡"}
          </button>

        </div>

        {/* CONTENT */}

        <div className="p-5">

          {/* PLATFORM / CATEGORY */}

          <div className="mb-4 flex flex-wrap items-center gap-2">

            <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-400 transition group-hover:border-blue-500/40">
              {prompt.platform}
            </span>

            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 transition group-hover:border-white/20 group-hover:text-gray-300">
              {prompt.category}
            </span>

          </div>

          {/* TITLE */}

          <h4 className="line-clamp-2 text-base font-semibold leading-6 tracking-tight text-white transition group-hover:text-blue-400">
            {prompt.title}
          </h4>

          {/* DESCRIPTION */}

          <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-6 text-gray-400">
            {prompt.description}
          </p>

          {/* FOOTER */}

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

            <span className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-[10px] font-medium tracking-wider text-gray-600">
              #{prompt.id.toString().padStart(3, "0")}
            </span>

            <button
              onClick={() => copyPrompt(prompt)}


              className={`rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
                copiedId === prompt.id
                  ? "bg-green-500 shadow-green-500/20"
                  : "bg-blue-600 shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30"
              }`}
            >
              {copiedId === prompt.id ? "✓ Copiado!" : "Copy Prompt"}
            </button>

          </div>

        </div>

      </article>

    ))}

  </div>

) : (

  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">

    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
      🔎
    </div>

    <h4 className="text-lg font-semibold text-white">
      Nenhum prompt encontrado
    </h4>

    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
      Tente alterar sua busca, filtros ou categoria.
    </p>

  </div>

)}

</section>

    </div>

  </div>
{/* MENU MOBILE */}
<nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#080a0f]/95 px-2 py-3 backdrop-blur-xl lg:hidden">


  {/* INÍCIO */}
  <button
    onClick={() => {
      setActivePage("home");
      setShowFavorites(false);


      setTimeout(() => {
        document.getElementById("categorias")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }}
    className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-gray-400 transition hover:text-blue-400"
  >
    <span className="text-xl">⌂</span>
    Início
  </button>




  {/* EXPLORAR */}
  <button
    onClick={() => {
  setActivePage("explorar");
  setShowFavorites(false);

  setTimeout(() => {
    document.getElementById("biblioteca")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}}

    className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-gray-400 transition hover:text-blue-400"
  >
    <span className="text-xl">⌕</span>
    Explorar
  </button>




  {/* FAVORITOS */}
  <button
    onClick={() => {
      setActivePage("home");
      setShowFavorites(true);


      setTimeout(() => {
        document.getElementById("lista-prompts")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }}
    className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-gray-400 transition hover:text-blue-400"
  >
    <span className="text-xl">
      {showFavorites ? "♥" : "♡"}
    </span>
    Favoritos
  </button>




  {/* RECENTES */}
  <button
    onClick={() => {
      setActivePage("recentes");
      setShowFavorites(false);


      setTimeout(() => {
        document
          .getElementById("recentes")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    }}
    className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-gray-400 transition hover:text-blue-400"
  >
    <span className="text-xl">◷</span>
    Recentes
  </button>




  {/* HUB BOSS */}
  <button
    onClick={() => {
      setActivePage("hub-boss");
      setShowFavorites(false);


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }}
    className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-blue-400 transition hover:text-blue-300"
  >
    <span className="text-xl">🔥</span>
    Hub Boss
  </button>


</nav>

</main>
  );
}

