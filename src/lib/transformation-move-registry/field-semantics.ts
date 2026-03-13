/**
 * TransformationMove Field Semantics — Annotated Schema
 *
 * Defines field names, TypeScript types, roles, valid values, and intent
 * descriptions for every field in the TransformationMove schema.
 *
 * Consumed by:
 *   - The orientation quest mapping proposer (maps player GM-face responses →
 *     TransformationMove proposal fields)
 *   - The challenger agent (structural completeness validation)
 *   - Admin UI (constraint display for face sub-packet authoring)
 *
 * Spec: .specify/specs/transformation-move-library/spec.md
 */

// ---------------------------------------------------------------------------
// Annotation types
// ---------------------------------------------------------------------------

/**
 * The role a field plays inside the TransformationMove schema.
 *
 * - `identifier`          — uniquely names or IDs the move
 * - `stage-classifier`    — places the move in a developmental sequence
 * - `behavioral-intent`   — describes what the move does / aims to produce
 * - `player-facing-prompt`— text or template surfaced directly to the player
 * - `compatibility-gate`  — constrains which contexts the move may be used in
 * - `bar-lifecycle`       — controls BAR (Behavioural Activation Record) creation
 * - `quest-sequencing`    — drives ordering and arc completeness logic
 * - `safety-metadata`     — surfaces harm-reduction notes for facilitators
 * - `structural-sub-schema` — wrapper object whose children carry the above roles
 */
export type FieldRole =
  | 'identifier'
  | 'stage-classifier'
  | 'behavioral-intent'
  | 'player-facing-prompt'
  | 'compatibility-gate'
  | 'bar-lifecycle'
  | 'quest-sequencing'
  | 'safety-metadata'
  | 'structural-sub-schema'

/** Ownership of the field value in the co-creation workflow. */
export type FieldOwner =
  | 'proposer'    // player or agent co-creating the move proposes this value
  | 'registry'    // canonical registry; never overridden by proposals
  | 'system'      // computed or assigned by the platform at review/publish time
  | 'facilitator' // GM / admin authors this in the face sub-packet

/**
 * A single field's full semantic annotation.
 *
 * `path` uses dot-notation for nested fields, e.g.
 *   "bar_integration.bar_type"
 *   "prompt_templates[].template_text"
 */
export interface FieldSemantics {
  /** Dot-notation path from the root TransformationMove object. */
  path: string
  /** Human-readable field label. */
  label: string
  /**
   * TypeScript type expressed as a literal string.
   * Arrays use `T[]`; unions use `"a" | "b"`.
   */
  type: string
  /** Functional role this field plays in the schema. */
  role: FieldRole
  /** Who owns / authors this value in the co-creation workflow. */
  owner: FieldOwner
  /**
   * Full intent description: what the field means, why it exists, and what
   * a well-formed value looks like.
   */
  intent: string
  /**
   * Guidance for the mapping proposer specifically: how to derive this field's
   * value from player GM-face responses, narrative context, or choice branches.
   */
  proposer_hint: string
  /** Whether this field must be present in every valid proposal. */
  required: boolean
  /** Exhaustive list of valid string values for constrained / enum fields. */
  enum_values?: readonly string[]
  /** Illustrative example value. */
  example?: unknown
}

// ---------------------------------------------------------------------------
// Root TransformationMove fields
// ---------------------------------------------------------------------------

