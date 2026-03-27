'use client'

import { getNpcConstitution } from '@/actions/npc-constitution'
import Link from 'next/link'
import { useEffect, useState, useTransition, use } from 'react'

type Npc = NonNullable<Awaited<ReturnType<typeof getNpcConstitution>>>

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/30',
  draft: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  suspended: 'bg-amber-900/50 text-amber-300 border-amber-700/30',
  archived: 'bg-red-900/50 text-red-400 border-red-700/30',
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { parsed = value }
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1 font-mono">{label}</p>
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-auto max-h-48">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  )
}

/**
 * @page /admin/npcs/:npcId
 * @entity NPC
 * @description NPC constitution detail with status, tier, role, location, governance, and JSON configuration
 * @permissions admin
 * @params npcId:string (path, required)
 * @relationships LINKED_TO (memories, reflections)
 * @dimensions WHO:admin, WHAT:NPC, WHERE:currentLocation, PERSONAL_THROUGHPUT:wake-up
 * @example /admin/npcs/npc_123
 * @agentDiscoverable false
 */
export default function NpcConstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [npc, setNpc] = useState<Npc | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionResult, setActionResult] = useState<string | null>(null)

  const load = () => {
    startTransition(async () => {
      const data = await getNpcConstitution(id)
      setNpc(data ?? null)
    })
  }

  useEffect(() => { load() }, [id])

  const handleActivate = async () => {
    setActionResult(null)
    const res = await fetch(`/api/npc-constitutions/${id}/activate`, { method: 'POST' })
    const json = await res.json() as { activated?: boolean; error?: string }
    setActionResult(json.activated ? 'Activated successfully.' : `Error: ${json.error}`)
    load()
  }

  const handleSuspend = async () => {
    const reason = prompt('Suspension reason:')
    if (!reason) return
    setActionResult(null)
    const res = await fetch(`/api/npc-constitutions/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const json = await res.json() as { suspended?: boolean; error?: string }
    setActionResult(json.suspended ? 'Suspended.' : `Error: ${json.error}`)
    load()
  }

  const handleValidate = async () => {
    setActionResult(null)
    const res = await fetch(`/api/npc-constitutions/${id}/validate`, { method: 'POST' })
    const json = await res.json() as { valid?: boolean; errors?: string[]; warnings?: string[] }
    if (json.valid) {
      setActionResult(`Valid. ${json.warnings?.length ? `Warnings: ${json.warnings.join('; ')}` : ''}`)
    } else {
      setActionResult(`Invalid: ${json.errors?.join('; ')}`)
    }
  }

  if (!npc && !isPending) return (
    <div className="text-zinc-600 text-sm italic py-16 text-center">NPC not found.</div>
  )
  if (!npc) return (
    <div className="text-zinc-600 text-sm italic py-16 text-center">Loading…</div>
  )

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <Link href="/admin/npcs" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← NPC Constitutions
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white">{npc.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[npc.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {npc.status}
              </span>
              <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400 font-mono">
                Tier {npc.tier} · v{npc.constitutionVersion}
              </span>
            </div>
            <p className="text-zinc-400 mt-1">{npc.archetypalRole}</p>
            <p className="text-xs text-zinc-600 mt-1">Location: {npc.currentLocation} · Governed by: {npc.governedBy}</p>
          </div>

          {/* Regent Controls */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleValidate}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
            >
              Validate
            </button>
            {npc.status !== 'active' && npc.status !== 'archived' && (
              <button
                onClick={handleActivate}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm"
              >
                Activate
              </button>
            )}
            {npc.status === 'active' && (
              <button
                onClick={handleSuspend}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm"
              >
                Suspend
              </button>
            )}
            <Link
              href={`/admin/npcs/${id}/reflections`}
              className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg text-sm border border-purple-700/30"
            >
              Reflections
            </Link>
            <Link
              href={`/admin/npcs/${id}/memories`}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm"
            >
              Memories
            </Link>
          </div>
        </div>

        {actionResult && (
          <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${actionResult.startsWith('Error') || actionResult.startsWith('Invalid') ? 'bg-red-900/30 text-red-300' : 'bg-emerald-900/30 text-emerald-300'}`}>
            {actionResult}
          </div>
        )}
      </header>

      {/* Constitution Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <JsonBlock label="identity" value={npc.identity} />
        <JsonBlock label="values" value={npc.values} />
        <JsonBlock label="function" value={npc.function} />
        <JsonBlock label="limits" value={npc.limits} />
        <JsonBlock label="memoryPolicy" value={npc.memoryPolicy} />
        <JsonBlock label="reflectionPolicy" value={npc.reflectionPolicy} />
      </div>

      {/* Linked Adventures */}
      <div>
        <p className="text-xs text-zinc-500 mb-1 font-mono">linkedAdventures</p>
        <p className="text-sm text-zinc-400 font-mono">{npc.linkedAdventures || '[]'}</p>
      </div>

      {/* Version History */}
      {npc.versions.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-zinc-400 mb-2">Latest Version</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-500 font-mono">
            v{npc.versions[0].version} · by {npc.versions[0].changedBy} · {new Date(npc.versions[0].createdAt).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Approved Reflections Preview */}
      {npc.reflections.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-zinc-400 mb-2">Recent Approved Reflections</h2>
          <div className="space-y-2">
            {npc.reflections.map((r) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">{r.inputSummary}</p>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(r.outputs), null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
