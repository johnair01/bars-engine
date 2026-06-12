/**
 * SuperpowerSelect — choose the player archetype (Core Architecture § Superpower
 * Archetypes). Each card shows channel affinity, perception, shadows, and the
 * 3-match synergy bonus.
 */
import type { Dispatch } from "react";
import type { Action } from "@/engine/gameState";
import { SUPERPOWERS, SUPERPOWER_NAMES, type SuperpowerName } from "@/data/superpowers";
import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  dispatch: Dispatch<Action>;
}

const accentByName: Record<SuperpowerName, string> = {
  Strategist: "border-strategist",
  Connector: "border-connector",
  Storyteller: "border-storyteller",
  Alchemist: "border-alchemist",
  Disruptor: "border-disruptor",
  "Escape Artist": "border-escape-artist",
};

export function SuperpowerSelect({ dispatch }: Props) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-8">
      <header>
        <h2 className="text-xl font-bold text-text">Choose your Superpower</h2>
        <p className="text-dim">Your preferred method of creating mutual satisfaction.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPERPOWER_NAMES.map((name) => {
          const def = SUPERPOWERS[name];
          return (
            <Card key={name} className={cn("border-l-4", accentByName[name])}>
              <CardHeader>
                <CardTitle>{name}</CardTitle>
                <div className="flex gap-1">
                  {def.channels.map((el) => (
                    <Badge key={el} className={cn("bg-surf", channelClass[el].text)}>
                      {CHANNELS[el].glyph} {el}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p>
                  <span className="text-muted">Sees: </span>
                  {def.sees}
                </p>
                <p className="text-[11px]">
                  <span className="text-muted">Shadows: </span>
                  {def.shadows.join(", ")}
                </p>
                <p className="text-[11px] text-relational">
                  <span className="text-muted">Synergy (3 match): </span>
                  {def.synergyBonus}
                </p>
                <Button
                  className="mt-1"
                  size="sm"
                  onClick={() => dispatch({ type: "SELECT_SUPERPOWER", superpower: name })}
                >
                  Play as {name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