const ROOT_FIELDS: FieldSemantics[] = [
  {
    path: 'move_id',
    label: 'Move ID',
    type: 'string',
    role: 'identifier',
    owner: 'proposer',
    required: true,
    intent:
      'Stable, slug-style identifier for the move. Lowercase, underscores only. ' +
      'For canonical moves this matches the registry key (e.g. "observe", "integrate"). ' +
      'Proposed new moves must use a unique slug that does not collide with any ' +
      'CANONICAL_MOVES entry.',
    proposer_hint:
      'Derive from move_name by lowercasing and replacing spaces with underscores. ' +
      'Ensure uniqueness against CANONICAL_MOVES before submitting.',
    example: 'anchor_breath',
  },
  {
    path: 'move_name',
    label: 'Move Name',
    type: 'string',
    role: 'identifier',
    owner: 'proposer',
    required: true,
    intent:
      'Title-cased display name shown to players. Short (1-3 words). ' +
      'Should evoke the action or quality the move cultivates.',
    proposer_hint:
      "Extract directly from the player's stated move concept. Normalise capitalisation. " +
      'If the player described a verb phrase, prefer the gerund or imperative form ' +
      '(e.g. "Anchor Breath", not "Anchoring the Breath").',
    example: 'Anchor Breath',
  },
  {
    path: 'move_category',
    label: 'Move Category',
    type: 'MoveCategory',
    role: 'stage-classifier',
    owner: 'proposer',
    required: true,
    enum_values: [
      'awareness',
      'reframing',
      'emotional_processing',
      'behavioral_experiment',
      'integration',
    ] as const,
    intent:
      'Functional classification of what psychological work this move performs. ' +
      'Determines which quest arc phase the move belongs to and which review rubric ' +
      'the challenger agent applies:\n' +
      '  awareness            — observing or naming internal patterns (wake_up)\n' +
      '  emotional_processing — connecting to or metabolising emotion (clean_up)\n' +
      '  reframing            — shifting interpretation or belief (grow_up)\n' +
      '  behavioral_experiment— small real-world action tests (show_up)\n' +
      '  integration          — anchoring and capturing learning (show_up/completion)',
    proposer_hint:
      "Infer from the move's described psychological mechanism. " +
      'If the player says the move is about "noticing" or "becoming aware", prefer awareness. ' +
      'If the move involves changing how something is understood, prefer reframing. ' +
      'If it involves feeling sensations in the body, prefer emotional_processing. ' +
      'If it involves doing something in the real world, prefer behavioral_experiment. ' +
      'If it captures or anchors prior learning, prefer integration.',
    example: 'awareness',
  },
  {
    path: 'wcgs_stage',
    label: 'WCGS Stage',
    type: 'WcgsStage',
    role: 'stage-classifier',
    owner: 'proposer',
    required: true,
    enum_values: ['wake_up', 'clean_up', 'grow_up', 'show_up'] as const,
    intent:
      'The developmental stage in the Wake-Clean-Grow-Show arc that this move ' +
      'primarily serves. Governs where the move appears in a quest arc and which ' +
      'follow-up moves are expected:\n' +
      '  wake_up  — building awareness and naming\n' +
      '  clean_up — processing emotional and identity material\n' +
      '  grow_up  — reframing meaning and shifting beliefs\n' +
      '  show_up  — taking action and integrating learning',
    proposer_hint:
      'Derive from move_category: awareness -> wake_up; emotional_processing -> clean_up; ' +
      'reframing -> grow_up; behavioral_experiment | integration -> show_up. ' +
      'Always cross-check against the branch the player chose in the quest orientation ' +
      'sub-packet — the wcgs_stage must match the selected arc phase.',
    example: 'wake_up',
  },
  {
    path: 'description',
    label: 'Description',
    type: 'string',
    role: 'behavioral-intent',
    owner: 'proposer',
    required: true,
    intent:
      "Describes the move's action, not its benefit. " +
      'One-sentence statement of what this move does — the mechanism in plain language. ' +
      'Written in present tense, second or third person neutral. ' +
      'Max 120 characters. No em-dashes or semicolons.',
    proposer_hint:
      "Synthesise from the player's description of how the move works. " +
      'Strip evaluative language ("great", "powerful"). ' +
      'Start with a verb that captures the mechanism: e.g. "Surface", "Separate", "Challenge".',
    example: 'Anchor awareness in the present moment through breath.',
  },
  {
    path: 'purpose',
    label: 'Purpose',
    type: 'string',
    role: 'behavioral-intent',
    owner: 'proposer',
    required: true,
    intent:
      "One-sentence statement of the move's therapeutic or developmental goal — " +
      'why someone would use this move and what it produces for the player. ' +
      'Distinct from description: description says what the move does; ' +
      'purpose says why that matters.',
    proposer_hint:
      "Derive from the player's stated outcome or motivation for creating the move. " +
      'Complete the frame: "This move exists so that the player can ...". ' +
      'Remove first-person voice before storing.',
    example: 'Ground reactive cognition so reflection can proceed.',
  },
  {
    path: 'target_effect',
    label: 'Target Effect',
    type: 'string',
    role: 'behavioral-intent',
    owner: 'proposer',
    required: true,
    intent:
      'Snake-case slug naming the psychological effect this move aims to produce. ' +
      'Used by the quest arc engine to verify the move delivers measurable output. ' +
      'Examples from canonical moves: pattern_visibility, narrative_clarification, ' +
      'identity_distance, embodied_awareness, meaning_shift, assumption_disruption, ' +
      'behavioral_activation, value_capture.',
    proposer_hint:
      'Construct from the purpose field: identify the core noun of what changes ' +
      '(e.g. "clarity", "distance", "activation") and prefix with a qualifying adjective ' +
      'in snake_case. Avoid duplicating any existing canonical target_effect unless the ' +
      'mechanism is identical.',
    example: 'somatic_grounding',
  },
  {
    path: 'typical_output_type',
    label: 'Typical Output Type',
    type: 'TypicalOutputType',
    role: 'behavioral-intent',
    owner: 'proposer',
    required: true,
    enum_values: ['reflection', 'dialogue', 'somatic', 'action', 'integration'] as const,
    intent:
      "The primary modality of the player's response when they perform this move. " +
      'Used to route the output to the correct rendering context and BAR template:\n' +
      '  reflection  — written introspective response\n' +
      '  dialogue    — imagined or externalised conversation\n' +
      '  somatic     — embodied sensation or body-scan response\n' +
      '  action      — real-world behavioural commitment\n' +
      '  integration — synthesis artefact or captured insight',
    proposer_hint:
      "Match to the dominant prompt_template type declared in the move's template list. " +
      'If the player described body sensations as the primary response, use somatic. ' +
      'If the move produces a behavioural commitment, use action.',
    example: 'somatic',
  },
  {
    path: 'compatible_lock_types',
    label: 'Compatible Lock Types',
    type: 'LockType[]',
    role: 'compatibility-gate',
    owner: 'proposer',
    required: true,
    enum_values: [
      'identity_lock',
      'emotional_lock',
      'action_lock',
      'possibility_lock',
    ] as const,
    intent:
      'List of psychological lock types this move can address. ' +
      'Lock types represent the flavour of stuckness a player is experiencing:\n' +
      '  identity_lock   — "I am not the kind of person who..."\n' +
      '  emotional_lock  — overwhelming or suppressed emotion blocks movement\n' +
      '  action_lock     — knowing what to do but unable to start\n' +
      '  possibility_lock— inability to imagine alternatives\n' +
      'A move may be compatible with multiple lock types. At least one is required.',
    proposer_hint:
      "Infer from the player's described use-case. " +
      'Awareness moves typically address identity_lock and possibility_lock. ' +
      'Emotional processing moves address emotional_lock. ' +
      'Action moves address action_lock. ' +
      'Always include at least the lock type the orientation quest selected for this arc.',
    example: ['emotional_lock', 'identity_lock'],
  },
  {
    path: 'compatible_emotion_channels',
    label: 'Compatible Emotion Channels',
    type: 'EmotionChannel[]',
    role: 'compatibility-gate',
    owner: 'proposer',
    required: true,
    enum_values: ['fear', 'anger', 'sadness', 'neutrality', 'joy'] as const,
    intent:
      'List of primary emotion states for which this move is appropriate. ' +
      'Used by the arc engine to avoid prescribing moves that would be ' +
      "contraindicated for the player's current emotional state. " +
      'Most moves are compatible with all five channels; restrict only when ' +
      "the move's efficacy is genuinely channel-dependent.",
    proposer_hint:
      'Default to all five channels unless the player explicitly described the move ' +
      'as targeting a specific emotion. ' +
      'If restricted, document reasoning in safety_notes.',
    example: ['fear', 'anger', 'sadness', 'neutrality', 'joy'],
  },
  {
    path: 'compatible_nations',
    label: 'Compatible Nations',
    type: 'string[]',
    role: 'compatibility-gate',
    owner: 'proposer',
    required: true,
    intent:
      'List of BARs nation contexts this move is appropriate for, by nation slug. ' +
      'Empty array means universally applicable. ' +
      'Used when a move is designed specifically for a particular cultural or ' +
      'community context within the BARs platform.',
    proposer_hint:
      'Leave as empty array unless the player explicitly designed the move for a ' +
      'specific nation context. Do not infer from player identity.',
    example: [],
  },
  {
    path: 'compatible_archetypes',
    label: 'Compatible Archetypes',
    type: 'string[]',
    role: 'compatibility-gate',
    owner: 'proposer',
    required: true,
    intent:
      'List of player archetype keys for which this move has enhanced efficacy. ' +
      'Empty array means compatible with all archetypes. ' +
      'Values must match keys in the archetype-influence-overlay registry.',
    proposer_hint:
      'Leave as empty array unless the player specifically described an archetype ' +
      "affinity. Archetype restriction reduces the move's reach — use sparingly.",
    example: [],
  },
  {
    path: 'safety_notes',
    label: 'Safety Notes',
    type: 'string[]',
    role: 'safety-metadata',
    owner: 'proposer',
    required: true,
    intent:
      'Array of plain-language notes for facilitators and the GM persona about ' +
      'contraindications, emotional intensity thresholds, or sequencing requirements. ' +
      'At minimum one note is required. ' +
      'Notes should be actionable: state the risk and the mitigation.',
    proposer_hint:
      'Ask the player: "Are there any situations where this move should be avoided ' +
      'or used carefully?" Reframe their answer as a facilitator note. ' +
      'Always add a note if typical_output_type is somatic or if the move works ' +
      'with high-intensity emotion channels.',
    example: ['May surface intense emotion. Ensure player has a pause option.'],
  },
]

