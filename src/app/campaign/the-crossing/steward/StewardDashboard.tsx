'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  stewardMarkCarPurchased,
  type TheCrossingCampaignState,
} from '@/actions/the-crossing-support'
import {
  domainLabel,
  getTheCrossingSupportRole,
  STATUS_META,
  THE_CROSSING_FILTERS,
  type TheCrossingContribution,
  type TheCrossingFilterKey,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'
const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'
const EARTH = ELEMENT_TOKENS.earth

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] p-4" style={{ background: '#121210' }}>
      <p className="text-[26px] font-bold leading-none" style={{ color: color ?? '#f4f2ec' }}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-[#a09e98]">{label}</p>
    </div>
  )
}

export function StewardDashboard({
  contributions,
  stats,
  fund,
  counts,
  state,
}: {
  contributions: TheCrossingContribution[]
  stats: { total: number; pending: number; people: number }
  fund: { raised: number; goal: number; pct: number; leads: number }
  counts: Record<TheCrossingFilterKey, number>
  state: TheCrossingCampaignState
}) {
  const [filter, setFilter] = useState<TheCrossingFilterKey>('all')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const visible = useMemo(() => {
    if (filter === 'all') return contributions
    if (filter === 'new') return contributions.filter((c) => c.status === 'new')
    return contributions.filter((c) => c.role === filter)
  }, [contributions, filter])

  const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

  function markPurchased() {
    startTransition(async () => {
      await stewardMarkCarPurchased()
      router.refresh()
    })
  }

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[840px] space-y-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-xl text-xl"
            style={{ background: `${EARTH.gem}1f`, color: EARTH.gem, border: `1px solid ${EARTH.gem}3d` }}
          >
            {EARTH.sigil}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em]">Wendell’s board</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#a09e98]">
              The Crossing · Steward dashboard
            </p>
          </div>
        </header>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Contributions" value={stats.total} />
          <StatCard label="Needs follow-up" value={stats.pending} color={STATUS_META.new.color} />
          <StatCard label="People in the field" value={stats.people} color={STATUS_META.accepted.color} />
        </div>

        {/* Car-fund card */}
        {state.carPurchased ? (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: ELEMENT_TOKENS.wood.frame, background: 'rgba(46,204,113,.08)' }}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-2xl" style={{ color: ELEMENT_TOKENS.wood.gem }}>
                🚗
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: ELEMENT_TOKENS.wood.gem }}>
                  Car secured
                </p>
                <p className="text-sm text-[#d6d4cd]">2019 Honda Civic — on the road</p>
              </div>
            </div>
            {state.thanked ? (
              <p className="mt-4 text-sm font-semibold" style={{ color: STATUS_META.thanked.color }}>
                ✦ The Crossing is complete — contributors thanked.
              </p>
            ) : (
              <Link
                href="/campaign/the-crossing/steward/thank-you"
                className="mt-4 inline-flex rounded-[11px] px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
              >
                Thank your contributors →
              </Link>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: EARTH.frame, background: 'rgba(212,160,23,.07)' }}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: EARTH.gem }}>
                  Car fund
                </p>
                <p className="mt-1 text-[22px] font-bold leading-none">
                  {money(fund.raised)} <span className="text-sm font-medium text-[#a09e98]">of {money(fund.goal)}</span>
                </p>
              </div>
              <p className="font-mono text-[11px] text-[#a09e98]">
                {Math.round(fund.pct)}% · {fund.leads} lead{fund.leads === 1 ? '' : 's'} in
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${fund.pct.toFixed(1)}%`, background: 'linear-gradient(90deg, #b5651d, #d4a017)' }}
              />
            </div>
            <button
              type="button"
              onClick={markPurchased}
              disabled={isPending}
              className="mt-4 inline-flex rounded-[11px] px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
            >
              {isPending ? 'Saving…' : 'Mark the car as purchased →'}
            </button>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {THE_CROSSING_FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                style={
                  active
                    ? { background: 'rgba(124,58,237,.22)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,.5)' }
                    : { background: 'transparent', color: '#a09e98', border: '1px solid rgba(255,255,255,.1)' }
                }
              >
                {f.label} · {counts[f.key]}
              </button>
            )
          })}
        </div>

        {/* Contribution list */}
        <div className="space-y-2.5">
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.07] p-6 text-center text-sm text-[#a09e98]">
              No contributions in this view yet.
            </p>
          ) : (
            visible.map((c) => {
              const role = getTheCrossingSupportRole(c.role)
              const el = role ? ELEMENT_TOKENS[role.element] : EARTH
              const status = STATUS_META[c.status]
              return (
                <Link
                  key={c.id}
                  href={`/campaign/the-crossing/steward/contributor/${c.id}`}
                  className="flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.07] p-4 transition-colors hover:border-white/20"
                  style={{ background: '#121210', borderLeft: `3px solid ${el.frame}` }}
                >
                  <span
                    aria-hidden
                    className="grid h-9 w-9 flex-none place-items-center rounded-lg text-base"
                    style={{ background: `${el.gem}1a`, color: el.gem }}
                  >
                    {el.sigil}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#f4f2ec]">{c.name || 'Anonymous'}</span>
                      <span className="flex-none rounded px-1.5 py-0.5 text-[10px] text-[#a09e98]" style={{ background: 'rgba(255,255,255,.05)' }}>
                        {c.roleLabel}
                      </span>
                      {c.status === 'new' ? (
                        <span
                          className="flex-none rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                          style={{ background: 'rgba(212,160,23,.16)', color: STATUS_META.new.color }}
                        >
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#a09e98]">{c.summary}</p>
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-[11px] font-semibold" style={{ color: status.color }}>
                      {status.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#6b6965]" suppressHydrationWarning>
                      {relativeTime(c.createdAt)}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <p className="pt-2 text-[11px] text-[#6b6965]">
          Every move lands here as a {domainLabel('GATHERING_RESOURCES')}-style BAR. Follow up through
          the contact each person left.
        </p>
      </div>
    </main>
  )
}
