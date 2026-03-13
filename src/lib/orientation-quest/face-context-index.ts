/**
 * Orientation Quest — Face Context Index
 *
 * Extracts and indexes all existing face descriptions from their canonical sources
 * into a single structured context object. Each entry captures:
 *   - semantic intent    : thematic lens + orientation stance
 *   - field_slots        : TransformationMove fields this face elicits in a sub-packet
 *   - descriptive metadata: label, role, mission, color, trigram, entry sentence
 *   - mapping_cues       : keyword/phrase signals for inference when mapping
 *                          player narrative to a face's domain
 *
 * Data sources (static, compile-time):
 *   - FACE_META         → src/lib/quest-grammar/types.ts
 *   - FACE_SENTENCES    → src/lib/face-sentences.ts
 *   - FACE_TRIGRAM      → src/lib/quest-grammar/iching-faces.ts
 *   - TransformationMove → src/lib/transformation-move-registry/types.ts
 *
 * No AI, no Prisma. Safe for server and client bundles.
 *
 * @see .specify/specs/orientation-quest/spec.md (AC 23a)
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { TransformationMove } from '@/lib/transformation-move-registry/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The semantic orientation a face brings to the TransformationMove co-creation
 * dialogue. Describes the "altitude" from which the player approaches the task.
 */
export interface FaceSemanticIntent {
  /** One-line thematic concept (e.g. "Mythic threshold and ritual belonging"). */
  theme: string
  /**
   * Stance the face invites the player to adopt when describing a move
   * (e.g. "Witness — observe from a place of held meaning").
   */
  orientation: string
  /**
   * Lens through which transformation is understood by this face
   * (e.g. "Change happens through initiation and crossing thresholds").
   */
  transformation_lens: string
  /**
   * The mode of entry — extracted verbatim from FACE_SENTENCES.
   * Encodes the implicit question each face asks first.
   */
  entry_sentence: string
}

/**
 * A single field slot — maps one TransformationMove field key to a plain-language
 * description of what the face's sub-packet is responsible for eliciting.
 *
 * `field_key` must be a top-level key of TransformationMove (or a dotted
 * sub-field path for nested objects, e.g. "bar_integration.bar_prompt_template").
 */
export interface FaceFieldSlot {
  /** Dot-notation path into TransformationMove (e.g. "compatible_lock_types"). */
  field_key: string
  /** Human-readable description of what this face elicits for this field. */
  elicitation_prompt: string
  /** Whether this face is the primary (sole) owner of this field slot. */
  is_primary: boolean
}

/**
 * Mapping inference cues: arrays of keywords/phrases that signal this face's
 * domain during free-text analysis of player input. Used by the few-shot
 * injection layer to route narrative fragments to the correct face sub-packet.
 */
export interface FaceMappingCues {
  /** Short trigger words strongly associated with this face's domain. */
  keywords: string[]
  /** Longer phrases or sentence patterns that indicate this face's lens. */
  phrase_patterns: string[]
  /**
   * Emotion channels most commonly processed via this face's lens.
   * Subset of EmotionalChannel ('Fear'|'Anger'|'Sadness'|'Joy'|'Neutrality').
   */
  dominant_channels: string[]
}

/**
 * Full structured context entry for a single Game Master face.
 * All data is derived from existing canonical sources — nothing is invented.
 */
export interface FaceContextEntry {
  /** The face identifier (canonical key). */
  face: GameMasterFace
  /** Display label (from FACE_META). */
  label: string
  /** Short role descriptor (from FACE_META). */
  role: string
  /** Mission statement (from FACE_META). */
  mission: string
  /** Tailwind color class (from FACE_META). */
  color: string
  /** I Ching trigram alignment (from FACE_TRIGRAM in iching-faces.ts). */
  trigram: string
  /** Semantic intent object derived from all face description sources. */
  semantic_intent: FaceSemanticIntent
  /**
   * Ordered list of TransformationMove field slots this face sub-packet owns.
   * When a face is the primary owner, its sub-packet questions elicit that field.
   * Secondary slots indicate the face contributes supplementary context.
   */
  field_slots: FaceFieldSlot[]
  /** Cues for mapping player narrative fragments to this face's domain. */
  mapping_cues: FaceMappingCues
}

/**
 * The complete face context index.
 * Keyed by GameMasterFace for O(1) lookup at prompt-construction time.
 */
export type FaceContextIndex = Record<GameMasterFace, FaceContextEntry>