// ---------------------------------------------------------------------------
// prompt_templates[] sub-schema
// ---------------------------------------------------------------------------

const PROMPT_TEMPLATE_FIELDS: FieldSemantics[] = [
  {
    path: 'prompt_templates[].template_id',
    label: 'Template ID',
    type: 'string',
    role: 'identifier',
    owner: 'proposer',
    required: true,
    intent:
      'Unique identifier for this prompt template within the move. ' +
      'Convention: {move_id}_{variant}_{zero-padded-index}. ' +
      'Used to reference specific templates in quest seeds and BAR records.',
    proposer_hint:
      'Construct automatically from move_id + template index. ' +
      'Example: for move_id "anchor_breath", first template -> "anchor_breath_basic_01".',
    example: 'anchor_breath_basic_01',
  },
  {
    path: 'prompt_templates[].template_text',
    label: 'Template Text',
    type: 'string',
    role: 'player-facing-prompt',
    owner: 'proposer',
    required: true,
    intent:
      'The question or prompt shown to the player when this move is activated. ' +
      'May contain mustache-style variable placeholders:\n' +
      '  {actor}          — the player or subject of the narrative\n' +
      '  {state}          — the emotional or psychological state being explored\n' +
      '  {object}         — the situation, relationship, or challenge in focus\n' +
      '  {emotion_channel}— the specific emotion active in the arc\n' +
      'Templates must be open-ended questions or invitations, not directives. ' +
      'Max 200 characters.',
    proposer_hint:
      "Transcribe or adapt from the player's description of how they would ask " +
      'the question. Replace specific nouns with the appropriate {placeholder}. ' +
      'Ensure at least one template uses {object} so context is always grounded.',
    example: 'Notice where in your body you feel {state} when you focus on {object}.',
  },
  {
    path: 'prompt_templates[].template_type',
    label: 'Template Type',
    type: 'TypicalOutputType',
    role: 'behavioral-intent',
    owner: 'proposer',
    required: true,
    enum_values: ['reflection', 'dialogue', 'somatic', 'action', 'integration'] as const,
    intent:
      'The output modality this specific template elicits. ' +
      'A move may have templates of different types (e.g. one somatic, one reflection) ' +
      'to serve different player preferences. ' +
      'The most common template_type should match the move\'s typical_output_type.',
    proposer_hint:
      'Infer from the template_text phrasing: body/sensation language -> somatic; ' +
      '"What would you do..." -> action; "What if..." interpretation -> reflection; ' +
      '"If X could speak..." -> dialogue; "Capture..." / "What did you learn..." -> integration.',
    example: 'somatic',
  },
]

