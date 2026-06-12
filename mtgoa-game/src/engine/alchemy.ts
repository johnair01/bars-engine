/**
 * Emotional Alchemy — channel generation (Wuxing cycle), metabolize, exile.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § Emotional Alchemy.
 *   - Generative cycle: generating a channel also yields +1 of the next element.
 *   - Dual-state deck cost ladder: play (+stress) / metabolize (channel) / exile (higher channel).
 */
import type { ChannelPool, Element } from "@/data/channels";
import { nextInCycle } from "@/data/channels";
import { RULES } from "./rules";

export function emptyPool(): ChannelPool {
  return {};
}

export function poolGet(pool: ChannelPool, element: Element): number {
  return pool[element] ?? 0;
}

export function addToPool(pool: ChannelPool, element: Element, amount: number): ChannelPool {
  return { ...pool, [element]: poolGet(pool, element) + amount };
}

/**
 * Generate channel energy. Per the Wuxing generative cycle, +1 of `element` also
 * produces +1 of the next element downstream (Water → +Water +Wood).
 */
export function generateChannel(pool: ChannelPool, element: Element): ChannelPool {
  const withPrimary = addToPool(pool, element, 1);
  return addToPool(withPrimary, nextInCycle(element), 1);
}

/** Whether the player can afford to spend `amount` of `element`. */
export function canSpend(pool: ChannelPool, element: Element, amount: number): boolean {
  return poolGet(pool, element) >= amount;
}

export function spendChannel(pool: ChannelPool, element: Element, amount: number): ChannelPool {
  return addToPool(pool, element, -amount);
}

export interface AlchemyResult {
  ok: boolean;
  pool: ChannelPool;
  reason?: string;
}

/**
 * Metabolize a shadow: pay the matching channel cost → it flips to light.
 * Returns ok:false (unchanged pool) if the player can't pay.
 */
export function metabolize(pool: ChannelPool, channel: Element): AlchemyResult {
  const cost = RULES.alchemy.metabolizeCost;
  if (!canSpend(pool, channel, cost)) {
    return { ok: false, pool, reason: `Need ${cost} ${channel} to metabolize` };
  }
  return { ok: true, pool: spendChannel(pool, channel, cost) };
}

/**
 * Exile a shadow: pay the higher channel cost → removed from the deck permanently
 * (the deck gets more efficient). Caller is responsible for removing the card.
 */
export function exile(pool: ChannelPool, channel: Element): AlchemyResult {
  const cost = RULES.alchemy.exileCost;
  if (!canSpend(pool, channel, cost)) {
    return { ok: false, pool, reason: `Need ${cost} ${channel} to exile` };
  }
  return { ok: true, pool: spendChannel(pool, channel, cost) };
}
