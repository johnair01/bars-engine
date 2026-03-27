'use client'

import Link from 'next/link'
import { use, useEffect, useState, useTransition } from 'react'

interface Reflection {
  id: string
  inputSummary: string
  outputs: string
  status: string
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-300',
  approved: 'bg-emerald-900/50 text-emerald-300',
  rejected: 'bg-red-900/50 text-red-400',
}

/**
 * @page /admin/npcs/:npcId/reflections
 * @entity NPC
 * @description NPC reflection management with status filtering, approve/reject actions, and review tracking
 * @permissions admin
 * @params npcId:string (path, required)
 * @relationships CONTAINS (NPC reflections by status)
 * @dimensions WHO:admin, WHAT:NPC, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/npcs/npc_123/reflections
 * @agentDiscoverable false
 */
export default function NpcReflectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [isPending, startTransition] = useTransition()
  const [actionResult, setActionResult] = useState<{ id: string; message: string } | null>(null)

  const load = () => {
    startTransition(async () => {
      const res = await fetch(`/api/npc-constitutions/${id}/reflections?status=${statusFilter}`)
      const data = await res.json() as Reflection[]
      setReflections(Array.isArray(data) ? data : [])
    })
  }

  useEffect(() => { load() }, [id, statusFilter])

  const handleReview = async (reflectionId: string, action: 'approve' | 'reject') => {
    const notes = action === 'reject' ? (prompt('Rejection notes (optional):') ?? undefined) : undefined
    const res = await fetch(`/api/npc-reflections/${reflectionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    })
    const json = await res.json() as { id?: string; error?: string }
    setActionResult({
      id: reflectionId,
      message: json.error ? `Error: ${json.error}` : `${action === 'approve' ? 'Approved' : 'Rejected'}.`,
    })
    load()
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <Link href={`/admin/npcs/${id}`} className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Back to Constitution
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">Reflection Review Queue</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Regent reviews pending reflections before they influence NPC dialogue.
        </p>
      </header>

      <div className="flex gap-2 items-center">
        <label className="text-sm text-zinc-400">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {isPending && <span className="text-xs text-zinc-500 italic">Loading…</span>}
      </div>

      <div className="space-y-4">
        {reflections.map((r) => {
          let outputs: Record<string, unknown> = {}
          try { outputs = JSON.parse(r.outputs) } catch { /* skip */ }
          const isResult = actionResult?.id === r.id

          return (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                  {r.status}
                </span>
                <span className="text-xs text-zinc-600 font-mono">
                  {new Date(r.createdAt).toLocaleDateString()}
                  {r.reviewedBy && ` · reviewed by ${r.reviewedBy.slice(0, 8)}…`}
                </span>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Input Summary</p>
                <p className="text-sm text-zinc-300">{r.inputSummary}</p>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Outputs</p>
                <pre className="text-xs text-zinc-400 bg-zinc-950 rounded-lg p-3 overflow-auto max-h-40">
                  {JSON.stringify(outputs, null, 2)}
                </pre>
              </div>

              {isResult && (
                <p className={`text-sm ${actionResult.message.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                  {actionResult.message}
                </p>
              )}

              {r.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleReview(r.id, 'approve')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(r.id, 'reject')}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg text-sm border border-red-700/30"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {reflections.length === 0 && !isPending && (
          <div className="text-zinc-600 text-sm italic py-8 text-center">
            No {statusFilter} reflections.
          </div>
        )}
      </div>
    </div>
  )
}