// ---------------------------------------------------------------------------
// bar_integration sub-schema
// ---------------------------------------------------------------------------

const BAR_INTEGRATION_FIELDS: FieldSemantics[] = [
  {
    path: 'bar_integration.creates_bar',
    label: 'Creates BAR',
    type: 'boolean',
    role: 'bar-lifecycle',
    owner: 'proposer',
    required: true,
    intent:
      'Whether completing this move automatically generates a Behavioural Activation ' +
      'Record (BAR) for the player. Set true only for action-phase and integration-phase ' +
      'moves where the output should be captured as a durable artefact. ' +
      'Canonical examples: Experiment (true), Integrate (true). ' +
      'Awareness and emotional processing moves typically set this false.',
    proposer_hint:
      'Ask: "Should completing this move create a lasting record for the player?" ' +
      'If the move ends with a commitment or insight capture, set true. ' +
      'If the move is a transient reflection prompt, set false.',
    example: false,
  },
  {
    path: 'bar_integration.bar_timing',
    label: 'BAR Timing',
    type: '"pre_action" | "post_action" | "completion" | undefined',
    role: 'bar-lifecycle',
    owner: 'proposer',
    required: false,
    enum_values: ['pre_action', 'post_action', 'completion'] as const,
    intent:
      "When the BAR is created relative to the move's action. " +
      'Required if creates_bar is true; omit otherwise.\n' +
      '  pre_action  — BAR captures intention before the action is taken\n' +
      '  post_action — BAR captures reflection after action completes\n' +
      '  completion  — BAR created at arc completion; used by Integrate moves',
    proposer_hint:
      'For behavioral_experiment moves: post_action. ' +
      'For integration moves: completion. ' +
      'For awareness moves that create an optional tracking BAR: pre_action.',
    example: 'post_action',
  },
  {
    path: 'bar_integration.bar_type',
    label: 'BAR Type',
    type: '"insight" | "vibe" | undefined',
    role: 'bar-lifecycle',
    owner: 'proposer',
    required: false,
    enum_values: ['insight', 'vibe'] as const,
    intent:
      'Flavour of BAR generated:\n' +
      '  insight — a discursive capture (reflection, learning, commitment)\n' +
      '  vibe    — an affective/somatic capture (mood, sensation, energy state)\n' +
      'Required if creates_bar is true.',
    proposer_hint:
      'If typical_output_type is reflection, action, or integration -> insight. ' +
      'If typical_output_type is somatic or dialogue -> vibe.',
    example: 'insight',
  },
  {
    path: 'bar_integration.bar_prompt_template',
    label: 'BAR Prompt Template',
    type: 'string | undefined',
    role: 'bar-lifecycle',
    owner: 'proposer',
    required: false,
    intent:
      'The prompt shown to the player when the BAR is created. ' +
      'May use the same {actor}, {state}, {object} placeholders as prompt_templates. ' +
      'Should be a concise capture invitation, not a full reflective question. ' +
      'Max 150 characters.',
    proposer_hint:
      "Adapt from the player's description of how they would summarise the move's " +
      'output. Keep it brief and forward-facing: "What did you learn from {object}?"',
    example: 'What did you notice in your body during {object}?',
  },
  {
    path: 'bar_integration.optional_tracking_bar',
    label: 'Optional Tracking BAR',
    type: 'boolean | undefined',
    role: 'bar-lifecycle',
    owner: 'proposer',
    required: false,
    intent:
      'When true, an optional (non-required) tracking BAR may be presented to the ' +
      'player even if creates_bar is false. Used by low-intensity awareness moves ' +
      '(Observe, Name) to allow players who want to record their experience to do so ' +
      'without making it mandatory.',
    proposer_hint:
      'Set true for awareness-category moves where journaling the observation has value ' +
      'but should not be a gate. Leave undefined for all other moves.',
    example: true,
  },
]

