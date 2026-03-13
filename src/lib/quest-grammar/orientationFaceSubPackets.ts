/**
 * Orientation Face Sub-Packets — 6 face-specific sub-packets for the orientation quest.
 *
 * Each sub-packet guides a player through co-creating a TransformationMove proposal
 * from the unique lens of one Game Master face. Pure compiler; no AI, no Prisma.
 *
 * Each face elicits a different subset of TransformationMove schema fields:
 *   shaman    → description, purpose, emotion channels, safety notes
 *   challenger → wcgs_stage, target_effect, lock types, bar_integration
 *   regent    → move_category, wcgs_stage, quest_usage, compatible_nations
 *   architect → move_id/name, prompt_templates, output type, description
 *   diplomat  → compatible_archetypes, emotion channels, safety notes, follow-ups
 *   sage      → quest_usage arc, bar_integration, purpose, can_stand_alone
 *
 * Part of the orientation quest system (BARs Engine orientation-quest-system AC1-Sub2).
 * @see .specify/specs/orientation-quest-system/spec.md
 */

import { FACE_META } from './types'
import type { SerializableQuestPacket, QuestNode, GameMasterFace, SegmentVariant } from './types'

// ─── Shared input type ────────────────────────────────────────────────────────

export interface FaceSubPacketInput {
  segment?: SegmentVariant
  /** Optional move name to seed the prompts (used when remixing an existing move). */
  seedMoveName?: string
}

// ─── Field prompt copy — face-specific ───────────────────────────────────────

/**
 * Shaman sub-packet content.
 * Focus fields: description, purpose, compatible_emotion_channels, safety_notes
 */
const SHAMAN_BEATS = [
  {
    id: 'shaman_intro',
    text: `**The Shaman holds the threshold.** Every TransformationMove is a crossing — from one way of being into another. Before we name the mechanics, we feel the passage.

This face asks: *What kind of threshold does this move create?*`,
  },
  {
    id: 'shaman_description',
    text: `**What experience does this move unlock?** Describe it from inside the crossing — not what the move *does* mechanically, but what a person *lives* when they step through it.

> Prompt your proposal: *This move creates a crossing from ______ to ______.*`,
  },
  {
    id: 'shaman_purpose',
    text: `**What does the ritual complete or initiate?** Every transformation has a before and an after. Name the initiatory purpose: what is being released, and what is being opened.

> Prompt your proposal: *The purpose of this move is to ______ so that ______.*`,
  },
  {
    id: 'shaman_emotions',
    text: `**Which emotional currents can this move work with?** The Shaman knows that transformation runs through the body before the mind. Which channels are alive in this crossing?

Choose all that apply: **fear · anger · sadness · neutrality · joy**

> Prompt your proposal: *This move is compatible with: ______.*`,
  },
  {
    id: 'shaman_safety',
    text: `**What must a guide honor at this threshold?** No crossing is without risk. Name the care conditions — what a guide must hold so the traveler is safe.

> Prompt your proposal: *Safety note: ______.*`,
  },
  {
    id: 'shaman_synthesis',
    text: `**You have named the threshold.** Review what you've surfaced: description, purpose, emotional currents, and safety notes. These become the living heart of your move proposal.

When you're ready, submit this face's contribution.`,
  },
]

/**
 * Challenger sub-packet content.
 * Focus fields: wcgs_stage, target_effect, compatible_lock_types, bar_integration
 */
