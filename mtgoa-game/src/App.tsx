/**
 * App — top-level phase router. The game state machine (engine/gameState.ts)
 * owns `phase`; this component maps each phase to its screen.
 *
 * Applied Mode intake (IntakeConversation) is a future build step (Migration
 * Brief priority #8); for now both modes route through Superpower → Encounter →
 * Domain so the core loop is playable end-to-end.
 */
import { useState } from "react";

import { useGame } from "@/hooks/useGame";
import { ModeSelect } from "@/screens/ModeSelect";
import { SuperpowerSelect } from "@/screens/SuperpowerSelect";
import { EncounterScreen } from "@/screens/EncounterScreen";
import { DomainScreen } from "@/screens/DomainScreen";
import { EndScreen } from "@/screens/EndScreen";
import { TrustEncounterScreen } from "@/screens/TrustEncounterScreen";

export default function App() {
  const { state, dispatch } = useGame();
  // Trust/attune rebuild: a self-contained, provably-completable Level-1 Priya
  // loop, reachable via a prototype toggle without disturbing the channel engine.
  const [trustProto, setTrustProto] = useState(
    typeof window !== "undefined" && window.location.hash === "#l1-priya",
  );

  if (trustProto) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <TrustEncounterScreen onExit={() => setTrustProto(false)} />
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

      <button
        onClick={() => setTrustProto(true)}
        className="fixed bottom-3 right-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
      >
        ▶ Play Level-1 Priya (trust prototype)
      </button>
    </div>
  );
}