// ---------------------------------------------------------------------------
// Field slot definitions (keyed by face)
// ---------------------------------------------------------------------------
// Each face owns a semantically coherent cluster of TransformationMove fields.
// Ownership is determined by which face's "altitude" (role/mission/theme) most
// naturally elicits each field through narrative dialogue.
//
// Primary owner = the face whose sub-packet questions are the canonical source
//                 for that field's value in a proposal record.
// Secondary      = the face contributes color/context but does not own the field.
// ---------------------------------------------------------------------------

const SHAMAN_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'description',
    elicitation_prompt:
      'Describe this move as if it were a ritual crossing — what threshold does the participant step through?',
    is_primary: true,
  },
  {
    field_key: 'safety_notes',
    elicitation_prompt:
      'What ritual care or ethical boundaries should guide use of this move? Name the conditions where it would be harmful.',
    is_primary: true,
  },
  {
    field_key: 'compatible_emotion_channels',
    elicitation_prompt:
      'Which emotional territories does this move work with — fear, anger, sadness, joy, or neutrality?',
    is_primary: true,
  },
]

const CHALLENGER_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'target_effect',
    elicitation_prompt:
      'What measurable or observable change should this move produce? Name the before-state and after-state.',
    is_primary: true,
  },
  {
    field_key: 'typical_output_type',
    elicitation_prompt:
      'What form does successful completion of this move take — reflection, dialogue, somatic response, action, or integration?',
    is_primary: true,
  },
  {
    field_key: 'compatible_lock_types',
    elicitation_prompt:
      'Which psychological locks or obstacles does this move unlock — identity, emotional, action, or possibility locks?',
    is_primary: true,
  },
]

const REGENT_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'wcgs_stage',
    elicitation_prompt:
      'Where does this move belong in the four-stage arc — wake_up, clean_up, grow_up, or show_up?',
    is_primary: true,
  },
  {
    field_key: 'quest_usage',
    elicitation_prompt:
      'How does this move fit within the quest system? Name its stage, whether it is required for the full arc, and whether it can stand alone.',
    is_primary: true,
  },
  {
    field_key: 'bar_integration',
    elicitation_prompt:
      'Does this move create a BAR (Behavioral Activation Record)? If so, when — before, during, or after action — and what type of bar?',
    is_primary: true,
  },
]

const ARCHITECT_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'move_category',
    elicitation_prompt:
      'What category best describes this move — awareness, reframing, emotional_processing, behavioral_experiment, or integration?',
    is_primary: true,
  },
  {
    field_key: 'prompt_templates',
    elicitation_prompt:
      'Write one or more concrete invocation prompts for this move. Each prompt should be directly usable by a facilitator or AI agent.',
    is_primary: true,
  },
  {
    field_key: 'purpose',
    elicitation_prompt:
      'State the strategic purpose of this move in one sentence — what problem does it solve and why does it matter in the arc?',
    is_primary: true,
  },
]

const DIPLOMAT_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'compatible_nations',
    elicitation_prompt:
      'Which community cultures or nations does this move resonate with most — and why does it fit their relational style?',
    is_primary: true,
  },
  {
    field_key: 'compatible_archetypes',
    elicitation_prompt:
      'Which player archetypes benefit most from this move? Name the archetypes and describe how the move fits their pattern.',
    is_primary: true,
  },
  {
    field_key: 'bar_integration.bar_prompt_template',
    elicitation_prompt:
      'If this move generates a BAR, write the prompt that invites the participant to reflect on the relational or communal dimension.',
    is_primary: true,
  },
]

const SAGE_FIELD_SLOTS: FaceFieldSlot[] = [
  {
    field_key: 'move_name',
    elicitation_prompt:
      'Name this move in a way that captures its integrative essence — a word or phrase that evokes the whole of what it does.',
    is_primary: true,
  },
  {
    field_key: 'quest_usage.suggested_follow_up_moves',
    elicitation_prompt:
      'What moves naturally follow this one in a full arc? Name the move IDs that should come next.',
    is_primary: true,
  },
  {
    field_key: 'quest_usage.is_required_for_full_arc',
    elicitation_prompt:
      'Is this move required to complete the full transformation arc, or is it optional enrichment?',
    is_primary: true,
  },
  {
    field_key: 'quest_usage.can_stand_alone',
    elicitation_prompt:
      'Can this move be used as a standalone intervention outside a quest arc? What context makes that appropriate?',
    is_primary: false,
  },
]

// ---------------------------------------------------------------------------
// Mapping cues (face → inference signals)
// ---------------------------------------------------------------------------

