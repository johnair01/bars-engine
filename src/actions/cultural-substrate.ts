'use server'

/**
 * cultural-substrate.ts
 *
 * "Inverse book-analyze" pipeline.
 * Reads exemplary community BARs, groups them by dimension cluster
 * (moveType × archetype × allyshipDomain), calls AI on each cluster, and
 * stores DistillationCandidate records for human review.
 *
 * Flow:
 *   exemplary CustomBars → cluster by dimensions → AI distillation → DistillationCandidate rows
 *
 * Contrast with book-analyze:
 *   external text → quest BARs → DB   (inward)
 *   player BARs → card language candidates → human approval → deck templates   (outward)
 */

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getOpenAI } from '@/lib/openai'
import { z } from 'zod'
import { generateObjectWithCache } from '@/lib/ai-with-cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DistillationResult =
  | {
      success: true
      runId: string
      clustersProcessed: number
      candidatesCreated: number
      skippedClusters: number
    }
  | { error: string }

type ExemplaryBar = {
  id: string
  title: string
  description: string
  moveType: string | null
  archetype: string | null
  allyshipDomain: string | null
  nationKey: string | null // mapped from `nation` column
}

type ClusterKey = string // `${moveType}||${archetype}||${allyshipDomain}`

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

// ---------------------------------------------------------------------------
// Model selection (mirrors book-analyze pattern)
// ---------------------------------------------------------------------------

function getDistillationModel(): string {
  return process.env.BOOK_ANALYSIS_MODEL || 'gpt-4o-mini'
}

// ---------------------------------------------------------------------------
// Zod schema for AI output
// ---------------------------------------------------------------------------

const distillationOutputSchema = z.object({
  secondRegisterName: z
    .string()
    .describe(
      '2-5 word compression phrase extracted from the authentic language of these BARs. Must fire a felt sense before conscious processing. Portland-register, not motivational-poster language.'
    ),
  internalExpr: z
    .string()
    .describe(
      'I-register expression: somatic/psychic experience, first or second person, embodied. What it feels like inside when doing this move.'
    ),
  interpersonalExpr: z
    .string()
    .describe(
      'We-register expression: what changes between people. Relational texture visible to those involved.'
    ),
  systemicExpr: z
    .string()
    .describe(
      'Its-register expression: community-visible impact. What an outside observer would name as the effect.'
    ),
  episodeTitleCandidate: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Optional mythic episode title (e.g. "After the Rain", "The Day We Held the Line"). Null if nothing strong emerged.'
    ),
  reasoning: z
    .string()
    .describe(
      'Why this name — which words or phrases came directly from the BARs, what language patterns you detected across entries.'
    ),
})

type DistillationOutput = z.infer<typeof distillationOutputSchema>

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const DISTILLATION_SYSTEM_PROMPT = `You are analyzing a cluster of real player BARs (Behavior-Action-Result logs) from a Portland allyship community playing BARs Engine. Your job is to distill the authentic language of this community into a compression phrase and three contextual expressions for the move type these BARs represent.

The compression phrase ("second-register name") must:
- Come from the BARs themselves — extract real phrases, word choices, or emotional textures that appeared across multiple entries
- Be 2-5 words that fire a felt sense before the reader consciously processes it
- Sound like it could have been said in a Portland organizing meeting, somatic practice session, or community circle
- NOT be AI-synthesized generic language or motivational phrases

The three expressions (I/We/Its) describe what this move type feels like:
- I (internal): somatic/psychic experience, first or second person, embodied
- We (interpersonal): what changes between people
- Its (systemic): community-visible impact, what an observer would name`

