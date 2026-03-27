'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { OfferBarModal } from '@/components/event/OfferBarModal'
import type { DonationWizardMilestoneOption } from '@/lib/donation-wizard'
import type { OfferBarDswPath } from '@/lib/offer-bar'

function mergeDonateHandoffQuery(
  searchParams: URLSearchParams,
  campaignRef: string | undefined,
  extra: Record<string, string>
): URLSearchParams {
  const q = new URLSearchParams(searchParams.toString())
  const r = campaignRef?.trim()
  if (r) q.set('ref', r)
  for (const [k, v] of Object.entries(extra)) {
    if (v) q.set(k, v)
  }
  return q
}

function wizardHref(searchParams: URLSearchParams, campaignRef: string | undefined): string {
  const q = new URLSearchParams(searchParams.toString())
  const r = campaignRef?.trim()
  if (r) q.set('ref', r)
  const s = q.toString()
  return s ? `/event/donate/wizard?${s}` : '/event/donate/wizard'
}

export const DSW_MONEY_TIERS = [
  {
    id: 'small' as const,
    label: 'Small',
    dollars: 15,
    why: 'Keeps practical costs covered — snacks, printing, one more night of rehearsal energy.',
  },
  {
    id: 'medium' as const,
    label: 'Medium',
    dollars: 50,
    why: 'Funds a visible moment — a guest, materials, or tech that players actually feel in-game.',
  },
  {
    id: 'large' as const,
    label: 'Large',
    dollars: 150,
    why: 'Moves weight — a milestone-sized push the whole campaign can celebrate together.',
  },
  { id: 'custom' as const, label: 'Custom', dollars: null as number | null, why: 'You choose the amount on the next screen after you pay.' },
]

const DSW_NARRATIVE_URL_MAX = 180

type Props = {
  instanceName: string
  /** Preserved on money handoff and BAR links (DSW Phase 3). */
  campaignRef?: string
  marketplaceHref: string
  milestones: DonationWizardMilestoneOption[]
  /** When false, offer BAR modal CTA routes to login with returnTo this wizard. */
  isLoggedIn: boolean
}

type Phase = 'pick' | 'money' | 'time' | 'space' | 'host'
type MoneyStep = 'tiers' | 'extras'

