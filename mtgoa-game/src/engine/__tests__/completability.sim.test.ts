/**
 * Completability simulation — does a REACHABLE win path exist?
 *
 * The existing engine.test.ts proves mechanics fire when *forced* (it hand-sets
 * npcStress: 7, injects all six counters, and injects showUp: target). This sim
 * instead plays the real reducer from a real starting deck under a reasonable
 * greedy policy, for every superpower vs Priya, and reports the outcome it can
 * actually reach. It asserts nothing about balance — it just surfaces the truth.
 *
 * Run: npm test -- completability
 */
import { describe, it } from "vitest";

import { reducer, initialState, type GameState } from "../gameState";
import { SUPERPOWER_NAMES, type SuperpowerName } from "@/data/superpowers";

const TURN_CAP = 100;

/** One greedy player phase, then END_TURN. Returns the next state. */
function playerTurn(state: GameState): GameState {
  let s = state;

  // 1) Counter every active shadow we hold a counter for (free metabolize).
  let acted = true;
  while (acted) {
    acted = false;
    for (const shadow of s.activeShadows) {
      const counter = s.hand.find(
        (c) => c.state === "light" && c.name === shadow.counter,
      );
      if (counter) {
        s = reducer(s, { type: "PLAY_MOVE", cardId: counter.id });
        acted = true;
        break;
      }
    }
  }

  // 2) If not yet converted and no shadow will surface next turn (npcStress < 3)
  //    while shadows remain, play one hand shadow to push her stress up so the
  //    next shadow activates and can be countered.
  if (!s.converted) {
    const shadowsLeft = (s.npcDecks?.shadow ?? []).filter(
      (sh) => !s.metabolizedShadowIds.includes(sh.id),
    );
    const noneActiveSoon = s.npcStress < 3 && s.activeShadows.length === 0;
    if (shadowsLeft.length > 0 && noneActiveSoon) {
      const ownShadow = s.hand.find((c) => c.state === "shadow");
      if (ownShadow) s = reducer(s, { type: "PLAY_MOVE", cardId: ownShadow.id });
    }
  }

  return reducer(s, { type: "END_TURN" });
}

function runEncounter(superpower: SuperpowerName) {
  let s = initialState();
  s = reducer(s, { type: "SELECT_MODE", mode: "character-select" });
  s = reducer(s, { type: "SELECT_SUPERPOWER", superpower });
  s = reducer(s, { type: "SELECT_ENCOUNTER", npcId: "npc-008" });
  s = reducer(s, { type: "ENTER_DOMAIN" });

  const counters = s.hand.filter((c) => c.state === "light" && c.counters).length;

  let guard = 0;
  while (s.result === null && guard < TURN_CAP) {
    s = playerTurn(s);
    guard += 1;
  }

  return {
    superpower,
    counters,
    result: s.result ?? "SOFTLOCK (no terminal state)",
    turns: s.turn,
    converted: s.converted,
    metabolized: s.metabolizedShadowIds.length,
    showUp: s.bars.showUp,
    showUpTarget: s.showUpTarget,
    playerStress: s.playerStress,
    npcStress: s.npcStress,
  };
}

describe("completability — every superpower vs Priya (real play)", () => {
  it("reports the reachable outcome for each superpower", () => {
    const rows = SUPERPOWER_NAMES.map(runEncounter);

    // eslint-disable-next-line no-console
    console.log(
      "\n=== Priya completability (real starting deck, greedy policy) ===",
    );
    for (const r of rows) {
      // eslint-disable-next-line no-console
      console.log(
        `${r.superpower.padEnd(13)} | counters:${r.counters} ` +
          `| ${String(r.result).padEnd(28)} | turns:${String(r.turns).padStart(3)} ` +
          `| converted:${r.converted ? "Y" : "n"} metab:${r.metabolized}/6 ` +
          `| showUp:${r.showUp}/${r.showUpTarget} ` +
          `| stress P${r.playerStress}/N${r.npcStress}`,
      );
    }
    const wins = rows.filter((r) => r.result === "win").length;
    // eslint-disable-next-line no-console
    console.log(`\nWINNABLE PATHS FOUND: ${wins} / ${rows.length}\n`);
  });
});
