/**
 * Character Creation Packet — Pure compiler for lens/nation/playbook/domain branching.
 * Used in chained initiation flow. No AI, no Prisma.
 * @see .specify/specs/auto-flow-chained-initiation/spec.md
 */

import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import type { SerializableQuestPacket, QuestNode, Choice, SegmentVariant } from './types'

export interface NationChoice {
  id: string
  name: string
}

export interface PlaybookChoice {
  id: string
  name: string
}

export interface CharacterCreationPacketInput {
  segment?: SegmentVariant
  nations?: NationChoice[]
  playbooks?: PlaybookChoice[]
}

const LENS_CHOICES = [
  { key: 'cognitive', label: 'Understanding — I want to see the big picture first' },
  { key: 'emotional', label: 'Connecting — I want to relate and feel into it' },
  { key: 'action', label: 'Acting — I want to do something concrete' },
] as const

function toSafeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
}

export function compileCharacterCreationPacket(
  input: CharacterCreationPacketInput = {}
): SerializableQuestPacket {
  const { segment = 'player', nations = [], playbooks = [] } = input

  const nodes: QuestNode[] = []

  // Lens hub — story-framed: "What draws you most?" before mechanics
  const lensChoices: Choice[] = LENS_CHOICES.map((c) => ({
    text: c.label,
    targetId: `char_set_${c.key}`,
  }))
  nodes.push({
    id: 'char_lens',
    beatType: 'orientation',
    wordCountEstimate: 25,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: '**What draws you most right now?** — A quick signal to personalize your journey into the Conclave.',
    choices: lensChoices,
    anchors: { goal: 'orientation' },
  })

  // Set lens nodes (cognitive, emotional, action)
  for (const c of LENS_CHOICES) {
    const nodeId = `char_set_${c.key}`
    nodes.push({
      id: nodeId,
      beatType: 'rising_engagement',
      wordCountEstimate: 15,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: `You chose ${c.label.split('—')[0]?.trim() ?? c.key}. Continue to choose your path.`,
      choices: [{ text: 'Continue', targetId: 'char_nation' }],
      anchors: {},
    })
  }

  // Nation hub
  const nationChoices: Choice[] =
    nations.length > 0
      ? nations.map((n) => ({
          text: n.name,
          targetId: `char_set_nation_${toSafeId(n.id)}`,
        }))
      : [{ text: 'Continue (skip)', targetId: 'char_playbook' }]

  if (nations.length > 0) {
    nodes.push({
      id: 'char_nation',
      beatType: 'tension',
      wordCountEstimate: 50,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: '**Each nation channels a different emotional energy.** Argyra: clarity and precision. Pyrakanth: passion and drive. Virelune: hope and growth. Meridia: calm and grounding. Lamenth: flow and wisdom. Which calls to you?',
      choices: nationChoices,
      anchors: {},
    })

    for (const n of nations) {
      const nodeId = `char_set_nation_${toSafeId(n.id)}`
      nodes.push({
        id: nodeId,
        beatType: 'integration',
        wordCountEstimate: 15,
        emotional: { channel: 'Neutrality', movement: 'translate' },
        text: `You chose ${n.name}. Continue.`,
        choices: [{ text: 'Continue', targetId: 'char_playbook' }],
        anchors: {},
      })
    }
  } else {
    nodes.push({
      id: 'char_nation',
      beatType: 'tension',
      wordCountEstimate: 25,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: '**Nation** — Continue to choose your playbook.',
      choices: [{ text: 'Continue', targetId: 'char_playbook' }],
      anchors: {},
    })
  }

  // Playbook hub
  const playbookChoices: Choice[] =
    playbooks.length > 0
      ? playbooks.map((p) => ({
          text: p.name,
          targetId: `char_set_playbook_${toSafeId(p.id)}`,
        }))
      : [{ text: 'Continue (skip)', targetId: 'char_domain' }]

  if (playbooks.length > 0) {
    nodes.push({
      id: 'char_playbook',
      beatType: 'tension',
      wordCountEstimate: 40,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: '**How do you approach the heist?** Each archetype brings a different lens — a different way of moving through the world. Your playbook is your approach.',
      choices: playbookChoices,
      anchors: {},
    })

    for (const p of playbooks) {
      const nodeId = `char_set_playbook_${toSafeId(p.id)}`
      nodes.push({
        id: nodeId,
        beatType: 'integration',
        wordCountEstimate: 15,
        emotional: { channel: 'Neutrality', movement: 'translate' },
        text: `You chose ${p.name}. Continue.`,
        choices: [{ text: 'Continue', targetId: 'char_domain' }],
        anchors: {},
      })
    }
  } else {
    nodes.push({
      id: 'char_playbook',
      beatType: 'tension',
      wordCountEstimate: 25,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: '**Playbook** — Continue to choose your domain.',
      choices: [{ text: 'Continue', targetId: 'char_domain' }],
      anchors: {},
    })
  }

  // Domain hub
  const domainChoices: Choice[] = ALLYSHIP_DOMAINS.map((d) => ({
    text: d.label,
    targetId: `char_set_domain_${d.key}`,
  }))
  nodes.push({
    id: 'char_domain',
    beatType: 'orientation',
    wordCountEstimate: 45,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: '**How do you want to contribute to the campaign?** Your allyship domain is where your work happens — gathering resources, direct action, raising awareness, or skillful organizing. Which calls to you?',
    choices: domainChoices,
    anchors: {},
  })

  for (const d of ALLYSHIP_DOMAINS) {
    nodes.push({
      id: `char_set_domain_${d.key}`,
      beatType: 'integration',
      wordCountEstimate: 15,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: `You chose ${d.label}.`,
      choices: [{ text: 'Continue', targetId: 'char_terminal' }],
      anchors: {},
    })
  }

  // Single terminal node — appendQuestToAdventure adds "Continue to next quest" here
  nodes.push({
    id: 'char_terminal',
    beatType: 'consequence',
    wordCountEstimate: 10,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: 'Character creation complete.',
    choices: [],
    anchors: {},
  })

  return {
    signature: {
      primaryChannel: 'Neutrality',
      dissatisfiedLabels: [],
      satisfiedLabels: [],
      movementPerNode: [],
      shadowVoices: [],
    },
    nodes,
    segmentVariant: segment,
    startNodeId: 'char_lens',
  }
}
