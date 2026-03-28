'use client'

import { useMemo } from 'react'
import { upsertInstance } from '@/actions/instance'
import { CAMPAIGN_DECK_TOPOLOGY_OPTIONS } from '@/lib/campaign-deck-topology'
import { KOTTER_STAGES } from '@/lib/kotter'
import { isBruisedBananaHouseInstance, parseHouseGoalData } from '@/lib/bruised-banana-house-state'
import type { CampaignDeckTopology } from '@/lib/campaign-deck-topology'

type Instance = {
  id: string
  slug: string
  name: string
  domainType: string
  allyshipDomain?: string | null
  theme: string | null
  targetDescription: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  campaignRef: string | null
  goalAmountCents: number | null
  currentAmountCents: number
  kotterStage: number
  isEventMode: boolean
  stripeOneTimeUrl: string | null
  patreonUrl: string | null
  venmoUrl: string | null
  cashappUrl: string | null
  paypalUrl: string | null
  donationButtonLabel?: string | null
  moveIds?: string
  sourceInstanceId?: string | null
  parentInstanceId?: string | null
  linkedInstanceId?: string | null
  goalData?: string | null
  campaignDeckTopology?: CampaignDeckTopology
}

type PromotedMove = { id: string; key: string; name: string }

function parseMoveIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function InstanceEditModal({
  instance,
  promotedMoves,
  instances,
  onClose,
}: {
  instance: Instance | null
  promotedMoves: PromotedMove[]
  instances: { id: string; slug: string; name: string }[]
  onClose: () => void
}) {
  if (!instance) return null

  const goalDollars = instance.goalAmountCents != null ? (instance.goalAmountCents / 100).toString() : ''
  const selectedMoveIds = new Set(parseMoveIds(instance.moveIds))
  const currentDollars = (instance.currentAmountCents / 100).toString()

  const showHouseState = isBruisedBananaHouseInstance(instance.slug, instance.campaignRef)
  const houseParsed = useMemo(() => parseHouseGoalData(instance.goalData), [instance.goalData])
  const defaultHouseNote = houseParsed.house?.operatorNote ?? ''
  const defaultHouseHealth =
    houseParsed.house?.healthSignal != null && houseParsed.house.healthSignal >= 1 && houseParsed.house.healthSignal <= 5
      ? String(houseParsed.house.healthSignal)
      : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Edit Instance: {instance.name}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none p-2"
            >
              ×
            </button>
          </div>

          <form action={upsertInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
            <input type="hidden" name="id" value={instance.id} />

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Slug</label>
              <input name="slug" defaultValue={instance.slug} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Name</label>
              <input name="name" defaultValue={instance.name} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Domain Type</label>
              <select name="domainType" defaultValue={instance.domainType} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required>
                <option value="party">party</option>
                <option value="fundraiser">fundraiser</option>
                <option value="hackathon">hackathon</option>
                <option value="business">business</option>
                <option value="house">house</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Allyship Domain (gameboard deck)</label>
              <select name="allyshipDomain" defaultValue={instance.allyshipDomain ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                <option value="">— None (legacy deck) —</option>
                <option value="GATHERING_RESOURCES">GATHERING_RESOURCES</option>
                <option value="DIRECT_ACTION">DIRECT_ACTION</option>
                <option value="RAISE_AWARENESS">RAISE_AWARENESS</option>
                <option value="SKILLFUL_ORGANIZING">SKILLFUL_ORGANIZING</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Theme</label>
              <input name="theme" defaultValue={instance.theme ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Target Description</label>
              <input name="targetDescription" defaultValue={instance.targetDescription ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Wake Up: Learn the story</label>
              <textarea name="wakeUpContent" rows={4} defaultValue={instance.wakeUpContent ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Show Up: Contribute to the campaign</label>
              <textarea name="showUpContent" rows={4} defaultValue={instance.showUpContent ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Story bridge (game ↔ real world)</label>
              <textarea name="storyBridgeCopy" rows={2} defaultValue={instance.storyBridgeCopy ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Campaign ref</label>
              <input name="campaignRef" defaultValue={instance.campaignRef ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Campaign deck topology (hub / landings)
              </label>
              <select
                name="campaignDeckTopology"
                defaultValue={instance.campaignDeckTopology ?? 'CAMPAIGN_DECK_52'}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
              >
                {CAMPAIGN_DECK_TOPOLOGY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-1">
                {CAMPAIGN_DECK_TOPOLOGY_OPTIONS.find((o) => o.value === (instance.campaignDeckTopology ?? 'CAMPAIGN_DECK_52'))?.hint}
              </p>
            </div>

            {showHouseState && (
              <div className="md:col-span-2 space-y-3 rounded-xl border border-teal-900/50 bg-teal-950/15 p-4">
                <div className="text-[10px] uppercase tracking-widest text-teal-500 font-bold">Bruised Banana House — operator state</div>
                <p className="text-xs text-zinc-500">
                  Stored in <span className="font-mono text-zinc-400">Instance.goalData</span> (schema{' '}
                  <span className="font-mono">bruised-banana-house-state-v1</span>). Shown when slug or campaign ref is{' '}
                  <span className="font-mono">bruised-banana-house</span>.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Operator note</label>
                  <textarea
                    name="houseOperatorNote"
                    key={`hn-${instance.id}`}
                    rows={3}
                    defaultValue={defaultHouseNote}
                    placeholder="What’s alive in the house this week?"
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Health signal (1–5)</label>
                  <select
                    name="houseHealthSignal"
                    key={`hh-${instance.id}`}
                    defaultValue={defaultHouseHealth === '' ? '' : defaultHouseHealth}
                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
                  >
                    <option value="">No change</option>
                    <option value="1">1 — rough</option>
                    <option value="2">2</option>
                    <option value="3">3 — ok</option>
                    <option value="4">4</option>
                    <option value="5">5 — thriving</option>
                    <option value="clear">Clear rating</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Source instance (fork from)</label>
              <select name="sourceInstanceId" defaultValue={instance.sourceInstanceId ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                <option value="">— None —</option>
                {instances.filter((i) => i.id !== instance.id).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Parent instance (sub-campaign of)</label>
              <select name="parentInstanceId" defaultValue={instance.parentInstanceId ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                <option value="">— None (top-level) —</option>
                {instances.filter((i) => i.id !== instance.id).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Linked instance (e.g. Fundraising → Bruised Banana)</label>
              <select name="linkedInstanceId" defaultValue={instance.linkedInstanceId ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                <option value="">— None —</option>
                {instances.filter((i) => i.id !== instance.id).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.slug})</option>
                ))}
              </select>
            </div>

            {promotedMoves.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">
                  Move pool (campaign-curated moves)
                </label>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 bg-black/50 border border-zinc-800 rounded">
                  {promotedMoves.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        name="moveIds"
                        value={m.id}
                        defaultChecked={selectedMoveIds.has(m.id)}
                        className="rounded border-zinc-600 bg-zinc-800"
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  When set, players in this campaign see only these moves in the move panel. Empty = all nation moves.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Goal Amount (USD)</label>
              <input name="goalAmount" type="text" inputMode="decimal" defaultValue={goalDollars} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Amount (USD)</label>
              <input name="currentAmount" type="text" inputMode="decimal" defaultValue={currentDollars} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Stripe Payment Link (one-time)</label>
              <input name="stripeOneTimeUrl" defaultValue={instance.stripeOneTimeUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Patreon Link</label>
              <input name="patreonUrl" defaultValue={instance.patreonUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Venmo Link</label>
              <input name="venmoUrl" defaultValue={instance.venmoUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cash App Link</label>
              <input name="cashappUrl" defaultValue={instance.cashappUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">PayPal Link</label>
              <input name="paypalUrl" defaultValue={instance.paypalUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Donate button label (optional)</label>
              <input
                name="donationButtonLabel"
                defaultValue={instance.donationButtonLabel ?? ''}
                placeholder="Donate"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Kotter Stage</label>
              <select name="kotterStage" defaultValue={instance.kotterStage} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}. {KOTTER_STAGES[n as keyof typeof KOTTER_STAGES].name}
                  </option>
                ))}
              </select>
            </div>

            <label className="md:col-span-2 flex items-center gap-3 text-sm text-zinc-300">
              <input type="checkbox" name="isEventMode" defaultChecked={instance.isEventMode} className="w-4 h-4" />
              Event Mode (show progress bar + donate CTAs)
            </label>

            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px]">
                Save Instance
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
