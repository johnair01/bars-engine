/**
 * Trust/Attune engine — a pure, testable reducer (no React, no I/O).
 *
 * One action per turn:
 *   ATTUNE          reveal her live need (hidden until read)
 *   PLAY align      match the need → +trust; mismatch → -trust, +stress (misread)
 *   PLAY domain     engage a domain (outer work — not alignment-judged)
 *   BASIC           "Show Up Honestly" — always available, +1 after attuning, never negative
 *   DISSOLVE        spend trust to dissolve a shadow; threshold → conversion
 *   CAPSTONE        win if converted AND all four domains engaged
 *
 * Completability guarantee: the only loss is rupture, and rupture only comes from
 * misreads. A reader who attunes before acting never misreads → stress never
 * rises → the table never ruptures → a win is always reachable. (Proven by
 * trust/__tests__/trustCompletability.sim.test.ts.)
 */
import type { Element } from "@/data/channels";
import { DOMAIN_NAMES, type DomainName } from "@/data/domains";
import { TRUST_RULES as R } from "./trustRules";
import type { EncounterConfig, TrustCard, TrustShadow } from "./trustTypes";

export type TrustResult = "win" | "loss-rupture" | null;

export interface TrustState {
  phase: "encounter" | "end";
  result: TrustResult;
  trust: number;
  npcStress: number;
  needIndex: number;
  needRevealed: boolean;
  needTrail: Element[];
  shadows: TrustShadow[];
  dissolvedShadowIds: string[];
  converted: boolean;
  domainsTouched: DomainName[];
  turn: number;
  config: EncounterConfig;
  log: string[];
}

export type TrustAction =
  | { type: "ATTUNE" }
  | { type: "PLAY"; cardId: string }
  | { type: "BASIC" }
  | { type: "DISSOLVE"; shadowId: string }
  | { type: "CAPSTONE" }
  | { type: "RESET" };

export function currentNeed(state: TrustState): Element {
  const seq = state.config.needSequence;
  return seq[state.needIndex % seq.length];
}

export function allDomainsTouched(state: TrustState): boolean {
  return DOMAIN_NAMES.every((d) => state.domainsTouched.includes(d));
}

/** The cards currently in the playable hand. `hidden` cards (the epiphany) stay
 *  out of hand until the NPC is converted, then surface as the revealed beat. */
export function visibleHand(state: TrustState): TrustCard[] {
  return state.config.deck.filter((c) => !c.hidden || state.converted);
}

export function initTrustEncounter(config: EncounterConfig): TrustState {
  return {
    phase: "encounter",
    result: null,
    trust: 0,
    npcStress: config.startingStress,
    needIndex: 0,
    needRevealed: false,
    needTrail: [],
    shadows: [...config.shadows],
    dissolvedShadowIds: [],
    converted: false,
    domainsTouched: [],
    turn: 1,
    config,
    log: [],
  };
}

const logLine = (s: TrustState, line: string): string[] => [...s.log, `T${s.turn}: ${line}`];

/** Advance the turn. If the live need changes (alternating levels), it is hidden
 *  again until re-attuned. A constant L1 need stays revealed. */
function advanceTurn(s: TrustState): TrustState {
  const prevNeed = currentNeed(s);
  const next: TrustState = { ...s, needIndex: s.needIndex + 1, turn: s.turn + 1 };
  if (currentNeed(next) !== prevNeed) next.needRevealed = false;
  return next;
}

function checkRupture(s: TrustState): TrustState {
  if (s.npcStress >= R.stress.ruptureAt) {
    return { ...s, result: "loss-rupture", phase: "end", log: logLine(s, "Rupture — she walls off and leaves.") };
  }
  return s;
}

