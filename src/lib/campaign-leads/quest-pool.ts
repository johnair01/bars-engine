/**
 * Campaign Lead Forge — the campaign quest pool (the CustomBars a lead's starter
 * quests / the funnel's offers are drawn from). One query, so the funnel, the lead
 * workspace, and any future consumer never show different sets.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 */
import 'server-only'
import { db } from '@/lib/db'

export interface QuestPoolOption {
  id: string
  title: string
  domain: string | null
}

export async function getCampaignQuestPool(): Promise<QuestPoolOption[]> {
  const rows = await db.customBar.findMany({
    where: { type: { in: ['onboarding', 'quest'] }, status: 'active', allyshipDomain: { not: null } },
    select: { id: true, title: true, allyshipDomain: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return rows.map((q) => ({ id: q.id, title: q.title, domain: q.allyshipDomain }))
}
