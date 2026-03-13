/**
 * Moves + GM Packet — Pure compiler for 4 moves and Game Master face selection.
 * Used in chained initiation flow. Heuristic text, no AI.
 * @see .specify/specs/auto-flow-chained-initiation/spec.md
 */

import { getFaceSentence } from '../shared/face-sentences'
import { GAME_MASTER_FACES, FACE_META } from './types'
import type { SerializableQuestPacket, QuestNode, Choice, SegmentVariant } from './types'

export interface MovesGMPacketInput {
  segment?: SegmentVariant
}

const VIBEULON_INTRO = `**Vibeulons** — the emotional energy that powers the construct. They flow through the Conclave, through the heist, through you. Complete this flow to earn your starter share. The threshold awaits.`

const MOVE_TEXTS: Record<string, string> = {
  wakeUp: `**Wake Up** — Notice what's true. The first move is awareness: naming what is, without judgment. What are you actually experiencing right now?`,
  cleanUp: `**Clean Up** — Release what no longer serves. Let go of stories, habits, or beliefs that block your next step.`,
  growUp: `**Grow Up** — Expand capacity. Learn, practice, and integrate new ways of being.`,
  showUp: `**Show Up** — Take action. Contribute to the campaign. Your participation matters.

[Contribute to the campaign](/event/donate) — donate before or after creating your account.`,
}

const COMMIT_TEXT = `**Commit** — You've chosen your path. This is the moment of crossing the threshold.`

const SIGNUP_TEXT = `**Sign up** — Create your account. You are now an Early Believer — a Catalyst who crossed before the crowd.

Unlock: founders thread, patron updates.`

export function compileMovesGMPacket(input: MovesGMPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input

  const nodes: QuestNode[] = []

  // Moves intro
  nodes.push({
    id: 'moves_intro',
    beatType: 'orientation',
    wordCountEstimate: 30,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: '**The Four Moves** — Wake Up, Clean Up, Grow Up, Show Up. These are your personal throughput. Learn them.',
    choices: [{ text: 'Continue', targetId: 'moves_wakeup' }],
    anchors: { goal: 'orientation' },
  })

  // Four moves
  const moveIds = ['wakeup', 'cleanup', 'growup', 'showup'] as const
  for (let i = 0; i < moveIds.length; i++) {
    const moveId = moveIds[i]
    const nextId = i < moveIds.length - 1 ? `moves_${moveIds[i + 1]}` : 'gm_choose'
    nodes.push({
      id: `moves_${moveId}`,
      beatType: 'rising_engagement',
      wordCountEstimate: 40,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: MOVE_TEXTS[moveId] ?? '',
      choices: [{ text: 'Continue', targetId: nextId }],
      anchors: {},
    })
  }

  // GM choose hub
  const gmChoices: Choice[] = GAME_MASTER_FACES.map((face) => {
    const meta = FACE_META[face]
    return {
      text: meta ? `${meta.label}: ${meta.role}` : face,
      targetId: `gm_set_${face}`,
    }
  })
  nodes.push({
    id: 'gm_choose',
    beatType: 'tension',
    wordCountEstimate: 25,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: '**Choose your Game Master face** — Which lens will guide your journey?',
    choices: gmChoices,
    anchors: {},
  })

  // GM set nodes — point to vibeulon intro (story beat before sign-up)
  for (const face of GAME_MASTER_FACES) {
    const sentence = getFaceSentence(face)
    nodes.push({
      id: `gm_set_${face}`,
      beatType: 'integration',
      wordCountEstimate: 40,
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: sentence || `You chose the ${face} path.`,
      choices: [{ text: 'Continue', targetId: 'moves_vibeulon' }],
      anchors: {},
    })
  }

  // Vibeulon intro — in-story before sign-up (FR7)
  nodes.push({
    id: 'moves_vibeulon',
    beatType: 'rising_engagement',
    wordCountEstimate: 35,
    emotional: { channel: 'Neutrality', movement: 'translate' },
    text: VIBEULON_INTRO,
    choices: [{ text: 'Continue', targetId: 'moves_commit' }],
    anchors: {},
  })

  // Commit (transcendence)
  nodes.push({
    id: 'moves_commit',
    beatType: 'transcendence',
    wordCountEstimate: 25,
    emotional: { channel: 'Joy', movement: 'transcend' },
    text: COMMIT_TEXT,
    choices: [{ text: 'Continue', targetId: 'moves_signup' }],
    anchors: {},
    isActionNode: true,
    actionType: 'signup',
  })

  // Signup (consequence)
  nodes.push({
    id: 'moves_signup',
    beatType: 'consequence',
    wordCountEstimate: 30,
    emotional: { channel: 'Joy', movement: 'translate' },
    text: SIGNUP_TEXT,
    choices: [{ text: 'Create my account', targetId: 'signup' }],
    anchors: { identityCue: 'Early Believer', consequenceCue: 'contribution logged' },
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
    startNodeId: 'moves_intro',
  }
}
