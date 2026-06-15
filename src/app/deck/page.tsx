import type { Metadata } from "next";
import { AllyshipDeckReader } from "@/components/deck/AllyshipDeckReader";

export const metadata: Metadata = {
  title: "The Allyship Deck — Mastering Allyship Moves",
  description:
    "A consultable deck of allyship moves. Draw for inspiration, or consult to find the move that restores a capability.",
};

export default function DeckPage() {
  return <AllyshipDeckReader />;
}
