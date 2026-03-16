'use client'

import { useEffect, useState } from 'react'
import type { AgentData } from '@/lib/spatial-world/pixi-room'
import { getAgentBars } from '@/actions/intent-agents'
import { claimPublicBar } from '@/actions/world-anchors'

type BarItem = { id: string; title: string; description: string; type: string }
type QuestItem = { id: string; title: string; description: string }

type Props = {
  agent: AgentData
  onClose: () => void
}

export function IntentAgentPanel({ agent, onClose }: Props) {
  const [bars, setBars] = useState<BarItem[]>([])
  const [quests, setQuests] = useState<QuestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimed, setClaimed] = useState<Set<string>>(new Set())

  useEffect(() => {
    void getAgentBars(agent.playerId).then(data => {
      setBars(data.bars)
      setQuests(data.quests)
      setLoading(false)
    })
  }, [agent.playerId])

  async function handleClaim(barId: string) {
    setClaiming(barId)
    try {
      await claimPublicBar(barId)
      setClaimed(prev => new Set(prev).add(barId))
    } catch (e) {
      console.error(e)
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <p className="text-white font-bold">{agent.playerName}</p>
          <p className="text-zinc-500 text-xs">Intent Agent</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <p className="text-zinc-500 text-sm">Loading…</p>
        ) : (
          <>
            <section>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Public BARs</h3>
              {bars.length === 0 ? (
                <p className="text-zinc-600 text-sm">No public BARs</p>
              ) : (
                <ul className="space-y-2">
                  {bars.map(b => (
                    <li key={b.id} className="bg-zinc-800 rounded p-3 space-y-1">
                      <p className="text-white text-sm font-medium">{b.title}</p>
                      <p className="text-zinc-400 text-xs">{b.description}</p>
                      <button
                        onClick={() => handleClaim(b.id)}
                        disabled={!!claiming || claimed.has(b.id)}
                        className="text-xs bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-0.5 rounded mt-1"
                      >
                        {claimed.has(b.id) ? 'Claimed' : claiming === b.id ? '…' : 'Claim'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Quests</h3>
              {quests.length === 0 ? (
                <p className="text-zinc-600 text-sm">No active quests</p>
              ) : (
                <ul className="space-y-2">
                  {quests.map(q => (
                    <li key={q.id} className="bg-zinc-800 rounded p-3">
                      <p className="text-white text-sm font-medium">{q.title}</p>
                      <p className="text-zinc-400 text-xs mt-1">{q.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
