/**
 * Game State Machine (useReducer).
 *
 * Canonical source: "MTGOA Game — Core Architecture" (stress, contagion, shadow
 * activation, conversion, BAR economy, victory) and the Migration Brief
 * (§ Core Mechanics Summary, § Priority build order #3 "useReducer with action
 * types"). Pure reducer — no React, no I/O — so it is unit-testable in isolation.
 *
 * Where the docs leave a loop detail unstated, the choice is commented INTERP.
 */
import type { ChannelPool, Element } from "@/data/channels";
import type { MoveCard } from "@/data/moves";
import type { NpcLightCard, NpcProfile, NpcShadowCard } from "@/data/npcs";
import type { SuperpowerName } from "@/data/superpowers";
import { getNpc } from "@/data/npcs";

import { RULES } from "./rules";
import { emptyLedger, type BarLedger } from "./bars";
import { buildStartingDeck, type PlayerDeck } from "./deckBuilder";
import {
  emptyPool,
  generateChannel,
  metabolize as metabolizeCost,
  exile as exileCost,
} from "./alchemy";
import {
  isConverted,
  npcChooseCard,
  resolveNpcDecks,
  shadowsRevealed,
  type NpcDecks,
} from "./combat";

export type GameMode = "character-select" | "applied";

export type Phase =
  | "mode-select"
  | "superpower-select"
  | "encounter"
  | "domain"
  | "end";

export type GameResult = "win" | "loss-rupture" | "loss-exhaustion" | null;

/** Round-scoped modifiers imposed by active NPC shadows (cleared each NPC turn). */
export interface RoundModifiers {
  blockRelational: boolean;
  skipProgress: boolean;
  /** Extra channel cost on a card type this round, e.g. action +1 Fire. */
  actionTax: { element: Element; amount: number } | null;
}

export interface GameState {
  mode: GameMode | null;
  phase: Phase;
  result: GameResult;

  superpower: SuperpowerName | null;
  deck: PlayerDeck | null;
  /** Cards still in the player's usable hand (exiled/spent removed). */
  hand: MoveCard[];

  channels: ChannelPool;
  bars: BarLedger;
  playerStress: number;

  npc: NpcProfile | null;
  npcDecks: NpcDecks | null;
  npcStress: number;
  converted: boolean;
  epiphanyRevealed: boolean;
  milestoneProgress: number;
  showUpTarget: number;

  /** NPC shadow cards currently on the board awaiting a counter. */
  activeShadows: NpcShadowCard[];
  metabolizedShadowIds: string[];
  exiledCardIds: string[];
  playedLightIds: string[];

  round: RoundModifiers;
  turn: number;
  log: string[];
}

export type Action =
  | { type: "SELECT_MODE"; mode: GameMode }
  | { type: "SELECT_SUPERPOWER"; superpower: SuperpowerName }
  | { type: "SELECT_ENCOUNTER"; npcId: string }
  | { type: "ENTER_DOMAIN" }
  | { type: "PLAY_MOVE"; cardId: string }
  | { type: "METABOLIZE_HAND_SHADOW"; cardId: string }
  | { type: "EXILE_HAND_SHADOW"; cardId: string }
  | { type: "END_TURN" }
  | { type: "GOTO"; phase: Phase }
  | { type: "RESET" };

const clampStress = (n: number) =>
  Math.max(RULES.stress.min, Math.min(RULES.stress.max, n));

export function initialState(): GameState {
  return {
    mode: null,
    phase: "mode-select",
    result: null,
    superpower: null,
    deck: null,
    hand: [],
    channels: emptyPool(),
    bars: emptyLedger(),
    playerStress: 0,
    npc: null,
    npcDecks: null,
    npcStress: 0,
    converted: false,
    epiphanyRevealed: false,
    milestoneProgress: 0,
    showUpTarget: RULES.victory.defaultShowUpTarget,
    activeShadows: [],
    metabolizedShadowIds: [],
    exiledCardIds: [],
    playedLightIds: [],
    round: emptyRound(),
    turn: 1,
    log: [],
  };
}

function emptyRound(): RoundModifiers {
  return { blockRelational: false, skipProgress: false, actionTax: null };
}

function log(state: GameState, line: string): string[] {
  return [...state.log, `T${state.turn}: ${line}`];
}

// --- Effect appliers ---------------------------------------------------------