function buildDistillationPrompt(
  moveType: string | null,
  archetype: string | null,
  allyshipDomain: string | null,
  bars: ExemplaryBar[]
): string {
  const barList = bars
    .map((b, i) => {
      const desc = b.description?.trim() ? `\n   ${b.description.trim()}` : ''
      return `${i + 1}. ${b.title}${desc}`
    })
    .join('\n')

  return `Move type: ${moveType ?? 'various'}
Archetype: ${archetype ?? 'various'}
Domain: ${allyshipDomain ?? 'various'}

Player BARs (${bars.length} entries):
${barList}

Extract the authentic language of this community. What phrase captures the essence of what these players were actually doing? What words did they use that you could lift and compress?`
}

// ---------------------------------------------------------------------------
// Clustering
// ---------------------------------------------------------------------------

function buildClusterKey(
  moveType: string | null,
  archetype: string | null,
  allyshipDomain: string | null
): ClusterKey {
  return `${moveType ?? ''}||${archetype ?? ''}||${allyshipDomain ?? ''}`
}

function parseClusterKey(key: ClusterKey): {
  moveType: string | null
  archetype: string | null
  allyshipDomain: string | null
} {
  const [moveType, archetype, allyshipDomain] = key.split('||')
  return {
    moveType: moveType || null,
    archetype: archetype || null,
    allyshipDomain: allyshipDomain || null,
  }
}

function groupIntoClusters(bars: ExemplaryBar[]): Map<ClusterKey, ExemplaryBar[]> {
  const clusters = new Map<ClusterKey, ExemplaryBar[]>()
  for (const bar of bars) {
    const key = buildClusterKey(bar.moveType, bar.archetype, bar.allyshipDomain)
    const existing = clusters.get(key) ?? []
    existing.push(bar)
    clusters.set(key, existing)
  }
  return clusters
}

// ---------------------------------------------------------------------------
// Core distillation runner
// ---------------------------------------------------------------------------

/**
 * Run the cultural substrate distillation pipeline.
 *
 * Loads all exemplary BARs, clusters them by moveType × archetype × allyshipDomain,
 * calls AI on each cluster above minClusterSize, and stores DistillationCandidate rows.
 *
 * @param options.minClusterSize  Minimum BARs per cluster before running AI (default: 3)
 * @param options.maxClusters     Maximum clusters to process in one run (default: 10)
 */