const CHALLENGER_BEATS = [
  {
    id: 'challenger_intro',
    text: `**The Challenger tests under pressure.** A move must do something real — measurable, actionable, leverageable. Vague intention is not a TransformationMove.

This face asks: *What exactly does this move accomplish, and how do we know it worked?*`,
  },
  {
    id: 'challenger_stage',
    text: `**Which stage of development does this move belong to?** Each stage demands a different kind of move:

- **wake_up** — Awareness and naming
- **clean_up** — Release and emotional processing
- **grow_up** — Reframing and expanding capacity
- **show_up** — Action and behavioral experiment

> Prompt your proposal: *This move belongs to: ______.*`,
  },
  {
    id: 'challenger_target_effect',
    text: `**What measurable change does this move create?** The Challenger doesn't accept "better" or "more aware." Name the specific effect — what shifts as a direct result of completing this move.

Examples: *pattern_visibility, identity_distance, embodied_awareness, meaning_shift, assumption_disruption, behavioral_activation, value_capture*

> Prompt your proposal: *target_effect: ______.*`,
  },
  {
    id: 'challenger_locks',
    text: `**Which blocks does this move break?** Every lock is a specific stuckness. Identify which lock types this move directly addresses:

- **identity_lock** — "That's just who I am"
- **emotional_lock** — Emotions too intense to move through
- **action_lock** — Inability to take the next step
- **possibility_lock** — "That's not possible for me"

> Prompt your proposal: *compatible_lock_types: ______.*`,
  },
  {
    id: 'challenger_bar',
    text: `**Does this move generate a tracking BAR?** BARs are the score. A move that creates measurable change can create a BAR to track it. Does this move create a BAR, and if so, when and what type?

Options: *creates_bar: true/false | bar_timing: pre_action / post_action / completion | bar_type: insight / vibe*

> Prompt your proposal: *bar_integration: ______.*`,
  },
  {
    id: 'challenger_synthesis',
    text: `**You have defined the proving ground.** You've identified stage, target effect, lock types, and BAR integration. These are the structural bones of your move proposal — the part that makes it testable.

When you're ready, submit this face's contribution.`,
  },
]

/**
 * Regent sub-packet content.
 * Focus fields: move_category, wcgs_stage, quest_usage, compatible_nations
 */
const REGENT_BEATS = [
  {
    id: 'regent_intro',
    text: `**The Regent maintains order.** The registry is a living system of roles and rules. Every move must know its place — its category, its stage, its function in the arc, and the territory it governs.

This face asks: *Where exactly does this move belong in the structure?*`,
  },
  {
    id: 'regent_category',
    text: `**What category does this move belong to?** The registry recognizes five categories:

- **awareness** — Surfacing what is hidden
- **reframing** — Changing interpretation
- **emotional_processing** — Working with felt experience
- **behavioral_experiment** — Testing new actions
- **integration** — Anchoring learning as durable value

> Prompt your proposal: *move_category: ______.*`,
  },
  {
    id: 'regent_quest_usage',
    text: `**Where in the arc does this move appear?** Name the quest stage and whether it is required for a full arc:

Quest stages: *reflection · cleanup · growth · action · completion*

Also: Can this move stand alone, or does it require preceding context?

> Prompt your proposal: *quest_stage: ______ | is_required_for_full_arc: ______ | can_stand_alone: ______.*`,
  },
  {
    id: 'regent_nations',
    text: `**Which nations especially benefit from this move?** The five nations carry different emotional energies. Some moves resonate more strongly with specific national channels.

Nations: *Argyra (clarity) · Pyrakanth (passion) · Virelune (hope) · Meridia (calm) · Lamenth (flow)*

Leave blank if the move is nation-agnostic.

> Prompt your proposal: *compatible_nations: ______.*`,
  },
  {
    id: 'regent_suggested_follows',
    text: `**What moves naturally follow this one?** The Regent thinks in sequences. Name the suggested follow-up moves — what comes next for a player who has completed this move.

Reference the canonical move IDs: *observe, name, externalize, feel, reframe, invert, experiment, integrate*

> Prompt your proposal: *suggested_follow_up_moves: ______.*`,
  },
  {
    id: 'regent_synthesis',
    text: `**You have mapped the order.** You've placed this move in its category, stage, arc position, national territory, and sequence. The Regent is satisfied when everything has its proper place.

When you're ready, submit this face's contribution.`,
  },
]

/**
 * Architect sub-packet content.
 * Focus fields: move_id, move_name, prompt_templates, typical_output_type, description
 */