// ---------------------------------------------------------------------------
// quest_usage sub-schema
// ---------------------------------------------------------------------------

const QUEST_USAGE_FIELDS: FieldSemantics[] = [
  {
    path: 'quest_usage.quest_stage',
    label: 'Quest Stage',
    type: 'QuestStage',
    role: 'quest-sequencing',
    owner: 'proposer',
    required: true,
    enum_values: ['reflection', 'cleanup', 'growth', 'action', 'completion'] as const,
    intent:
      'The quest arc phase in which this move is used. ' +
      'Maps to wcgs_stage with finer granularity:\n' +
      '  wake_up  -> reflection\n' +
      '  clean_up -> cleanup\n' +
      '  grow_up  -> growth\n' +
      '  show_up  -> action (behavioral moves) or completion (integration moves)',
    proposer_hint:
      'Derive deterministically from wcgs_stage using the mapping above. ' +
      'Only Integrate moves should use "completion".',
    example: 'reflection',
  },
  {
    path: 'quest_usage.is_required_for_full_arc',
    label: 'Required for Full Arc',
    type: 'boolean',
    role: 'quest-sequencing',
    owner: 'proposer',
    required: true,
    intent:
      'Whether this move must appear in every complete quest arc. ' +
      'In the canonical registry only Integrate is required (true). ' +
      'New proposals should set this false unless there is a compelling ' +
      'structural reason for mandatory inclusion.',
    proposer_hint:
      'Set to false for all proposed moves unless the player explicitly argues ' +
      'the move is an arc gate. The reviewer will adjust if needed.',
    example: false,
  },
  {
    path: 'quest_usage.can_stand_alone',
    label: 'Can Stand Alone',
    type: 'boolean',
    role: 'quest-sequencing',
    owner: 'proposer',
    required: true,
    intent:
      'Whether this move can be used as a standalone micro-quest without the ' +
      'full WCGS arc. Awareness moves (Observe, Name) can stand alone. ' +
      'Processing, reframing, and integration moves should not.',
    proposer_hint:
      'Set true only if the move produces complete value in a single isolated session, ' +
      'without requiring prior wake_up or clean_up moves.',
    example: true,
  },
  {
    path: 'quest_usage.suggested_follow_up_moves',
    label: 'Suggested Follow-up Moves',
    type: 'string[]',
    role: 'quest-sequencing',
    owner: 'proposer',
    required: true,
    intent:
      'Ordered list of move_ids that naturally follow this move in a quest arc. ' +
      'Used by the arc engine to suggest next steps and by the challenger agent ' +
      'to validate arc coherence. ' +
      'May reference both canonical move_ids and proposed move_ids that are under review. ' +
      'Empty array is valid for terminal moves (e.g. Integrate).',
    proposer_hint:
      'Ask the player: "What move would you recommend after this one?" ' +
      'Cross-reference against the CANONICAL_MOVES registry. ' +
      'Follow-up moves should advance the arc stage, not regress it.',
    example: ['reframe', 'experiment'],
  },
]

