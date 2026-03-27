'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createOfferBarFromDsw } from '@/actions/offer-bar-from-dsw'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { CopyTextButton } from '@/components/ui/CopyTextButton'
import type { OfferBarDswPath, OfferBarSkillBand } from '@/lib/offer-bar'

const SKILL_OPTIONS: { value: OfferBarSkillBand; label: string }[] = [
  { value: 'skilled', label: 'Skilled (needs training or craft)' },
  { value: 'unskilled', label: 'Unskilled (show up, learn on the job)' },
  { value: 'either', label: 'Either / we’ll figure it out together' },
]

const PATTERN_OPTIONS: { value: '' | 'along_the_way' | 'scheduled' | 'batch' | 'other'; label: string }[] = [
  { value: '', label: 'Optional — how you like to bundle time' },
  { value: 'along_the_way', label: 'Along the way (bundle with trips you already take)' },
  { value: 'scheduled', label: 'Scheduled blocks' },
  { value: 'batch', label: 'Batch / multi-session' },
  { value: 'other', label: 'Other' },
]

function marketplaceHrefWithAttach(marketplaceHref: string, barId: string): string {
  const q = marketplaceHref.includes('?') ? '&' : '?'
  return `${marketplaceHref}${q}attach=${encodeURIComponent(barId)}`
}

type Props = {
  isOpen: boolean
  onClose: () => void
  dswPath: OfferBarDswPath
  campaignRef?: string | null
  marketplaceHref: string
  /** Vault / Hand — default `/hand`. */
  vaultHref?: string
}