const ARCHITECT_BEATS = [
  {
    id: 'architect_intro',
    text: `**The Architect builds the blueprint.** Before a move can live in the world, it needs an exact specification — a name, an ID, prompt templates that work, and a clear output type. Precision is the advantage.

This face asks: *What is the exact technical specification of this move?*`,
  },
  {
    id: 'architect_name',
    text: `**Name the move.** The move name is what players see. The move ID is what the system uses — lowercase, snake_case, unique within the registry.

Examples: *move_name: "Observe" → move_id: "observe"*

> Prompt your proposal: *move_name: ______ | move_id: ______.*`,
  },
  {
    id: 'architect_description',
    text: `**Write a precise one-sentence description.** The description tells what the move does — not why, not how a player experiences it, but what it *does* as a functional unit.

Examples: *"Increase awareness of a pattern without judgment." | "Separate the pattern from identity."*

> Prompt your proposal: *description: ______.*`,
  },
  {
    id: 'architect_templates',
    text: `**Write 2–3 prompt templates.** Templates use placeholder tokens: **{actor}** (the player), **{state}** (the emotional/mental state), **{object}** (the thing being worked with).

Each template also has a type: *reflection · dialogue · somatic · action · integration*

Example: *"What story are you telling yourself about {object}?" [reflection]*

> Prompt your proposal (write one per line): ______.*`,
  },
  {
    id: 'architect_output_type',
    text: `**What type of output does this move produce?** The output type determines how responses are processed and stored.

- **reflection** — Written insight
- **dialogue** — Externalised inner voice
- **somatic** — Body-based awareness
- **action** — Concrete next step
- **integration** — Retained learning artifact

> Prompt your proposal: *typical_output_type: ______.*`,
  },
  {
    id: 'architect_synthesis',
    text: `**The blueprint is drawn.** You have the move ID, name, description, prompt templates, and output type. This is the technical skeleton — the part the system can build from.

When you're ready, submit this face's contribution.`,
  },
]

/**
 * Diplomat sub-packet content.
 * Focus fields: compatible_archetypes, compatible_emotion_channels, safety_notes, suggested_follow_up_moves
 */
const DIPLOMAT_BEATS = [
  {
    id: 'diplomat_intro',
    text: `**The Diplomat reads the relational field.** Every move lands differently depending on who is holding it and who they are. A move's true power shows in connection — with one's archetype, one's emotional terrain, and what comes before and after.

This face asks: *Who is this move for, and how does it connect?*`,
  },
  {
    id: 'diplomat_archetypes',
    text: `**Which archetypes especially benefit from this move?** Each archetype carries a distinct way of moving through the world. Some moves fit certain archetypes naturally — the right key for the right lock.

If the move is archetype-agnostic, note that too.

> Prompt your proposal: *compatible_archetypes: ______ (or: archetype-agnostic)*`,
  },
  {
    id: 'diplomat_emotions',
    text: `**What emotional landscape does this move work within?** The Diplomat knows that emotional attunement is the difference between a move that heals and one that harms. Name the emotion channels this move is most attuned to:

**fear · anger · sadness · neutrality · joy**

> Prompt your proposal: *compatible_emotion_channels: ______.*`,
  },
  {
    id: 'diplomat_safety',
    text: `**What relational care is required?** The Diplomat cares for the field between guide and player. Name the relational safety notes — what the guide must hold, what to watch for, what pacing or containment is needed.

> Prompt your proposal: *safety_notes: ______.*`,
  },
  {
    id: 'diplomat_followups',
    text: `**What comes next?** The Diplomat thinks in terms of continuity. What move naturally follows this one — what does the player need after they've completed this crossing?

Reference canonical IDs: *observe, name, externalize, feel, reframe, invert, experiment, integrate*

> Prompt your proposal: *suggested_follow_up_moves: ______.*`,
  },
  {
    id: 'diplomat_synthesis',
    text: `**You have mapped the relational field.** Compatible archetypes, emotional attunement, safety care, and continuity into what's next. This is the connective tissue of your move proposal.

When you're ready, submit this face's contribution.`,
  },
]

