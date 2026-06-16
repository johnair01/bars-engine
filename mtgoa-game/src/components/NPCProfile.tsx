/**
 * NPCProfile — the encounter card. Surfaces the NPC's Face, Superpower, compound
 * stuck channels, milestone, and (optionally) their full six-question profile.
 */
import type { NpcProfile as NpcData } from "@/data/npcs";
import { FACES } from "@/data/npcs";
import { CHANNELS } from "@/data/channels";
import { channelClass } from "../../design-system/theme";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  npc: NpcData;
  /** Show the full six-question intake (used on the encounter screen). */
  expanded?: boolean;
}

export function NPCProfile({ npc, expanded }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{npc.name}</CardTitle>
          <span className="text-xs text-muted">{npc.age}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className="bg-surf text-accent" title={FACES[npc.face].coreQuestion}>
            {npc.face}
          </Badge>
          <Badge className="bg-surf text-dim">{npc.superpower}</Badge>
          {npc.stuckChannels.map((el) => (
            <Badge key={el} className={cn("bg-surf", channelClass[el].text)}>
              {CHANNELS[el].glyph} {el}
            </Badge>
          ))}
          <Badge className={cn("bg-surf", channelClass[npc.targetChannel].text)}>
            → {npc.targetChannel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <span className="ds-label text-muted">Milestone — {npc.milestone.title}</span>
          <p className="mt-1 text-dim">{npc.milestone.body}</p>
        </div>

        {npc.note && <p className="text-[11px] italic text-muted">{npc.note}</p>}

        {expanded && (
          <>
            <SixQuestions npc={npc} />
            <div>
              <span className="ds-label text-muted">Forest Seeds</span>
              <ul className="mt-1 list-disc pl-4 text-dim">
                {npc.forestSeeds.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-muted">
              Also allying with: <span className="text-dim">{npc.alsoAllyingWith}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SixQuestions({ npc }: { npc: NpcData }) {
  const q = npc.sixQuestions;
  const rows: [string, string][] = [
    ["Wants to create", q.experience],
    ["Satisfied state", q.satisfiedState],
    ["Life right now", q.currentLife],
    ["How it feels", q.howItFeels],
    ["Epiphany (hidden)", q.epiphany],
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ds-label text-muted">Six Questions</span>
      {rows.map(([label, val]) => (
        <div key={label} className="text-[11px]">
          <span className="text-muted">{label}: </span>
          <span className="text-dim">{val}</span>
        </div>
      ))}
    </div>
  );
}