// ---------------------------------------------------------------------------
// Full annotated schema — flat lookup by field path
// ---------------------------------------------------------------------------

/** All field semantics in a flat array, ordered root-first then sub-schemas. */
export const TRANSFORMATION_MOVE_FIELD_SEMANTICS: readonly FieldSemantics[] = [
  ...ROOT_FIELDS,
  ...PROMPT_TEMPLATE_FIELDS,
  ...BAR_INTEGRATION_FIELDS,
  ...QUEST_USAGE_FIELDS,
] as const

/**
 * O(1) lookup map from field path -> FieldSemantics.
 *
 * @example
 *   const sem = FIELD_SEMANTICS_BY_PATH['bar_integration.bar_type']
 *   // -> { path: 'bar_integration.bar_type', label: 'BAR Type', ... }
 */
export const FIELD_SEMANTICS_BY_PATH: Readonly<Record<string, FieldSemantics>> =
  Object.fromEntries(
    TRANSFORMATION_MOVE_FIELD_SEMANTICS.map((f) => [f.path, f])
  )

// ---------------------------------------------------------------------------
// Sub-schema group exports — for targeted access
// ---------------------------------------------------------------------------

/** Semantics for the flat TransformationMove root fields only. */
export const ROOT_MOVE_FIELD_SEMANTICS: readonly FieldSemantics[] = ROOT_FIELDS

/** Semantics for prompt_templates[] item fields. */
export const PROMPT_TEMPLATE_FIELD_SEMANTICS: readonly FieldSemantics[] = PROMPT_TEMPLATE_FIELDS

