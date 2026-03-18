'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { generateFromTemplate } from '@/lib/template-library'
import { getActiveInstance } from '@/actions/instance'
import { ALLYSHIP_DOMAINS } from '@/lib/campaign-subcampaigns'

export async function saveNarrativeKernel(
  kernel: string
): Promise<{ ok: true } | { error: string }> {
  const instance = await getActiveInstance()
  if (!instance) return { error: 'No active instance found' }
  try {
    await db.instance.update({
      where: { id: instance.id },
      data: { narrativeKernel: kernel.trim() || null },
    })
    return { ok: true }
  } catch {
    return { error: 'Failed to save kernel' }
  }
}

export async function generateAllSubcampaigns(
  campaignRef: string,
  kotterStage: number
): Promise<{ created: string[] } | { error: string }> {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  const [template, instance] = await Promise.all([
    db.adventureTemplate.findUnique({ where: { key: 'encounter-9-passage' } }),
    getActiveInstance(),
  ])
  if (!template) return { error: 'Template "encounter-9-passage" not found — run npm run seed:templates' }

  const kernel = instance?.narrativeKernel
  if (!kernel) return { error: 'Set a narrative kernel first' }

  const domains = [...ALLYSHIP_DOMAINS]

  // Call backend to generate all passages
  let passages: Record<string, Record<string, string>>
  try {
    const resp = await fetch(`${backendUrl}/api/agents/generate-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kernel,
        domains,
        kotter_stage: kotterStage,
        campaign_ref: campaignRef,
      }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!resp.ok) return { error: `Backend error: ${resp.status}` }
    const data = await resp.json()
    passages = data.output.passages
  } catch (e) {
    return { error: String(e) }
  }

  // Create one Adventure per domain with generated passage texts
  const createdIds: string[] = []
  for (const domain of domains) {
    const domainPassages = passages[domain]
    if (!domainPassages) continue

    const adventure = await generateFromTemplate(template.id, {
      campaignRef,
      subcampaignDomain: domain,
      title: `${domain.replace(/_/g, ' ')} — Stage ${kotterStage} (kernel draft)`,
    })

    // Overwrite every passage with the generated text
    const adventurePassages = await db.passage.findMany({
      where: { adventureId: adventure.id },
    })
    for (const p of adventurePassages) {
      const generatedText = domainPassages[p.nodeId]
      if (generatedText) {
        await db.passage.update({
          where: { id: p.id },
          data: { text: generatedText },
        })
      }
    }

    createdIds.push(adventure.id)
  }

  revalidatePath(`/admin/campaign/${campaignRef}/author`)
  return { created: createdIds }
}

export async function generateAdventureFromDeck(
  campaignRef: string,
  subcampaignDomain: string,
  kotterStage: number
): Promise<{ adventureId: string } | { error: string }> {
  // Find the encounter template
  const template = await db.adventureTemplate.findUnique({
    where: { key: 'encounter-9-passage' },
  })
  if (!template) return { error: 'Template "encounter-9-passage" not found — run npm run seed:templates' }

  // Pull quests from campaign deck for this domain
  const deckQuests = await db.customBar.findMany({
    where: {
      campaignRef,
      allyshipDomain: subcampaignDomain,
      type: 'quest',
      status: 'active',
      ...(kotterStage ? { kotterStage } : {}),
    },
    orderBy: { reward: 'desc' },
    take: 3,
  })

  // Fallback: any quest for this domain if kotter-filtered deck is empty
  const choiceQuests =
    deckQuests.length > 0
      ? deckQuests
      : await db.customBar.findMany({
          where: { campaignRef, allyshipDomain: subcampaignDomain, type: 'quest', status: 'active' },
          orderBy: { reward: 'desc' },
          take: 3,
        })

  const topQuest = choiceQuests[0] ?? null

  // Generate draft adventure from template
  const adventure = await generateFromTemplate(template.id, {
    campaignRef,
    subcampaignDomain,
    title: `${subcampaignDomain.replace(/_/g, ' ')} — Stage ${kotterStage} (draft)`,
  })

  // Override choice passage: Diplomat voice with deck quest options
  if (choiceQuests.length > 0) {
    const choicePassage = await db.passage.findFirst({
      where: { adventureId: adventure.id, nodeId: 'choice' },
    })
    if (choicePassage) {
      const choiceText = [
        `Three paths lie before you, each rooted in real work your community needs done.`,
        `Which direction calls to you right now?`,
      ].join('\n\n')

      const choices = choiceQuests.map((q) => ({
        text: q.title,
        targetId: 'response',
      }))

      await db.passage.update({
        where: { id: choicePassage.id },
        data: {
          text: choiceText,
          choices: JSON.stringify(choices),
        },
      })
    }
  }

  // Override artifact passage: link to highest-reward quest
  if (topQuest) {
    const artifactPassage = await db.passage.findFirst({
      where: { adventureId: adventure.id, nodeId: 'artifact' },
    })
    if (artifactPassage) {
      await db.passage.update({
        where: { id: artifactPassage.id },
        data: {
          linkedQuestId: topQuest.id,
          text: [
            `You carry something forward from this encounter.`,
            `**Quest unlocked:** ${topQuest.title}`,
            topQuest.description ? `\n${topQuest.description}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      })
    }
  }

  revalidatePath(`/admin/campaign/${campaignRef}/author`)
  return { adventureId: adventure.id }
}
