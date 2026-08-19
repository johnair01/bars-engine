'use client'

/**
 * PlanScreen — the numbers-first beat of the ally CYOA, shown only for invites
 * with `showPlan` set.
 *
 * Audience: the reader who will not move until the arithmetic survives them.
 * Order of information is deliberate: the target, then the three paths (each
 * with its failure condition attached), then the copy ladder, then the 90-day
 * gates with their abort clauses. Risk is stated before upside on every card —
 * for this reader, naming the failure mode first is what makes the success
 * mode credible.
 *
 * Everything rendered here is derived in `victory-paths.ts` from the same
 * inputs the rest of the campaign quotes. Nothing on this screen can disagree
 * with the Numbers panel, because neither owns a figure.
 */

import { useState } from 'react'
import {
  MONTHLY_TARGET_CENTS,
  NINETY_DAY,
  copyLadder,
  monthlyBookTargetCopies,
  victoryPaths,
  type VictoryPath,
} from '@/lib/ally-campaign/victory-paths'
import {
  WARM_CASE_UNITS,
  WARM_CHANNELS,
  copiesPerRun,
  warmPlan,
} from '@/lib/ally-campaign/warm-selling'
import {
  ACQUISITION_BENCHMARKS,
  INPUTS,
  adEconomics,
  attachRateToBreakEven,
  cacScenarios,
  digitalEconomics,
  netPerWorkshopSeatCents,
  printEconomics,
  usd,
} from '@/lib/ally-campaign/economics'

const PURPLE = 'var(--bars-liminal)'
const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

const cta =
  'rounded-xl px-5 py-3 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50'

