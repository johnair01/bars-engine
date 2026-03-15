'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  completeGameboardQuest,
  attachQuestToSlot,
  getPlayerCampaignQuestsForSlot,
  takeSlotQuest,
  recordWakeUp,
  recordCleanUp,
  releaseSlotQuest,
  placeBid,
  withdrawBid,
  offerAid,
  acceptAidOffer,
  declineAidOffer,
  forkQuestPrivately,
  forkDeclinedAidQuest,
} from '@/actions/gameboard'
import { createSubQuest } from '@/actions/quest-nesting'
import { QuestOutlineReview } from '@/components/admin/QuestOutlineReview'
import { logPrePublishFeedback } from '@/actions/narrative-quality-feedback'
import type { SerializableQuestPacket } from '@/lib/quest-grammar/types'
import type { GameboardUnpacking } from '@/actions/gameboard'

function HexagramLines({ id }: { id: number }) {
  const lines: boolean[] = []
  let num = id
  for (let i = 0; i < 6; i++) {
    lines.unshift(num % 2 === 1)
    num = Math.floor(num / 2)
  }
  return (
    <div className="flex flex-col gap-1.5 items-center">
      {lines.map((solid, i) => (
        <div key={i}>
          {solid ? (
            <div className="w-16 h-2 bg-yellow-400 rounded-sm" />
          ) : (
            <div className="flex gap-2">
              <div className="w-6 h-2 bg-yellow-400 rounded-sm" />
              <div className="w-6 h-2 bg-yellow-400 rounded-sm" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

type Bid = {
  id: string
  amount: number
  bidder: { id: string; name: string }
}
type AidOffer = {
  id: string
  message: string
  type: string
  offerer: { id: string; name: string }
  linkedQuest?: { id: string; title: string } | null
  expiresAt?: Date | null
}
type Slot = {
  id: string
  slotIndex: number
  questId: string | null
  stewardId: string | null
  wakeUpAt: Date | null
  cleanUpAt: Date | null
  cleanUpReflection: string | null
  quest: {
    id: string
    title: string
    description: string
    parentId: string | null
  } | null
  steward: { id: string; name: string } | null
  bids?: Bid[]
  aidOffers?: AidOffer[]
}

type CampaignQuest = { id: string; title: string; campaignGoal: string | null }

type DeclinedOffer = {
  id: string
  linkedQuest: { id: string; title: string } | null
  slot: { id: string; slotIndex: number }
  steward: { id: string; name: string }
}

function formatExpiry(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return ''
  const now = new Date()
  const ms = expiresAt.getTime() - now.getTime()
  if (ms <= 0) return 'Expired'
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours < 1) return `Expires in ${Math.floor(ms / 60000)}m`
  if (hours < 24) return `Expires in ${hours}h`
  return `Respond by ${expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
}

export function GameboardClient({
  slots,
  campaignRef,
  isAdmin = false,
  playerId,
  declinedOffers = [],
}: {
  slots: Slot[]
  campaignRef: string
  isAdmin?: boolean
  playerId?: string
  declinedOffers?: DeclinedOffer[]
}) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)
  const [taking, setTaking] = useState<string | null>(null)
  const [wakingUp, setWakingUp] = useState<string | null>(null)
  const [cleaningUp, setCleaningUp] = useState<string | null>(null)
  const [releasing, setReleasing] = useState<string | null>(null)
  const [bidding, setBidding] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState<string>('1')
  const [bidSlotId, setBidSlotId] = useState<string | null>(null)
  const [aidSlotId, setAidSlotId] = useState<string | null>(null)
  const [aidMessage, setAidMessage] = useState('')
  const [aidType, setAidType] = useState<'direct' | 'quest'>('direct')
  const [aidLinkedQuestId, setAidLinkedQuestId] = useState<string | null>(null)
  const [aidQuestTitle, setAidQuestTitle] = useState('')
  const [aidQuestDesc, setAidQuestDesc] = useState('')
  const [aidQuestLoading, setAidQuestLoading] = useState(false)
  const [aidCampaignQuests, setAidCampaignQuests] = useState<CampaignQuest[]>([])
  const [aidLoading, setAidLoading] = useState(false)
  const [forking, setForking] = useState<string | null>(null)
  const [forkDeclinedLoading, setForkDeclinedLoading] = useState<string | null>(null)
  const [cleanUpReflection, setCleanUpReflection] = useState<Record<string, string>>({})
  const [addQuestSlotId, setAddQuestSlotId] = useState<string | null>(null)
  const [campaignQuests, setCampaignQuests] = useState<CampaignQuest[]>([])
  const [attachLoading, setAttachLoading] = useState(false)
  const [localSlots, setLocalSlots] = useState(slots)
  const [subquestTitle, setSubquestTitle] = useState('')
  const [subquestDesc, setSubquestDesc] = useState('')
  const [subquestLoading, setSubquestLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [subquestParentId, setSubquestParentId] = useState<string | null>(null)

  const [ritualSlotId, setRitualSlotId] = useState<string | null>(null)
  const [ritualText, setRitualText] = useState('')
  const [generatedPacket, setGeneratedPacket] = useState<SerializableQuestPacket | null>(null)
  const [generatedUnpacking, setGeneratedUnpacking] = useState<GameboardUnpacking | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)

  const addQuestSlot = addQuestSlotId
    ? localSlots.find((s) => s.id === addQuestSlotId) ?? null
    : null

  useEffect(() => {
    if (addQuestSlotId && campaignRef) {
      getPlayerCampaignQuestsForSlot(campaignRef).then(setCampaignQuests)
    } else {
      setCampaignQuests([])
    }
  }, [addQuestSlotId, campaignRef])

  useEffect(() => {
    if (aidSlotId && campaignRef) {
      getPlayerCampaignQuestsForSlot(campaignRef).then(setAidCampaignQuests)
    } else {
      setAidCampaignQuests([])
    }
  }, [aidSlotId, campaignRef])

  async function handleTake(slotId: string, ritualTextArg?: string) {
    setTaking(slotId)
    try {
      const result = await takeSlotQuest(slotId, ritualTextArg)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setRitualSlotId(null)
        setRitualText('')
        window.location.reload()
      }
    } finally {
      setTaking(null)
    }
  }

  async function handleWakeUp(slotId: string) {
    setWakingUp(slotId)
    try {
      const result = await recordWakeUp(slotId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      setWakingUp(null)
    }
  }

  async function handleCleanUp(slotId: string) {
    const reflection = cleanUpReflection[slotId]?.trim()
    if (!reflection) {
      alert('Name at least one inner obstacle you notice.')
      return
    }
    setCleaningUp(slotId)
    try {
      const result = await recordCleanUp(slotId, reflection)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setCleanUpReflection((prev) => ({ ...prev, [slotId]: '' }))
        window.location.reload()
      }
    } finally {
      setCleaningUp(null)
    }
  }

  async function handlePlaceBid(slotId: string) {
    const amount = parseInt(bidAmount, 10)
    if (isNaN(amount) || amount < 1) {
      alert('Enter a valid bid amount (1 or more)')
      return
    }
    setBidding(slotId)
    try {
      const result = await placeBid(slotId, amount)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setBidSlotId(null)
        setBidAmount('1')
        window.location.reload()
      }
    } finally {
      setBidding(null)
    }
  }

  async function handleWithdrawBid(bidId: string) {
    if (!confirm('Withdraw your bid? Your vibeulons will be returned.')) return
    try {
      const result = await withdrawBid(bidId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      // no loading state for withdraw
    }
  }

  async function handleOfferAid(slotId: string) {
    if (!aidMessage.trim()) {
      alert('Enter a message for the steward.')
      return
    }
    if (aidType === 'quest' && !aidLinkedQuestId) {
      alert('Create a quest or select an existing one to offer.')
      return
    }
    setAidLoading(true)
    try {
      const result = await offerAid(
        slotId,
        aidMessage.trim(),
        aidType,
        aidType === 'quest' ? aidLinkedQuestId : undefined
      )
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setAidSlotId(null)
        setAidMessage('')
        setAidType('direct')
        setAidLinkedQuestId(null)
        setAidQuestTitle('')
        setAidQuestDesc('')
        window.location.reload()
      }
    } finally {
      setAidLoading(false)
    }
  }

  async function handleCreateQuestForAid(slotId: string) {
    const slot = localSlots.find((s) => s.id === slotId)
    if (!slot?.quest?.id || !aidQuestTitle.trim()) {
      alert('Enter a title for the quest.')
      return
    }
    setAidQuestLoading(true)
    try {
      const result = await createSubQuest(slot.quest.id, {
        title: aidQuestTitle.trim(),
        description: aidQuestDesc.trim() || aidQuestTitle.trim(),
      })
      if (result && 'error' in result) {
        alert(result.error)
      } else if (result && 'questId' in result) {
        setAidLinkedQuestId(result.questId)
      }
    } finally {
      setAidQuestLoading(false)
    }
  }

  async function handleAcceptAid(offerId: string) {
    try {
      const result = await acceptAidOffer(offerId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      // no loading state
    }
  }

  async function handleDeclineAid(offerId: string) {
    try {
      const result = await declineAidOffer(offerId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      // no loading state
    }
  }

  async function handleFork(slotId: string, questId: string) {
    setForking(slotId)
    try {
      const result = await forkQuestPrivately(questId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      setForking(null)
    }
  }

  async function handleForkDeclinedAid(offerId: string) {
    setForkDeclinedLoading(offerId)
    try {
      const result = await forkDeclinedAidQuest(offerId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      setForkDeclinedLoading(null)
    }
  }

  async function handleRelease(slotId: string) {
    if (!confirm('Release this quest? Someone else can take it.')) return
    setReleasing(slotId)
    try {
      const result = await releaseSlotQuest(slotId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      setReleasing(null)
    }
  }

  async function handleComplete(slotId: string) {
    if (!confirm('Are you sure you completed this quest?')) return
    setCompleting(slotId)
    try {
      const result = await completeGameboardQuest(slotId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    } finally {
      setCompleting(null)
    }
  }

  async function handleAttach(slotId: string, questId: string) {
    setAttachLoading(true)
    try {
      const result = await attachQuestToSlot(slotId, questId)
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setAddQuestSlotId(null)
        window.location.reload()
      }
    } finally {
      setAttachLoading(false)
    }
  }

  async function handleAddSubquest(parentId: string) {
    if (!subquestTitle.trim()) {
      alert('Enter a title for your subquest.')
      return
    }
    setSubquestLoading(true)
    try {
      const result = await createSubQuest(parentId, {
        title: subquestTitle.trim(),
        description: subquestDesc.trim() || subquestTitle.trim(),
      })
      if (result && 'error' in result) {
        alert(result.error)
      } else {
        setAddQuestSlotId(null)
        setSubquestTitle('')
        setSubquestDesc('')
        window.location.reload()
      }
    } finally {
      setSubquestLoading(false)
    }
  }

  function closeAddQuestModal() {
    setAddQuestSlotId(null)
    setSubquestTitle('')
    setSubquestDesc('')
    setGeneratedPacket(null)
    setGeneratedUnpacking(null)
    setAccepted(false)
    setGenerationCount(0)
    setIsRegenerating(false)
    setPublishLoading(false)
  }

  const filledSlots = [...Array(8)].map((_, i) => {
    const slot = localSlots.find((s) => s.slotIndex === i)
    return (
      slot ?? {
        id: `empty-${i}`,
        slotIndex: i,
        questId: null,
        stewardId: null,
        wakeUpAt: null,
        cleanUpAt: null,
        cleanUpReflection: null,
        quest: null,
        steward: null,
        bids: [],
        aidOffers: [],
      }
    )
  })

  const isSteward = (slot: Slot) =>
    slot.stewardId && playerId && slot.stewardId === playerId
  const canComplete = (slot: Slot) =>
    !slot.stewardId ||
    (slot.stewardId === playerId && slot.wakeUpAt && slot.cleanUpAt)

  return (
    <>
      {declinedOffers.length > 0 && (
        <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-700 rounded-xl">
          <p className="text-sm font-medium text-zinc-300 mb-2">Your declined AID</p>
          <p className="text-xs text-zinc-500 mb-3">
            Steward declined your quest offer. Fork it to complete it yourself.
          </p>
          <div className="space-y-2">
            {declinedOffers.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-2 p-2 bg-zinc-800/50 rounded text-xs"
              >
                <span className="text-zinc-300 truncate">
                  {o.linkedQuest?.title ?? 'Quest'} — declined by {o.steward.name}
                </span>
                <button
                  onClick={() => handleForkDeclinedAid(o.id)}
                  disabled={!!forkDeclinedLoading}
                  className="shrink-0 py-1.5 px-3 bg-amber-600/80 hover:bg-amber-500/80 disabled:opacity-50 text-amber-100 text-xs font-medium rounded transition-colors"
                >
                  {forkDeclinedLoading === o.id ? 'Forking...' : 'Fork and complete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {filledSlots.map((slot) => (
        <div
          key={slot.id}
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[140px]"
        >
          {slot.quest ? (
            <>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-white text-sm line-clamp-2 flex-1">
                  {slot.quest.title}
                </h3>
                {isAdmin && (
                  <Link
                    href={`/admin/quests/${slot.quest.id}`}
                    className="shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-colors"
                    title="Edit quest config"
                  >
                    Edit
                  </Link>
                )}
              </div>
              {slot.steward && (
                <p className="text-zinc-400 text-xs mb-2">
                  Steward: {slot.steward.name}
                </p>
              )}
              <p className="text-zinc-500 text-xs line-clamp-2 flex-1 mb-3">
                {slot.quest.description}
              </p>

              {/* No steward: Take quest */}
              {!slot.stewardId && (
                <div className="flex flex-col gap-2">
                  {ritualSlotId === slot.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Name a belief or moment before you begin..."
                        value={ritualText}
                        onChange={(e) => setRitualText(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTake(slot.id, ritualText.trim() || undefined)}
                          disabled={!!taking}
                          className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {taking === slot.id ? 'Taking...' : 'Take with ritual'}
                        </button>
                        <button
                          onClick={() => handleTake(slot.id)}
                          disabled={!!taking}
                          className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition-colors"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => { setRitualSlotId(null); setRitualText('') }}
                          className="py-2 px-3 text-zinc-500 hover:text-zinc-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTake(slot.id)}
                        disabled={!!taking}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {taking === slot.id ? 'Taking...' : 'Take quest'}
                      </button>
                      <button
                        onClick={() => setRitualSlotId(slot.id)}
                        className="w-full py-1.5 px-3 text-zinc-500 hover:text-zinc-400 text-xs"
                      >
                        Take with ritual (optional)
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setAddQuestSlotId(addQuestSlotId === slot.id ? null : slot.id)}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Add quest (1v)
                  </button>
                </div>
              )}

              {/* Steward: 3-step flow */}
              {slot.stewardId && (
                <div className="flex flex-col gap-2">
                  {/* Step 1: Wake Up */}
                  {!slot.wakeUpAt && isSteward(slot) && (
                    <button
                      onClick={() => handleWakeUp(slot.id)}
                      disabled={!!wakingUp}
                      className="w-full py-2 px-4 bg-amber-700/60 hover:bg-amber-600/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg transition-colors"
                    >
                      {wakingUp === slot.id ? 'Recording...' : '1. Wake Up — I’ve read this'}
                    </button>
                  )}
                  {slot.wakeUpAt && isSteward(slot) && (
                    <p className="text-xs text-amber-400/80">✓ Wake Up</p>
                  )}

                  {/* Step 2: Clean Up */}
                  {slot.wakeUpAt && !slot.cleanUpAt && isSteward(slot) && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Name an inner obstacle..."
                        value={cleanUpReflection[slot.id] ?? ''}
                        onChange={(e) =>
                          setCleanUpReflection((prev) => ({
                            ...prev,
                            [slot.id]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded border border-zinc-700"
                      />
                      <button
                        onClick={() => handleCleanUp(slot.id)}
                        disabled={!!cleaningUp || !cleanUpReflection[slot.id]?.trim()}
                        className="w-full py-2 px-4 bg-amber-700/60 hover:bg-amber-600/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg transition-colors"
                      >
                        {cleaningUp === slot.id ? 'Recording...' : '2. Clean Up — Reflect'}
                      </button>
                    </div>
                  )}
                  {slot.cleanUpAt && isSteward(slot) && (
                    <p className="text-xs text-amber-400/80">✓ Clean Up</p>
                  )}

                  {/* Step 3: Complete */}
                  {isSteward(slot) && (
                    <button
                      onClick={() => handleComplete(slot.id)}
                      disabled={!!completing || !canComplete(slot)}
                      className={
                        canComplete(slot)
                          ? 'w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors'
                          : 'w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-500 text-sm font-medium rounded-lg transition-colors'
                      }
                    >
                      {completing === slot.id ? 'Completing...' : '3. Show Up — Complete'}
                    </button>
                  )}
                  {isSteward(slot) && (
                    <button
                      onClick={() => handleRelease(slot.id)}
                      disabled={!!releasing}
                      className="w-full py-1.5 px-3 text-zinc-500 hover:text-zinc-400 text-xs"
                    >
                      {releasing === slot.id ? 'Releasing...' : 'Release quest'}
                    </button>
                  )}

                  {/* Non-steward: Bid, Offer AID, Fork */}
                  {/* Non-steward: Bid, Offer AID, Fork */}
                  {slot.stewardId && !isSteward(slot) && (
                    <div className="flex flex-col gap-1.5">
                      {slot.bids?.some((b) => b.bidder.id === playerId) ? (
                        slot.bids
                          ?.filter((b) => b.bidder.id === playerId)
                          .map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center justify-between gap-2 py-1 px-2 bg-zinc-800/50 rounded text-xs"
                            >
                              <span className="text-zinc-400">Your bid: {b.amount}v</span>
                              <button
                                onClick={() => handleWithdrawBid(b.id)}
                                className="text-amber-400 hover:text-amber-300 text-xs"
                              >
                                Withdraw
                              </button>
                            </div>
                          ))
                      ) : (
                        <button
                          onClick={() => setBidSlotId(bidSlotId === slot.id ? null : slot.id)}
                          className="w-full py-1.5 px-3 bg-amber-900/40 hover:bg-amber-800/40 border border-amber-700/50 rounded text-xs text-amber-200"
                        >
                          Bid to take over
                        </button>
                      )}
                      <button
                        onClick={() => setAidSlotId(aidSlotId === slot.id ? null : slot.id)}
                        className="w-full py-1.5 px-3 bg-sky-900/40 hover:bg-sky-800/40 border border-sky-700/50 rounded text-xs text-sky-200"
                      >
                        Offer AID
                      </button>
                      <button
                        onClick={() => handleFork(slot.id, slot.quest!.id)}
                        disabled={!!forking}
                        className="w-full py-1.5 px-3 bg-zinc-800/60 hover:bg-zinc-700/60 rounded text-xs text-zinc-400 disabled:opacity-50"
                      >
                        {forking === slot.id ? 'Forking...' : 'Fork privately'}
                      </button>
                    </div>
                  )}

                  {/* Steward: pending AID offers */}
                  {isSteward(slot) && (slot.aidOffers?.length ?? 0) > 0 && (
                    <div className="space-y-1.5 border-t border-zinc-800 pt-2 mt-1">
                      <p className="text-xs text-zinc-500 font-medium">AID offers</p>
                      {slot.aidOffers?.map((o) => (
                        <div
                          key={o.id}
                          className="p-2 bg-zinc-800/50 rounded text-xs space-y-1"
                        >
                          <p className="text-zinc-300">
                            {o.offerer.name}: {o.message}
                            {o.linkedQuest && (
                              <span className="block mt-1 text-amber-400/90">
                                Quest: {o.linkedQuest.title}
                              </span>
                            )}
                            {o.expiresAt && (
                              <span className="block mt-1 text-zinc-500 text-[11px]">
                                {formatExpiry(o.expiresAt)}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptAid(o.id)}
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineAid(o.id)}
                              className="text-zinc-500 hover:text-zinc-400"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setAddQuestSlotId(addQuestSlotId === slot.id ? null : slot.id)}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Add quest (1v)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              Empty slot
            </div>
          )}
        </div>
      ))}
      </div>

      {/* Bid Modal */}
      {bidSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setBidSlotId(null)}
          />
          <div
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">Place bid</h3>
            <p className="text-zinc-500 text-xs mb-3">
              When the steward releases, highest bidder takes over. Your bid goes to the steward.
            </p>
            <input
              type="number"
              min={1}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 rounded border border-zinc-700 mb-3"
              placeholder="Amount (vibeulons)"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handlePlaceBid(bidSlotId)}
                disabled={!!bidding}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {bidding ? 'Placing...' : 'Place bid'}
              </button>
              <button
                onClick={() => setBidSlotId(null)}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer AID Modal */}
      {aidSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setAidSlotId(null)
              setAidMessage('')
              setAidType('direct')
              setAidLinkedQuestId(null)
              setAidQuestTitle('')
              setAidQuestDesc('')
            }}
          />
          <div
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">Offer AID</h3>
            <p className="text-zinc-500 text-xs mb-3">
              Send support to the steward. Direct: message only. Quest: create or link a quest to help unblock them (costs 1v).
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setAidType('direct')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  aidType === 'direct'
                    ? 'bg-sky-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Direct (message)
              </button>
              <button
                onClick={() => setAidType('quest')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  aidType === 'quest'
                    ? 'bg-sky-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Quest to unblock
              </button>
            </div>

            {aidType === 'quest' && (
              <div className="space-y-3 mb-3 p-3 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
                <p className="text-zinc-400 text-xs font-medium">Create or link a quest (1v to create)</p>
                {aidLinkedQuestId ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-amber-400 text-xs">Quest selected. Add a message below and send.</p>
                    <button
                      onClick={() => setAidLinkedQuestId(null)}
                      className="text-zinc-500 hover:text-zinc-400 text-xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Quest title"
                        value={aidQuestTitle}
                        onChange={(e) => setAidQuestTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={aidQuestDesc}
                        onChange={(e) => setAidQuestDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700 resize-none"
                      />
                      <button
                        onClick={() => handleCreateQuestForAid(aidSlotId)}
                        disabled={aidQuestLoading || !aidQuestTitle.trim()}
                        className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded"
                      >
                        {aidQuestLoading ? 'Creating...' : 'Create quest (1v)'}
                      </button>
                    </div>
                    {aidCampaignQuests.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-zinc-700">
                        <p className="text-zinc-500 text-xs">Or link existing:</p>
                        {aidCampaignQuests.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => setAidLinkedQuestId(q.id)}
                            className="block w-full text-left py-1.5 px-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded text-xs text-zinc-300 truncate"
                          >
                            {q.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <textarea
              value={aidMessage}
              onChange={(e) => setAidMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 rounded border border-zinc-700 resize-none mb-3"
              placeholder="I can support you by..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleOfferAid(aidSlotId)}
                disabled={aidLoading || !aidMessage.trim() || (aidType === 'quest' && !aidLinkedQuestId)}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
              >
                {aidLoading ? 'Sending...' : 'Send offer'}
              </button>
              <button
                onClick={() => {
                  setAidSlotId(null)
                  setAidMessage('')
                  setAidType('direct')
                  setAidLinkedQuestId(null)
                  setAidQuestTitle('')
                  setAidQuestDesc('')
                }}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Quest Modal */}
      {addQuestSlot && addQuestSlot.quest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeAddQuestModal}
          />
          <div
            className={`relative w-full bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden ${generatedPacket ? 'max-w-2xl' : 'max-w-md'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">
                Add quest to &quot;{addQuestSlot.quest.title}&quot;
              </h2>
              <p className="text-zinc-500 text-xs mt-1">Cost: 1 vibeulon per action</p>
            </div>

            <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Attach existing */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Attach existing quest</h3>
                {campaignQuests.length === 0 ? (
                  <p className="text-zinc-500 text-xs">
                    No campaign-tagged quests. Create a quest with campaign goal first.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {campaignQuests.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleAttach(addQuestSlot.id, q.id)}
                        disabled={attachLoading}
                        className="block w-full text-left py-2 px-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded text-xs text-zinc-300 truncate disabled:opacity-50"
                      >
                        {q.title}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Create new */}
              <section>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Create new quest</h3>
                <div className="space-y-3">
                  {addQuestSlot.quest.parentId === null && (
                    <div className="space-y-2 p-3 bg-zinc-800/30 rounded-lg">
                      <p className="text-zinc-400 text-xs">Quick subquest (under this container)</p>
                      <input
                        type="text"
                        placeholder="Title"
                        value={subquestTitle}
                        onChange={(e) => setSubquestTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                      />
                      <textarea
                        placeholder="Description"
                        value={subquestDesc}
                        onChange={(e) => setSubquestDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700 resize-none"
                      />
                      <button
                        onClick={() => handleAddSubquest(addQuestSlot.quest!.id)}
                        disabled={subquestLoading || !subquestTitle.trim()}
                        className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded"
                      >
                        {subquestLoading ? 'Creating...' : 'Create subquest'}
                      </button>
                    </div>
                  )}
                  <Link
                    href={`/quest/create?from=gameboard&questId=${addQuestSlot.quest.id}&slotId=${addQuestSlot.id}&campaignRef=${encodeURIComponent(campaignRef)}`}
                    className="block w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-center"
                  >
                    Full quest wizard →
                  </Link>
                  {isAdmin && !generatedPacket && (
                    <button
                      onClick={async () => {
                        setGenerateLoading(true)
                        try {
                          const { previewGameboardAlignedQuest } = await import(
                            '@/actions/gameboard'
                          )
                          const result = await previewGameboardAlignedQuest(
                            addQuestSlot.quest!.id,
                            campaignRef
                          )
                          if ('error' in result) {
                            alert(result.error)
                          } else {
                            setGeneratedPacket(result.packet)
                            setGeneratedUnpacking(result.unpacking)
                            setGenerationCount(1)
                            setAccepted(false)
                          }
                        } finally {
                          setGenerateLoading(false)
                        }
                      }}
                      disabled={generateLoading}
                      className="block w-full py-2 px-3 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-700/50 rounded text-xs text-amber-200 text-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {generateLoading
                        ? 'Generating... (30–90s)'
                        : 'Generate grammatical quest (admin)'}
                    </button>
                  )}
                </div>
              </section>

              {/* Hexagram display */}
              {isAdmin && generatedPacket && generatedUnpacking?.hexagramId && (
                <section className="flex items-center gap-4 p-3 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
                  <HexagramLines id={generatedUnpacking.hexagramId} />
                  <div className="flex-1">
                    <p className="text-yellow-400 text-sm font-semibold">
                      #{generatedUnpacking.hexagramId} {generatedUnpacking.hexagramName ?? 'Hexagram'}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">I Ching — influences tone and imagery</p>
                  </div>
                  <button
                    onClick={async () => {
                      setGenerateLoading(true)
                      try {
                        const { previewGameboardAlignedQuest } = await import('@/actions/gameboard')
                        const recast = await previewGameboardAlignedQuest(
                          addQuestSlot!.quest!.id,
                          campaignRef,
                          { priorUnpacking: { ...generatedUnpacking!, hexagramId: undefined, hexagramName: undefined } }
                        )
                        if ('error' in recast) {
                          alert(recast.error)
                        } else {
                          setGeneratedPacket(recast.packet)
                          setGeneratedUnpacking(recast.unpacking)
                          setGenerationCount((c) => c + 1)
                          setAccepted(false)
                        }
                      } finally {
                        setGenerateLoading(false)
                      }
                    }}
                    disabled={generateLoading || isRegenerating}
                    className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors disabled:opacity-40"
                  >
                    Recast
                  </button>
                </section>
              )}

              {/* Quest Preview / Review / Publish */}
              {isAdmin && generatedPacket && (
                <section>
                  <QuestOutlineReview
                    packet={generatedPacket}
                    accepted={accepted}
                    generationCount={generationCount}
                    isRegenerating={isRegenerating}
                    onAccept={() => setAccepted(true)}
                    onReset={() => {
                      setGeneratedPacket(null)
                      setGeneratedUnpacking(null)
                      setAccepted(false)
                      setGenerationCount(0)
                    }}
                    onRegenerate={async (feedback) => {
                      setIsRegenerating(true)
                      try {
                        logPrePublishFeedback({
                          feedback,
                          generationCount,
                          packetSignature: {
                            primaryChannel: generatedPacket.signature.primaryChannel,
                            moveType: generatedPacket.signature.moveType,
                            segment: generatedPacket.segmentVariant,
                          },
                        })

                        const { previewGameboardAlignedQuest } = await import(
                          '@/actions/gameboard'
                        )
                        const result = await previewGameboardAlignedQuest(
                          addQuestSlot!.quest!.id,
                          campaignRef,
                          { adminFeedback: feedback, priorUnpacking: generatedUnpacking! }
                        )
                        if ('error' in result) {
                          alert(result.error)
                        } else {
                          setGeneratedPacket(result.packet)
                          setGeneratedUnpacking(result.unpacking)
                          setGenerationCount((c) => c + 1)
                          setAccepted(false)
                        }
                      } finally {
                        setIsRegenerating(false)
                      }
                    }}
                  >
                    {accepted && (
                      <button
                        onClick={async () => {
                          setPublishLoading(true)
                          try {
                            const { publishGameboardQuestFromPreview } = await import(
                              '@/actions/gameboard'
                            )
                            const result = await publishGameboardQuestFromPreview(
                              generatedPacket!,
                              addQuestSlot!.quest!.id,
                              addQuestSlot!.id,
                              campaignRef
                            )
                            if ('error' in result) {
                              alert(result.error)
                            } else {
                              closeAddQuestModal()
                              window.location.reload()
                            }
                          } finally {
                            setPublishLoading(false)
                          }
                        }}
                        disabled={publishLoading}
                        className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {publishLoading ? 'Publishing...' : 'Add to gameboard'}
                      </button>
                    )}
                  </QuestOutlineReview>
                </section>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={closeAddQuestModal}
                className="w-full py-2 text-zinc-500 hover:text-zinc-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
