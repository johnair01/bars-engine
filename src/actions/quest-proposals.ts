'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateQuestProposalFromBar } from '@/lib/bar-quest-generation'
import { publishQuestProposal } from '@/lib/bar-quest-generation/publish'

async function checkAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  const adminRole = await db.playerRole.findFirst({
    where: {
      playerId: player.id,
      role: { key: 'admin' },
    },
  })

  if (!adminRole) throw new Error('Not authorized')
  return player
}

export interface ListQuestProposalsFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'deferred'
  campaignRef?: string
}

export async function listQuestProposals(filters?: ListQuestProposalsFilters) {
  await checkAdmin()

  const where: { reviewStatus?: string; campaignRef?: string } = {}
  if (filters?.status) where.reviewStatus = filters.status
  if (filters?.campaignRef) where.campaignRef = filters.campaignRef

  return db.questProposal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      bar: { select: { id: true, title: true, description: true } },
      player: { select: { id: true, name: true } },
    },
  })
}

export async function getQuestProposal(id: string) {
  await checkAdmin()

  return db.questProposal.findUnique({
    where: { id },
    include: {
      bar: true,
      player: { select: { id: true, name: true, contactValue: true } },
    },
  })
}

export async function generateProposalFromBar(barId: string) {
  await checkAdmin()

  const result = await generateQuestProposalFromBar(barId)
  revalidatePath('/admin/quest-proposals')
  return result
}

export interface ReviewQuestProposalInput {
  action: 'approve' | 'reject' | 'defer'
  editedFields?: {
    title?: string
    description?: string
    completionConditions?: string[]
  }
}

export async function reviewQuestProposal(
  proposalId: string,
  input: ReviewQuestProposalInput
) {
  await checkAdmin()

  const proposal = await db.questProposal.findUnique({
    where: { id: proposalId },
  })

  if (!proposal) throw new Error('Proposal not found')

  const update: { reviewStatus: string; title?: string; description?: string; completionConditions?: string } = {
    reviewStatus: input.action === 'approve' ? 'approved' : input.action === 'reject' ? 'rejected' : 'deferred',
  }

  if (input.editedFields?.title) update.title = input.editedFields.title
  if (input.editedFields?.description) update.description = input.editedFields.description
  if (input.editedFields?.completionConditions) {
    update.completionConditions = JSON.stringify(input.editedFields.completionConditions)
  }

  await db.questProposal.update({
    where: { id: proposalId },
    data: update,
  })

  revalidatePath('/admin/quest-proposals')
  revalidatePath(`/admin/quest-proposals/${proposalId}`)
  return { success: true }
}

export async function publishProposal(proposalId: string) {
  await checkAdmin()

  const result = await publishQuestProposal(proposalId)
  revalidatePath('/admin/quest-proposals')
  revalidatePath('/admin/quests')
  if (result.success) {
    revalidatePath(`/admin/world/quest/${result.questId}`)
  }
  return result
}
