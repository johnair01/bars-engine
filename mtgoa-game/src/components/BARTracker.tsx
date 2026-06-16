/**
 * BARTracker — the four BAR types (Core Architecture § The BAR Economy).
 * Show Up is the score; it carries the milestone target.
 */
import { BAR_META, BAR_TYPES, type BarLedger } from "@/engine/bars";
import { cn } from "@/lib/utils";

interface Props {
  bars: BarLedger;
  showUpTarget: number;
}

const accent: Record<string, string> = {
  wakeUp: "text-cognitive",
  cleanUp: "text-water",
  growUp: "text-relational",
  showUp: "text-accent",
};

export function BARTracker({ bars, showUpTarget }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {BAR_TYPES.map((t) => (
        <div key={t} className="flex flex-col rounded-md border border-border bg-surf px-2 py-1.5">
          <span className="ds-label text-muted">{BAR_META[t].label}</span>
          <span className={cn("text-lg font-bold tabular-nums", accent[t])}>
            {bars[t]}
            {t === "showUp" && <span className="text-xs text-muted">/{showUpTarget}</span>}
          </span>
          <span className="text-[9px] leading-tight text-muted">{BAR_META[t].function}</span>
        </div>
      ))}
    </div>
  );
}
