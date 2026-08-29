export type Prompt = {
  id: number;
  image: string;
  video: string;
  title: string;
  type: string;
  platform: string;
  ai: string;
  category: string;
  description: string;
  prompt: string;
  favorite: boolean
};

export const prompts: Prompt[] = [
  {
    id: 1,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Influencer apresentando produto",
    type: "Vídeo",
    platform: "FLOW",
    ai: "Google Veo",
    category: "POV",
    description:
      "Prompt para criação de vídeo com IA para criar uma influencer apresentando um produto de forma natural e realista.",
    prompt:
      "COLE AQUI O PROMPT COMPLETO DO SEU PRIMEIRO PROMPT.",
      favorite: false,
      
  },

  {
    id: 2,
    image: "/prompts/images/influencerdois.jpeg",
    video: "",
    title: "Prompt 2",
    type: "Vídeo",
    platform: "FLOW",
    ai: "Google Veo",
    category: "POV",
    description: "Descrição do prompt 2.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 3,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 3",
    type: "Imagem",
    platform: "IA",
    ai: "Google Veo",

    category: "POV",
    description: "Descrição do prompt 3.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 4,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 4",
    type: "Imagem",
    platform: "IA",
    ai: "Google Veo",
    category: "Mirror Selfie",
    description: "Descrição do prompt 4.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 5,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 5",
    type: "Vídeo",
    platform: "FLOW",
    ai: "Google Veo",
    category: "POV",
    description: "Descrição do prompt 5.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 6,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 6",
    type: "Vídeo",
    platform: "FLOW",
    ai: "Google Veo",
    category: "POV",
    description: "Descrição do prompt 6.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 7,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 7",
    type: "Vídeo",
    platform: "FLOW",
    ai: "Google Veo",
    category: "Mirror Selfie",
    description: "Descrição do prompt 7.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },

  {
    id: 8,
    image: "/prompts/images/influencer.jpeg",
    video: "",
    title: "Prompt 8",
    type: "Imagem",
    platform: "IA",
    ai: "Google Veo",
    category: "Mirror Selfie",
    description: "Descrição do prompt 8.",
    prompt: "COLE AQUI O PROMPT COMPLETO.",
    favorite: false,
  },
];
