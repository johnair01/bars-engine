/**
 * BAR Economy.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § The BAR Economy.
 *
 *   Wake Up  → expand the map (unlock scenario tiers / ally types)
 *   Clean Up → spendable energy, the primary currency (Dominion money model)
 *   Grow Up  → gate permissions / tier unlocks
 *   Show Up  → victory points (the score)
 */

export type BarType = "wakeUp" | "cleanUp" | "growUp" | "showUp";

export type BarLedger = Record<BarType, number>;

export const BAR_META: Record<BarType, { label: string; function: string }> = {
  wakeUp: { label: "Wake Up", function: "Expand the map" },
  cleanUp: { label: "Clean Up", function: "Spendable energy" },
  growUp: { label: "Grow Up", function: "Gate permissions" },
  showUp: { label: "Show Up", function: "Victory points" },
};

export const BAR_TYPES: BarType[] = ["wakeUp", "cleanUp", "growUp", "showUp"];

export function emptyLedger(): BarLedger {
  return { wakeUp: 0, cleanUp: 0, growUp: 0, showUp: 0 };
}

export function addBar(ledger: BarLedger, type: BarType, amount = 1): BarLedger {
  return { ...ledger, [type]: ledger[type] + amount };
}

/** Win when Show Up BARs reach the milestone target (default 10). */
export function hasReachedShowUpTarget(ledger: BarLedger, target: number): boolean {
  return ledger.showUp >= target;
}