const SHAMAN_CUES: FaceMappingCues = {
  keywords: [
    'ritual', 'threshold', 'belonging', 'sacred', 'mythic', 'initiation',
    'ceremony', 'bridge', 'crossing', 'space', 'worlds', 'healing',
    'ancient', 'ground', 'root', 'earth',
  ],
  phrase_patterns: [
    'feels like a rite of passage',
    'crossing a threshold',
    'something sacred about this',
    'need a container for this',
    'the place where one thing ends and another begins',
    'bridge between',
    'sense of belonging',
    'held by something larger',
  ],
  dominant_channels: ['Fear', 'Sadness', 'Neutrality'],
}

const CHALLENGER_CUES: FaceMappingCues = {
  keywords: [
    'prove', 'test', 'edge', 'pressure', 'action', 'challenge', 'obstacle',
    'block', 'stuck', 'force', 'push', 'resistance', 'barrier', 'breakthrough',
    'fire', 'fight', 'friction',
  ],
  phrase_patterns: [
    'nothing is working',
    'up against a wall',
    'need to push through',
    'feels like a test',
    'keep hitting resistance',
    'prove myself',
    'facing the obstacle',
    'want to act but something stops me',
  ],
  dominant_channels: ['Anger', 'Fear'],
}

const REGENT_CUES: FaceMappingCues = {
  keywords: [
    'structure', 'order', 'system', 'process', 'rule', 'role', 'protocol',
    'collective', 'organize', 'framework', 'container', 'boundary', 'stage',
    'step', 'sequence', 'phase', 'governance',
  ],
  phrase_patterns: [
    'needs more structure',
    'unclear what the process is',
    'who is responsible for what',
    'chaos without a framework',
    'need a system',
    'where does this fit',
    'what stage are we in',
    'collective needs clarity',
  ],
  dominant_channels: ['Fear', 'Neutrality'],
}

const ARCHITECT_CUES: FaceMappingCues = {
  keywords: [
    'strategy', 'blueprint', 'design', 'plan', 'build', 'leverage', 'advantage',
    'project', 'construct', 'engineer', 'map', 'framework', 'logic', 'model',
    'heaven', 'vision', 'clarity',
  ],
  phrase_patterns: [
    'need a better strategy',
    'want to design this deliberately',
    'looking for the leverage point',
    'what is the blueprint for',
    'thinking through the architecture of',
    'how do we build this',
    'what is the model',
    'needs a clear design',
  ],
  dominant_channels: ['Neutrality', 'Joy'],
}

const DIPLOMAT_CUES: FaceMappingCues = {
  keywords: [
    'relationship', 'connect', 'care', 'weave', 'together', 'community',
    'trust', 'support', 'empathy', 'listen', 'dialogue', 'bridge', 'bond',
    'relational', 'field', 'network', 'wind',
  ],
  phrase_patterns: [
    'about the relationship between',
    'needs to feel connected',
    'sense of care missing',
    'want people to feel heard',
    'weaving different perspectives',
    'the relational dimension of this',
    'how do we build trust',
    'this is about who we are to each other',
  ],
  dominant_channels: ['Sadness', 'Joy', 'Fear'],
}

const SAGE_CUES: FaceMappingCues = {
  keywords: [
    'integration', 'whole', 'emergence', 'flow', 'complete', 'synthesis',
    'wisdom', 'pattern', 'all', 'meta', 'overview', 'perspective', 'mountain',
    'long view', 'see it all', 'meaning',
  ],
  phrase_patterns: [
    'seeing the whole picture',
    'how does this all fit together',
    'the deeper pattern here',
    'from a higher vantage',
    'what does integration look like',
    'the meaning of all of this',
    'completing the arc',
    'holding all the parts at once',
  ],
  dominant_channels: ['Neutrality', 'Joy'],
}

// ---------------------------------------------------------------------------
// Face Context Index — canonical static lookup
// ---------------------------------------------------------------------------

/**
 * FACE_CONTEXT_INDEX
 *
 * The single source of truth for face-to-field-slot and face-to-semantic-intent
 * mapping. All data is derived statically from existing codebase sources at
 * compile time — no runtime queries, no caching required.
 *
 * Usage:
 *   import { FACE_CONTEXT_INDEX } from '@/lib/orientation-quest/face-context-index'
 *   const entry = FACE_CONTEXT_INDEX['shaman']
 *   entry.field_slots  // → fields this face owns in a TransformationMove sub-packet
 *   entry.semantic_intent  // → thematic + orientation description
 *   entry.mapping_cues  // → keyword/phrase signals for inference routing
 */