export function trustReducer(state: TrustState, action: TrustAction): TrustState {
  if (action.type === "RESET") return initTrustEncounter(state.config);
  if (state.phase === "end") return state;

  switch (action.type) {
    case "ATTUNE": {
      // Attune reveals the live need and spends the turn. On alternating levels
      // the need is authored in pairs, so you read on the first beat and respond
      // on the second while that need is still live. Learning the rhythm lets an
      // expert skip the read and respond straight away — that's the skill.
      const need = currentNeed(state);
      const s: TrustState = {
        ...state,
        needRevealed: true,
        needTrail: [...state.needTrail, need],
        log: logLine(state, `Attuned — her live need is ${need}.`),
      };
      return advanceTurn(s);
    }

    case "PLAY": {
      const card = state.config.deck.find((c) => c.id === action.cardId);
      if (!card) return state;

      // Hidden cards (the epiphany) haven't surfaced until she's converted.
      if (card.hidden && !state.converted) {
        return { ...state, log: logLine(state, `${card.name} hasn't surfaced yet.`) };
      }

      if (card.kind === "align") {
        const need = currentNeed(state);
        if (card.channel === need) {
          const trust = state.trust + R.trust.alignedGain;
          return advanceTurn({ ...state, trust, log: logLine(state, `Played ${card.name} — aligned (+${R.trust.alignedGain} trust → ${trust}).`) });
        }
        const trust = Math.max(R.trust.floor, state.trust - R.trust.misreadLoss);
        const npcStress = state.npcStress + R.stress.misreadGain;
        const misread = checkRupture({ ...state, trust, npcStress, log: logLine(state, `Played ${card.name} — misread (-${R.trust.misreadLoss} trust, +${R.stress.misreadGain} stress).`) });
        return misread.result ? misread : advanceTurn(misread);
      }

      // domain card — outer-track engagement (not alignment-judged)
      if (card.herOnly && !state.converted) {
        return { ...state, log: logLine(state, `${card.name} needs Priya as ally — convert her first.`) };
      }
      if (!card.domain || state.domainsTouched.includes(card.domain)) {
        return { ...state, log: logLine(state, card.domain ? `${card.domain} already engaged.` : `${card.name} engages nothing.`) };
      }
      return advanceTurn({
        ...state,
        domainsTouched: [...state.domainsTouched, card.domain],
        log: logLine(state, `Played ${card.name} — engaged ${card.domain}.`),
      });
    }

    case "BASIC": {
      const gain = state.needRevealed ? R.trust.basicGain : 0;
      const trust = state.trust + gain;
      const line = gain > 0 ? `Showed up honestly (+${gain} trust → ${trust}).` : `Showed up honestly — but you haven't read her yet (+0).`;
      return advanceTurn({ ...state, trust, log: logLine(state, line) });
    }

    case "DISSOLVE": {
      const shadow = state.shadows.find((sh) => sh.id === action.shadowId);
      if (!shadow) return state;
      if (state.trust < R.shadow.dissolveCost) {
        return { ...state, log: logLine(state, `Not enough trust to dissolve ${shadow.name} (need ${R.shadow.dissolveCost}).`) };
      }
      let s: TrustState = {
        ...state,
        trust: state.trust - R.shadow.dissolveCost,
        shadows: state.shadows.filter((sh) => sh.id !== shadow.id),
        dissolvedShadowIds: [...state.dissolvedShadowIds, shadow.id],
        npcStress: Math.max(R.stress.min, state.npcStress - R.stress.dissolveRelief),
        log: logLine(state, `Dissolved ${shadow.name} (-${R.shadow.dissolveCost} trust).`),
      };
      if (!s.converted && s.dissolvedShadowIds.length >= convertThreshold(state.config)) {
        s = { ...s, converted: true, log: logLine(s, `${state.config.npcName} crosses the threshold — now she plays with you.`) };
      }
      return advanceTurn(s);
    }

    case "CAPSTONE": {
      if (state.converted && allDomainsTouched(state)) {
        return { ...state, result: "win", phase: "end", log: logLine(state, `Capstone: ${state.config.capstone.title} — you win.`) };
      }
      return { ...state, log: logLine(state, "Capstone not ready — need Priya as ally and all four domains engaged.") };
    }

    default:
      return state;
  }
}
