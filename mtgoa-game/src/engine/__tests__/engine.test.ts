/**
 * Engine smoke test — the Verification Quest for the migrated mechanics.
 *
 * Proves the canonical rules from the design docs actually run: the Wuxing
 * generative cycle, Priya's authored decks, stress contagion, the
 * metabolize → convert threshold, and the Show Up victory condition.
 */
import { describe, expect, it } from "vitest";

import { generateChannel, metabolize, poolGet } from "../alchemy";
import { activeShadowCount, resolveNpcDecks } from "../combat";
import { reducer, initialState, type GameState } from "../gameState";
import { COUNTER_MOVES } from "@/data/moves";
import { getNpc } from "@/data/npcs";

describe("alchemy — Wuxing generative cycle", () => {
  it("generating a channel also yields +1 of the next element (Water → Wood)", () => {
    const pool = generateChannel({}, "Water");
    expect(poolGet(pool, "Water")).toBe(1);
    expect(poolGet(pool, "Wood")).toBe(1); // downstream in the sheng cycle
  });

  it("metabolize fails without enough matching channel, succeeds with it", () => {
    expect(metabolize({}, "Fire").ok).toBe(false);
    const res = metabolize({ Fire: 2 }, "Fire");
    expect(res.ok).toBe(true);
    expect(poolGet(res.pool, "Fire")).toBe(1);
  });
});

describe("combat — shadow activation + authored decks", () => {
  it("activates shadows by NPC stress band (0/1/2/3)", () => {
    expect(activeShadowCount(2)).toBe(0);
    expect(activeShadowCount(3)).toBe(1);
    expect(activeShadowCount(5)).toBe(2);
    expect(activeShadowCount(7)).toBe(3);
  });

  it("Priya ships authored decks; other NPCs are generated", () => {
    const priya = resolveNpcDecks(getNpc("npc-008")!);
    expect(priya.generated).toBe(false);
    expect(priya.shadow).toHaveLength(6);
    expect(priya.light).toHaveLength(5);

    const dara = resolveNpcDecks(getNpc("npc-001")!);
    expect(dara.generated).toBe(true);
    expect(dara.shadow).toHaveLength(6);
  });
});

/** Drive the reducer from the menu into a live Priya encounter. */
function enterPriyaDomain(): GameState {
  let s = initialState();
  s = reducer(s, { type: "SELECT_MODE", mode: "character-select" });
  s = reducer(s, { type: "SELECT_SUPERPOWER", superpower: "Storyteller" });
  s = reducer(s, { type: "SELECT_ENCOUNTER", npcId: "npc-008" });
  s = reducer(s, { type: "ENTER_DOMAIN" });
  return s;
}

describe("reducer — full Priya encounter", () => {
  it("sets up Priya with her starting stress and authored decks", () => {
    const s = enterPriyaDomain();
    expect(s.phase).toBe("domain");
    expect(s.npc?.name).toBe("Priya");
    expect(s.npcStress).toBe(4); // canonical starting stress
    expect(s.npcDecks?.generated).toBe(false);
  });

  it("NPC plays a shadow on END_TURN, raising player stress (contagion)", () => {
    const s = enterPriyaDomain();
    const next = reducer(s, { type: "END_TURN" });
    expect(next.activeShadows.length).toBe(1);
    expect(next.playerStress).toBe(s.playerStress + 1);
  });

  it("metabolizing 3 shadows with their counters converts Priya to an ally", () => {
    // Give the player every canonical counter, and crank NPC stress so 3
    // shadows are active per turn.
    let s = enterPriyaDomain();
    s = { ...s, npcStress: 7, hand: COUNTER_MOVES.map((c) => ({ ...c })) };

    // Each cycle: NPC surfaces a shadow, player plays its counter.
    for (let i = 0; i < 3 && !s.converted; i++) {
      s = reducer(s, { type: "END_TURN" });
      const shadow = s.activeShadows[s.activeShadows.length - 1];
      expect(shadow).toBeDefined();
      const counter = s.hand.find((c) => c.name === shadow.counter);
      expect(counter, `counter for ${shadow.name}`).toBeDefined();
      s = reducer(s, { type: "PLAY_MOVE", cardId: counter!.id });
    }

    expect(s.metabolizedShadowIds.length).toBeGreaterThanOrEqual(3);
    expect(s.converted).toBe(true);
    expect(s.bars.growUp).toBeGreaterThanOrEqual(1); // conversion grants a Grow Up BAR
  });
});

describe("reducer — victory", () => {
  it("declares a win once Show Up BARs hit the milestone target", () => {
    let s = enterPriyaDomain();
    s = { ...s, converted: true, bars: { ...s.bars, showUp: s.showUpTarget } };
    s = reducer(s, { type: "END_TURN" }); // any action runs the end-evaluation
    expect(s.result).toBe("win");
    expect(s.phase).toBe("end");
  });
});
