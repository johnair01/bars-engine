/**
 * NPCShadowCard — an NPC resistance card on the board, showing its effect and
 * the player move that counters it (Core Architecture § NPC Shadow Activation).
 */
import type { NpcShadowCard as ShadowData } from "@/data/npcs";
import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  card: ShadowData;
}

export function NPCShadowCard({ card }: Props) {
  const ch = channelClass[card.channel];
  return (
    <div className={cn("flex w-44 flex-col gap-1.5 rounded-card border-2 border-fire/60 bg-card p-2.5")}>
      <div className="flex items-start justify-between gap-1">
        <span className="text-card-title font-bold leading-tight text-fire">{card.name}</span>
        <span className={cn("text-base leading-none", ch.text)}>{CHANNELS[card.channel].glyph}</span>
      </div>
      <Badge className={cn("w-fit bg-surf", ch.text)}>{card.channel} shadow</Badge>
      <p className="text-card-body leading-snug text-dim">{card.text}</p>
      <div className="mt-1 rounded bg-surf px-2 py-1">
        <span className="ds-label text-muted">Counter</span>
        <span className="block text-card-body font-semibold text-relational">{card.counter}</span>
      </div>
    </div>
  );
}
