import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { EncounterRunner } from './EncounterRunner'

/**
 * @page /threshold-encounter/:id
 * @entity QUEST
 * @description Interactive threshold encounter — CYOA scene from emotional alchemy check-in
 * @permissions authenticated, owner_only
 * @params id:string (path, required) - ThresholdEncounter identifier
 * @relationships loads ThresholdEncounter (playerId must match), renders as interactive CYOA
 * @energyCost 0 (encounter viewing)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:threshold_encounter, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /threshold-encounter/enc_123
 * @agentDiscoverable false
 */
export default async function ThresholdEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const { id } = await params
  const encounter = await db.thresholdEncounter.findUnique({
    where: { id },
  })
  if (!encounter || encounter.playerId !== playerId) notFound()

  // Parse twee source into passage map
  const passageMap: Record<string, { name: string; prose: string; links: { text: string; target: string }[] }> = {}
  const rawPassages = encounter.tweeSource
    .split(/^:: /m)
    .filter(Boolean)

  for (const block of rawPassages) {
    const newlineIdx = block.indexOf('\n')
    const name = block.slice(0, newlineIdx).trim()
    if (name === 'StoryData') continue
    let content = block.slice(newlineIdx + 1).trim()

    // Extract [[link text->target]] patterns
    const links: { text: string; target: string }[] = []
    content = content.replace(/\[\[([^\]]+?)->([^\]]+?)\]\]/g, (_m, text, target) => {
      links.push({ text: text.trim(), target: target.trim() })
      return ''
    })
    // Also handle [[PassageName]] (self-referencing links)
    content = content.replace(/\[\[([^\]]+?)\]\]/g, (_m, name) => {
      links.push({ text: name.trim(), target: name.trim() })
      return ''
    })
    // Strip artifact JSON tags from display
    content = content.replace(/\[ARTIFACTS:[^\]]*\]/g, '')
    // Clean up trailing whitespace
    content = content.trim()

    passageMap[name] = { name, prose: content, links }
  }

  return (
    <EncounterRunner
      passages={passageMap}
      encounterId={encounter.id}
      gmFace={encounter.gmFace}
      vector={encounter.vector}
      exportHref={`/api/threshold-encounter/${encounter.id}/export`}
    />
  )
}
