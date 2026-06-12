/**
 * DomainScreen — the core play loop. Player plays moves (generating Wuxing
 * channel and countering NPC shadows), then ends the turn for the NPC to act.
 * Surfaces the dual stress meters, BAR economy, active shadows, and event log.
 */
import type { Dispatch } from "react";
import type { Action, GameState } from "@/engine/gameState";
import { npcShadowsVisible } from "@/engine/gameState";
import { activeShadowCount } from "@/engine/combat";
import { RULES } from "@/engine/rules";
import { DOMAIN_NAMES } from "@/data/domains";

import { BARTracker } from "@/components/BARTracker";
import { ChannelDisplay } from "@/components/ChannelDisplay";
import { StressBar } from "@/components/StressBar";
import { MoveCard } from "@/components/MoveCard";
import { NPCShadowCard } from "@/components/NPCShadowCard";
import { DomainCard } from "@/components/DomainCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

export function DomainScreen({ state, dispatch }: Props) {
  if (!state.npc) return null;
  const dysregulated = state.playerStress >= RULES.stress.dysregulationThreshold;
  // A card counters a board shadow when card.counters === that shadow's name.
  const counterableNames = state.activeShadows.map((s) => s.name);
  const pendingShadows = activeShadowCount(state.npcStress);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      {/* Top status row */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text">{state.npc.milestone.title}</h2>
          <span className="text-xs text-muted">
            Turn {state.turn} · vs {state.npc.name} ({state.npc.face} · {state.npc.superpower})
            {state.converted && " · ALLY"}
          </span>
        </div>
        <div className="w-full max-w-md">
          <BARTracker bars={state.bars} showUpTarget={state.showUpTarget} />
        </div>
      </header>

      {/* Resources + stress */}
      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surf p-3">
          <span className="ds-label text-muted">Your channels</span>
          <ChannelDisplay pool={state.channels} />
          <div className="flex flex-wrap gap-2 text-[11px] text-muted">
            <span>Milestone progress: {state.milestoneProgress}</span>
            {state.round.blockRelational && <Badge className="bg-fire/20 text-fire">Relational blocked</Badge>}
            {state.round.skipProgress && <Badge className="bg-fire/20 text-fire">No progress this round</Badge>}
            {state.round.actionTax && (
              <Badge className="bg-fire/20 text-fire">
                Action +{state.round.actionTax.amount} {state.round.actionTax.element}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex min-w-[220px] flex-col gap-3 rounded-card border border-border bg-surf p-3">
          <StressBar label="Your" value={state.playerStress} showThresholds />
          <StressBar label={state.npc.name} value={state.npcStress} showThresholds />
          <span className="text-[10px] text-muted">
            Metabolized {state.metabolizedShadowIds.length}/{RULES.conversion.shadowsToMetabolize} to
            convert
          </span>
        </div>
      </section>

      {/* NPC board */}
      <section className="flex flex-col gap-2 rounded-card border border-border bg-surf p-3">
        <div className="flex items-center justify-between">
          <span className="ds-label text-muted">
            {state.converted ? `${state.npc.name} — ally` : `${state.npc.name} — resistance`}
          </span>
          <span className="text-[10px] text-muted">
            {npcShadowsVisible(state)
              ? `${pendingShadows} shadow${pendingShadows === 1 ? "" : "s"} active`
              : "shadows hidden (stress < 3)"}
          </span>
        </div>
        {state.epiphanyRevealed && (
          <div className="rounded bg-accent/15 px-3 py-2 text-card-body text-accent">
            Epiphany revealed: {state.npc.sixQuestions.epiphany}
          </div>
        )}
        {state.activeShadows.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {state.activeShadows.map((s) => (
              <NPCShadowCard key={s.id} card={s} />
            ))}
          </div>
        ) : (
          <p className="text-card-body text-muted">
            {state.converted
              ? "No resistance on the board — keep building toward the milestone."
              : "Nothing on the board yet. End your turn to let the NPC respond."}
          </p>
        )}
      </section>

      {/* Domains */}
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAIN_NAMES.map((d) => (
          <DomainCard key={d} domain={d} relevance={state.npc?.domainRelevance?.[d]} />
        ))}
      </section>

      {/* Hand */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-label text-muted">Your hand ({state.hand.length})</span>
          <Button onClick={() => dispatch({ type: "END_TURN" })} variant="subtle">
            End turn — {state.npc.name} acts
          </Button>
        </div>
        {dysregulated && (
          <p className="text-card-body text-fire">
            Dysregulated (stress {RULES.stress.max}). Action phase blocked — end your turn.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {state.hand.map((card) => (
            <MoveCard
              key={card.id}
              card={card}
              counterableNames={counterableNames}
              disabled={dysregulated}
              onPlay={(id) => dispatch({ type: "PLAY_MOVE", cardId: id })}
              onMetabolize={(id) => dispatch({ type: "METABOLIZE_HAND_SHADOW", cardId: id })}
              onExile={(id) => dispatch({ type: "EXILE_HAND_SHADOW", cardId: id })}
            />
          ))}
        </div>
      </section>

      {/* Event log */}
      <section className="rounded-card border border-border bg-surf p-3">
        <span className="ds-label text-muted">Log</span>
        <div className="mt-1 flex max-h-40 flex-col-reverse gap-0.5 overflow-y-auto">
          {[...state.log].reverse().map((line, i) => (
            <p key={state.log.length - i} className="text-[11px] text-dim">
              {line}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
