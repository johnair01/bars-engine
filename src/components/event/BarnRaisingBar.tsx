import Link from "next/link";
import {
  BARN_WALLS,
  EMPTY_BARN_STATE,
  RUNWAY_HORIZON_CENTS,
  formatMoneyCents,
  oneTimeHeadline,
  wallProgress01,
  type BarnState,
  type BarnWall,
} from "@/lib/event/barn-raising";

/**
 * The Milestone BAR — a "barn raising" thermometer with three walls (car / pre-sale /
 * runway), a money headline, and an in-kind "hands & beams" readout. Presentational and
 * server-renderable; pass live values via `state` (defaults to the honest empty state).
 *
 * @see .specify/specs/mtgoa-launch-barn-raising-party/milestone-bar-brainstorm.md
 */
export function BarnRaisingBar({
  state = EMPTY_BARN_STATE,
  variant = "full",
}: {
  state?: BarnState;
  /** `full` = standalone/kiosk; `teaser` = compact card for the funnel. */
  variant?: "full" | "teaser";
}) {
  const headline = oneTimeHeadline(state);
  const isEmpty =
    headline.raisedCents === 0 &&
    state.raisedCents.runway === 0 &&
    state.hands === 0 &&
    state.beams === 0;

  if (variant === "teaser") {
    return (
      <Link
        href="/event/barn"
        className="block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-amber-700/60"
      >
        <p className="text-[10px] uppercase tracking-widest text-amber-500/90">
          The Barn Raising · July 18
        </p>
        <h3 className="mt-1 text-lg font-bold text-white">Raise the barn together</h3>
        <p className="mt-1 text-sm text-zinc-400">
          One send-off, three walls: replace the car, back the pre-sale, fund the runway.
        </p>
        <div className="mt-4 flex gap-1.5">
          {BARN_WALLS.map((w) => (
            <div key={w.key} className="h-2 flex-1 overflow-hidden rounded-full bg-black ring-1 ring-zinc-800">
              <div
                className={`h-full bg-gradient-to-r ${w.accent.bar}`}
                style={{ width: `${Math.round(wallProgress01(w, state) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <span className="mt-4 inline-block text-sm font-semibold text-amber-300">
          See the barn →
        </span>
      </Link>
    );
  }

  return (
    <section aria-label="Barn raising progress" className="flex flex-col gap-6">
      {/* Headline */}
      <header className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-widest text-amber-500/90">
          The Barn Raising · July 18
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {isEmpty ? "Be the first plank" : "The barn is going up"}
        </h2>
        <p className="max-w-2xl text-sm text-zinc-400">
          A community lifting a structure no one could raise alone. Three walls, three kinds
          of giving — and you choose where your plank goes.
        </p>
      </header>

      {/* Money + hands & beams readouts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout
          label="Raised (one-time)"
          value={formatMoneyCents(headline.raisedCents)}
          sub={`of ${formatMoneyCents(headline.targetCents)} goal`}
        />
        <Readout
          label="Runway committed"
          value={formatMoneyCents(state.raisedCents.runway, "month")}
          sub={`of ${formatMoneyCents(RUNWAY_HORIZON_CENTS, "month")} horizon`}
        />
        <Readout
          label="Hands & beams"
          value={`${state.hands} ✋ · ${state.beams} 🪵`}
          sub="in-kind: time, labor & space"
        />
      </div>

      {/* The three walls */}
      <div className="flex flex-col gap-4">
        {BARN_WALLS.map((w) => (
          <WallRow key={w.key} wall={w} state={state} />
        ))}
      </div>

      <p className="text-xs text-zinc-600">
        Names appear only if you opt in. Once a wall is full, your gift rolls to the runway —
        and we&apos;ll point you to the other walls, the pre-sale, or a way to lend a hand.
      </p>
    </section>
  );
}

function Readout({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-zinc-100">{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}

function WallRow({ wall, state }: { wall: BarnWall; state: BarnState }) {
  const pct = Math.round(wallProgress01(wall, state) * 100);
  const raised = formatMoneyCents(state.raisedCents[wall.key], wall.cadence);
  const target = formatMoneyCents(wall.targetCents, wall.cadence);

  return (
    <article className={`rounded-2xl border ${wall.accent.ring} bg-zinc-900/40 p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className={`text-base font-bold ${wall.accent.text}`}>{wall.name}</h3>
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
            {wall.kind}
          </span>
        </div>
        <p className="font-mono text-sm text-zinc-300">
          {raised} <span className="text-zinc-600">/ {target}</span>
        </p>
      </div>

      <p className="mt-1 text-sm text-zinc-400">{wall.blurb}</p>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black ring-1 ring-zinc-800">
        <div
          className={`h-full bg-gradient-to-r ${wall.accent.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-zinc-600">{pct}% raised</span>
        <Link
          href={wall.cta.href}
          className={`rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold ${wall.accent.text} transition-colors hover:border-zinc-500`}
        >
          {wall.cta.label} →
        </Link>
      </div>
    </article>
  );
}