/** Apply an NPC light card's benefits to the player/board. */
function applyNpcLight(state: GameState, card: NpcLightCard): GameState {
  let next = { ...state };
  const e = card.effect;
  if (e.playerChannel) {
    next.channels = { ...next.channels };
    next.channels[e.playerChannel.element] =
      (next.channels[e.playerChannel.element] ?? 0) + e.playerChannel.amount;
  }
  if (typeof e.playerStress === "number") {
    next.playerStress = clampStress(next.playerStress + e.playerStress);
  }
  if (e.revealEpiphany) next.epiphanyRevealed = true;
  if (e.showUpBar) next.bars = { ...next.bars, showUp: next.bars.showUp + 1 };
  if (typeof e.milestoneDelta === "number") {
    next.milestoneProgress += e.milestoneDelta;
  }
  // CANONICAL: NPC light move → player stress -1, milestone progress.
  next.playerStress = clampStress(
    next.playerStress + RULES.contagion.npcLightToPlayer,
  );
  next.milestoneProgress += 1;
  next.playedLightIds = [...next.playedLightIds, card.id];
  return next;
}

/** Put an NPC shadow on the board and apply its immediate contagion + effects. */
function applyNpcShadow(state: GameState, card: NpcShadowCard): GameState {
  let next = { ...state };
  // CANONICAL: NPC shadow played → player stress +1.
  next.playerStress = clampStress(
    next.playerStress + RULES.contagion.npcShadowToPlayer,
  );
  const e = card.effect;
  if (e.blockRelational) next.round = { ...next.round, blockRelational: true };
  if (e.skipProgress) next.round = { ...next.round, skipProgress: true };
  if (e.channelTax) {
    next.round = {
      ...next.round,
      actionTax: { element: e.channelTax.element, amount: e.channelTax.amount },
    };
  }
  if (e.drainChannel) {
    next.channels = { ...next.channels };
    next.channels[e.drainChannel.element] = Math.max(
      0,
      (next.channels[e.drainChannel.element] ?? 0) - e.drainChannel.amount,
    );
  }
  if (typeof e.playerStress === "number") {
    next.playerStress = clampStress(next.playerStress + e.playerStress);
  }
  next.activeShadows = [...next.activeShadows, card];
  return next;
}

/** Win/loss evaluation (Core Architecture § Victory Structure). */
function evaluateEnd(state: GameState): GameState {
  if (state.bars.showUp >= state.showUpTarget) {
    return { ...state, result: "win", phase: "end", log: log(state, "Milestone met — you win.") };
  }
  // INTERP: Rupture = collective stress overwhelms the table (both maxed).
  if (
    state.playerStress >= RULES.stress.max &&
    state.npcStress >= RULES.stress.max
  ) {
    return {
      ...state,
      result: "loss-rupture",
      phase: "end",
      log: log(state, "Rupture — collective stress overwhelmed the table."),
    };
  }
  // INTERP: Exhaustion = no shadows left, not converted, milestone unmet.
  const shadowsLeft = state.npcDecks
    ? state.npcDecks.shadow.filter((s) => !state.metabolizedShadowIds.includes(s.id))
    : [];
  if (
    state.npcDecks &&
    !state.converted &&
    shadowsLeft.length === 0 &&
    state.activeShadows.length === 0
  ) {
    return {
      ...state,
      result: "loss-exhaustion",
      phase: "end",
      log: log(state, "Exhaustion — the deck ran out before the milestone."),
    };
  }
  return state;
}