export function PlanScreen({ onContinue }: { onContinue: () => void }) {
  const paths = victoryPaths()
  const ladder = copyLadder()
  const print = printEconomics()
  const digital = digitalEconomics()
  const ads = adEconomics()
  const scenarios = cacScenarios(MONTHLY_TARGET_CENTS)
  const seatNet = netPerWorkshopSeatCents()
  const metaMedianCents =
    ACQUISITION_BENCHMARKS.find((b) => b.key === 'meta-cold')?.lowCents ?? digital.marginCents
  const metaAttachRate = attachRateToBreakEven(metaMedianCents)
  const warm = warmPlan(20, monthlyBookTargetCopies())
  const [openPath, setOpenPath] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-[23px] font-bold leading-snug" style={{ color: INK }}>
        The target is {usd(MONTHLY_TARGET_CENTS)} a month. Here are {numberWord(paths.length)} ways there.
      </h2>
      <p className="text-[14px] leading-relaxed" style={{ color: DIM }}>
        None of these is &ldquo;the&rdquo; plan — the plan is that a miss on one engine is answered by
        another engine, not by a bigger ask. Each card states its failure condition before its pitch,
        because a path that can&apos;t say how it fails can&apos;t be trusted about how it wins. Open
        all {numberWord(paths.length)}. Two of them involve me getting a job, and the first one is
        nothing but that.
      </p>

      {/* ── The three paths ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        {paths.map((p) => (
          <PathCard
            key={p.key}
            path={p}
            open={openPath === p.key}
            onToggle={() => setOpenPath(openPath === p.key ? null : p.key)}
          />
        ))}
      </div>

      {/* ── The copy ladder ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-5"
        style={{ background: PANEL }}
      >
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          the question you were going to ask
        </span>
        <h3 className="text-[19px] font-bold" style={{ color: INK }}>
          How many copies of the book is that?
        </h3>
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {ladder.map((r) => (
            <div key={r.key} className="flex flex-col gap-0.5 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px]" style={{ color: DIM }}>
                  {r.label}
                </span>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: GOLD }}>
                  {r.copies}
                </span>
              </div>
              <span className="text-[12px] leading-snug" style={{ color: FAINT }}>
                {r.note}
              </span>
            </div>
          ))}
        </div>
        {/* The plan's worst number, given its own box rather than a footnote.
            Hiding this is the single easiest way to make the run look solvent. */}
        {!print.coversRunFromSellable && (
          <div
            className="flex flex-col gap-2 rounded-lg px-4 py-3"
            style={{ background: 'rgba(204,136,136,.12)' }}
          >
            <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: '#f0a0a0' }}>
              the weakest number on this page
            </p>
            <p className="text-[13.5px] leading-relaxed" style={{ color: '#f0d0d0' }}>
              {print.obligationUnits} of the {INPUTS.printRunUnits} copies are already sold — people
              paid and are waiting, so those copies earn nothing new. That leaves{' '}
              <strong>{print.sellableUnits} sellable</strong> against a break-even of{' '}
              <strong>{print.breakEvenUnits}</strong>. At this run size the print run only washes its
              face if essentially every remaining copy sells, which is not a plan, it&apos;s a hope.
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: '#f0d0d0' }}>
              The fix is a bigger run, a higher cover price, or both — and I would rather you find the
              right answer than watch me pick one quietly.
            </p>
          </div>
        )}
        <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
          Copies are counted at the run&apos;s blended margin — the less flattering of the two margins,
          the same basis the repayment plan uses. Flattering numbers are how plans die.
        </p>
      </div>

      {/* ── Cost per sale — the number the whole plan hangs on ──────────────── */}
      <div
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-5"
        style={{ background: PANEL }}
      >
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          the number I don&apos;t have yet
        </span>
        <h3 className="text-[19px] font-bold" style={{ color: INK }}>
          What does it cost to sell one book?
        </h3>
        <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
          Every copy count on this page assumes readers can be found. Some arrive free — events, the
          Dream 100, the deck, word of mouth. The rest have to be bought, and each bought reader costs
          ad money that comes straight off the margin. An earlier version of this page ignored that
          entirely, which quietly made every number look better than it is.
        </p>

        <div className="flex flex-col gap-1.5 rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,.045)' }}>
          <MetricRow label="A digital copy sells for" value={usd(digital.priceCents)} />
          <MetricRow label="Keeps, after processing" value={usd(digital.marginCents)} />
          <MetricRow label="Ceiling, if the book must pay for itself" value={usd(ads.maxViableCostPerSaleCents)} />
          <MetricRow
            label={`Ceiling, counting a reader's later workshop seat`}
            value={usd(ads.ltvCeilingCents)}
            accent
          />
          <p className="pt-1 text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
            Two ceilings, reported apart, because only the first one is proven. A reader is worth the
            book plus whatever they do next, and for this business the thing they do next is book a
            seat — at {usd(seatNet)} net each.
          </p>
        </div>

        {/* The published numbers, so the plan's own guess can be judged against
            something instead of taken on trust. */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
            what it costs other people
          </span>
          {ACQUISITION_BENCHMARKS.map((b) => (
            <div
              key={b.key}
              className="flex flex-col gap-1 rounded-lg border border-white/[0.08] px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] font-semibold" style={{ color: INK }}>
                  {b.label}
                </span>
                <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: GOLD }}>
                  {b.lowCents === null || b.highCents === null
                    ? 'not priced'
                    : b.lowCents === b.highCents
                      ? usd(b.lowCents)
                      : `${usd(b.lowCents)}–${usd(b.highCents)}`}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: DIM }}>
                {b.what}
              </p>
              <p className="text-[11.5px]" style={{ color: FAINT }}>
                {b.source}
              </p>
            </div>
          ))}
        </div>

        {/* The finding that decides it, stated as a falsifiable fraction. */}
        <div
          className="flex flex-col gap-2 rounded-lg px-4 py-3"
          style={{ background: 'rgba(139,92,246,.10)' }}
        >
          <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
            so here is the actual question
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: INK }}>
            At Meta&apos;s median of {usd(metaMedianCents)} a sale, the book alone loses money. It
            stops losing money the moment{' '}
            <strong style={{ color: GOLD }}>
              {(metaAttachRate * 100).toFixed(1)}% of readers
            </strong>{' '}
            go on to book a workshop seat. That is the whole paid-ads argument, and it is small enough
            to be plausible and specific enough to be wrong.
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: DIM }}>
            &ldquo;Ads will work&rdquo; can&apos;t be checked. &ldquo;About 1 reader in{' '}
            {Math.round(1 / Math.max(metaAttachRate, 0.0001))} books a seat&rdquo; can — and the ad
            test is how we find out, not how we hope.
          </p>
        </div>

        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <thead>
              <tr>
                {['If a sale costs', 'Copy is worth', 'Copies/mo', 'Seats needed', ''].map((h) => (
                  <th
                    key={h}
                    className="px-1 pb-2 text-[10px] uppercase"
                    style={{ letterSpacing: '.14em', color: FAINT, fontWeight: 600 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr
                  key={s.costPerSaleCents}
                  style={{ background: s.viable ? 'transparent' : 'rgba(204,136,136,.10)' }}
                >
                  <td className="px-1 py-2" style={{ color: INK }}>
                    <span className="text-[13.5px] font-semibold tabular-nums">
                      {usd(s.costPerSaleCents)}
                    </span>
                    {s.benchmarkLabel && (
                      <span className="block text-[11px]" style={{ color: FAINT }}>
                        {s.benchmarkLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-2 text-[13.5px] tabular-nums" style={{ color: DIM }}>
                    {usd(s.contributionPerSaleCents)}
                  </td>
                  <td className="px-1 py-2 text-[13.5px] font-semibold tabular-nums" style={{ color: s.viable ? GOLD : '#f0a0a0' }}>
                    {s.copiesForTarget}
                  </td>
                  <td className="px-1 py-2 text-[13px] tabular-nums" style={{ color: s.requiredAttachRate > 0 ? '#f0d0d0' : FAINT }}>
                    {s.requiredAttachRate > 0 ? `${(s.requiredAttachRate * 100).toFixed(1)}%` : 'none'}
                  </td>
                  <td className="px-1 py-2 text-[12px] leading-snug" style={{ color: s.viable ? FAINT : '#f0d0d0' }}>
                    {s.verdict}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
          <strong style={{ color: GOLD }}>Where the plan currently assumes it lands:</strong>{' '}
          {usd(ads.costPerSaleCents)} a sale, with {Math.round(INPUTS.paidAcquisitionShare * 100)}% of
          readers bought rather than organic. That is a guess, it is flagged as one everywhere it
          appears, and the {INPUTS.adMonthlyBudgetCents > 0 ? '3-month' : ''} ad test exists for the
          sole purpose of replacing it with a fact. At {usd(INPUTS.adMonthlyBudgetCents)}/month it buys
          roughly {ads.salesPerMonthAtBudget} sales a month.
        </p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
          If you only pressure-test one number on this page, make it this one. Every copy count above
          moves when it does.
        </p>
      </div>

      {/* ── The warm channel — the answer to the number above ───────────────── */}
      <div
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-5"
        style={{ background: PANEL }}
      >
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          so here is the actual plan
        </span>
        <h3 className="text-[19px] font-bold" style={{ color: INK }}>
          Girl Scout cookies, basically
        </h3>
        <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
          If a stranger costs about what the book earns, then the answer is not a bigger ad budget —
          it is to stop selling to strangers. A warm ask from someone trusted converts several times
          better than any advertisement, and it costs nothing to acquire. This page you are reading
          is the recruiting mechanism for exactly that.
        </p>

        <div className="flex flex-col gap-1.5 rounded-lg px-4 py-3" style={{ background: 'rgba(139,92,246,.08)' }}>
          <MetricRow label="A case, per ally, per month" value={`${WARM_CASE_UNITS} digital copies`} />
          <MetricRow label="Allies needed to cover the whole target" value={`${warm.alliesForFullCoverage}`} accent />
          <MetricRow label="Acquisition cost of those copies" value={usd(0)} />
          <MetricRow label="What an ally has to front or ship" value="nothing" />
          <p className="pt-1 text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
            {warm.alliesForFullCoverage} people, each asking about twenty of their own, each month.
            That is the entire mechanism. They sell the digital edition, so nobody carries stock,
            fronts cash or posts a parcel — and there is no ceiling. Doing this on paper would have
            run dry after {warm.physicalCapacityAllies} cases, and it costs about{' '}
            {usd(warm.marginTradedPerCopyCents)} a copy in margin to avoid that.
          </p>
        </div>

        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left">
            <thead>
              <tr>
                {['What an ally does', 'Copies', 'Hours', 'How we check it'].map((h) => (
                  <th
                    key={h}
                    className="px-1 pb-2 text-[10px] uppercase"
                    style={{ letterSpacing: '.14em', color: FAINT, fontWeight: 600 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WARM_CHANNELS.map((c) => (
                <tr key={c.key}>
                  <td className="px-1 py-2" style={{ color: INK }}>
                    <span className="text-[13.5px] font-semibold">{c.label}</span>
                    <span className="block text-[11.5px]" style={{ color: FAINT }}>
                      {c.reachLabel}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-[14px] font-semibold tabular-nums" style={{ color: GOLD }}>
                    {copiesPerRun(c)}
                  </td>
                  <td className="px-1 py-2 text-[13px] tabular-nums" style={{ color: DIM }}>
                    {c.effortHours}
                  </td>
                  <td className="px-1 py-2 text-[12px] leading-snug" style={{ color: DIM }}>
                    {c.evidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
          <strong style={{ color: GOLD }}>Including the part that undersells me:</strong> a social
          post is worth about {copiesPerRun(WARM_CHANNELS[0])} copies. It is the weakest row here and
          it is listed at its real value, because an ally who is told posting is powerful and then
          watches nothing happen stops believing the rest of the board.
        </p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
          Every ally gets a link that attributes what came from them, so this is a number on the
          board rather than a favour disappearing into the dark. Conversion rates above are published
          benchmarks for other people&apos;s campaigns — they are the best prior available, and they
          get replaced by our own numbers the moment we have any.
        </p>
      </div>

      {/* ── The 90-day gates ────────────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] p-5"
        style={{ background: PANEL }}
      >
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          the 90-day campaign
        </span>
        <h3 className="text-[19px] font-bold" style={{ color: INK }}>
          Three gates. What a miss means is written down now, not on day 29.
        </h3>
        <div className="flex flex-col gap-3">
          {NINETY_DAY.map((g) => (
            <div
              key={g.day}
              className="flex flex-col gap-2 rounded-xl border-l-2 py-3 pl-4 pr-3"
              style={{ borderColor: PURPLE, background: 'rgba(139,92,246,.06)' }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="text-[12px] font-bold uppercase tabular-nums"
                  style={{ letterSpacing: '.14em', color: PURPLE }}
                >
                  day {g.day}
                </span>
                <span className="text-[15.5px] font-semibold" style={{ color: INK }}>
                  {g.title}
                </span>
              </div>
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {g.proves.map((line, idx) => (
                  <li key={idx} className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                    {line}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
                <strong style={{ color: GOLD }}>If it&apos;s missed:</strong> {g.ifMissed}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button className={cta} style={{ background: PURPLE }} onClick={onContinue}>
          Now show me where I fit →
        </button>
      </div>
    </div>
  )
}

function PathCard({
  path,
  open,
  onToggle,
}: {
  path: VictoryPath
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="rounded-xl border px-4 py-4 text-left transition-colors"
      style={{
        background: open ? 'rgba(139,92,246,.08)' : PANEL,
        borderColor: open ? PURPLE : 'rgba(255,255,255,.10)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[16px] font-semibold" style={{ color: INK }}>
            {path.title}
            {path.estimate && (
              <span className="ml-2 text-[11px] font-normal" style={{ color: FAINT }}>
                (uses estimates)
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[12.5px]" style={{ color: FAINT }}>
            {path.comp}
          </div>
        </div>
        <span className="mt-0.5 shrink-0 text-[16px]" style={{ color: open ? PURPLE : FAINT }} aria-hidden>
          {open ? '−' : '+'}
        </span>
      </div>

      {/* The month, in countable units — visible even when collapsed. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <NumTag label="books/mo" value={path.booksPerMonth} />
        <NumTag
          label={path.workshopsPerMonth === 1 ? 'workshop/mo' : 'workshops/mo'}
          value={path.workshopsPerMonth}
        />
        {path.bridgeIncomeCents > 0 && !path.runway && (
          <NumTag label="part-time" value={`${usd(path.bridgeIncomeCents)}/mo`} />
        )}
        {path.runway && (
          <NumTag label={`runway · ${path.runway.months} mo, then it stops`} value={usd(path.runway.totalCents)} />
        )}
        <NumTag label={`lands at ${usd(path.monthlyCents)}/mo`} accent />
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.07] pt-3">
          {/* Failure first. For this reader, that IS the credibility. */}
          <div
            className="rounded-lg px-3 py-2.5 text-[13px] leading-relaxed"
            style={{ background: 'rgba(204,136,136,.10)', color: '#f0d0d0' }}
          >
            <strong>How this path fails:</strong> {path.failureReads}
          </div>
          <div
            className="rounded-lg px-3 py-2.5 text-[13px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,.045)', color: DIM }}
          >
            <strong style={{ color: INK }}>Demand risk:</strong> {path.demandRisk}
          </div>
          {path.needsReprint && Number.isFinite(path.runMonthsAtPace) && (
            <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
              At this pace the current print run is gone in about {path.runMonthsAtPace} months — this
              path quietly requires a second printing, so it&apos;s saying that out loud instead.
            </p>
          )}
          {/* A bounded ask with a stated end date, stated as such — the whole
              anti-dependency claim of this campaign rests on this box. */}
          {path.runway && (
            <div
              className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(212,160,23,.10)' }}
            >
              <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
                <strong style={{ color: GOLD }}>What this path actually asks for:</strong>{' '}
                {usd(path.runway.monthlyCents)}/month for {path.runway.months} months —{' '}
                {usd(path.runway.totalCents)} in total. That covers {path.runway.what}
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: '#e8c98a' }}>
                <strong style={{ color: GOLD }}>It ends:</strong> {path.runway.endsWhen}. Not
                &ldquo;when things pick up.&rdquo;
              </p>
            </div>
          )}
          <p className="text-[14px] leading-relaxed" style={{ color: '#cfcdc6' }}>
            {path.thesis}
          </p>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: PURPLE }}
            >
              Has to exist on day 1
            </p>
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
              {path.needsUpFront.map((line, idx) => (
                <li key={idx} className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              What support looks like, specifically
            </p>
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
              {path.supportLooksLike.map((line, idx) => (
                <li key={idx} className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </button>
  )
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13.5px]" style={{ color: accent ? INK : DIM }}>
        {label}
      </span>
      <span className="text-[14px] font-semibold tabular-nums" style={{ color: accent ? GOLD : INK }}>
        {value}
      </span>
    </div>
  )
}

/** Small counts read better as words in prose; anything larger stays a numeral. */
function numberWord(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][n] ?? String(n)
}

function NumTag({
  label,
  value,
  accent,
}: {
  label: string
  value?: number | string
  accent?: boolean
}) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
      style={{
        background: accent ? 'rgba(212,160,23,.14)' : 'rgba(255,255,255,.06)',
        color: accent ? GOLD : DIM,
      }}
    >
      {value !== undefined ? `${value} ${label}` : label}
    </span>
  )
}
