/**
 * StressBar — a single 0–7 stress meter. Encounter/Domain screens render two
 * (player + NPC) for the dual-state contagion view (Core Architecture § Stress).
 */
import { RULES } from "@/engine/rules";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  /** Whether contagion-threshold annotations should be shown. */
  showThresholds?: boolean;
}

const MAX = RULES.stress.max;

function segmentColor(i: number, value: number): string {
  if (i >= value) return "bg-border";
  if (i >= RULES.stress.dysregulationThreshold - 1) return "bg-fire";
  if (i >= RULES.stress.sympatheticThreshold - 1) return "bg-earth";
  if (i >= RULES.stress.contagionThreshold - 1) return "bg-water";
  return "bg-relational";
}

export function StressBar({ label, value, showThresholds }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="ds-label text-muted">{label} Stress</span>
        <span className="text-sm font-bold tabular-nums text-dim">
          {value}/{MAX}
        </span>
      </div>
      <div className="flex gap-1" role="meter" aria-valuenow={value} aria-valuemax={MAX}>
        {Array.from({ length: MAX }, (_, i) => (
          <div key={i} className={cn("h-2.5 flex-1 rounded-sm", segmentColor(i, value))} />
        ))}
      </div>
      {showThresholds && value >= RULES.stress.contagionThreshold && (
        <span className="text-[10px] text-muted">
          {value >= RULES.stress.dysregulationThreshold
            ? "Dysregulation — action phase blocked"
            : value >= RULES.stress.sympatheticThreshold
              ? "Sympathetic state — can spend but not receive"
              : "Contagion active — dysregulation spreads"}
        </span>
      )}
    </div>
  );
}
