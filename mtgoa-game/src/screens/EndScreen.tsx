/**
 * EndScreen — win/loss with the end-of-encounter reflection (Migration Brief
 * priority #10/#11): what was metabolized, exiled, and what remains.
 */
import type { Dispatch } from "react";
import type { Action, GameState } from "@/engine/gameState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

const OUTCOME: Record<NonNullable<GameState["result"]>, { title: string; tone: string; body: string }> = {
  win: {
    title: "Allyship occurred",
    tone: "text-relational",
    body: "You generated enough Show Up BARs before the domains exhausted. The milestone holds.",
  },
  "loss-rupture": {
    title: "Rupture",
    tone: "text-fire",
    body: "Collective stress overwhelmed the table. The work isn't lost — it's a Roadblock Quest to metabolize.",
  },
  "loss-exhaustion": {
    title: "Exhaustion",
    tone: "text-earth",
    body: "The deck ran out before the milestone was met. Speed comes from getting better at metabolizing blockers.",
  },
};

export function EndScreen({ state, dispatch }: Props) {
  const result = state.result ?? "loss-exhaustion";
  const o = OUTCOME[result];
  const metabolized = state.metabolizedShadowIds.length;
  const exiled = state.exiledCardIds.length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-8">
      <header>
        <h1 className={`text-2xl font-bold ${o.tone}`}>{o.title}</h1>
        <p className="mt-1 text-dim">{o.body}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Reflection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Show Up" value={`${state.bars.showUp}/${state.showUpTarget}`} />
          <Stat label="Metabolized" value={metabolized} />
          <Stat label="Exiled" value={exiled} />
          <Stat label="Turns" value={state.turn} />
          <Stat label="Wake Up" value={state.bars.wakeUp} />
          <Stat label="Clean Up" value={state.bars.cleanUp} />
          <Stat label="Grow Up" value={state.bars.growUp} />
          <Stat label="Converted" value={state.converted ? "Yes" : "No"} />
        </CardContent>
      </Card>

      {state.npc && (
        <p className="text-card-body text-muted">
          {state.npc.name}'s epiphany — <span className="text-dim">{state.npc.sixQuestions.epiphany}</span>
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={() => dispatch({ type: "RESET" })}>Play again</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-surf px-2 py-1.5">
      <span className="ds-label text-muted">{label}</span>
      <span className="text-lg font-bold text-text">{value}</span>
    </div>
  );
}