export function DonationSelfServiceWizard({
  instanceName,
  campaignRef,
  marketplaceHref,
  milestones,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refParam = useMemo(
    () => campaignRef?.trim() || searchParams.get('ref')?.trim() || '',
    [campaignRef, searchParams]
  )
  const wizardHrefWithRef = useMemo(
    () => wizardHref(searchParams, campaignRef),
    [searchParams, campaignRef]
  )
  const barsCreateHref = refParam
    ? `/bars/create?ref=${encodeURIComponent(refParam)}`
    : '/bars/create'

  const loginReturnHref = wizardHrefWithRef
  const loginHref = `/login?returnTo=${encodeURIComponent(loginReturnHref)}`

  const [offerModalPath, setOfferModalPath] = useState<OfferBarDswPath | null>(null)
  const [phase, setPhase] = useState<Phase>('pick')
  const [moneyStep, setMoneyStep] = useState<MoneyStep>('tiers')
  const [tier, setTier] = useState<(typeof DSW_MONEY_TIERS)[number]['id'] | null>(null)
  const [narrative, setNarrative] = useState('')
  const [milestoneId, setMilestoneId] = useState('')

  const goDonateWithMoney = () => {
    const t = DSW_MONEY_TIERS.find((x) => x.id === tier)
    const narr = narrative.trim()
    const q = mergeDonateHandoffQuery(searchParams, campaignRef, {
      dswPath: 'money',
      ...(tier ? { dswTier: tier } : {}),
      ...(t?.dollars != null ? { amount: t.dollars.toFixed(2) } : {}),
      ...(narr ? { dswNarrative: narr.slice(0, DSW_NARRATIVE_URL_MAX) } : {}),
      ...(milestoneId ? { dswMilestoneId: milestoneId } : {}),
    })
    router.push(`/event/donate?${q.toString()}`)
  }

  const resetMoney = () => {
    setMoneyStep('tiers')
    setTier(null)
    setNarrative('')
    setMilestoneId('')
  }

  const directDonateHref = useMemo(() => {
    const q = mergeDonateHandoffQuery(searchParams, campaignRef, {})
    const s = q.toString()
    return s ? `/event/donate?${s}` : '/event/donate'
  }, [searchParams, campaignRef])

  return (
    <div className="space-y-8">
      {phase === 'pick' && (
        <>
          <p className="text-zinc-400 text-sm">
            Contribute with <span className="text-zinc-300">money</span> or{' '}
            <span className="text-zinc-300">services</span> (time and space — skills, venue, in-kind offers). You can switch paths anytime.
          </p>
          <p className="text-zinc-500 text-xs">
            Supporting <span className="text-zinc-300">{instanceName}</span> — pick a tile, or use Back to return here from any branch.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { id: 'money' as const, title: 'Money', emoji: '💵', blurb: 'Donate and self-report for redemption packs (vibeulons).' },
                { id: 'time' as const, title: 'Time', emoji: '⏱️', blurb: 'Show up — skills, facilitation, or campaign labor.' },
                { id: 'space' as const, title: 'Space', emoji: '🏠', blurb: 'Venue, housing, storage, or in-kind space.' },
                { id: 'host' as const, title: 'Host / organize', emoji: '🎤', blurb: 'Benefit night, drive, or fundraiser — align with stewards first.' },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPhase(c.id)}
                className="text-left rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-emerald-800/60 hover:bg-zinc-900/70 transition"
              >
                <div className="text-2xl mb-1">{c.emoji}</div>
                <div className="font-bold text-white">{c.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{c.blurb}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'money' && moneyStep === 'tiers' && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => {
              setPhase('pick')
              resetMoney()
            }}
            className="text-sm text-zinc-500 hover:text-white"
          >
            ← Back
          </button>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
            <div className="font-semibold text-amber-200 mb-1">Hosting a fundraiser?</div>
            <p className="text-amber-100/80">
              Use the <strong className="text-amber-100">Host / organize</strong> path for checklists and steward alignment — or continue here for your personal gift.
            </p>
          </div>
          <h2 className="text-lg font-bold text-white">Pick a tier</h2>
          <p className="text-zinc-500 text-sm">Tiers are suggestions; you&apos;ll confirm the exact amount when you self-report after paying.</p>
          <div className="space-y-3">
            {DSW_MONEY_TIERS.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setTier(row.id)
                  setMoneyStep('extras')
                }}
                className="w-full text-left rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-700/50 transition"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-white">{row.label}</span>
                  {row.dollars != null && (
                    <span className="text-emerald-400 text-sm">${row.dollars}</span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm mt-1">{row.why}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'money' && moneyStep === 'extras' && tier && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setMoneyStep('tiers')}
            className="text-sm text-zinc-500 hover:text-white"
          >
            ← Back to tiers
          </button>
          <h2 className="text-lg font-bold text-white">Tie it to a moment (optional)</h2>
          <p className="text-zinc-500 text-sm">
            One line helps stewards see why this gift matters — a quest beat, milestone, or shout-out. Stored on your donation record.
          </p>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="e.g. For the house show arc / milestone 3 / in honor of…"
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none resize-y min-h-[88px]"
          />
          <div className="text-xs text-zinc-600">{narrative.length}/280</div>

          {milestones.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="dsw-milestone" className="block text-sm font-medium text-zinc-300">
                Count toward a campaign milestone (optional)
              </label>
              <select
                id="dsw-milestone"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none"
              >
                <option value="">No milestone link</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                    {m.targetValue != null
                      ? ` (${Math.round(m.currentValue)} / ${Math.round(m.targetValue)})`
                      : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-600">
                Your reported USD amount increments the milestone total when you self-report.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={goDonateWithMoney}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
          >
            Continue to pay &amp; self-report →
          </button>
        </div>
      )}

      {phase === 'host' && (
        <div className="space-y-6">
          <button type="button" onClick={() => setPhase('pick')} className="text-sm text-zinc-500 hover:text-white">
            ← Back
          </button>
          <h2 className="text-lg font-bold text-white">Organizing a fundraiser or benefit</h2>
          <p className="text-zinc-400 text-sm">
            Drives land best when they&apos;re wired to the same instance, event artifacts, and messaging as the residency. Use this as a lightweight checklist — then route guests to donate or RSVP through the normal game surfaces.
          </p>
          <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-2">
            <li>Confirm date, venue, and fundraising goal with campaign stewards.</li>
            <li>Create or update an <strong className="text-zinc-200">event</strong> so invites and capacity stay in one place.</li>
            <li>Share payment links that match this instance (Venmo / Stripe / etc. on the donate page).</li>
            <li>Personal gifts vs. drive totals: guests can still use the guided wizard for their own contribution story.</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Link
              href="/event"
              className="text-center px-5 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold transition"
            >
              Event hub
            </Link>
            <Link
              href={wizardHrefWithRef}
              className="text-center px-5 py-3 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-bold transition"
            >
              Open contribution wizard (guests)
            </Link>
            <Link
              href={directDonateHref}
              className="text-center px-5 py-3 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-bold transition"
            >
              Direct donate + self-report
            </Link>
          </div>
        </div>
      )}

      {phase === 'time' && (
        <div className="space-y-6">
          <button type="button" onClick={() => setPhase('pick')} className="text-sm text-zinc-500 hover:text-white">
            ← Back
          </button>
          <h2 className="text-lg font-bold text-white">Offer your time</h2>
          <p className="text-zinc-400 text-sm">
            Time contributions usually show up as a <strong className="text-zinc-200">BAR</strong> (a concrete offer or quest-shaped commitment). You can create one and, if it fits the campaign economy, list it on the{' '}
            <strong className="text-zinc-200">marketplace</strong> so others can discover it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setOfferModalPath('time')}
                className="text-center px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition"
              >
                Create offer BAR (guided)
              </button>
            ) : (
              <Link
                href={loginHref}
                className="text-center px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition"
              >
                Sign in to create an offer BAR
              </Link>
            )}
            <Link
              href={marketplaceHref}
              className="text-center px-5 py-3 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-bold transition"
            >
              Campaign marketplace
            </Link>
          </div>
          <p className="text-zinc-500 text-xs">
            <Link href={barsCreateHref} className="text-zinc-400 hover:text-white underline underline-offset-2">
              Advanced / full BAR forge
            </Link>
            {' — '}
            all fields, forge workflow, power users.
          </p>
          <p className="text-zinc-600 text-xs">
            Money path still open if you also want to donate:{' '}
            <button type="button" className="underline hover:text-zinc-400" onClick={() => setPhase('money')}>
              Guided money →
            </button>
          </p>
        </div>
      )}

      {phase === 'space' && (
        <div className="space-y-6">
          <button type="button" onClick={() => setPhase('pick')} className="text-sm text-zinc-500 hover:text-white">
            ← Back
          </button>
          <h2 className="text-lg font-bold text-white">Offer space</h2>
          <p className="text-zinc-400 text-sm">
            Venue nights, rehearsal rooms, storage, or housing — capture it as a <strong className="text-zinc-200">BAR</strong> so the campaign can reference and honor the offer. List on the marketplace when it&apos;s something other players can browse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setOfferModalPath('space')}
                className="text-center px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold transition"
              >
                Create offer BAR (space, guided)
              </button>
            ) : (
              <Link
                href={loginHref}
                className="text-center px-5 py-3 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-bold transition"
              >
                Sign in to create an offer BAR
              </Link>
            )}
            <Link
              href={marketplaceHref}
              className="text-center px-5 py-3 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-bold transition"
            >
              Campaign marketplace
            </Link>
          </div>
          <p className="text-zinc-500 text-xs">
            <Link href={barsCreateHref} className="text-zinc-400 hover:text-white underline underline-offset-2">
              Advanced / full BAR forge
            </Link>
            {' — '}
            all fields, forge workflow, power users.
          </p>
          <p className="text-zinc-600 text-xs">
            Money path still open if you also want to donate:{' '}
            <button type="button" className="underline hover:text-zinc-400" onClick={() => setPhase('money')}>
              Guided money →
            </button>
          </p>
        </div>
      )}

      <OfferBarModal
        isOpen={offerModalPath != null}
        onClose={() => setOfferModalPath(null)}
        dswPath={offerModalPath ?? 'time'}
        campaignRef={campaignRef}
        marketplaceHref={marketplaceHref}
      />
    </div>
  )
}