export function OfferBarModal({
  isOpen,
  onClose,
  dswPath,
  campaignRef,
  marketplaceHref,
  vaultHref = '/hand',
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skillBand, setSkillBand] = useState<OfferBarSkillBand>('either')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [sessionCount, setSessionCount] = useState('')
  const [schedulingNotes, setSchedulingNotes] = useState('')
  const [geographyOrVenue, setGeographyOrVenue] = useState('')
  const [creativePattern, setCreativePattern] = useState<(typeof PATTERN_OPTIONS)[number]['value']>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [barId, setBarId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setBarId(null)
  }, [isOpen, dswPath])

  if (!isOpen) return null

  const heading = dswPath === 'time' ? 'Offer your time' : 'Offer space'
  const sub =
    dswPath === 'time'
      ? 'Name what you’ll do, how long it might take, and when you’re available — exchange-shaped, not one-way charity.'
      : 'Describe the space (venue, storage, housing window) and how others can coordinate with you.'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setBarId(null)

    const hRaw = estimatedHours.trim() === '' ? NaN : Number.parseFloat(estimatedHours)
    const hoursVal = Number.isFinite(hRaw) ? hRaw : undefined
    const scRaw = sessionCount.trim() === '' ? NaN : Number.parseInt(sessionCount, 10)
    const sessionsVal = Number.isFinite(scRaw) ? scRaw : undefined

    try {
      const res = await createOfferBarFromDsw({
        title,
        description,
        skillBand,
        campaignRef: campaignRef?.trim() || null,
        estimatedHours: hoursVal,
        sessionCount: sessionsVal,
        schedulingNotes: schedulingNotes.trim() || null,
        geographyOrVenue: geographyOrVenue.trim() || null,
        creativeOfferPattern: creativePattern || null,
        dswPath,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      if (res.success) {
        setBarId(res.barId)
        setTitle('')
        setDescription('')
        setSkillBand('either')
        setEstimatedHours('')
        setSessionCount('')
        setSchedulingNotes('')
        setGeographyOrVenue('')
        setCreativePattern('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CultivationCard
          element="wood"
          altitude="neutral"
          stage="seed"
          className="rounded-2xl hover:!scale-100"
          aria-label="Offer BAR dialog"
        >
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white">{heading}</h2>
                <p className="text-sm text-zinc-400 mt-1">{sub}</p>
              </div>
              <div className="flex items-start gap-2 shrink-0">
                <CopyTextButton text={`${heading}\n\n${sub}`} aria-label="Copy introduction" />
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-500 hover:text-white text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {barId ? (
                <div className="space-y-4">
                <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/90 space-y-2">
                  <div className="flex justify-end">
                    <CopyTextButton
                      text="Your offer BAR is in your vault. You can refine it, list it on a campaign stall, or keep it private."
                      aria-label="Copy success message"
                    />
                  </div>
                  <p>
                    Your offer BAR is in your vault. You can refine it, list it on a campaign stall, or keep it private.
                  </p>
                </div>

                <div className="rounded-xl border border-teal-900/45 bg-teal-950/20 px-4 py-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-teal-500/90">Next steps</p>
                    <CopyTextButton
                      text={
                        'Next steps\n\nVault — drafts and private BARs live in your hand.\n\nMarketplace — publish to a numbered stall so this campaign can browse your offer (stall rules apply).\n\n“List on a stall” opens the marketplace with this BAR ready to attach to an empty stall (same flow as Vault). If you have no free stall, unlock or clear one there first.'
                      }
                      aria-label="Copy next steps text"
                    />
                  </div>
                  <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-4">
                    <li>
                      <span className="text-zinc-300">Vault</span> — drafts and private BARs live in your hand.
                    </li>
                    <li>
                      <span className="text-zinc-300">Marketplace</span> — publish to a numbered stall so this campaign can
                      browse your offer (stall rules apply).
                    </li>
                  </ul>
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                      <Link
                        href={`/bars/${barId}`}
                        className="text-center px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm transition"
                      >
                        Open BAR →
                      </Link>
                      <Link
                        href={vaultHref}
                        className="text-center px-4 py-2.5 rounded-xl border border-zinc-600 hover:border-zinc-500 text-zinc-200 font-semibold text-sm transition"
                      >
                        View in Vault →
                      </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                      <Link
                        href={marketplaceHref}
                        className="text-center px-4 py-2.5 rounded-xl border border-teal-800/60 hover:border-teal-600/80 text-teal-100 font-semibold text-sm transition"
                      >
                        Open campaign marketplace →
                      </Link>
                      {campaignRef?.trim() ? (
                        <Link
                          href={marketplaceHrefWithAttach(marketplaceHref, barId)}
                          className="text-center px-4 py-2.5 rounded-xl bg-teal-800/70 hover:bg-teal-700 text-white font-semibold text-sm transition"
                        >
                          List on a stall →
                        </Link>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      “List on a stall” opens the marketplace with this BAR ready to attach to an empty stall (same flow as
                      Vault). If you have no free stall, unlock or clear one there first.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-zinc-500 hover:text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <label htmlFor="offer-bar-title" className="block text-sm font-medium text-zinc-300">
                      Title
                    </label>
                    {title.trim() ? <CopyTextButton text={title} aria-label="Copy title" /> : null}
                  </div>
                  <input
                    id="offer-bar-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    placeholder="Short name for your offer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <label htmlFor="offer-bar-desc" className="block text-sm font-medium text-zinc-300">
                      What you&apos;ll do (description)
                    </label>
                    {description.trim() ? <CopyTextButton text={description} aria-label="Copy description" /> : null}
                  </div>
                  <textarea
                    id="offer-bar-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none resize-y min-h-[100px]"
                    placeholder="Concrete scope, who it helps, any boundaries."
                  />
                </div>

                <div>
                  <label htmlFor="offer-bar-skill" className="block text-sm font-medium text-zinc-300 mb-1">
                    Skill band
                  </label>
                  <select
                    id="offer-bar-skill"
                    value={skillBand}
                    onChange={(e) => setSkillBand(e.target.value as OfferBarSkillBand)}
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    {SKILL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <label htmlFor="offer-bar-hours" className="block text-sm font-medium text-zinc-300">
                        Estimated hours (optional)
                      </label>
                      {estimatedHours.trim() ? (
                        <CopyTextButton text={estimatedHours} aria-label="Copy estimated hours" />
                      ) : null}
                    </div>
                    <input
                      id="offer-bar-hours"
                      type="number"
                      min={0}
                      max={500}
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <label htmlFor="offer-bar-sessions" className="block text-sm font-medium text-zinc-300">
                        Sessions (optional)
                      </label>
                      {sessionCount.trim() ? (
                        <CopyTextButton text={sessionCount} aria-label="Copy session count" />
                      ) : null}
                    </div>
                    <input
                      id="offer-bar-sessions"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={sessionCount}
                      onChange={(e) => setSessionCount(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <label htmlFor="offer-bar-sched" className="block text-sm font-medium text-zinc-300">
                      Scheduling notes
                    </label>
                    {schedulingNotes.trim() ? (
                      <CopyTextButton text={schedulingNotes} aria-label="Copy scheduling notes" />
                    ) : null}
                  </div>
                  <textarea
                    id="offer-bar-sched"
                    value={schedulingNotes}
                    onChange={(e) => setSchedulingNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none resize-y"
                    placeholder="Windows, cadence, creative constraints (timebank-style)."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <label htmlFor="offer-bar-geo" className="block text-sm font-medium text-zinc-300">
                      Geography or venue (optional)
                    </label>
                    {geographyOrVenue.trim() ? (
                      <CopyTextButton text={geographyOrVenue} aria-label="Copy geography or venue" />
                    ) : null}
                  </div>
                  <input
                    id="offer-bar-geo"
                    value={geographyOrVenue}
                    onChange={(e) => setGeographyOrVenue(e.target.value)}
                    maxLength={500}
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    placeholder={dswPath === 'space' ? 'Neighborhood, address band, or venue type' : 'Where you can show up or meet'}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <label htmlFor="offer-bar-pattern" className="block text-sm font-medium text-zinc-300">
                      How you like to offer time
                    </label>
                    <CopyTextButton
                      text={
                        (PATTERN_OPTIONS.find((o) => o.value === creativePattern)?.label ??
                          creativePattern) || 'Optional'
                      }
                      aria-label="Copy time pattern"
                    />
                  </div>
                  <select
                    id="offer-bar-pattern"
                    value={creativePattern}
                    onChange={(e) =>
                      setCreativePattern(e.target.value as (typeof PATTERN_OPTIONS)[number]['value'])
                    }
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    {PATTERN_OPTIONS.map((o) => (
                      <option key={o.value || 'none'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200 flex justify-end items-start gap-2">
                    <p className="flex-1 min-w-0">{error}</p>
                    <CopyTextButton text={error} aria-label="Copy error message" />
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-600 text-zinc-300 hover:border-zinc-500 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold transition"
                  >
                    {loading ? 'Saving…' : 'Create offer BAR'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </CultivationCard>
      </div>
    </div>
  )
}
