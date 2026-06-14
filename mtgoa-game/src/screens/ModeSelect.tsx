/**
 * ModeSelect — Character Select vs Applied Mode (Core Architecture § Two Game Modes).
 *
 * Applied Mode is always available: intake runs as a scripted, no-AI conversation
 * (engine/intake) that synthesizes a completable trust encounter. An AI backend,
 * when configured, only *enhances* the intake's reflections — it is no longer a
 * gate. (Dual-track: the scripted path is first-class, not a fallback.)
 */
import type { Dispatch } from "react";
import type { Action } from "@/engine/gameState";
import { aiEnabled } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  dispatch: Dispatch<Action>;
}

export function ModeSelect({ dispatch }: Props) {
  const enhanced = aiEnabled();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text">Mastering the Game of Allyship</h1>
        <p className="text-dim">
          Increase the capacity for mutual satisfaction over time. Choose how you want to play.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Character Select</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>
              Pick a Superpower and face one of the eight pre-built encounters. Recommended for
              workshop and coaching contexts.
            </p>
            <Button onClick={() => dispatch({ type: "SELECT_MODE", mode: "character-select" })}>
              Play Character Select
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applied Mode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>
              Work a real situation. The intake guide maps your answers to the Six Unpacking
              Questions and builds the encounter around you.
            </p>
            <Button
              variant="subtle"
              onClick={() => dispatch({ type: "SELECT_MODE", mode: "applied" })}
            >
              Begin Intake
            </Button>
            <span className="text-[11px] text-muted">
              {enhanced ? "AI backend connected — intake reflections enhanced." : "Runs fully scripted — no AI required."}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