export const FACE_CONTEXT_INDEX: FaceContextIndex = {
  shaman: {
    face: 'shaman',
    label: 'Shaman',
    role: 'Mythic threshold',
    mission: 'Belonging, ritual space, bridge between worlds',
    color: 'text-fuchsia-400',
    trigram: 'Earth',
    semantic_intent: {
      theme: 'Mythic threshold and ritual belonging',
      orientation:
        'Witness — approach the move as sacred ground, held by collective wisdom and the felt sense of belonging.',
      transformation_lens:
        'Change happens through initiation: a ritual crossing that anchors the new self in a larger story.',
      entry_sentence:
        "Enter through the mythic threshold: the residency as ritual space, Wendell's technology as a bridge between worlds. Your journey begins in belonging.",
    },
    field_slots: SHAMAN_FIELD_SLOTS,
    mapping_cues: SHAMAN_CUES,
  },

  challenger: {
    face: 'challenger',
    label: 'Challenger',
    role: 'Proving ground',
    mission: 'Action, edge, lever',
    color: 'text-red-400',
    trigram: 'Fire',
    semantic_intent: {
      theme: 'Proving ground — pressure that forges clarity',
      orientation:
        'Edge-walker — meet the move as an obstacle to overcome or a lever to use; transformation is earned through direct engagement.',
      transformation_lens:
        'Change happens through friction and testing: the proving ground reveals what is real and what is possible.',
      entry_sentence:
        "Enter through the edge: the residency as a proving ground, Wendell's technology as a lever. Your journey begins in action.",
    },
    field_slots: CHALLENGER_FIELD_SLOTS,
    mapping_cues: CHALLENGER_CUES,
  },

  regent: {
    face: 'regent',
    label: 'Regent',
    role: 'Order, structure',
    mission: 'Roles, rules, collective tool',
    color: 'text-amber-400',
    trigram: 'Lake',
    semantic_intent: {
      theme: 'Order and collective structure',
      orientation:
        'Steward — situate the move within the system; transformation requires clear roles, stages, and shared protocols.',
      transformation_lens:
        'Change happens through structure: defining where each piece belongs in the collective order.',
      entry_sentence:
        "Enter through the order: the residency as a house with roles and rules, Wendell's technology as a tool for the collective. Your journey begins in structure.",
    },
    field_slots: REGENT_FIELD_SLOTS,
    mapping_cues: REGENT_CUES,
  },

  architect: {
    face: 'architect',
    label: 'Architect',
    role: 'Blueprint',
    mission: 'Strategy, project, advantage',
    color: 'text-blue-400',
    trigram: 'Heaven',
    semantic_intent: {
      theme: 'Blueprint and strategic design',
      orientation:
        'Designer — build the move from first principles; transformation is an engineering challenge requiring clear purpose, levers, and prompts.',
      transformation_lens:
        'Change happens through intentional design: naming the category, crafting the invocation, stating the strategic purpose.',
      entry_sentence:
        "Enter through the blueprint: the residency as a project to build, Wendell's technology as an advantage. Your journey begins in strategy.",
    },
    field_slots: ARCHITECT_FIELD_SLOTS,
    mapping_cues: ARCHITECT_CUES,
  },

  diplomat: {
    face: 'diplomat',
    label: 'Diplomat',
    role: 'Weave',
    mission: 'Relational field, care, connector',
    color: 'text-teal-400',
    trigram: 'Wind',
    semantic_intent: {
      theme: 'Relational field and care',
      orientation:
        'Weaver — sense the move through its relational texture; transformation happens in the space between people and communities.',
      transformation_lens:
        'Change happens through connection: understanding who benefits, who this resonates with, and how it nurtures relationship.',
      entry_sentence:
        "Enter through the weave: the residency as a relational field, Wendell's technology as a connector. Your journey begins in care.",
    },
    field_slots: DIPLOMAT_FIELD_SLOTS,
    mapping_cues: DIPLOMAT_CUES,
  },

  sage: {
    face: 'sage',
    label: 'Sage',
    role: 'Whole',
    mission: 'Integration, emergence, flow',
    color: 'text-purple-400',
    trigram: 'Mountain',
    semantic_intent: {
      theme: 'Whole-system integration and emergence',
      orientation:
        'Integrator — see the move within the full arc; transformation is complete when all parts cohere into a new emergent whole.',
      transformation_lens:
        'Change happens through integration: naming the move, tracing its place in the arc, and blessing what comes next.',
      entry_sentence:
        "Enter through the whole: the residency as one expression of emergence, Wendell's technology as part of the flow. Your journey begins in integration.",
    },
    field_slots: SAGE_FIELD_SLOTS,
    mapping_cues: SAGE_CUES,
  },
} as const

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Returns all GameMasterFace keys in canonical order.
 * (shaman → challenger → regent → architect → diplomat → sage)
 */