/**
 * Sage sub-packet content.
 * Focus fields: quest_usage (arc integration), bar_integration, purpose, can_stand_alone
 */
const SAGE_BEATS = [
  {
    id: 'sage_intro',
    text: `**The Sage sees the whole.** Before any field is filled, the Sage asks: what enduring change does this move make possible? A move that doesn't serve the whole arc is just an exercise. True integration serves emergence.

This face asks: *What does this move contribute to the player's long arc of transformation?*`,
  },
  {
    id: 'sage_arc_fit',
    text: `**Where does this move fit in the full arc of transformation?** The arc moves from awareness → processing → growth → action → integration. A move serves the arc only if it creates conditions for what comes next.

Describe how this move enables the player to take the next step in their arc.

> Prompt your proposal: *Arc contribution: ______.*`,
  },
  {
    id: 'sage_bar_integration',
    text: `**What long-term value does this move anchor?** BARs (Beliefs/Actions/Results) track transformation over time. A move that creates lasting change deserves a tracking mechanism.

Does this move create a BAR? If so: when (pre_action / post_action / completion), what type (insight / vibe), and what does the BAR prompt ask?

> Prompt your proposal: *bar_integration: ______.*`,
  },
  {
    id: 'sage_purpose',
    text: `**What is the move's deepest purpose?** Strip away the mechanism. What enduring change in capacity, perspective, or relationship to self does this move serve?

> Prompt your proposal: *purpose: ______.*`,
  },
  {
    id: 'sage_standalone',
    text: `**Can this move stand alone?** Some moves require preceding context to be safe and effective. Others can be entered cold. The Sage knows when a move needs the river it's part of, and when it can be its own pool.

> Prompt your proposal: *can_stand_alone: true/false | Reason: ______.*`,
  },
  {
    id: 'sage_synthesis',
    text: `**You have seen the whole.** Arc fit, BAR integration, deepest purpose, and standalone capacity. The Sage completes the proposal by asking whether it serves emergence — whether the whole is greater than the sum of its parts.

When you're ready, submit this face's contribution.`,
  },
]

// ─── Beat-to-node compiler (shared utility) ───────────────────────────────────

type BeatEntry = { id: string; text: string }

function compileSubPacketNodes(
  face: GameMasterFace,
  beats: BeatEntry[],
  packetPrefix: string
): QuestNode[] {
  const nodes: QuestNode[] = []
  const ids = beats.map((b) => `${packetPrefix}_${b.id}`)

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]!
    const nodeId = ids[i]!
    const isFirst = i === 0
    const isLast = i === beats.length - 1
    const nextId = !isLast ? ids[i + 1]! : `${packetPrefix}_terminal`

    nodes.push({
      id: nodeId,
      beatType: isFirst
        ? 'orientation'
        : isLast
          ? 'integration'
          : i === 1
            ? 'rising_engagement'
            : i === beats.length - 2
              ? 'tension'
              : 'rising_engagement',
      wordCountEstimate: Math.round(beat.text.replace(/[^a-zA-Z ]/g, ' ').split(/\s+/).length * 1.2),
      emotional: { channel: 'Neutrality', movement: 'translate' },
      text: beat.text,
      choices: isLast
        ? [{ text: 'Submit this face\'s contribution', targetId: `${packetPrefix}_terminal` }]
        : [{ text: 'Continue', targetId: nextId }],
      anchors: isFirst ? { goal: 'move proposal co-creation' } : {},
      depth: 1,
      gameMasterFace: face,
    })
  }

  // Terminal node — chains to the next stage (e.g. review or submission)
  nodes.push({
    id: `${packetPrefix}_terminal`,
    beatType: 'consequence',
    wordCountEstimate: 10,
    emotional: { channel: 'Joy', movement: 'translate' },
    text: `**${FACE_META[face].label} contribution recorded.** This face's lens has been applied. Your proposal fields are ready for review.`,
    choices: [],
    anchors: { consequenceCue: `${face} fields submitted` },
    depth: 1,
    gameMasterFace: face,
  })

  return nodes
}

