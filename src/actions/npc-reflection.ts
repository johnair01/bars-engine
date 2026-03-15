'use server'

import { db } from '@/lib/db'

/**
 * Generates a new NPC reflection in pending status.
 * No reflection output is active until Regent approves it.
 */
export async function generateNpcReflection(
  npcId: string,
  inputSummary: string,
  outputs: {
    stance_update?: string
    possible_hooks?: string[]
    bar_affinity_shift?: string[]
  } = {},
  campaignId?: string
) {
  const npc = await db.npcConstitution.findUnique({
    where: { id: npcId },
    select: { reflectionPolicy: true, status: true },
  })

  if (!npc) return { error: 'NPC not found' }
  if (npc.status !== 'active') return { error: 'NPC must be active to generate reflections' }

  let policy: { allowed?: boolean; max_outputs?: number } = {}
  try {
    policy = JSON.parse(npc.reflectionPolicy)
  } catch { /* use defaults */ }

  if (policy.allowed === false) {
    return { error: 'Reflection is not allowed by this NPC constitution' }
  }

  const reflection = await db.npcReflection.create({
    data: {
      npcId,
      campaignId,
      inputSummary,
      outputs: JSON.stringify({
        stance_update: outputs.stance_update ?? null,
        possible_hooks: (outputs.possible_hooks ?? []).slice(0, 2), // max 2 per spec
        bar_affinity_shift: outputs.bar_affinity_shift ?? [],
      }),
      status: 'pending',
    },
  })

  return { reflection }
}

/**
 * Regent reviews a pending reflection — approve or reject.
 * Only approved reflections influence future NPC dialogue.
 */
export async function reviewNpcReflection(
  reflectionId: string,
  action: 'approve' | 'reject',
  reviewedBy: string,
  notes?: string
) {
  const reflection = await db.npcReflection.findUnique({ where: { id: reflectionId } })
  if (!reflection) return { error: 'Reflection not found' }
  if (reflection.status !== 'pending') {
    return { error: `Reflection is already ${reflection.status}` }
  }

  const updated = await db.npcReflection.update({
    where: { id: reflectionId },
    data: {
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      ...(notes
        ? {
            outputs: JSON.stringify({
              ...JSON.parse(reflection.outputs),
              regent_notes: notes,
            }),
          }
        : {}),
    },
  })

  return { reflection: updated }
}

/**
 * Returns approved reflections for an NPC — fed into NPC context for next dialogue.
 */
export async function getApprovedReflections(npcId: string, limit = 5) {
  return db.npcReflection.findMany({
    where: { npcId, status: 'approved' },
    orderBy: { reviewedAt: 'desc' },
    take: limit,
  })
}
