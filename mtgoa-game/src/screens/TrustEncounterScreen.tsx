/**
 * TrustEncounterScreen — the playable Level-1 Priya loop on the trust/attune
 * engine (engine/trust). Self-contained: it owns its own reducer so it does not
 * touch the channel-engine game state. Mounted from App via a prototype toggle.
 *
 * The loop on screen:
 *   ATTUNE to reveal her live need → play a matching card for TRUST → spend trust
 *   to DISSOLVE shadows → convert her → engage all four DOMAINS (Direct Action is
 *   her-only) → CAPSTONE to win. "Show Up Honestly" is the always-safe basic move.
 */
import { useReducer } from "react";

import { CHANNELS } from "@/data/channels";
import { DOMAIN_NAMES } from "@/data/domains";
import { channelClass } from "../../design-system/theme";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { LEVEL1_PRIYA } from "@/engine/trust/level1Priya";
import { TRUST_RULES as R } from "@/engine/trust/trustRules";
import type { EncounterConfig } from "@/engine/trust/trustTypes";
import {
  allDomainsTouched,
  currentNeed,
  initTrustEncounter,
  trustReducer,
} from "@/engine/trust/trustEngine";

interface Props {
  onExit: () => void;
  /** Which encounter to run. Defaults to the Level-1 tutorial; pass BOSS_PRIYA
   *  for the full-difficulty fight. The screen is config-agnostic. */
  encounter?: EncounterConfig;
}