// --- Reducer -----------------------------------------------------------------

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SELECT_MODE":
      return { ...state, mode: action.mode, phase: "superpower-select" };

    case "SELECT_SUPERPOWER": {
      const deck = buildStartingDeck(action.superpower);
      return {
        ...state,
        superpower: action.superpower,
        deck,
        hand: deck.cards,
        phase: "encounter",
      };
    }

    case "SELECT_ENCOUNTER": {
      // Empty id clears the current encounter (back-to-roster).
      if (!action.npcId) {
        return {
          ...state,
          npc: null,
          npcDecks: null,
          npcStress: 0,
          activeShadows: [],
          metabolizedShadowIds: [],
          playedLightIds: [],
          converted: false,
          epiphanyRevealed: false,
          milestoneProgress: 0,
        };
      }
      const npc = getNpc(action.npcId);
      if (!npc) return state;
      const npcDecks = resolveNpcDecks(npc);
      return {
        ...state,
        npc,
        npcDecks,
        npcStress: npc.startingStress,
        showUpTarget: RULES.victory.defaultShowUpTarget,
        log: log(state, `Encounter begins: ${npc.name} (${npc.face} · ${npc.superpower}).`),
      };
    }

    case "ENTER_DOMAIN":
      return { ...state, phase: "domain" };

    case "PLAY_MOVE": {
      if (!state.npc) return state;
      const card = state.hand.find((c) => c.id === action.cardId);
      if (!card) return state;

      let next: GameState = { ...state };

      if (card.state === "light") {
        // Light move generates its channel (+ Wuxing downstream element).
        next.channels = generateChannel(next.channels, card.channel);

        // If it counters an active NPC shadow, metabolize that shadow.
        const target = next.activeShadows.find((s) => s.counter === card.name);
        if (target) {
          // CANONICAL: metabolize NPC shadow → NPC stress -1, clear its round effect.
          next.activeShadows = next.activeShadows.filter((s) => s.id !== target.id);
          next.metabolizedShadowIds = [...next.metabolizedShadowIds, target.id];
          next.npcStress = clampStress(
            next.npcStress + RULES.contagion.metabolizeNpcShadow,
          );
          next.round = recomputeRound(next.activeShadows);
          next.bars = { ...next.bars, cleanUp: next.bars.cleanUp + 1 };
          next.log = log(next, `Played ${card.name} — metabolized ${target.name}.`);

          if (!next.converted && isConverted(next.metabolizedShadowIds)) {
            next.converted = true;
            next.bars = { ...next.bars, growUp: next.bars.growUp + 1 };
            next.log = log(next, `${state.npc.name} crosses the threshold — now an ally.`);
          }
        } else {
          next.bars = { ...next.bars, wakeUp: next.bars.wakeUp + 1 };
          next.log = log(next, `Played ${card.name} (+${card.channel}).`);
        }
      } else {
        // Shadow played as-is: generate channel + add stress (cheap, costly).
        next.channels = generateChannel(next.channels, card.channel);
        next.playerStress = clampStress(
          next.playerStress + RULES.alchemy.shadowPlayStress,
        );
        // CANONICAL: player shadow played → NPC stress +1.
        next.npcStress = clampStress(
          next.npcStress + RULES.contagion.playerShadowToNpc,
        );
        next.log = log(next, `Played shadow ${card.name} (+${card.channel}, +1 stress).`);
      }

      next.hand = next.hand.filter((c) => c.id !== card.id);
      return evaluateEnd(next);
    }

    case "METABOLIZE_HAND_SHADOW": {
      const card = state.hand.find((c) => c.id === action.cardId && c.state === "shadow");
      if (!card) return state;
      const res = metabolizeCost(state.channels, card.channel);
      if (!res.ok) return { ...state, log: log(state, res.reason ?? "Cannot metabolize.") };
      const flipped: MoveCard = { ...card, state: "light" };
      return {
        ...state,
        channels: res.pool,
        hand: state.hand.map((c) => (c.id === card.id ? flipped : c)),
        bars: { ...state.bars, cleanUp: state.bars.cleanUp + 1 },
        log: log(state, `Metabolized ${card.name} → light.`),
      };
    }

    case "EXILE_HAND_SHADOW": {
      const card = state.hand.find((c) => c.id === action.cardId && c.state === "shadow");
      if (!card) return state;
      const res = exileCost(state.channels, card.channel);
      if (!res.ok) return { ...state, log: log(state, res.reason ?? "Cannot exile.") };
      return {
        ...state,
        channels: res.pool,
        hand: state.hand.filter((c) => c.id !== card.id),
        exiledCardIds: [...state.exiledCardIds, card.id],
        log: log(state, `Exiled ${card.name} — deck is leaner.`),
      };
    }

    case "END_TURN": {
      if (!state.npc || !state.npcDecks) return state;
      // Clear round modifiers, then let the NPC act.
      let next: GameState = { ...state, round: emptyRound() };

      const play = npcChooseCard({
        npc: next.npc!,
        decks: next.npcDecks!,
        npcStress: next.npcStress,
        converted: next.converted,
        metabolizedShadowIds: next.metabolizedShadowIds,
        playedLightIds: next.playedLightIds,
      });

      if (play.kind === "shadow") {
        next = applyNpcShadow(next, play.card);
        next.log = log(next, `${next.npc!.name} plays ${play.card.name}.`);
      } else if (play.kind === "light") {
        next = applyNpcLight(next, play.card);
        next.log = log(next, `${next.npc!.name} plays ${play.card.name}.`);
      } else {
        next.log = log(next, `${next.npc!.name} holds steady.`);
      }

      // Recompute round modifiers from whatever shadows remain on the board.
      next.round = recomputeRound(next.activeShadows);
      next.turn += 1;
      return evaluateEnd(next);
    }

    case "GOTO":
      return { ...state, phase: action.phase };

    case "RESET":
      return initialState();

    default:
      return state;
  }
}

/** Recompute round-scoped modifiers from the shadows currently on the board. */
function recomputeRound(active: NpcShadowCard[]): RoundModifiers {
  const round = emptyRound();
  for (const s of active) {
    if (s.effect.blockRelational) round.blockRelational = true;
    if (s.effect.skipProgress) round.skipProgress = true;
    if (s.effect.channelTax) {
      round.actionTax = { element: s.effect.channelTax.element, amount: s.effect.channelTax.amount };
    }
  }
  return round;
}

/** Convenience selector: are the NPC's shadows currently revealed? */
export function npcShadowsVisible(state: GameState): boolean {
  return shadowsRevealed(state.npcStress);
}