/** Semantics for bar_integration sub-schema fields. */
export const BAR_INTEGRATION_FIELD_SEMANTICS: readonly FieldSemantics[] = BAR_INTEGRATION_FIELDS

/** Semantics for quest_usage sub-schema fields. */
export const QUEST_USAGE_FIELD_SEMANTICS: readonly FieldSemantics[] = QUEST_USAGE_FIELDS

// ---------------------------------------------------------------------------
// Prompt-construction helpers
// ---------------------------------------------------------------------------

/**
 * Serialise the full field semantics schema to a structured text block
 * suitable for embedding in an LLM prompt.
 *
 * Format per field:
 *   FIELD: <path>
 *   Label: <label>
 *   Type:  <type>
 *   Role:  <role>
 *   Owner: <owner>
 *   Required: yes | no
 *   Enum values: <values> (omitted if not constrained)
 *   Intent: <intent>
 *   Proposer hint: <proposer_hint>
 *   Example: <example> (omitted if not provided)
 *
 * @param fields - Subset of semantics to serialise (defaults to full schema).
 */
export function renderFieldSemanticsBlock(
  fields: readonly FieldSemantics[] = TRANSFORMATION_MOVE_FIELD_SEMANTICS
): string {
  const lines: string[] = [
    'TRANSFORMATION MOVE FIELD SEMANTICS',
    '====================================',
    '',
  ]

  for (const f of fields) {
    lines.push(`FIELD: ${f.path}`)
    lines.push(`  Label:         ${f.label}`)
    lines.push(`  Type:          ${f.type}`)
    lines.push(`  Role:          ${f.role}`)
    lines.push(`  Owner:         ${f.owner}`)
    lines.push(`  Required:      ${f.required ? 'yes' : 'no'}`)
    if (f.enum_values && f.enum_values.length > 0) {
      lines.push(`  Enum values:   ${f.enum_values.join(' | ')}`)
    }
    lines.push(`  Intent:        ${f.intent.replace(/\n/g, '\n               ')}`)
    lines.push(`  Proposer hint: ${f.proposer_hint.replace(/\n/g, '\n               ')}`)
    if (f.example !== undefined) {
      const exStr =
        typeof f.example === 'string'
          ? f.example
          : JSON.stringify(f.example)
      lines.push(`  Example:       ${exStr}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Serialise the schema to compact JSON, suitable for structured tool calls
 * or machine-readable prompt injection.
 *
 * @param fields - Subset of semantics to serialise (defaults to full schema).
 */
export function renderFieldSemanticsJson(
  fields: readonly FieldSemantics[] = TRANSFORMATION_MOVE_FIELD_SEMANTICS
): string {
  return JSON.stringify(
    fields.map(({ path, label, type, role, owner, required, enum_values, intent, proposer_hint, example }) => ({
      path,
      label,
      type,
      role,
      owner,
      required,
      ...(enum_values ? { enum_values } : {}),
      intent,
      proposer_hint,
      ...(example !== undefined ? { example } : {}),
    })),
    null,
    2
  )
}

/**
 * Return only the semantics entries that a mapping proposer must populate
 * (i.e. owner === 'proposer' and required === true).
 */
export function getRequiredProposerFields(): readonly FieldSemantics[] {
  return TRANSFORMATION_MOVE_FIELD_SEMANTICS.filter(
    (f) => f.owner === 'proposer' && f.required
  )
}

/**
 * Return semantics for a named sub-schema group.
 *
 * @param group - One of 'root' | 'prompt_templates' | 'bar_integration' | 'quest_usage'
 */
export function getFieldSemanticsByGroup(
  group: 'root' | 'prompt_templates' | 'bar_integration' | 'quest_usage'
): readonly FieldSemantics[] {
  switch (group) {
    case 'root':
      return ROOT_MOVE_FIELD_SEMANTICS
    case 'prompt_templates':
      return PROMPT_TEMPLATE_FIELD_SEMANTICS
    case 'bar_integration':
      return BAR_INTEGRATION_FIELD_SEMANTICS
    case 'quest_usage':
      return QUEST_USAGE_FIELD_SEMANTICS
  }
}