// ─── 6 face sub-packet compilers ─────────────────────────────────────────────

export function compileShamanFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'shaman'
  const prefix = 'orient_shaman'
  const nodes = compileSubPacketNodes(face, SHAMAN_BEATS, prefix)

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
    startNodeId: `${prefix}_${SHAMAN_BEATS[0]!.id}`,
  }
}

export function compileChallengerFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'challenger'
  const prefix = 'orient_challenger'
  const nodes = compileSubPacketNodes(face, CHALLENGER_BEATS, prefix)

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
    startNodeId: `${prefix}_${CHALLENGER_BEATS[0]!.id}`,
  }
}

export function compileRegentFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'regent'
  const prefix = 'orient_regent'
  const nodes = compileSubPacketNodes(face, REGENT_BEATS, prefix)

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
    startNodeId: `${prefix}_${REGENT_BEATS[0]!.id}`,
  }
}

export function compileArchitectFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'architect'
  const prefix = 'orient_architect'
  const nodes = compileSubPacketNodes(face, ARCHITECT_BEATS, prefix)

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
    startNodeId: `${prefix}_${ARCHITECT_BEATS[0]!.id}`,
  }
}

export function compileDiplomatFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'diplomat'
  const prefix = 'orient_diplomat'
  const nodes = compileSubPacketNodes(face, DIPLOMAT_BEATS, prefix)

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
    startNodeId: `${prefix}_${DIPLOMAT_BEATS[0]!.id}`,
  }
}

export function compileSageFaceSubPacket(input: FaceSubPacketInput = {}): SerializableQuestPacket {
  const { segment = 'player' } = input
  const face: GameMasterFace = 'sage'
  const prefix = 'orient_sage'
  const nodes = compileSubPacketNodes(face, SAGE_BEATS, prefix)

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
    startNodeId: `${prefix}_${SAGE_BEATS[0]!.id}`,
  }
}

// ─── Face field mapping (static lookup) ──────────────────────────────────────

/**
 * Static mapping: each face → the TransformationMove fields it elicits.
 * Used for branch-to-field mapping at compile time — no runtime derivation.
 */
export const FACE_FIELD_MAP: Record<GameMasterFace, (keyof import('../transformation-move-registry/types').TransformationMove)[]> = {
  shaman: ['description', 'purpose', 'compatible_emotion_channels', 'safety_notes'],
  challenger: ['wcgs_stage', 'target_effect', 'compatible_lock_types', 'bar_integration'],
  regent: ['move_category', 'wcgs_stage', 'quest_usage', 'compatible_nations'],
  architect: ['move_id', 'move_name', 'prompt_templates', 'typical_output_type', 'description'],
  diplomat: ['compatible_archetypes', 'compatible_emotion_channels', 'safety_notes', 'quest_usage'],
  sage: ['quest_usage', 'bar_integration', 'purpose', 'typical_output_type'],
}

// ─── Router ──────────────────────────────────────────────────────────────────

/** Dispatch to the correct face sub-packet compiler. */
export const FACE_SUB_PACKET_COMPILERS: Record<
  GameMasterFace,
  (input?: FaceSubPacketInput) => SerializableQuestPacket
> = {
  shaman: compileShamanFaceSubPacket,
  challenger: compileChallengerFaceSubPacket,
  regent: compileRegentFaceSubPacket,
  architect: compileArchitectFaceSubPacket,
  diplomat: compileDiplomatFaceSubPacket,
  sage: compileSageFaceSubPacket,
}

/**
 * Compile the face sub-packet for any given face.
 * Single entry point for the orientation quest orchestrator.
 */
export function compileFaceSubPacket(
  face: GameMasterFace,
  input: FaceSubPacketInput = {}
): SerializableQuestPacket {
  const compiler = FACE_SUB_PACKET_COMPILERS[face]
  return compiler(input)
}
