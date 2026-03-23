/**
 * Face × Move passage system.
 *
 * 4 moves × 6 faces = 24 combinations. Each yields:
 *  - passage: the narrative text shown at the emit node
 *  - barPrompt: the question the player answers (pre-fills barDescription)
 *  - barTitle: a seed title for the emitted BAR
 *  - blueprintKey: key into BLUEPRINT_PROMPT_SNIPPETS
 *
 * The face is IMPLICIT — derived from the portal hexagram, never shown as
 * face vocabulary to the player. The move (Wake Up / Clean Up / Grow Up /
 * Show Up) is the player's explicit choice. The face shapes tone + prompt.
 */

export type GameMasterFace =
  | 'shaman'
  | 'challenger'
  | 'regent'
  | 'architect'
  | 'diplomat'
  | 'sage'

export type PortalMove = 'wakeUp' | 'cleanUp' | 'showUp'

export interface FaceMoveContent {
  passage: string
  barTitle: string
  barPrompt: string
  blueprintKey: string
}

export const FACE_MOVE_PASSAGES: Record<GameMasterFace, Record<PortalMove, FaceMoveContent>> = {
  shaman: {
    wakeUp: {
      passage:
        "You've crossed a threshold. Something that was beneath the surface is asking to be seen. This is arrival energy — not urgency, but presence.\n\nLet what's here be witnessed.",
      barTitle: 'What became visible',
      barPrompt: 'What became visible when you stepped in?',
      blueprintKey: 'face_shaman_move_wakeUp',
    },
    cleanUp: {
      passage:
        "Something old is pressing against you from below. It belongs to a longer story than this moment — ancestral, recurring, familiar in its weight.\n\nThe work is to name it without becoming it.",
      barTitle: 'What pattern is active',
      barPrompt: 'What ancestral or recurring pattern is active in your stuck-ness right now?',
      blueprintKey: 'face_shaman_move_cleanUp',
    },
    showUp: {
      passage:
        "You are making yourself present to the community. This act of showing up is ritual — it changes the field simply by happening.\n\nThe offering matters. Name it.",
      barTitle: 'My offering',
      barPrompt: 'What is the offering you are bringing? Name what you are committing to.',
      blueprintKey: 'face_shaman_move_showUp',
    },
  },
  challenger: {
    wakeUp: {
      passage:
        "You showed up at the edge. This moment has been waiting for someone with your nerve. Waking up here means facing what others look away from.\n\nName it plainly.",
      barTitle: 'The truth I see',
      barPrompt: 'What truth are you willing to name right now?',
      blueprintKey: 'face_challenger_move_wakeUp',
    },
    cleanUp: {
      passage:
        "You've hit something real. The friction is telling you something worth hearing. Most people avoid it — you're here because you don't.\n\nSay what's actually in the way.",
      barTitle: 'What is actually blocking me',
      barPrompt: "What are you avoiding naming? Say it plainly — what's actually in the way?",
      blueprintKey: 'face_challenger_move_cleanUp',
    },
    showUp: {
      passage:
        "This is the moment of choosing the hard thing. Showing up here is an act of courage — not the performance of it, but the real thing.\n\nBe specific. Vague is not yet showing up.",
      barTitle: 'My commitment',
      barPrompt: 'What is the specific, real action you are committing to?',
      blueprintKey: 'face_challenger_move_showUp',
    },
  },
  regent: {
    wakeUp: {
      passage:
        "You've arrived in a field that has structure. There is an order here worth understanding — roles, relationships, what's available and what isn't.\n\nOrient before you act.",
      barTitle: 'The lay of the land',
      barPrompt: "What is the lay of the land? What's actually available to you here?",
      blueprintKey: 'face_regent_move_wakeUp',
    },
    cleanUp: {
      passage:
        "A role is unclear, or a boundary has been crossed. Restoring order begins with seeing what's out of order — not blame, but clarity about what structure is missing.\n\nName the gap.",
      barTitle: 'What structure is missing',
      barPrompt: 'What structure or accountability is missing that is creating the block?',
      blueprintKey: 'face_regent_move_cleanUp',
    },
    showUp: {
      passage:
        "Your role in the collective requires this action. You are not showing up for yourself alone — you are showing up for the structure that depends on your presence.\n\nName the responsibility.",
      barTitle: 'My role-responsibility',
      barPrompt: 'What is the responsibility you are fulfilling? What does your role require of you here?',
      blueprintKey: 'face_regent_move_showUp',
    },
  },
  architect: {
    wakeUp: {
      passage:
        "You stepped into the blueprint. The system is visible if you look with the right eyes — leverage points, bottlenecks, what one thing unlocks many things.\n\nScan the field.",
      barTitle: 'The leverage point I see',
      barPrompt: 'What leverage point do you see? What one thing unlocks many things here?',
      blueprintKey: 'face_architect_move_wakeUp',
    },
    cleanUp: {
      passage:
        "The system has a bottleneck — not emotional, structural. The block is architectural, and finding it is half the work.\n\nDiagnose before fixing.",
      barTitle: 'The structural cause',
      barPrompt: 'What is the structural cause of this friction? What would a clean design fix?',
      blueprintKey: 'face_architect_move_cleanUp',
    },
    showUp: {
      passage:
        "This action is a move in a larger game. Showing up here connects to strategy you've been building — not isolated effort, but a node in a system.\n\nName the downstream consequence.",
      barTitle: 'My strategic commitment',
      barPrompt: 'What does this action unlock downstream? Name the commitment and its systemic consequence.',
      blueprintKey: 'face_architect_move_showUp',
    },
  },
  diplomat: {
    wakeUp: {
      passage:
        "You arrived into relationship. The field is relational — who else is here, what they need, what's trying to form between people.\n\nFeel into the room before speaking.",
      barTitle: 'What is asking for my attention',
      barPrompt: 'Who or what is asking for your attention in this moment?',
      blueprintKey: 'face_diplomat_move_wakeUp',
    },
    cleanUp: {
      passage:
        "A relationship or collective dynamic is carrying tension. Something between people needs tending — not fixing, not managing, but honest contact.\n\nName the relational cost.",
      barTitle: 'The relational tension I see',
      barPrompt: 'What is the relational cost of this block? Who else is affected by what is stuck?',
      blueprintKey: 'face_diplomat_move_cleanUp',
    },
    showUp: {
      passage:
        "Showing up in this context is relational — your presence matters to others who are watching for it. This is not performance; it is presence.\n\nName who it serves.",
      barTitle: 'My presence as commitment',
      barPrompt: 'Who is affected by whether you show up? Name the commitment in terms of the people it serves.',
      blueprintKey: 'face_diplomat_move_showUp',
    },
  },
  sage: {
    wakeUp: {
      passage:
        "You've stepped into a pattern that includes all the prior patterns. From this altitude you can see what the lower floors can't — the meta-pattern, the larger arc.\n\nSee from the widest angle before descending.",
      barTitle: 'The meta-pattern',
      barPrompt: 'What is the meta-pattern? What is this moment an instance of?',
      blueprintKey: 'face_sage_move_wakeUp',
    },
    cleanUp: {
      passage:
        "The friction is information about a transition. You are between two patterns, and the old one is resisting. This is not failure — it is the necessary resistance of a system changing.\n\nName what is completing and what is emerging.",
      barTitle: 'What is completing / emerging',
      barPrompt: 'What is completing and what is emerging? What do you need to metabolize to move?',
      blueprintKey: 'face_sage_move_cleanUp',
    },
    showUp: {
      passage:
        "Showing up at this level means acting from the whole, not just the part. This commitment is integrative — it holds multiple perspectives at once.\n\nName what becomes possible.",
      barTitle: 'My integrative commitment',
      barPrompt: 'What is the commitment that integrates your current understanding? What becomes possible because of it?',
      blueprintKey: 'face_sage_move_showUp',
    },
  },
}

