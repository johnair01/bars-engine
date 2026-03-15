'use client'

import Link from 'next/link'
import { use, useEffect, useState, useTransition } from 'react'
import { getNpcMemories, pruneNpcMemories, markMemoryCanon } from '@/actions/npc-memory'

type Memory = Awaited<ReturnType<typeof getNpcMemories>>[number]

const TYPE_COLORS: Record<string, string> = {
  scene: 'bg-blue-900/40 text-blue-300',
  relationship: 'bg-purple-900/40 text-purple-300',
  campaign: 'bg-amber-900/40 text-amber-300',
}

export default function NpcMemoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [memories, setMemories] = useState<Memory[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const load = () => {
    startTransition(async () => {
      const data = await getNpcMemories(
        id,
        undefined,
        typeFilter === 'all' ? undefined : typeFilter as 'scene' | 'relationship' | 'campaign'
      )
      setMemories(data)
    })
  }

  useEffect(() => { load() }, [id, typeFilter])

  const handlePrune = async () => {
    setMessage(null)
    await pruneNpcMemories(id)
    setMessage('Pruned — retention caps applied.')
    load()
  }

  const handleCanon = async (memoryId: string) => {
    setMessage(null)
    await markMemoryCanon(memoryId)
    setMessage('Memory marked as canon — exempt from pruning.')
    load()
  }

  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    const key = m.memoryType
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <Link href={`/admin/npcs/${id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Back to Constitution
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">NPC Memories</h1>
            <p className="text-zinc-400 text-sm mt-1">Caps: 10 scene · 5 relationship · 3 campaign per player. Canon memories are exempt.</p>
          </div>
          <button
            onClick={handlePrune}
            disabled={isPending}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Apply Retention Caps
          </button>
        </div>
        {message && (
          <div className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm">{message}</div>
        )}
      </header>

      <div className="flex gap-2 items-center">
        <label className="text-sm text-zinc-400">Type:</label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All</option>
          <option value="scene">Scene</option>
          <option value="relationship">Relationship</option>
          <option value="campaign">Campaign</option>
        </select>
        {isPending && <span className="text-xs text-zinc-500 italic">Loading…</span>}
      </div>

      {Object.entries(grouped).map(([type, mems]) => (
        <div key={type}>
          <h2 className="text-sm font-bold text-zinc-400 mb-2 capitalize">{type} Memories ({mems.length})</h2>
          <div className="space-y-2">
            {mems.map((m) => {
              let tags: string[] = []
              try { tags = JSON.parse(m.tags) } catch { /* skip */ }

              return (
                <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[m.memoryType] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {m.memoryType}
                      </span>
                      {m.isCanon && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300">canon</span>
                      )}
                      {tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{t}</span>
                      ))}
                    </div>
                    <p className="text-sm text-zinc-300">{m.summary}</p>
                    <p className="text-xs text-zinc-600 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!m.isCanon && (
                    <button
                      onClick={() => handleCanon(m.id)}
                      className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors shrink-0 pt-1"
                    >
                      Mark Canon
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {memories.length === 0 && !isPending && (
        <div className="text-zinc-600 text-sm italic py-8 text-center">
          No memories found for this NPC.
        </div>
      )}
    </div>
  )
}
