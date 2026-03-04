/**
 * Quest Grammar Compiler
 *
 * Compiles 6 Unpacking Questions + Aligned Action into QuestPacket.
 * Heuristic-based; no AI/LLM. Deterministic output.
 * Use compileQuestWithPrivileging when targetNationId/targetPlaybookId for choice privileging.
 */

import { db } from '@/lib/db'
import { deriveMovementPerNode } from './emotional-alchemy'
import { ALL_CANONICAL_MOVES } from './move-engine'
import { selectPrivilegedChoices } from './move-assignment'
import type { ElementKey } from './elements'
import type {
  QuestCompileInput,
  QuestPacket,
  QuestNode,
  EmotionalAlchemySignature,
  EmotionalChannel,
  MovementType,
  BeatType,
  EpiphanyBeatType,
  KotterBeatType,
  Choice,
  LoreGate,
  NodeAnchors,
  UnpackingAnswers,
  PersonalMoveType,
} from './types'

const EPIPHANY_BEATS: EpiphanyBeatType[] = [
  'orientation',
  'rising_engagement',
  'tension',
  'integration',
  'transcendence',
  'consequence',
]

const KOTTER_BEATS: KotterBeatType[] = [
  'urgency',
  'coalition',
  'vision',
  'communicate',
  'obstacles',
  'wins',
  'build_on',
  'anchor',
]

const CHANNEL_KEYWORDS: Record<EmotionalChannel, string[]> = {
  Fear: ['anxious', 'anxiety', 'scared', 'scary', 'worried', 'worry', 'afraid', 'fear', 'nervous'],
  Anger: ['frustrated', 'frustration', 'angry', 'anger', 'mad', 'rage', 'irritated'],
  Sadness: ['sad', 'grief', 'loss', 'sorrow', 'melancholy', 'disappointed'],
  Joy: ['joyful', 'joy', 'happy', 'happiness', 'excited', 'bliss', 'triumphant', 'poignant'],
  Neutrality: ['neutral', 'calm', 'indifferent', 'detached'],
}

// Use /i only (no /g) so pattern.test() is deterministic across multiple compileQuest calls
const SHADOW_VOICE_PATTERNS = [
  { pattern: /not\s+ready/i, label: "I'm not ready" },
  { pattern: /not\s+worthy/i, label: "I'm not worthy" },
  { pattern: /not\s+good\s+enough/i, label: "I'm not good enough" },
  { pattern: /not\s+capable/i, label: "I'm not capable" },
  { pattern: /insignificant/i, label: "I'm insignificant" },
  { pattern: /don'?t\s+belong/i, label: "I don't belong" },
]

function toText(value: string | string[]): string {
  return Array.isArray(value) ? value.join(' ') : (value ?? '')
}

function extractPrimaryChannel(q4: string | string[], q5: string): EmotionalChannel {
  const combined = `${toText(q4)} ${q5}`.toLowerCase()
  const scores: Record<EmotionalChannel, number> = {
    Fear: 0,
    Anger: 0,
    Sadness: 0,
    Joy: 0,
    Neutrality: 0,
  }
  for (const [channel, keywords] of Object.entries(CHANNEL_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        scores[channel as EmotionalChannel]++
      }
    }
  }
  const max = Math.max(...Object.values(scores))
  if (max === 0) return 'Fear'
  const winner = (Object.entries(scores).find(([, v]) => v === max)?.[0] ?? 'Fear') as EmotionalChannel
  return winner
}

function extractLabels(text: string): string[] {
  const words = text
    .replace(/[.,!?;:]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
  const emotional = new Set<string>()
  for (const [channel, keywords] of Object.entries(CHANNEL_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.toLowerCase().includes(kw)) {
        emotional.add(kw)
      }
    }
  }
  return Array.from(emotional).slice(0, 5)
}

function extractShadowVoices(q6: string): string[] {
  const found: string[] = []
  for (const { pattern, label } of SHADOW_VOICE_PATTERNS) {
    if (pattern.test(q6)) {
      found.push(label)
    }
  }
  return found
}

function deriveMoveType(alignedAction: string): PersonalMoveType {
  const lower = alignedAction.trim().toLowerCase()
  if (lower.startsWith('wake up')) return 'wakeUp'
  if (lower.startsWith('clean up')) return 'cleanUp'
  if (lower.startsWith('grow up')) return 'growUp'
  if (lower.startsWith('show up')) return 'showUp'
  return 'cleanUp'
}