export const ORDERED_FACES: GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

/**
 * Returns all primary-owned field slot keys for a given face.
 * Useful for validating that a sub-packet has populated its owned fields.
 */
export function getPrimaryFieldKeys(face: GameMasterFace): string[] {
  return FACE_CONTEXT_INDEX[face].field_slots
    .filter((slot) => slot.is_primary)
    .map((slot) => slot.field_key)
}

/**
 * Returns the full set of TransformationMove field keys owned (primarily) across
 * ALL faces. Can be compared against TransformationMove's required keys to verify
 * structural completeness of the sub-packet system.
 */
export function getAllOwnedFieldKeys(): string[] {
  const keys = new Set<string>()
  for (const face of ORDERED_FACES) {
    for (const slot of FACE_CONTEXT_INDEX[face].field_slots) {
      if (slot.is_primary) keys.add(slot.field_key)
    }
  }
  return [...keys]
}

/**
 * Given a free-text fragment, scores each face by counting keyword matches.
 * Returns faces sorted by descending match count.
 *
 * This is a lightweight, purely deterministic function intended for use in
 * prompt-construction routing — not a semantic embedding search.
 */
export function scoreFacesByText(text: string): Array<{ face: GameMasterFace; score: number }> {
  const lower = text.toLowerCase()
  return ORDERED_FACES.map((face) => {
    const { keywords, phrase_patterns } = FACE_CONTEXT_INDEX[face].mapping_cues
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1
    }
    for (const phrase of phrase_patterns) {
      if (lower.includes(phrase.toLowerCase())) score += 2
    }
    return { face, score }
  }).sort((a, b) => b.score - a.score)
}

/**
 * Returns the face entry for a given TransformationMove field key.
 * Finds the primary owner of that field slot.
 * Returns undefined if no face owns that field primarily.
 */
export function getFaceForField(fieldKey: string): FaceContextEntry | undefined {
  for (const face of ORDERED_FACES) {
    const entry = FACE_CONTEXT_INDEX[face]
    const primarySlot = entry.field_slots.find(
      (slot) => slot.is_primary && slot.field_key === fieldKey,
    )
    if (primarySlot) return entry
  }
  return undefined
}

/**
 * Validates that all primary field slots across all faces map to valid top-level
 * TransformationMove keys (or known dotted sub-paths).
 * Returns an array of any unrecognized keys.
 */
export function validateFieldSlotCoverage(): string[] {
  // Top-level TransformationMove keys (from types.ts)
  const KNOWN_TOP_LEVEL_KEYS = new Set<string>([
    'move_id',
    'move_name',
    'move_category',
    'wcgs_stage',
    'description',
    'purpose',
    'prompt_templates',
    'target_effect',
    'typical_output_type',
    'compatible_lock_types',
    'compatible_emotion_channels',
    'compatible_nations',
    'compatible_archetypes',
    'bar_integration',
    'quest_usage',
    'safety_notes',
  ])

  // Known dotted sub-paths
  const KNOWN_SUB_PATHS = new Set<string>([
    'bar_integration.creates_bar',
    'bar_integration.bar_timing',
    'bar_integration.bar_type',
    'bar_integration.bar_prompt_template',
    'bar_integration.optional_tracking_bar',
    'quest_usage.quest_stage',
    'quest_usage.is_required_for_full_arc',
    'quest_usage.can_stand_alone',
    'quest_usage.suggested_follow_up_moves',
  ])

  const unknown: string[] = []
  for (const face of ORDERED_FACES) {
    for (const slot of FACE_CONTEXT_INDEX[face].field_slots) {
      const topLevel = slot.field_key.split('.')[0]
      const isValid =
        KNOWN_TOP_LEVEL_KEYS.has(slot.field_key) ||
        KNOWN_TOP_LEVEL_KEYS.has(topLevel) ||
        KNOWN_SUB_PATHS.has(slot.field_key)
      if (!isValid) unknown.push(`${face}:${slot.field_key}`)
    }
  }
  return unknown
}
