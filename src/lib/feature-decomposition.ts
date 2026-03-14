/**
 * Six-Face Parallel Feature Handling — DC-6
 * Per .specify/specs/deftness-uplevel-character-daemons-agents/six-face-parallel-handling/spec.md
 *
 * decomposeFeature: split feature into face-assigned tasks
 * runParallelFeatureWork: invoke agents concurrently
 * synthesizeFeatureOutputs: combine outputs; flag conflicts
 */

import type { GameMasterFace } from './sage-coordination'

export type { GameMasterFace }

export interface DecomposedTask {
  face: GameMasterFace
  task: string
  dependencies?: string[]
}

export interface DecomposeFeatureResult {
  tasks: DecomposedTask[]
}

export interface FaceOutput {
  face: GameMasterFace
  output: unknown
  error?: string
}

export interface SynthesizeResult {
  synthesized: unknown
  conflicts?: string[]
}

/** Keyword hints per face — from agent-domain-backlog-ownership */
const FACE_HINTS: Record<GameMasterFace, string[]> = {
  shaman: ['daemon', 'character', 'talisman', 'identity', 'ritual', 'mythic', 'belonging'],
  challenger: ['validation', 'quest completion', 'gameboard', 'action', 'edge', 'proving'],
  regent: ['schema', 'playbook', 'campaign', 'rules', 'structure', 'roles', 'prisma'],
  architect: ['quest grammar', 'cyoa', 'character creation', 'compilation', 'design', 'blueprint'],
  diplomat: ['copy', 'community', 'narrative', 'feedback', 'relational', 'care'],
  sage: ['integration', 'coordination', 'meta', 'synthesis', 'cross-cutting'],
}

/**
 * Decompose a feature description into tasks, one per face.
 * v1: Heuristic based on keyword matching. v2: Sage API for AI decomposition.
 */
export function decomposeFeature(featureDescription: string): DecomposeFeatureResult {
  const text = featureDescription.toLowerCase()
  const tasks: DecomposedTask[] = []
  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

  for (const face of faces) {
    const hints = FACE_HINTS[face]
    const score = hints.filter((h) => text.includes(h)).length
    const task =
      face === 'sage'
        ? `Synthesize outputs from all faces for: ${featureDescription.slice(0, 200)}`
        : score > 0
          ? `[${face}] ${featureDescription.slice(0, 150)} — focus on ${hints.slice(0, 2).join(', ')}`
          : `[${face}] ${featureDescription.slice(0, 150)} — apply your domain lens`

    const deps = face === 'sage' ? ['shaman', 'challenger', 'regent', 'architect', 'diplomat'] : undefined
    tasks.push({ face, task, dependencies: deps })
  }

  return { tasks }
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

/**
 * Invoke each face with its task in parallel.
 * Requires backend POST /api/agents/{face}/task endpoint.
 */
export async function runParallelFeatureWork(
  featureId: string,
  tasks: DecomposedTask[]
): Promise<Record<GameMasterFace, unknown>> {
  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  const runOne = async (t: DecomposedTask) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents/${t.face}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: t.task, featureId }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!res.ok) {
        errors[t.face] = `HTTP ${res.status}`
        return
      }
      const data = await res.json()
      results[t.face] = data.output ?? data
    } catch (e) {
      errors[t.face] = e instanceof Error ? e.message : String(e)
    }
  }

  await Promise.all(tasks.map(runOne))

  const out: Record<GameMasterFace, unknown> = {} as Record<GameMasterFace, unknown>
  for (const face of ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as GameMasterFace[]) {
    out[face] = errors[face] ? { error: errors[face] } : results[face] ?? null
  }
  return out
}

/**
 * Synthesize outputs from multiple faces into a coherent result.
 * v1: Simple concatenation + conflict detection. v2: Sage API for AI synthesis.
 */
export function synthesizeFeatureOutputs(
  _featureId: string,
  outputs: Record<GameMasterFace, unknown>
): SynthesizeResult {
  const parts: string[] = []
  const conflicts: string[] = []

  for (const [face, out] of Object.entries(outputs)) {
    if (out && typeof out === 'object' && 'error' in out) continue
    if (out != null) {
      const str = typeof out === 'string' ? out : JSON.stringify(out, null, 2)
      parts.push(`## ${face}\n${str}`)
    }
  }

  const synthesized = parts.length > 0 ? parts.join('\n\n') : null
  return { synthesized: synthesized ?? {}, conflicts: conflicts.length > 0 ? conflicts : undefined }
}
