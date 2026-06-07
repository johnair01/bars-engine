export type Depth = "easy" | "medium" | "hard";

export const DEPTHS: Depth[] = ["easy", "medium", "hard"];

export type FlavorBlock = {
  line: string;
  npc: string;
  title: string;
};

export type CardCopyDraft = {
  title: string;
  flavor: Record<Depth, FlavorBlock>;
  prompts: Record<Depth, string>;
};

type CardLike = {
  title: string;
  flavor: Record<Depth, FlavorBlock>;
  prompts: Record<Depth, string>;
};

export function copyFromCard(card: CardLike): CardCopyDraft {
  return {
    title: card.title,
    flavor: {
      easy: { ...card.flavor.easy },
      medium: { ...card.flavor.medium },
      hard: { ...card.flavor.hard },
    },
    prompts: {
      easy: card.prompts.easy,
      medium: card.prompts.medium,
      hard: card.prompts.hard,
    },
  };
}
