'use client'

import { useState, useCallback } from 'react'

export interface GuidancePanelProps {
  flowId: string
  nodeId: string
  role?: 'librarian' | 'collaborator' | 'witness'
  visited?: string[]
  events?: string[]
  /** Optional: hide when guidance indicates node not found or error */
  hideOnError?: boolean
}

interface GuidanceResponse {
  role_id: string
  role_name: string
  message: string
  suggested_actions?: Array<{ label: string; target_id: string }>
  allowed: boolean
}

/**
 * Single-player companionship: "Ask Librarian" (or Collaborator/Witness) panel.
 * Fetches simulated actor guidance and displays with clear "(simulated)" labeling.
 * @see .specify/specs/npc-simulated-player-content-ecology/spec.md
 */
export function GuidancePanel({
  flowId,
  nodeId,
  role = 'librarian',
  visited,
  events,
  hideOnError = true,
}: GuidancePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuidance = useCallback(async () => {
    if (!flowId || !nodeId) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        flowId,
        nodeId,
        role,
      })
      if (visited?.length) params.set('visited', visited.join(','))
      if (events?.length) params.set('events', events.join(','))
      const res = await fetch(`/api/guidance?${params}`)
      const data = (await res.json()) as GuidanceResponse | { error?: string }
      if (!res.ok) {
        const err = 'error' in data ? data.error : 'Failed to load guidance'
        setError(err ?? 'Failed to load guidance')
        if (hideOnError) setGuidance(null)
        return
      }
      const g = data as GuidanceResponse
      if (hideOnError && !g.allowed && g.message?.includes('not found')) {
        setGuidance(null)
        return
      }
      setGuidance(g)
      setExpanded(true)
    } catch (e) {
      setError('Could not load guidance')
      if (!hideOnError) setGuidance(null)
    } finally {
      setLoading(false)
    }
  }, [flowId, nodeId, role, visited, events, hideOnError])

  const roleLabel = role === 'librarian' ? 'Librarian' : role === 'collaborator' ? 'Collaborator' : 'Witness'

  return (
    <div className="mt-4 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
      {!expanded && !guidance ? (
        <button
          type="button"
          onClick={fetchGuidance}
          disabled={loading}
          className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors flex items-center justify-between gap-2"
        >
          <span>
            {loading ? 'Loading...' : `Ask ${roleLabel} (simulated)`}
          </span>
          <span className="text-xs text-zinc-500">Single-player companionship</span>
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {guidance?.role_name ?? roleLabel} (simulated)
            </span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Collapse
            </button>
          </div>
          {error && (
            <p className="text-amber-500/80 text-sm">{error}</p>
          )}
          {guidance && !error && (
            <>
              <p className="text-zinc-300 text-sm">{guidance.message}</p>
              {guidance.suggested_actions && guidance.suggested_actions.length > 0 && (
                <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
                  {guidance.suggested_actions.map((a, i) => (
                    <li key={i}>{a.label}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
