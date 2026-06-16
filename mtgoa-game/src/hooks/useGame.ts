/**
 * useGame — binds the pure reducer (engine/gameState.ts) to React.
 *
 * The whole game runs through one reducer per the Migration Brief's priority #3
 * ("useReducer with action types"), so the engine stays UI-free and testable.
 */
import { useReducer } from "react";
import { initialState, reducer } from "@/engine/gameState";

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return { state, dispatch };
}
