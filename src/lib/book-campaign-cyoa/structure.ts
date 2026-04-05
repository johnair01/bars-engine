/**
 * Deterministic CYOA skeleton for book-derived campaigns.
 * Spec: .specify/specs/pdf-to-campaign-autogeneration/spec.md
 */

export interface SkeletonNode {
  nodeId: string
  textPlaceholder: string
  choices: { text: string; targetId: string }[]
  linkedQuestId?: string
}

export interface BookCampaignSkeleton {
  nodes: SkeletonNode[]
  startNodeId: string
}

export interface ArchetypeInfo {
  id: string
  name: string
}

export interface BuildSkeletonInput {
  bookTitle: string
  bookAuthor: string | null
  toc?: { entries?: unknown[] } | null
  sectionHints?: Array<{ moveType?: string }>
  archetypes: ArchetypeInfo[]
  questsByMove: {
    wakeUp: { id: string; title: string }[]
    cleanUp: { id: string; title: string }[]
    growUp: { id: string; title: string }[]
    showUp: { id: string; title: string }[]
  }
}

/**
 * Build deterministic CYOA skeleton for a book campaign.
 * Nodes: BOOK_Intro → BOOK_ChooseArchetype → BOOK_Archetype_[id] → move sequence → BOOK_Complete
 */
export function buildBookCampaignSkeleton(input: BuildSkeletonInput): BookCampaignSkeleton {
  const { bookTitle, archetypes, questsByMove } = input
  const nodes: SkeletonNode[] = []

  // BOOK_Intro — placeholder for summary + leverage
  nodes.push({
    nodeId: 'BOOK_Intro',
    textPlaceholder: `[Summary and campaign leverage for "${bookTitle}"]`,
    choices: [
      { text: 'Choose your archetype', targetId: 'BOOK_ChooseArchetype' },
    ],
  })

  // BOOK_ChooseArchetype — list archetypes
  const archetypeChoices = archetypes.map((a) => ({
    text: a.name,
    targetId: `BOOK_Archetype_${a.id}`,
  }))
  nodes.push({
    nodeId: 'BOOK_ChooseArchetype',
    textPlaceholder: `**Choose your lens** — How do you want to approach "${bookTitle}"? Each archetype offers a different way through the material.`,
    choices: archetypeChoices,
  })

  // Each archetype branch: intro → WakeUp → CleanUp → GrowUp → ShowUp → Complete
  for (const arch of archetypes) {
    nodes.push({
      nodeId: `BOOK_Archetype_${arch.id}`,
      textPlaceholder: `[As ${arch.name}, you approach this material...]`,
      choices: [{ text: 'Begin with Wake Up', targetId: 'BOOK_WakeUp' }],
    })
  }

  // Move nodes — shared across archetypes (linear flow)
  const firstWakeUp = questsByMove.wakeUp[0]
  const firstCleanUp = questsByMove.cleanUp[0]
  const firstGrowUp = questsByMove.growUp[0]
  const firstShowUp = questsByMove.showUp[0]

  nodes.push({
    nodeId: 'BOOK_WakeUp',
    textPlaceholder: '**Wake Up** — New ideas and awareness. What does this material reveal?',
    choices: [{ text: 'Continue to Clean Up', targetId: 'BOOK_CleanUp' }],
    linkedQuestId: firstWakeUp?.id,
  })

  nodes.push({
    nodeId: 'BOOK_CleanUp',
    textPlaceholder: '**Clean Up** — Psychological barriers. What might block you from engaging?',
    choices: [{ text: 'Continue to Grow Up', targetId: 'BOOK_GrowUp' }],
    linkedQuestId: firstCleanUp?.id,
  })

  nodes.push({
    nodeId: 'BOOK_GrowUp',
    textPlaceholder: '**Grow Up** — Skill capacity. What emergent skills does this material offer?',
    choices: [{ text: 'Continue to Show Up', targetId: 'BOOK_ShowUp' }],
    linkedQuestId: firstGrowUp?.id,
  })

  nodes.push({
    nodeId: 'BOOK_ShowUp',
    textPlaceholder: '**Show Up** — Apply to your campaign. How will you take action?',
    choices: [{ text: 'Complete', targetId: 'BOOK_Complete' }],
    linkedQuestId: firstShowUp?.id,
  })

  nodes.push({
    nodeId: 'BOOK_Complete',
    textPlaceholder: '**Complete** — You have journeyed through the material. What will you do next?',
    choices: [],
  })

  return {
    nodes,
    startNodeId: 'BOOK_Intro',
  }
}
