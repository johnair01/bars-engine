/**
 * Demo Orientation Preview — resolve token/slug to adventure bounds.
 * @see .specify/specs/demo-orientation-preview/spec.md
 */

import { db } from '@/lib/db'

/**
 * `/api/adventures/[slug]/[nodeId]` only serves the full Bruised Banana graph
 * (Passages + dynamic BB_* nodes) when `slug === 'bruised-banana'`.
 * Demo links may point at another Adventure row with the same campaignRef but a
 * different slug — normalize so preview fetches don't 404 mid-flow.
 */
export function apiAdventureSlugForDemoOrientation(
  adventureSlug: string,
  campaignRef: string | null
): string {
  if (campaignRef === 'bruised-banana') return 'bruised-banana'
  return adventureSlug
}

export type ResolvedDemoOrientationLink = {
  id: string
  token: string
  adventureSlug: string
  startNodeId: string
  campaignRef: string | null
  instanceId: string | null
  inviteId: string | null
  maxSteps: number | null
  endNodeId: string | null
  label: string | null
}

/**
 * Load an active demo link by opaque `token` or optional `publicSlug`.
 */
export async function resolveDemoOrientationLink(params: {
  token?: string | null
  publicSlug?: string | null
}): Promise<ResolvedDemoOrientationLink | null> {
  const token = params.token?.trim()
  const publicSlug = params.publicSlug?.trim()
  if (!token && !publicSlug) return null

  const row = await db.demoOrientationLink.findFirst({
    where: {
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...(token ? { token } : { publicSlug: publicSlug! }),
    },
    include: { adventure: { select: { slug: true } } },
  })
  if (!row) return null

  return {
    id: row.id,
    token: row.token,
    adventureSlug: apiAdventureSlugForDemoOrientation(row.adventure.slug, row.campaignRef),
    startNodeId: row.startNodeId,
    campaignRef: row.campaignRef,
    instanceId: row.instanceId,
    inviteId: row.inviteId,
    maxSteps: row.maxSteps,
    endNodeId: row.endNodeId,
    label: row.label,
  }
}