function toLabelArray(value: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

function extractSignature(
  answers: UnpackingAnswers,
  alignedAction: string,
  nodeCount: number,
  explicitMoveType?: PersonalMoveType
): EmotionalAlchemySignature {
  const primaryChannel = extractPrimaryChannel(answers.q4, answers.q5)
  const dissatisfiedLabels = toLabelArray(answers.q4).length ? toLabelArray(answers.q4) : extractLabels(toText(answers.q4))
  const satisfiedLabels = toLabelArray(answers.q2).length ? toLabelArray(answers.q2) : extractLabels(toText(answers.q2))
  const shadowVoices = toLabelArray(answers.q6).length ? toLabelArray(answers.q6) : extractShadowVoices(toText(answers.q6))
  const movementPerNode = deriveMovementPerNode(
    satisfiedLabels,
    dissatisfiedLabels,
    shadowVoices,
    nodeCount
  )
  const moveType = explicitMoveType ?? deriveMoveType(alignedAction)
  return {
    primaryChannel,
    dissatisfiedLabels: dissatisfiedLabels.length ? dissatisfiedLabels : ['stuck'],
    satisfiedLabels: satisfiedLabels.length ? satisfiedLabels : ['free'],
    movementPerNode,
    shadowVoices: shadowVoices.length ? shadowVoices : ['unknown'],
    moveType,
  }
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function generateEpiphanyNodeText(
  beatType: EpiphanyBeatType,
  signature: EmotionalAlchemySignature,
  answers: UnpackingAnswers,
  alignedAction: string,
  segment: 'player' | 'sponsor',
  q3Display: string
): string {
  const { primaryChannel, dissatisfiedLabels, satisfiedLabels } = signature
  const fromState = dissatisfiedLabels[0] ?? 'stuck'
  const toState = satisfiedLabels[0] ?? 'free'

  const playerFraming = 'You are entering a living world mid-formation. Your participation matters.'
  const sponsorFraming = 'You are protecting emergence. Your stewardship catalyzes what wants to happen.'
  const framing = segment === 'player' ? playerFraming : sponsorFraming

  const templates: Record<EpiphanyBeatType, string> = {
    orientation: `**Orientation** — ${answers.q1}\n\nRight now: ${q3Display}\n\n${framing}`,
    rising_engagement: `**Rising engagement** — You feel ${fromState}. ${toText(answers.q4)}\n\nWhat would have to be true? ${answers.q5}`,
    tension: `**Moment of tension** — The gap between ${fromState} and ${toState} is real. ${signature.shadowVoices.join('. ')}`,
    integration: `**Integration** — ${alignedAction}\n\nYou're translating ${primaryChannel} into movement. The threshold is near.`,
    transcendence: `**Transcendence** — Cross the threshold.\n\n**Ritual**: This is a moment of commitment — you are choosing to contribute.\n\n**Transaction**: Your contribution supports the campaign. Funds go directly to the cause.\n\n[Contribute to the campaign](/event/donate) — donate before or after creating your account.`,
    consequence: `**Structural consequence** — Contribution logged. You are now an Early Believer — a Catalyst who crossed before the crowd.\n\nUnlock: founders thread, patron updates.`,
  }
  return templates[beatType]
}

function generateKotterNodeText(
  beatType: KotterBeatType,
  signature: EmotionalAlchemySignature,
  answers: UnpackingAnswers,
  alignedAction: string,
  segment: 'player' | 'sponsor',
  q3Display: string
): string {
  const { dissatisfiedLabels, satisfiedLabels } = signature
  const fromState = dissatisfiedLabels[0] ?? 'stuck'
  const toState = satisfiedLabels[0] ?? 'free'

  const playerFraming = 'You are entering a living world mid-formation. Your participation matters.'
  const sponsorFraming = 'You are protecting emergence. Your stewardship catalyzes what wants to happen.'
  const framing = segment === 'player' ? playerFraming : sponsorFraming

  const templates: Record<KotterBeatType, string> = {
    urgency: `**1. Urgency** — ${answers.q1}\n\nRight now: ${q3Display}\n\n${framing}\n\nWe need to create urgency around this need.`,
    coalition: `**2. Coalition** — Who will contribute?\n\n${signature.shadowVoices.join('. ')} — who can help bridge this gap? Build the coalition.`,
    vision: `**3. Vision** — What does success look like?\n\n${satisfiedLabels.join(', ')} — ${toState}. What would have to be true? ${answers.q5}`,
    communicate: `**4. Communicate** — Share the need.\n\n${alignedAction} — communicate the vision. Spread the message.`,
    obstacles: `**5. Obstacles** — What blocks progress?\n\nYou feel ${fromState}. ${toText(answers.q4)}. ${signature.shadowVoices.join('. ')}`,
    wins: `**6. Wins** — First milestone reached.\n\nCelebrate progress. The threshold is approaching. Contribution supports the campaign.\n\n[Contribute to the campaign](/event/donate) — donate before or after creating your account.`,
    build_on: `**7. Build On** — Scale giving.\n\nBuild on the wins. Iterate and amplify. Funds go directly to the cause.`,
    anchor: `**8. Anchor** — Sustainable funding.\n\nContribution logged. You are now an Early Believer — a Catalyst who crossed before the crowd.\n\nUnlock: founders thread, patron updates.`,
  }
  return templates[beatType]
}

function buildAnchors(beatType: BeatType, index: number): NodeAnchors {
  const anchors: NodeAnchors = {}
  const isFirst = beatType === 'orientation' || beatType === 'urgency'
  const isLast = beatType === 'consequence' || beatType === 'anchor'
  if (isFirst) anchors.goal = beatType === 'orientation' ? 'orientation' : 'urgency'
  if (isLast) {
    anchors.identityCue = 'Early Believer'
    anchors.consequenceCue = 'contribution logged'
  } else if (!isFirst) {
    anchors.goal = beatType
  }
  return anchors
}

function generateChoices(
  beatType: BeatType,
  index: number,
  nodeIds: string[],
  privilegeContext?: { nationElement: ElementKey; playbookWave: PersonalMoveType }
): Choice[] {
  const isFinal = beatType === 'consequence' || beatType === 'anchor'
  if (isFinal) {
    return [{ text: 'Create my account', targetId: 'signup' }]
  }
  if (index < nodeIds.length - 1) {
    if (privilegeContext) {
      const privileged = selectPrivilegedChoices({
        validMoves: ALL_CANONICAL_MOVES,
        nationElement: privilegeContext.nationElement,
        playbookWave: privilegeContext.playbookWave,
        limit: 3,
      })
      const targetId = nodeIds[index + 1]
      return privileged.map((m) => ({
        text: m.name,
        targetId,
        moveId: m.id,
      }))
    }
    return [
      { text: 'Continue', targetId: nodeIds[index + 1] },
      { text: 'Pause and reflect', targetId: nodeIds[index] },
    ]
  }
  return []
}

export function compileQuest(input: QuestCompileInput): QuestPacket {
  const {
    unpackingAnswers,
    alignedAction,
    segment,
    campaignId,
    questModel = 'personal',
    moveType: explicitMoveType,
    privilegeContext,
  } = input
  const beatTypes = questModel === 'communal' ? KOTTER_BEATS : EPIPHANY_BEATS
  const nodeCount = beatTypes.length
  const signature = extractSignature(unpackingAnswers, alignedAction, nodeCount, explicitMoveType)

  const q3Display = (() => {
    const raw = unpackingAnswers.q3 ?? ''
    const sep = ' | '
    if (raw.includes(sep)) {
      const [lifeState, distance] = raw.split(sep).map((s) => s.trim())
      if (distance) {
        return lifeState ? `${lifeState}. How far from your creation: ${distance}` : `How far from your creation: ${distance}`
      }
      return lifeState
    }
    return raw
  })()

  const nodeIds = beatTypes.map((_, i) => `node_${i}`)
  const nodes: QuestNode[] = beatTypes.map((beatType, index) => {
    const id = nodeIds[index]
    const text =
      questModel === 'communal'
        ? generateKotterNodeText(beatType as KotterBeatType, signature, unpackingAnswers, alignedAction, segment, q3Display)
        : generateEpiphanyNodeText(beatType as EpiphanyBeatType, signature, unpackingAnswers, alignedAction, segment, q3Display)
    const choices = generateChoices(beatType, index, nodeIds, privilegeContext)
    const wordCountEstimate = wordCount(text)
    const isDonationNode = beatType === 'transcendence' || beatType === 'wins'

    const node: QuestNode = {
      id,
      beatType,
      wordCountEstimate,
      emotional: {
        channel: signature.primaryChannel,
        movement: signature.movementPerNode[index] ?? 'translate',
        fromState: signature.dissatisfiedLabels[0],
        toState: signature.satisfiedLabels[0],
      },
      text,
      choices,
      anchors: buildAnchors(beatType, index),
      isDonationNode,
    }
    return node
  })

  const telemetryHooks = {
    questStarted: () => {},
    nodeViewed: (_nodeId: string) => {},
    choiceSelected: (_from: string, _to: string) => {},
    donationClicked: () => {},
    donationCompleted: () => {},
  }

  const moveMap: QuestPacket['moveMap'] = privilegeContext
    ? Object.fromEntries(
        nodes.map((n, i) => {
          const choicesWithMove = n.choices
            .map((c, ci) => (c.moveId ? ([ci, c.moveId] as const) : null))
            .filter((x): x is [number, string] => x !== null)
          if (choicesWithMove.length === 0) return [n.id, {}] as const
          return [n.id, Object.fromEntries(choicesWithMove)] as const
        })
      )
    : undefined

  return {
    signature,
    nodes,
    segmentVariant: segment,
    telemetryHooks,
    startNodeId: 'node_0',
    moveMap,
  }
}

/**
 * Async variant that resolves nation/playbook for choice privileging.
 * Use when targetNationId or targetPlaybookId are provided.
 */
export async function compileQuestWithPrivileging(input: QuestCompileInput): Promise<QuestPacket> {
  const { targetNationId, targetPlaybookId } = input
  if (!targetNationId && !targetPlaybookId) {
    return compileQuest(input)
  }

  let nationElement: ElementKey = 'earth'
  let playbookWave: PersonalMoveType = 'showUp'

  if (targetNationId) {
    const nation = await db.nation.findUnique({
      where: { id: targetNationId },
      select: { element: true },
    })
    if (nation?.element && ['metal', 'water', 'wood', 'fire', 'earth'].includes(nation.element)) {
      nationElement = nation.element as ElementKey
    }
  }

  if (targetPlaybookId) {
    const { getPlaybookPrimaryWave } = await import('./playbook-wave')
    playbookWave = await getPlaybookPrimaryWave(targetPlaybookId)
  }

  return compileQuest({
    ...input,
    privilegeContext: { nationElement, playbookWave },
  })
}
