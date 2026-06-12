/**
 * App — top-level phase router. The game state machine (engine/gameState.ts)
 * owns `phase`; this component maps each phase to its screen.
 *
 * Applied Mode intake (IntakeConversation) is a future build step (Migration
 * Brief priority #8); for now both modes route through Superpower → Encounter →
 * Domain so the core loop is playable end-to-end.
 */
import { useGame } from "@/hooks/useGame";
import { ModeSelect } from "@/screens/ModeSelect";
import { SuperpowerSelect } from "@/screens/SuperpowerSelect";
import { EncounterScreen } from "@/screens/EncounterScreen";
import { DomainScreen } from "@/screens/DomainScreen";
import { EndScreen } from "@/screens/EndScreen";

export default function App() {
  const { state, dispatch } = useGame();

  return (
    <div className="min-h-screen bg-bg text-text">
      {state.phase === "mode-select" && <ModeSelect dispatch={dispatch} />}
      {state.phase === "superpower-select" && <SuperpowerSelect dispatch={dispatch} />}
      {state.phase === "encounter" && <EncounterScreen state={state} dispatch={dispatch} />}
      {state.phase === "domain" && <DomainScreen state={state} dispatch={dispatch} />}
      {state.phase === "end" && <EndScreen state={state} dispatch={dispatch} />}
    </div>
  );
}
