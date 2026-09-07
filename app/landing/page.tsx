"use client";

const CHECKOUT_URL =
  "https://pay.cakto.com.br/38wdyea_1087097";

const VIDEOS = [
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%201.mp4",
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%202.mp4",
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%206.mp4",
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%205.mp4",
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%204.mp4",
  "https://jvffatvkkqqwiguoyusc.supabase.co/storage/v1/object/public/Videos%20Landing/loop%203.mp4",
];

const VIDEO_LOOP = [...VIDEOS, ...VIDEOS];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_45%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 md:px-10 md:pb-28 md:pt-12">

          {/* LOGO */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-2xl sm:h-12 sm:w-12">
                <img
                  src="/logo.jpeg"
                  alt="KNIGHTS LAB"
                  className="h-full w-full object-contain"
                />
              </div>

              <span className="text-sm font-bold tracking-[0.18em] text-white sm:text-base">
                KNIGHTS LAB
              </span>
            </div>
          </div>

          {/* BADGE */}
          <div className="mt-10 flex justify-center sm:mt-12">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
              Biblioteca de Prompts
            </span>
          </div>

          {/* HEADLINE */}
          <div className="mx-auto mt-7 max-w-5xl text-center">
            <h1 className="text-[42px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-5xl md:text-7xl">
              Pare de começar seus conteúdos
              <span className="block text-blue-500">
                do zero.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
              Tenha acesso a uma biblioteca de prompts prontos e
              organizados para criar conteúdos para TikTok Shop sem
              precisar começar do zero toda vez.
            </p>
          </div>

          {/* CTA */}
          <div className="mx-auto mt-9 w-full max-w-md">
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/30"
            >
              QUERO ACESSAR A KNIGHTS LAB
            </a>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            R$ 47,90 • Pagamento único • Acesso à Biblioteca Knights Lab
          </p>
        </div>
      </section>


      {/* BENEFÍCIOS */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-24">

          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              O que você encontra
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Tudo organizado em um só lugar.
            </h2>

            <p className="mt-5 text-base leading-7 text-gray-400">
              Em vez de começar do zero toda vez que precisar criar,
              encontre ideias prontas e organizadas para acelerar sua
              produção.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {[
              {
                icon: "⚡",
                title: "Mais velocidade",
                text: "Encontre rapidamente um ponto de partida para seu próximo conteúdo.",
              },
              {
                icon: "🎯",
                title: "Prompts organizados",
                text: "Navegue por categorias e encontre o tipo de prompt que procura.",
              },
              {
                icon: "⌕",
                title: "Busca rápida",
                text: "Pesquise dentro da biblioteca para encontrar prompts específicos.",
              },
              {
                icon: "♡",
                title: "Favoritos",
                text: "Salve seus prompts preferidos para acessar novamente quando quiser.",
              },
              {
                icon: "🎥",
                title: "Referências visuais",
                text: "Conteúdos com referências em vídeo e imagem quando disponíveis.",
              },
              {
  icon: "↻",
  title: "Conteúdo atualizado",
  text: "A biblioteca continua evoluindo, com novos prompts e referências sendo adicionados ao longo do tempo.",
},
              {
                icon: "▣",
                title: "Acesso pelo celular",
                text: "Use a biblioteca pelo celular ou computador.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30"
              >
                <div className="text-2xl text-blue-400">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {item.text}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* VÍDEOS */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#06080d] py-20 md:py-28">

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 md:px-10">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Veja na prática
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Veja o que você pode criar.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">
            Alguns exemplos visuais do tipo de conteúdo que você pode
            explorar usando a Biblioteca Knights Lab.
          </p>

        </div>

        {/* ESTEIRA */}
        <div className="relative mt-12 overflow-hidden md:mt-16">

          <div
            className="flex w-max gap-4"
            style={{
              animation: "knightsVideoMarquee 34s linear infinite",
              willChange: "transform",
            }}
          >
            {VIDEO_LOOP.map((video, index) => (
              <div
                key={`${video}-${index}`}
                className="relative h-[390px] w-[220px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/40 sm:h-[430px] sm:w-[242px] md:h-[500px] md:w-[285px]"
              >
                <video
                  src={video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={index < 6 ? "metadata" : "none"}
                  controls={false}
                  disablePictureInPicture
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />
              </div>
            ))}
          </div>

          {/* MÁSCARAS */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#06080d] to-transparent md:w-32" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#06080d] to-transparent md:w-32" />

        </div>

        <div className="mx-auto mt-10 w-full max-w-md px-4 sm:px-6">

          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
          >
            QUERO ACESSAR A KNIGHTS LAB
          </a>

        </div>

        <style>{`
          @keyframes knightsVideoMarquee {
            from {
              transform: translate3d(0, 0, 0);
            }

            to {
              transform: translate3d(calc(-50% - 8px), 0, 0);
            }
          }
        `}</style>

      </section>


      {/* PROBLEMA */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            O problema
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Criar conteúdo não deveria começar com uma tela em branco.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
            Quando você precisa criar algo novo toda vez, parte do seu
            tempo vai embora apenas tentando descobrir por onde começar.
          </p>

        </div>
      </section>


      {/* SOLUÇÃO */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-28">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              A solução
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Um ponto de partida para cada nova criação.
            </h2>

            <p className="mt-6 text-base leading-7 text-gray-400 md:text-lg">
              A Knights Lab reúne prompts organizados para você consultar
              quando precisar de uma ideia, uma referência ou um novo ponto
              de partida.
            </p>

          </div>

          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-blue-500/20 bg-blue-950/10 p-8 text-center md:p-12">

            <p className="text-lg font-semibold leading-8 text-white md:text-2xl">
              Menos tempo pensando no que criar.
              <br />
              Mais tempo colocando suas ideias em prática.
            </p>

          </div>

        </div>
      </section>


      {/* FUNCIONALIDADES */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-28">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Feita para consultar
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Uma biblioteca pensada para facilitar sua rotina.
            </h2>

          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">

            {[
              {
                title: "Organização",
                text: "Encontre os prompts separados de forma clara para navegar com mais facilidade.",
              },
              {
                title: "Pesquisa",
                text: "Use a busca para encontrar rapidamente o que você precisa dentro da biblioteca.",
              },
              {
                title: "Favoritos",
                text: "Guarde seus prompts preferidos e volte a eles quando precisar.",
              },
              {
                title: "Referências",
                text: "Visualize referências em vídeo e imagem quando elas estiverem disponíveis.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-7"
              >
                <h3 className="text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  {item.text}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* TRANSFORMAÇÃO */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            A mudança
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            De “não sei o que criar”
            <span className="block text-blue-500">
              para “já sei por onde começar”.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-400">
            A proposta é simples: ter um lugar para consultar quando
            faltar uma ideia ou quando você quiser acelerar sua produção.
          </p>

        </div>
      </section>


      {/* COMO FUNCIONA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-28">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Simples e rápido
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Comece em poucos passos.
            </h2>

          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">

            {[
              {
                number: "01",
                title: "Faça sua compra",
                text: "Realize o pagamento único através do checkout.",
              },
              {
                number: "02",
                title: "Receba seu acesso",
                text: "Após a confirmação, você poderá acessar sua área.",
              },
              {
                number: "03",
                title: "Comece a criar",
                text: "Escolha seus prompts e acelere sua produção de conteúdo.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-7"
              >
                <span className="text-sm font-bold text-blue-500">
                  {item.number}
                </span>

                <h3 className="mt-5 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {item.text}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* OFERTA */}
      <section className="px-4 pb-20 sm:px-6 md:px-10 md:pb-28">

        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-white/[0.03] to-transparent p-8 text-center shadow-2xl shadow-black/30 md:p-14">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Acesso à biblioteca
          </p>

          <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
            Knights Lab
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-400 md:text-base">
            Tenha acesso à Biblioteca de Prompts e encontre rapidamente
            ideias para seus conteúdos.
          </p>

          <div className="mt-8">

            <span className="text-5xl font-bold tracking-tight">
              R$ 47,90
            </span>

            <p className="mt-2 text-sm text-gray-500">
              Pagamento único
            </p>

          </div>

          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-8 flex min-h-[56px] w-full max-w-md items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
          >
            QUERO ACESSAR A KNIGHTS LAB
          </a>

        </div>

      </section>


      {/* FAQ */}
      <section className="border-t border-white/10 bg-white/[0.015]">

        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 md:px-10 md:py-28">

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Dúvidas
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Perguntas frequentes
            </h2>

          </div>

          <div className="mt-12 space-y-4">

            {[
              {
                question: "O pagamento é mensal?",
                answer:
                  "Não. O acesso à Biblioteca Knights Lab é vendido através de pagamento único.",
              },
              {
                question: "Posso acessar pelo celular?",
                answer:
                  "Sim. A biblioteca foi desenvolvida para funcionar tanto no computador quanto no celular.",
              },
              {
                question: "Preciso instalar algum programa?",
                answer:
                  "Não. O acesso é feito diretamente pelo navegador.",
              },
              {
                question: "Como recebo meu acesso?",
                answer:
                  "Após a confirmação da compra, o acesso é liberado conforme as regras definidas para o produto.",
              },
            ].map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <summary className="cursor-pointer list-none font-semibold text-white">
                  {item.question}
                </summary>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {item.answer}
                </p>
              </details>
            ))}

          </div>

        </div>

      </section>


      {/* CTA FINAL */}
      <section className="px-4 py-20 text-center sm:px-6 md:px-10 md:py-28">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Knights Lab
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
          Pronto para acelerar sua criação?
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-gray-500">
          Acesse a Biblioteca Knights Lab por R$ 47,90 em pagamento único.
        </p>

        <a
          href={CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-8 flex min-h-[56px] w-full max-w-md items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
        >
          QUERO ACESSAR AGORA
        </a>

      </section>


      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-gray-600">
        © 2026 KNIGHTS LAB. Todos os direitos reservados.
      </footer>

    </main>
  );
}