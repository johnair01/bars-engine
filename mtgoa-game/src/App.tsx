/**
 * App — top-level phase router. The game state machine (engine/gameState.ts)
 * owns `phase`; this component maps each phase to its screen.
 *
 * Applied Mode routes through the scripted intake (IntakeConversation), which
 * synthesizes a completable trust encounter (buildEncounterFromIntake) and plays
 * it on TrustEncounterScreen — superpower select is skipped (the player authors
 * the encounter). Character Select keeps the legacy channel-engine loop.
 */
import { useState } from "react";

import { useGame } from "@/hooks/useGame";
import { ModeSelect } from "@/screens/ModeSelect";
import { SuperpowerSelect } from "@/screens/SuperpowerSelect";
import { EncounterScreen } from "@/screens/EncounterScreen";
import { DomainScreen } from "@/screens/DomainScreen";
import { EndScreen } from "@/screens/EndScreen";
import { TrustEncounterScreen } from "@/screens/TrustEncounterScreen";
import { IntakeConversation } from "@/screens/IntakeConversation";
import { buildEncounterFromIntake } from "@/engine/intake/buildEncounter";
import type { EncounterConfig } from "@/engine/trust/trustTypes";
import { LEVEL1_PRIYA } from "@/engine/trust/level1Priya";
import { BOSS_PRIYA } from "@/engine/trust/bossPriya";

export default function App() {
  const { state, dispatch } = useGame();
  // Applied Mode flow: null until intake finishes, then the synthesized encounter.
  const [appliedEncounter, setAppliedEncounter] = useState<EncounterConfig | null>(null);
  // Trust/attune rebuild: self-contained, provably-completable Priya encounters,
  // reachable via a prototype toggle without disturbing the channel engine.
  // null = not in the prototype; otherwise the encounter to run.
  const initialProto =
    typeof window !== "undefined"
      ? window.location.hash === "#boss-priya"
        ? BOSS_PRIYA
        : window.location.hash === "#l1-priya"
          ? LEVEL1_PRIYA
          : null
      : null;
  const [trustProto, setTrustProto] = useState(initialProto);

  if (trustProto) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <TrustEncounterScreen encounter={trustProto} onExit={() => setTrustProto(null)} />
      </div>
    );
  }

  // Applied Mode: scripted intake → synthesized trust encounter (no superpower step).
  if (state.mode === "applied") {
    const exitApplied = () => {
      setAppliedEncounter(null);
      dispatch({ type: "RESET" });
    };
    return (
      <div className="min-h-screen bg-bg text-text">
        {appliedEncounter ? (
          <TrustEncounterScreen encounter={appliedEncounter} onExit={exitApplied} />
        ) : (
          <IntakeConversation
            onComplete={(config, npcName) =>
              setAppliedEncounter(buildEncounterFromIntake(config, { npcName }))
            }
            onExit={exitApplied}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {state.phase === "mode-select" && <ModeSelect dispatch={dispatch} />}
      {state.phase === "superpower-select" && <SuperpowerSelect dispatch={dispatch} />}
      {state.phase === "encounter" && <EncounterScreen state={state} dispatch={dispatch} />}
      {state.phase === "domain" && <DomainScreen state={state} dispatch={dispatch} />}
      {state.phase === "end" && <EndScreen state={state} dispatch={dispatch} />}

      <div className="fixed bottom-3 right-3 flex flex-col items-end gap-2">
        <button
          onClick={() => setTrustProto(LEVEL1_PRIYA)}
          className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
        >
          ▶ Play Level-1 Priya (trust prototype)
        </button>
        <button
          onClick={() => setTrustProto(BOSS_PRIYA)}
          className="rounded-md border border-fire/40 bg-fire/10 px-3 py-1.5 text-xs font-semibold text-fire hover:bg-fire/20"
        >
          ▶ Play Boss Priya (full difficulty)
        </button>
      </div>
    </div>
  );
}
