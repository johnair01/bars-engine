/**
 * ModeSelect — Character Select vs Applied Mode (Core Architecture § Two Game Modes).
 * Applied Mode needs the AI intake backend; without it, it degrades to a note.
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
  const applied = aiEnabled();
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

        <Card className={applied ? "" : "opacity-60"}>
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
              disabled={!applied}
              onClick={() => dispatch({ type: "SELECT_MODE", mode: "applied" })}
            >
              {applied ? "Begin Intake" : "Requires AI backend"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
