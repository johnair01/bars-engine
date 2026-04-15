'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createDaemonSeedFromBar,
  convertBarChargeToVibeulon,
  allocateBarChargeToQuest,
  attachBarToQuest,
  attachBarToBar,
} from '@/actions/charge-routing'
import { getLinkableQuests } from '@/actions/create-bar'

type ChargeRoutingPanelProps = {
  barId: string
  barTitle: string
  chargeAmount: number
}

export function ChargeRoutingPanel({ barId, barTitle, chargeAmount }: ChargeRoutingPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'menu' | 'daemon' | 'quest' | 'attach-bar'>('menu')
  const [daemonName, setDaemonName] = useState('')
  const [daemonDesc, setDaemonDesc] = useState('')
  const [quests, setQuests] = useState<Array<{ id: string; title: string }>>([])
  const [selectedQuestId, setSelectedQuestId] = useState('')
  const [targetBarId, setTargetBarId] = useState('')
  const [amount, setAmount] = useState(chargeAmount)

  const loadQuests = () => {
    if (quests.length > 0) return
    getLinkableQuests().then(setQuests)
  }

  const handleDaemonSeed = () => {
    setError(null)
    startTransition(async () => {
      const res = await createDaemonSeedFromBar(barId, daemonName || barTitle, daemonDesc)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(`/daemon-seeds/${res.data.daemonSeedId}`)
      router.refresh()
    })
  }

  const handleConvertVibeulon = () => {
    setError(null)
    startTransition(async () => {
      const res = await convertBarChargeToVibeulon(barId, amount)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const handleAllocateToQuest = () => {
    if (!selectedQuestId) return
    setError(null)
    startTransition(async () => {
      const res = await allocateBarChargeToQuest(barId, selectedQuestId, amount)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const handleAttachToQuest = () => {
    if (!selectedQuestId) return
    setError(null)
    startTransition(async () => {
      const res = await attachBarToQuest(barId, selectedQuestId)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const handleAttachToBar = () => {
    if (!targetBarId.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await attachBarToBar(barId, targetBarId.trim())
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  if (mode === 'daemon') {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-white">Turn into Daemon Seed</h3>
        <input
          type="text"
          value={daemonName}
          onChange={(e) => setDaemonName(e.target.value)}
          placeholder={`Name (default: "${barTitle.slice(0, 40)}...")`}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
        />
        <textarea
          value={daemonDesc}
          onChange={(e) => setDaemonDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500 resize-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('menu')}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
          >
            Back
          </button>
          <button
            onClick={handleDaemonSeed}
            disabled={isPending}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create Daemon Seed'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'quest') {
    loadQuests()
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-white">Route to Quest</h3>
        <p className="text-sm text-zinc-400">Allocate charge or attach as context.</p>
        <select
          value={selectedQuestId}
          onChange={(e) => setSelectedQuestId(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Select a quest…</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={chargeAmount}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Math.min(chargeAmount, Number(e.target.value) || 1)))}
            className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white"
          />
          <span className="text-zinc-400 self-center text-sm">amount</span>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode('menu')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm">
            Back
          </button>
          <button
            onClick={handleAllocateToQuest}
            disabled={isPending || !selectedQuestId}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isPending ? '…' : 'Allocate to Quest'}
          </button>
          <button
            onClick={handleAttachToQuest}
            disabled={isPending || !selectedQuestId}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Attach as Context
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'attach-bar') {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-white">Attach to another BAR</h3>
        <input
          type="text"
          value={targetBarId}
          onChange={(e) => setTargetBarId(e.target.value)}
          placeholder="Paste BAR ID"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500 font-mono text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setMode('menu')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm">
            Back
          </button>
          <button
            onClick={handleAttachToBar}
            disabled={isPending || !targetBarId.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isPending ? '…' : 'Attach'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-white">Route this charge</h3>
      <p className="text-sm text-zinc-400">
        Charge amount: {chargeAmount}. Choose where to send it.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('daemon')}
          className="px-4 py-3 bg-amber-900/40 border border-amber-500/50 hover:bg-amber-900/60 text-amber-200 rounded-lg text-sm font-medium text-left"
        >
          Turn into Daemon Seed
        </button>
        <button
          onClick={handleConvertVibeulon}
          disabled={isPending}
          className="px-4 py-3 bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-900/60 text-emerald-200 rounded-lg text-sm font-medium text-left disabled:opacity-50"
        >
          {isPending ? '…' : 'Convert to Vibeulon'}
        </button>
        <button
          onClick={() => setMode('quest')}
          className="px-4 py-3 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-900/60 text-purple-200 rounded-lg text-sm font-medium text-left col-span-2"
        >
          Allocate or Attach to Quest
        </button>
        <button
          onClick={() => setMode('attach-bar')}
          className="px-4 py-3 bg-cyan-900/40 border border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-200 rounded-lg text-sm font-medium text-left col-span-2"
        >
          Attach to another BAR
        </button>
      </div>
    </div>
  )
}
