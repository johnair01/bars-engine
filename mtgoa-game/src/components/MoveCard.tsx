/**
 * MoveCard — a player card with play / metabolize / exile actions.
 * Shadow cards expose the alchemy cost ladder (Core Architecture § Dual-State Deck).
 */
import type { MoveCard as MoveCardData } from "@/data/moves";
import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { RULES } from "@/engine/rules";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const typeColor: Record<string, string> = {
  emotional: "text-emotional",
  relational: "text-relational",
  cognitive: "text-cognitive",
  action: "text-action",
};

interface Props {
  card: MoveCardData;
  /** Names of NPC shadows currently on the board this card could counter. */
  counterableNames?: string[];
  onPlay: (id: string) => void;
  onMetabolize: (id: string) => void;
  onExile: (id: string) => void;
  disabled?: boolean;
}

export function MoveCard({ card, counterableNames = [], onPlay, onMetabolize, onExile, disabled }: Props) {
  const isShadow = card.state === "shadow";
  const ch = channelClass[card.channel];
  const counters = card.counters && counterableNames.includes(card.counters);

  return (
    <div
      className={cn(
        "flex w-44 flex-col gap-2 rounded-card border bg-card p-2.5",
        isShadow ? "border-fire/50" : ch.border,
        counters && "ring-2 ring-accent",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-card-title font-bold leading-tight text-text">{card.name}</span>
        <span className={cn("text-base leading-none", ch.text)}>{CHANNELS[card.channel].glyph}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge className={cn("bg-surf", ch.text)}>{card.channel}</Badge>
        <Badge className={cn("bg-surf", typeColor[card.type])}>{card.type}</Badge>
        {isShadow && <Badge className="bg-fire/20 text-fire">shadow</Badge>}
        {card.provisional && <Badge className="bg-surf text-muted">provisional</Badge>}
      </div>

      <p className="text-card-body leading-snug text-dim">{card.text}</p>

      <div className="mt-auto flex flex-col gap-1">
        <Button size="sm" variant={counters ? "default" : "subtle"} disabled={disabled} onClick={() => onPlay(card.id)}>
          {counters ? `Counter ${card.counters}` : "Play"}
        </Button>
        {isShadow && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={disabled}
              onClick={() => onMetabolize(card.id)}
            >
              Metabolize ({RULES.alchemy.metabolizeCost})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              disabled={disabled}
              onClick={() => onExile(card.id)}
            >
              Exile ({RULES.alchemy.exileCost})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
