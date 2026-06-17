/**
 * buildEncounterFromIntake — the bridge from Applied Mode intake to a playable,
 * provably-completable trust/attune encounter.
 *
 * The Six Unpacking Questions (api/intake.ts) produce an `IntakeConfig`; this
 * pure function synthesizes the `EncounterConfig` the trust engine runs. Because
 * it targets the trust engine (not the proven-unwinnable channel engine), and
 * because it mirrors the structure of the hand-authored Priya encounters
 * (align-per-need + four domains + ≥2 dissolvable shadows), every output is
 * winnable by construction — asserted in
 * __tests__/intakeCompletability.sim.test.ts under the shared sim policies.
 *
 * Design decisions (ratified 2026-06-12, see
 * .specify/specs/applied-mode-intake-conversation/spec.md):
 *   - Target the trust engine; reuse TrustEncounterScreen.
 *   - 2–3 stuck channels are PAIRED for rhythm ([a,a,b,b,…]); cap 3 distinct.
 *     A single stuck channel is a constant L1-style need.
 *   - The epiphany (Q5) becomes a HIDDEN align card revealed at conversion —
 *     a root-realization beat, optional for the win.
 *   - targetChannel (Q2) is thematic only; the engine reads needs from the
 *     stuck channels, not the target.
 */
import type { Element } from "@/data/channels";
import type { IntakeConfig } from "@/api/intake";
import { TRUST_RULES as R } from "@/engine/trust/trustRules";
import type { EncounterConfig, TrustCard, TrustShadow } from "@/engine/trust/trustTypes";

/** Cap on distinct stuck channels → needs (avoids the alternation softlock). */
export const MAX_DISTINCT_NEEDS = 3;

const DEFAULT_NEED: Element = "Water";

/** Per-channel align-card copy — the inner-track response that matches a need. */
const ALIGN_COPY: Record<Element, { name: string; text: string }> = {
  Water: { name: "Bear Witness", text: "Stay present to the grief without rushing to fix it." },
  Fire: { name: "Name the Anger", text: "Say the heat is legitimate — out loud, beside them." },
  Earth: { name: "Hold the Center", text: "Offer steady ground instead of pushing for a side." },
  Metal: { name: "Honor the Guard", text: "Respect what the precision is protecting before asking it to soften." },
  Wood: { name: "Make Room to Grow", text: "Invite the reach that got punished back into the open." },
};

/** Per-channel default shadow copy — the defended posture of a stuck feeling. */
const SHADOW_COPY: Record<Element, { name: string; text: string }> = {
  Water: { name: "Quiet Withdrawal", text: "Goes silent rather than risk more loss." },
  Fire: { name: "Managed Anger", text: "Holds the heat in so no one calls them difficult." },
  Earth: { name: "Frozen Neutrality", text: "Stays in the middle to avoid taking a side." },
  Metal: { name: "Iron Control", text: "Grips so tightly nothing real gets through." },
  Wood: { name: "Stunted Reach", text: "Stops reaching because reaching got punished." },
};

/** The four standard domain cards — outer track. Direct Action is her-only. */
const DOMAIN_DECK: TrustCard[] = [
  { id: "ad-gather", name: "Reach the People Still With You", channel: "Water", kind: "domain", domain: "Gather Resources", text: "Find who is still reachable and willing." },
  { id: "ad-aware", name: "See What's Actually at Stake", channel: "Metal", kind: "domain", domain: "Raise Awareness", text: "Get the situation into clear focus." },
  { id: "ad-organize", name: "Build a Container That Holds", channel: "Earth", kind: "domain", domain: "Skillful Organizing", text: "Make a structure the real work can live in." },
  { id: "ad-direct", name: "Say the True Thing — Together", channel: "Fire", kind: "domain", domain: "Direct Action", herOnly: true, text: "Act on the truth, now that they're an ally." },
];

/** Distinct stuck channels in first-seen order, capped at MAX_DISTINCT_NEEDS. */
export function distinctNeeds(stuckChannels: Element[]): Element[] {
  const seen = new Set<Element>();
  const out: Element[] = [];
  for (const c of stuckChannels) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= MAX_DISTINCT_NEEDS) break;
  }
  return out.length > 0 ? out : [DEFAULT_NEED];
}

/** Need sequence: one channel → constant; 2–3 → paired rhythm ([a,a,b,b,…]). */
export function buildNeedSequence(needs: Element[]): Element[] {
  if (needs.length <= 1) return [needs[0] ?? DEFAULT_NEED];
  return needs.flatMap((c) => [c, c]);
}

/**
 * Synthesize a completable trust encounter from intake answers.
 * @param config  the structured intake output (Six Unpacking Questions).
 * @param opts.npcName  who the encounter is about (default: "Your Counterpart").
 */
export function buildEncounterFromIntake(
  config: IntakeConfig,
  opts: { npcName?: string } = {},
): EncounterConfig {
  const npcName = opts.npcName?.trim() || "Your Counterpart";
  const needs = distinctNeeds(config.stuckChannels);
  const needSequence = buildNeedSequence(needs);

  // Shadows: one per distinct need, with at least two so the convert threshold
  // (R.shadow.convertThreshold) is reachable. A reservation (forest seed) colours
  // a shadow's text when one is available.
  const shadows: TrustShadow[] = needs.map((channel, i) => {
    const seed = config.forestSeeds[i]?.trim();
    const base = SHADOW_COPY[channel];
    return {
      id: `as-${channel.toLowerCase()}-${i}`,
      name: base.name,
      channel,
      text: seed && seed.length > 0 ? seed : base.text,
    };
  });
  while (shadows.length < R.shadow.convertThreshold) {
    const channel = needs[0];
    const i = shadows.length;
    const seed = config.forestSeeds[i]?.trim();
    shadows.push({
      id: `as-${channel.toLowerCase()}-${i}`,
      name: SHADOW_COPY[channel].name,
      channel,
      text: seed && seed.length > 0 ? seed : SHADOW_COPY[channel].text,
    });
  }

  // Inner track: one align card per distinct need (so every need is answerable).
  const alignDeck: TrustCard[] = needs.map((channel) => ({
    id: `ac-${channel.toLowerCase()}`,
    name: ALIGN_COPY[channel].name,
    channel,
    kind: "align",
    text: ALIGN_COPY[channel].text,
  }));

  // The epiphany (Q5): a hidden align card that surfaces only at conversion.
  const epiphanyText = config.epiphany.trim();
  const hiddenCard: TrustCard = {
    id: "ac-epiphany",
    name: "The Root Realization",
    channel: needs[0],
    kind: "align",
    hidden: true,
    text: epiphanyText.length > 0 ? epiphanyText : "What had to be true for them to feel this way.",
  };

  return {
    npcId: "applied-intake",
    npcName,
    level: needs.length > 1 ? 2 : 1,
    needSequence,
    startingStress: Math.min(R.stress.ruptureAt - 1, R.stress.start),
    shadows,
    deck: [...alignDeck, ...DOMAIN_DECK, hiddenCard],
    capstone: {
      title: config.milestoneTitle.trim() || "What you set out to create",
      body:
        config.milestoneBody.trim() ||
        "With them beside you and every domain engaged, you name what's still possible from inside this.",
    },
  };
}