/** Grow Up transition text per face (routes to schools, no BAR emit) */
export const GROW_UP_TRANSITION: Record<GameMasterFace, string> = {
  shaman:
    'The schools hold initiatory knowledge. You are crossing into a learning that changes who you are — not just what you know.',
  challenger:
    'Growth happens at the edge of what you can currently do. The school will put you there. Go toward what is hard.',
  regent:
    'Skillful role requires ongoing study. You are attending to your development as a form of duty — to the people your role serves.',
  architect:
    'Every upgrade in capacity upgrades the whole system. You are about to expand what you are capable of building.',
  diplomat:
    'Growing up together is different from growing up alone. The school is also a community — come with your questions.',
  sage:
    'Developmental growth is a gift forward — to your future self and to everyone you will eventually influence. Go learn.',
}

const FACES: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
const MOVES: PortalMove[] = ['wakeUp', 'cleanUp', 'showUp']

export function getFaceMoveContent(
  face: string | undefined,
  move: PortalMove
): FaceMoveContent | null {
  if (!face || !FACES.includes(face as GameMasterFace)) return null
  return FACE_MOVE_PASSAGES[face as GameMasterFace][move]
}

export function getGrowUpTransition(face: string | undefined): string | null {
  if (!face || !FACES.includes(face as GameMasterFace)) return null
  return GROW_UP_TRANSITION[face as GameMasterFace]
}

export const EMIT_NODE_IDS = {
  wakeUp: 'WakeUp_Emit',
  cleanUp: 'CleanUp_Emit',
  showUp: 'ShowUp_Emit',
  hubReturn: 'Hub_Return',
} as const

export function moveFromEmitNodeId(nodeId: string): PortalMove | null {
  if (nodeId === EMIT_NODE_IDS.wakeUp) return 'wakeUp'
  if (nodeId === EMIT_NODE_IDS.cleanUp) return 'cleanUp'
  if (nodeId === EMIT_NODE_IDS.showUp) return 'showUp'
  return null
}