export async function runDistillation(options?: {
  minClusterSize?: number
  maxClusters?: number
}): Promise<DistillationResult> {
  await requireAdmin()

  const minClusterSize = options?.minClusterSize ?? 3
  const maxClusters = options?.maxClusters ?? 10

  try {
    // 1. Load all exemplary active BARs
    const rawBars = await db.customBar.findMany({
      where: { isExemplar: true, status: 'active' },
      select: {
        id: true,
        title: true,
        description: true,
        moveType: true,
        archetype: true,
        allyshipDomain: true,
        nation: true, // the schema column is `nation`, we expose it as nationKey
      },
    })

    if (rawBars.length === 0) {
      return { error: 'No exemplary BARs found. Mark BARs as exemplary first.' }
    }

    // Map `nation` → `nationKey` to match the DistillationCandidate schema vocabulary
    const bars: ExemplaryBar[] = rawBars.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      moveType: b.moveType ?? null,
      archetype: b.archetype ?? null,
      allyshipDomain: b.allyshipDomain ?? null,
      nationKey: b.nation ?? null,
    }))

    // 2. Cluster
    const allClusters = groupIntoClusters(bars)

    // Partition into qualifying and skipped
    const qualifyingEntries: [ClusterKey, ExemplaryBar[]][] = []
    let skippedClusters = 0

    for (const [key, clusterBars] of allClusters) {
      if (clusterBars.length < minClusterSize) {
        skippedClusters++
      } else {
        qualifyingEntries.push([key, clusterBars])
      }
    }

    if (qualifyingEntries.length === 0) {
      return {
        error: `No clusters meet minimum size. Need at least ${minClusterSize} exemplary BARs per dimension.`,
      }
    }

    // Limit to maxClusters
    const clustersToProcess = qualifyingEntries.slice(0, maxClusters)
    skippedClusters += qualifyingEntries.length - clustersToProcess.length

    const runId = crypto.randomUUID()
    const modelId = getDistillationModel()
    let candidatesCreated = 0
    let clustersProcessed = 0

    // 3. Process each cluster
    for (const [key, clusterBars] of clustersToProcess) {
      const { moveType, archetype, allyshipDomain } = parseClusterKey(key)

      try {
        const sourceBarIds = clusterBars.map((b) => b.id)

        // Use a stable input key so repeated runs on the same cluster hit cache
        const inputKey = [
          'distillation',
          key,
          sourceBarIds.sort().join(','),
        ].join(':')

        const result = await generateObjectWithCache<DistillationOutput>({
          feature: 'cultural_substrate_distillation',
          inputKey,
          model: modelId,
          schema: distillationOutputSchema,
          system: DISTILLATION_SYSTEM_PROMPT,
          prompt: buildDistillationPrompt(moveType, archetype, allyshipDomain, clusterBars),
          getModel: () => getOpenAI()(modelId),
        })

        const output = result.object

        // Derive nationKey from cluster: use the most common nation among source BARs,
        // or null when they're mixed. This gives the candidate a nation hint without
        // fabricating one when the cluster is cross-nation.
        const nationCounts = new Map<string, number>()
        for (const b of clusterBars) {
          if (b.nationKey) nationCounts.set(b.nationKey, (nationCounts.get(b.nationKey) ?? 0) + 1)
        }
        const dominantNation =
          nationCounts.size === 1
            ? [...nationCounts.keys()][0]
            : nationCounts.size > 1
            ? [...nationCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
            : null
        // Only set nationKey when all BARs share the same nation (unambiguous)
        const clusterNationKey = nationCounts.size === 1 ? dominantNation : null

        await db.distillationCandidate.create({
          data: {
            moveType,
            archetype,
            allyshipDomain,
            nationKey: clusterNationKey,
            sourceBarIds: JSON.stringify(sourceBarIds),
            clusterSize: clusterBars.length,
            secondRegisterName: output.secondRegisterName,
            internalExpr: output.internalExpr,
            interpersonalExpr: output.interpersonalExpr,
            systemicExpr: output.systemicExpr,
            episodeTitleCandidate: output.episodeTitleCandidate ?? null,
            aiReasoning: output.reasoning,
            status: 'pending',
            runId,
          },
        })

        candidatesCreated++
        clustersProcessed++
      } catch (e) {
        // Per-cluster errors are isolated — log and continue
        console.error(
          `[DISTILLATION] Cluster "${key}" failed:`,
          e instanceof Error ? e.message : e
        )
      }
    }

    revalidatePath('/admin/cultural-substrate')

    return {
      success: true,
      runId,
      clustersProcessed,
      candidatesCreated,
      skippedClusters,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Distillation failed'
    console.error('[DISTILLATION] runDistillation error:', msg)
    return { error: msg }
  }
}

// ---------------------------------------------------------------------------
// Review helpers
// ---------------------------------------------------------------------------

/**
 * Returns all DistillationCandidates for admin review.
 * Optionally filter by status: 'pending' | 'approved' | 'rejected' | 'edited'
 */
export async function getDistillationCandidates(status?: string) {
  await requireAdmin()

  return db.distillationCandidate.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Approve a candidate, optionally storing a human-edited name.
 * Sets status → 'approved', records approvedName and reviewer metadata.
 */
export async function approveCandidate(id: string, approvedName?: string): Promise<void> {
  const adminId = await requireAdmin()

  await db.distillationCandidate.update({
    where: { id },
    data: {
      status: 'approved',
      approvedName: approvedName ?? null,
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
  })

  revalidatePath('/admin/cultural-substrate')
}

/**
 * Reject a candidate.
 * Sets status → 'rejected', records reviewer metadata.
 */
export async function rejectCandidate(id: string): Promise<void> {
  const adminId = await requireAdmin()

  await db.distillationCandidate.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
  })

  revalidatePath('/admin/cultural-substrate')
}
