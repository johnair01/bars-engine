/**
 * EncounterScreen — pick an encounter from the roster, then review the NPC's full
 * six-question profile before entering the domain loop.
 */
import type { Dispatch } from "react";
import type { Action, GameState } from "@/engine/gameState";
import { NPCS } from "@/data/npcs";
import { NPCProfile } from "@/components/NPCProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { cn } from "@/lib/utils";

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

export function EncounterScreen({ state, dispatch }: Props) {
  if (!state.npc) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5 p-8">
        <header>
          <h2 className="text-xl font-bold text-text">Choose an encounter</h2>
          <p className="text-dim">
            Eight pre-built characters, each a node in a network. Priya (008) is the hardest test.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NPCS.map((npc) => (
            <Card key={npc.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{npc.name}</CardTitle>
                  <span className="text-[10px] text-muted">{npc.id.toUpperCase()}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-surf text-accent">{npc.face}</Badge>
                  <Badge className="bg-surf text-dim">{npc.superpower}</Badge>
                  {npc.stuckChannels.map((el) => (
                    <Badge key={el} className={cn("bg-surf", channelClass[el].text)}>
                      {CHANNELS[el].glyph}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-[11px]">{npc.milestone.title}</p>
                <Button size="sm" onClick={() => dispatch({ type: "SELECT_ENCOUNTER", npcId: npc.id })}>
                  Face {npc.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-8">
      <header>
        <h2 className="text-xl font-bold text-text">Encounter</h2>
        <p className="text-dim">
          Playing as <span className="text-accent">{state.superpower}</span>. Read the room, then
          begin.
        </p>
      </header>
      <NPCProfile npc={state.npc} expanded />
      <div className="flex gap-2">
        <Button onClick={() => dispatch({ type: "ENTER_DOMAIN" })}>Begin the encounter</Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "SELECT_ENCOUNTER", npcId: "" })}>
          Back to roster
        </Button>
      </div>
    </div>
  );
}