/** A simple labelled value meter (trust has no fixed max; stress caps at rupture). */
function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="ds-label text-muted">{label}</span>
        <span className="text-sm font-bold tabular-nums text-dim">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-sm bg-border">
        <div className={cn("h-full rounded-sm transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TrustEncounterScreen({ onExit, encounter = LEVEL1_PRIYA }: Props) {
  const [state, dispatch] = useReducer(trustReducer, encounter, initTrustEncounter);

  const need = currentNeed(state);
  const config = state.config;
  const convertNeeded = R.shadow.convertThreshold;
  const ready = state.converted && allDomainsTouched(state);

  if (state.phase === "end") {
    const won = state.result === "win";
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 p-8">
        <div className={cn("rounded-card border p-6", won ? "border-accent bg-accent/10" : "border-fire bg-fire/10")}>
          <h2 className={cn("text-2xl font-bold", won ? "text-accent" : "text-fire")}>
            {won ? "You found what's still possible." : "Rupture — she walled off and left."}
          </h2>
          <p className="mt-2 text-card-body text-dim">
            {won
              ? config.capstone.body
              : "Too many misreads raised her defenses past the breaking point. Read her before you act."}
          </p>
          <p className="mt-3 text-xs text-muted">Resolved in {state.turn - 1} turns.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => dispatch({ type: "RESET" })}>Play again</Button>
          <Button variant="ghost" onClick={onExit}>Exit prototype</Button>
        </div>
        <LogPanel log={state.log} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text">{config.capstone.title}</h2>
            <Badge className="bg-surf text-accent">Level {config.level}</Badge>
            {state.converted && <Badge className="bg-accent/20 text-accent">{config.npcName} · ALLY</Badge>}
          </div>
          <span className="text-xs text-muted">Turn {state.turn} · {config.npcName} (Diplomat)</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>Exit prototype</Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,auto)]">
        {/* Live need / inner track */}
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surf p-4">
          <span className="ds-label text-muted">Her live need</span>
          {state.needRevealed ? (
            <div className="flex items-center gap-3">
              <span className={cn("text-3xl", channelClass[need].text)}>{CHANNELS[need].glyph}</span>
              <div>
                <p className={cn("text-base font-bold", channelClass[need].text)}>{need}</p>
                <p className="text-[11px] text-muted">Match this channel to build trust.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl text-muted">?</span>
              <div>
                <p className="text-base font-bold text-dim">Unread</p>
                <p className="text-[11px] text-muted">Attune to reveal what she needs.</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="subtle" disabled={state.needRevealed} onClick={() => dispatch({ type: "ATTUNE" })}>
              Attune
            </Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "BASIC" })}>
              Show Up Honestly {state.needRevealed ? `(+${R.trust.basicGain})` : "(+0 until read)"}
            </Button>
            {state.needTrail.length > 0 && (
              <span className="text-[10px] text-muted">trail: {state.needTrail.join(" · ")}</span>
            )}
          </div>
        </div>

        {/* Meters */}
        <div className="flex min-w-[220px] flex-col gap-3 rounded-card border border-border bg-surf p-4">
          <Meter label="Trust" value={state.trust} max={Math.max(6, state.trust)} tone="bg-accent" />
          <Meter label={`${config.npcName} stress`} value={state.npcStress} max={R.stress.ruptureAt} tone="bg-fire" />
          <span className="text-[10px] text-muted">
            Dissolved {state.dissolvedShadowIds.length}/{convertNeeded} to convert · dissolve costs {R.shadow.dissolveCost} trust
          </span>
        </div>
      </section>

      {/* Shadows */}
      <section className="flex flex-col gap-2 rounded-card border border-border bg-surf p-3">
        <span className="ds-label text-muted">
          {state.converted ? `${config.npcName} — ally` : `${config.npcName} — defended`}
        </span>
        {state.shadows.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {state.shadows.map((s) => (
              <div key={s.id} className={cn("flex w-52 flex-col gap-2 rounded-card border bg-card p-3", channelClass[s.channel].border)}>
                <div className="flex items-center justify-between">
                  <span className="text-card-title font-bold text-text">{s.name}</span>
                  <span className={cn(channelClass[s.channel].text)}>{CHANNELS[s.channel].glyph}</span>
                </div>
                <p className="text-[11px] text-dim">{s.text}</p>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={state.trust < R.shadow.dissolveCost}
                  onClick={() => dispatch({ type: "DISSOLVE", shadowId: s.id })}
                >
                  Dissolve (−{R.shadow.dissolveCost} trust)
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-card-body text-muted">Every defense released. She's with you now.</p>
        )}
      </section>

      {/* Domain track */}
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {DOMAIN_NAMES.map((d) => {
          const touched = state.domainsTouched.includes(d);
          const card = config.deck.find((c) => c.kind === "domain" && c.domain === d);
          const locked = !!card?.herOnly && !state.converted;
          return (
            <div
              key={d}
              className={cn(
                "rounded-card border p-3",
                touched ? "border-accent bg-accent/10" : locked ? "border-border bg-card opacity-60" : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-card-title font-bold text-text">{d}</span>
                {touched ? <Badge className="bg-accent/20 text-accent">engaged</Badge> : locked ? <Badge className="bg-surf text-muted">her-only</Badge> : null}
              </div>
              <p className="mt-1 text-[11px] text-muted">{card?.text}</p>
            </div>
          );
        })}
      </section>

      {/* Hand */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-label text-muted">Your hand</span>
          <Button disabled={!ready} onClick={() => dispatch({ type: "CAPSTONE" })}>
            {ready ? "Capstone — solve it" : "Capstone (convert + all four domains)"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {config.deck.map((card) => {
            const isAlign = card.kind === "align";
            const aligned = isAlign && state.needRevealed && card.channel === need;
            const touched = !isAlign && !!card.domain && state.domainsTouched.includes(card.domain);
            const locked = !!card.herOnly && !state.converted;
            return (
              <button
                key={card.id}
                disabled={touched || locked}
                onClick={() => dispatch({ type: "PLAY", cardId: card.id })}
                className={cn(
                  "flex w-44 flex-col gap-1 rounded-card border bg-card p-3 text-left transition-colors hover:bg-surf disabled:opacity-40 disabled:hover:bg-card",
                  channelClass[card.channel].border,
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-card-title font-bold text-text">{card.name}</span>
                  <span className={cn(channelClass[card.channel].text)}>{CHANNELS[card.channel].glyph}</span>
                </div>
                <p className="text-[11px] text-dim">{card.text}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge className="bg-surf text-muted">{isAlign ? "inner · align" : `outer · ${card.domain}`}</Badge>
                  {aligned && <Badge className="bg-accent/20 text-accent">matches need</Badge>}
                  {touched && <Badge className="bg-accent/20 text-accent">engaged</Badge>}
                  {locked && <Badge className="bg-surf text-muted">her-only</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <LogPanel log={state.log} />
    </div>
  );
}

function LogPanel({ log }: { log: string[] }) {
  return (
    <section className="rounded-card border border-border bg-surf p-3">
      <span className="ds-label text-muted">Log</span>
      <div className="mt-1 flex max-h-40 flex-col-reverse gap-0.5 overflow-y-auto">
        {[...log].reverse().map((line, i) => (
          <p key={log.length - i} className="text-[11px] text-dim">{line}</p>
        ))}
      </div>
    </section>
  );
}
