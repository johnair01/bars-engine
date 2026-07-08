import type { AlchemyAltitude, EmotionChannel } from './types'
import type { AlchemyEdge, AlchemyState } from './alchemy-graph'
import { vectorKey } from './alchemy-graph'
import type { ShowUpPrimitiveId } from './show-up-primitives'

export type VectorMoveFamilyRole = 'metabolize' | 'translate' | 'transcend'
export type VectorMoveFamilyCoverage = 'good' | 'partial' | 'stub'
export type VectorMoveMechanicTag =
  | 'identify_signal'
  | 'reveal_care'
  | 'reveal_desire'
  | 'locate_edge'
  | 'map_field'
  | 'restore_flow'
  | 'restore_participation'
  | 'right_size_force'
  | 'name_tenderness'
  | 'orient_to_threshold'
  | 'create_container'
  | 'complete_movement'
  | 'settle_coherence'
type MetabolizeVectorKey = {
  [Channel in EmotionChannel]: `${Channel}:dissatisfied->${Channel}:neutral`
}[EmotionChannel]
type TranscendVectorKey = {
  [Channel in EmotionChannel]: `${Channel}:neutral->${Channel}:satisfied`
}[EmotionChannel]
type TranslateVectorKey = {
  [Source in EmotionChannel]: {
    [Target in Exclude<EmotionChannel, Source>]: `${Source}:neutral->${Target}:neutral`
  }[Exclude<EmotionChannel, Source>]
}[EmotionChannel]
export type VectorKey = MetabolizeVectorKey | TranscendVectorKey | TranslateVectorKey

export interface VectorMoveCardSeed {
  title: string
  source?: string
}

export type VectorMovePracticeLens = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'
export type VectorMovePracticeRole = 'processing' | 'bridge' | 'action'

export interface VectorMovePracticeVariant {
  role: VectorMovePracticeRole
  prompt: string
  output: string
}

export interface VectorMoveMechanicOperation {
  title: string
  intent: string
  steps: string[]
  output: string
  completionCriteria: string
  practiceVariants: Record<VectorMovePracticeLens, VectorMovePracticeVariant>
}

export interface VectorMoveFamily {
  vector: VectorKey
  role: VectorMoveFamilyRole
  sourceChannel: EmotionChannel
  targetChannel: EmotionChannel
  coverage: VectorMoveFamilyCoverage
  mechanicTags: VectorMoveMechanicTag[]
  mechanicOperation?: VectorMoveMechanicOperation
  coreMechanic: string
  preferredPrimitiveIds: ShowUpPrimitiveId[]
  seedMoves: VectorMoveCardSeed[]
  internalExpression: string
  externalExpression: string
  completionSignal: string
  failureMode: string
  sourceRefs: string[]
}

function family(input: Omit<VectorMoveFamily, 'vector'> & { vector: string }): VectorMoveFamily {
  return input as VectorMoveFamily
}

const CHANNEL_SOURCE = 'The Library/02 Index/KEYTERM-EA-CHANNEL-*.md'
const MOVE_LIST_SOURCE = 'The Library/08 Source Library/.../Downloads 4.17/Emotional_Alchemy_Move_List.txt'
const DECK_CSV_SOURCE = 'The Library/08 Source Library/.../Downloads/Emotional_Alchemy_Deck_With_Types.csv'
const INVENTORY_SOURCE = '.specify/specs/beginner-route-hand-planner/emotional-vector-move-inventory.md'

export const VECTOR_MOVE_FAMILIES: Record<VectorKey, VectorMoveFamily> = {
  'anger:dissatisfied->anger:neutral': family({
    vector: 'anger:dissatisfied->anger:neutral',
    role: 'metabolize',
    sourceChannel: 'anger',
    targetChannel: 'anger',
    coverage: 'good',
    mechanicTags: ['identify_signal', 'reveal_desire', 'right_size_force'],
    coreMechanic: 'Identify the desire and obstruction so vague heat becomes legible force.',
    preferredPrimitiveIds: ['interrupt_pattern', 'identify_signal'],
    seedMoves: [
      { title: 'Draw the Line Within', source: MOVE_LIST_SOURCE },
      { title: 'The Sacred No', source: DECK_CSV_SOURCE },
      { title: 'Ember of Boundaries', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Name the desire, the obstruction, and the clean line inside the self.',
    externalExpression: 'Name the crossed line or blocked movement without attacking the field.',
    completionSignal: 'I want ___, and the obstruction or boundary issue is ___.',
    failureMode: 'Heat becomes spectacle, blame, domination, or analysis without a line.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'sadness:dissatisfied->sadness:neutral': family({
    vector: 'sadness:dissatisfied->sadness:neutral',
    role: 'metabolize',
    sourceChannel: 'sadness',
    targetChannel: 'sadness',
    coverage: 'good',
    mechanicTags: ['identify_signal', 'reveal_care'],
    coreMechanic: 'Identify care and distance so heaviness becomes clean sadness.',
    preferredPrimitiveIds: ['name_care_distance', 'identify_signal'],
    seedMoves: [
      { title: 'Feel It Fully', source: MOVE_LIST_SOURCE },
      { title: 'Let It Ache', source: DECK_CSV_SOURCE },
      { title: 'The Thing You Cared For', source: DECK_CSV_SOURCE },
      { title: 'Softening', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Name what matters and how it is distant, changed, absent, or unreceived.',
    externalExpression: 'Make one tender signal of care without demanding closure.',
    completionSignal: 'I care about ___, and the distance is ___.',
    failureMode: 'Sadness becomes collapse, guilt recruitment, or pressure for immediate repair.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'fear:dissatisfied->fear:neutral': family({
    vector: 'fear:dissatisfied->fear:neutral',
    role: 'metabolize',
    sourceChannel: 'fear',
    targetChannel: 'fear',
    coverage: 'good',
    mechanicTags: ['identify_signal', 'locate_edge'],
    coreMechanic: 'Identify the risk and edge so vague alarm becomes clean discernment.',
    preferredPrimitiveIds: ['bound_the_ask', 'identify_signal'],
    seedMoves: [
      { title: 'Locate the Risk', source: MOVE_LIST_SOURCE },
      { title: 'See the Knife', source: DECK_CSV_SOURCE },
      { title: 'Sharpen the Signal', source: DECK_CSV_SOURCE },
      { title: 'Accepting the Unknown', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Separate known risk, unknowns, story, and next safe-enough contact point.',
    externalExpression: 'Ask for one bounded piece of information, support, or orientation.',
    completionSignal: 'The risk or edge is ___, and what I know so far is ___.',
    failureMode: 'Fear becomes control, freezing, catastrophizing, or false certainty.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'joy:dissatisfied->joy:neutral': family({
    vector: 'joy:dissatisfied->joy:neutral',
    role: 'metabolize',
    sourceChannel: 'joy',
    targetChannel: 'joy',
    coverage: 'partial',
    mechanicTags: ['identify_signal', 'restore_participation'],
    coreMechanic: 'Identify the aliveness and the form of participation it wants.',
    preferredPrimitiveIds: ['identify_signal', 'make_meaning_actionable'],
    seedMoves: [
      { title: 'Follow the Spark', source: MOVE_LIST_SOURCE },
      { title: 'Let Yourself Want', source: DECK_CSV_SOURCE },
      { title: 'Choose Delight', source: DECK_CSV_SOURCE },
      { title: 'Slow Joy', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Name the difference between true participation and stimulation.',
    externalExpression: 'Choose one small form where aliveness can participate for real.',
    completionSignal: 'Aliveness wants to participate in ___.',
    failureMode: 'Joy becomes grasping, comparison, overpromising, or stimulation seeking.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'neutrality:dissatisfied->neutrality:neutral': family({
    vector: 'neutrality:dissatisfied->neutrality:neutral',
    role: 'metabolize',
    sourceChannel: 'neutrality',
    targetChannel: 'neutrality',
    coverage: 'good',
    mechanicTags: ['identify_signal', 'map_field', 'settle_coherence'],
    coreMechanic: 'Distinguish clean neutrality from shutdown and identify the field.',
    preferredPrimitiveIds: ['create_sequence', 'identify_signal'],
    seedMoves: [
      { title: 'Return to Center', source: MOVE_LIST_SOURCE },
      { title: 'Set It Down', source: DECK_CSV_SOURCE },
      { title: 'The Pause That Opens', source: DECK_CSV_SOURCE },
      { title: 'Trust the Soil', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Name the field, the parts, and what can be witnessed without collapse.',
    externalExpression: 'Create one simple sequence, container, or pause that restores coherence.',
    completionSignal: 'I am holding the field of ___, and I can see ___ without collapsing.',
    failureMode: 'Neutrality becomes numbness, avoidance, abstraction, or premature structure.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'anger:neutral->anger:satisfied': family({
    vector: 'anger:neutral->anger:satisfied',
    role: 'transcend',
    sourceChannel: 'anger',
    targetChannel: 'anger',
    coverage: 'good',
    mechanicTags: ['complete_movement', 'right_size_force', 'reveal_desire'],
    coreMechanic: 'Use clean force to complete movement without scorching the field.',
    preferredPrimitiveIds: ['interrupt_pattern', 'make_meaning_actionable'],
    seedMoves: [
      { title: 'Own the Win', source: MOVE_LIST_SOURCE },
      { title: 'Show Your Strength', source: MOVE_LIST_SOURCE },
      { title: 'Strike the Spark', source: DECK_CSV_SOURCE },
      { title: 'Power With, Not Power Over', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Choose the clean yes, clean no, or commitment that honors desire.',
    externalExpression: 'Apply the smallest sufficient force: line, refusal, demand, or act.',
    completionSignal: 'Agency, warmth, triumph, or honored boundary becomes available.',
    failureMode: 'Clean force becomes domination, punishment, or performance of strength.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'sadness:neutral->sadness:satisfied': family({
    vector: 'sadness:neutral->sadness:satisfied',
    role: 'transcend',
    sourceChannel: 'sadness',
    targetChannel: 'sadness',
    coverage: 'good',
    mechanicTags: ['restore_flow', 'reveal_care'],
    coreMechanic: 'Restore flow by giving care a form without forcing closure.',
    preferredPrimitiveIds: ['restore_flow', 'repair_without_performance'],
    seedMoves: [
      { title: 'Let the Beauty Break You Open', source: MOVE_LIST_SOURCE },
      { title: 'Offer from the Heart', source: MOVE_LIST_SOURCE },
      { title: 'Love Still Present', source: DECK_CSV_SOURCE },
      { title: 'Weep as a Wayfinder', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Let the wave complete and carry meaning forward.',
    externalExpression: 'Offer a tender gesture, witness request, ritual, or contact point.',
    completionSignal: 'Poignance appears, or the next true charge becomes available.',
    failureMode: 'Sadness becomes closure forcing, guilt recruitment, or premature action.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'fear:neutral->fear:satisfied': family({
    vector: 'fear:neutral->fear:satisfied',
    role: 'transcend',
    sourceChannel: 'fear',
    targetChannel: 'fear',
    coverage: 'partial',
    mechanicTags: ['orient_to_threshold', 'locate_edge'],
    coreMechanic: 'Approach the threshold so risk becomes chosen experiment or clean retreat.',
    preferredPrimitiveIds: ['create_sequence', 'clean_exit'],
    seedMoves: [
      { title: "Act Before You're Ready", source: MOVE_LIST_SOURCE },
      { title: 'Ride the Surge', source: MOVE_LIST_SOURCE },
      { title: 'Step to the Edge', source: DECK_CSV_SOURCE },
      { title: 'Excitement in the Jitters', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Prepare the body and choose a relationship to the threshold.',
    externalExpression: 'Scout, ask, test, or take one safe-enough exposure step.',
    completionSignal: 'Excitement, courage, wonder, or clean retreat becomes available.',
    failureMode: 'Fear becomes recklessness, control, or endless preparation.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'joy:neutral->joy:satisfied': family({
    vector: 'joy:neutral->joy:satisfied',
    role: 'transcend',
    sourceChannel: 'joy',
    targetChannel: 'joy',
    coverage: 'partial',
    mechanicTags: ['restore_participation'],
    coreMechanic: 'Give aliveness a real game to play, savor, create, share, or grow inside.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'identify_signal'],
    seedMoves: [
      { title: 'Soak in the Delight', source: MOVE_LIST_SOURCE },
      { title: 'Spread the Sparkle', source: MOVE_LIST_SOURCE },
      { title: 'Overflow is Not a Problem', source: DECK_CSV_SOURCE },
      { title: 'Touch Without Outcome', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Savor clean delight without needing to justify or grasp it.',
    externalExpression: 'Create, invite, share, or enter the real game of participation.',
    completionSignal: 'Bliss, delight, flourishing, or clean participation becomes available.',
    failureMode: 'Joy becomes consumption, overpromising, performance, or bypassing.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'neutrality:neutral->neutrality:satisfied': family({
    vector: 'neutrality:neutral->neutrality:satisfied',
    role: 'transcend',
    sourceChannel: 'neutrality',
    targetChannel: 'neutrality',
    coverage: 'good',
    mechanicTags: ['settle_coherence', 'map_field', 'create_container'],
    coreMechanic: 'Let the whole system settle into coherence without forcing preference.',
    preferredPrimitiveIds: ['create_sequence', 'create_handoff'],
    seedMoves: [
      { title: 'Breathe into the Silence', source: MOVE_LIST_SOURCE },
      { title: 'Hold the Field', source: MOVE_LIST_SOURCE },
      { title: 'Enough for Now', source: DECK_CSV_SOURCE },
      { title: 'Steady Through the Spiral', source: DECK_CSV_SOURCE },
    ],
    internalExpression: 'Let timing, parts, and truth settle into a held field.',
    externalExpression: 'Hold the field, sequence the parts, or create a settling container.',
    completionSignal: 'Peace, coherence, grounded presence, or right timing becomes available.',
    failureMode: 'Peace becomes avoidance, dissociation, false neutrality, or control.',
    sourceRefs: [CHANNEL_SOURCE, MOVE_LIST_SOURCE, DECK_CSV_SOURCE],
  }),
  'anger:neutral->sadness:neutral': family({
    vector: 'anger:neutral->sadness:neutral',
    role: 'translate',
    sourceChannel: 'anger',
    targetChannel: 'sadness',
    coverage: 'stub',
    mechanicTags: ['reveal_care', 'name_tenderness'],
    coreMechanic: 'Let desire and boundary reveal care and distance.',
    preferredPrimitiveIds: ['repair_without_performance', 'name_care_distance'],
    seedMoves: [{ title: 'Name What The Line Protects', source: INVENTORY_SOURCE }],
    internalExpression: 'Ask what the boundary protects and what care is distant.',
    externalExpression: 'Own impact or name protected care without demanding soothing.',
    completionSignal: 'The player can feel what matters under the line.',
    failureMode: 'Anger recruits guilt, blame, or sentimental collapse.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'anger:neutral->fear:neutral': family({
    vector: 'anger:neutral->fear:neutral',
    role: 'translate',
    sourceChannel: 'anger',
    targetChannel: 'fear',
    coverage: 'stub',
    mechanicTags: ['locate_edge', 'right_size_force'],
    mechanicOperation: {
      title: 'Risk Before Force',
      intent: 'Temper clean anger by locating the risk, exposure, or condition that must be respected before adding force.',
      steps: [
        'Name the action, boundary, demand, or refusal your anger wants to make.',
        'Name what could be damaged, exposed, escalated, or misunderstood if you add force now.',
        'Separate the real risk from the story about the risk.',
        'Create one bounded ask, safety condition, timing condition, or information request before acting.',
      ],
      output: 'A risk-aware action condition: I can move when ___ is known, bounded, asked, or protected.',
      completionCriteria: 'The next forceful move has a named risk and a concrete condition that makes action cleaner.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Notice the heat and name the action it wants before deciding whether to act.',
          output: 'A named anger impulse.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the heat be felt long enough to receive the risk signal hiding inside it.',
          output: 'A received edge or exposure signal.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate the real risk of acting from the fear-story or power-story around acting.',
          output: 'A real-risk / story-risk distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose the maturity level of force: impulse, domination, boundary, protection, or stewardship.',
          output: 'A right-sized force standard.',
        },
        show_up: {
          role: 'action',
          prompt: 'Make the bounded ask, safety condition, or timing condition that lets force move cleanly.',
          output: 'A sent ask, named condition, or action constraint.',
        },
      },
    },
    coreMechanic: 'Let force become discernment of risk, exposure, and edge.',
    preferredPrimitiveIds: ['bound_the_ask', 'clean_exit'],
    seedMoves: [{ title: 'Cool The Fire', source: INVENTORY_SOURCE }],
    internalExpression: 'Name the risk created by action before adding more force.',
    externalExpression: 'Create an off-ramp, ask, or safety condition around the next act.',
    completionSignal: 'The risk or exposure is specific enough to relate to cleanly.',
    failureMode: 'Anger pretends risk does not matter or fear becomes control.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'anger:neutral->joy:neutral': family({
    vector: 'anger:neutral->joy:neutral',
    role: 'translate',
    sourceChannel: 'anger',
    targetChannel: 'joy',
    coverage: 'stub',
    mechanicTags: ['restore_participation', 'reveal_desire'],
    coreMechanic: 'Let desire become playable participation instead of pressure.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'interrupt_pattern'],
    seedMoves: [{ title: 'Turn Demand Into Game', source: INVENTORY_SOURCE }],
    internalExpression: 'Find the form of participation underneath the demand.',
    externalExpression: 'Turn the line into an invitation, game, or contribution path.',
    completionSignal: 'The desire has a playable form.',
    failureMode: 'Desire becomes pressure, salesmanship, or forced enthusiasm.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'anger:neutral->neutrality:neutral': family({
    vector: 'anger:neutral->neutrality:neutral',
    role: 'translate',
    sourceChannel: 'anger',
    targetChannel: 'neutrality',
    coverage: 'partial',
    mechanicTags: ['map_field', 'right_size_force', 'create_container'],
    coreMechanic: 'Let force enter whole-field perspective.',
    preferredPrimitiveIds: ['create_handoff', 'create_sequence'],
    seedMoves: [{ title: 'Put The Heat On The Map', source: INVENTORY_SOURCE }],
    internalExpression: 'Map the heat as one part of the field, not the whole field.',
    externalExpression: 'Create a sequence, owner, or container for the heated issue.',
    completionSignal: 'The anger is held in context without being erased.',
    failureMode: 'Neutrality suppresses force or anger rejects the system view.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'sadness:neutral->anger:neutral': family({
    vector: 'sadness:neutral->anger:neutral',
    role: 'translate',
    sourceChannel: 'sadness',
    targetChannel: 'anger',
    coverage: 'partial',
    mechanicTags: ['reveal_desire', 'right_size_force', 'reveal_care'],
    coreMechanic: 'Let care reveal desire, boundary, or obstruction.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'interrupt_pattern'],
    seedMoves: [{ title: 'Protect What Matters', source: INVENTORY_SOURCE }],
    internalExpression: 'Name what care now wants to protect, refuse, claim, or advance.',
    externalExpression: 'Turn care into a clean line, ask, refusal, or commitment.',
    completionSignal: 'Care becomes available as directed force.',
    failureMode: 'Care becomes accusation, martyrdom, or pressure.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'sadness:neutral->fear:neutral': family({
    vector: 'sadness:neutral->fear:neutral',
    role: 'translate',
    sourceChannel: 'sadness',
    targetChannel: 'fear',
    coverage: 'stub',
    mechanicTags: ['locate_edge', 'reveal_care', 'orient_to_threshold'],
    coreMechanic: 'Let care reveal stakes, vulnerability, and risk.',
    preferredPrimitiveIds: ['bound_the_ask', 'repair_without_performance'],
    seedMoves: [{ title: 'What Care Makes Vulnerable', source: INVENTORY_SOURCE }],
    internalExpression: 'Name the exposure created by caring.',
    externalExpression: 'Ask for the information, support, or boundary care now requires.',
    completionSignal: 'The vulnerability has a clear edge.',
    failureMode: 'Care becomes anxious control or fear denies care.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'sadness:neutral->joy:neutral': family({
    vector: 'sadness:neutral->joy:neutral',
    role: 'translate',
    sourceChannel: 'sadness',
    targetChannel: 'joy',
    coverage: 'partial',
    mechanicTags: ['restore_participation', 'restore_flow'],
    coreMechanic: 'Let meaning re-open vitality and participation.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'restore_flow'],
    seedMoves: [{ title: 'Renew Vitality', source: CHANNEL_SOURCE }],
    internalExpression: 'Ask what love wants to participate in now.',
    externalExpression: 'Turn meaning into one invitation, creation, or contribution.',
    completionSignal: 'Care becomes aliveness without erasing the loss.',
    failureMode: 'Joy bypasses grief or grief refuses renewed life.',
    sourceRefs: [CHANNEL_SOURCE, INVENTORY_SOURCE],
  }),
  'sadness:neutral->neutrality:neutral': family({
    vector: 'sadness:neutral->neutrality:neutral',
    role: 'translate',
    sourceChannel: 'sadness',
    targetChannel: 'neutrality',
    coverage: 'partial',
    mechanicTags: ['map_field', 'create_container', 'restore_flow'],
    coreMechanic: 'Let care settle into whole-field acceptance.',
    preferredPrimitiveIds: ['create_handoff', 'create_sequence'],
    seedMoves: [{ title: 'Hold Care Without Forcing Return', source: INVENTORY_SOURCE }],
    internalExpression: 'Hold care as part of the field without forcing resolution.',
    externalExpression: 'Create a container, ritual, or agreement that lets care be held.',
    completionSignal: 'Care can be included without collapsing the field.',
    failureMode: 'Neutrality numbs care or sadness rejects integration.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'fear:neutral->anger:neutral': family({
    vector: 'fear:neutral->anger:neutral',
    role: 'translate',
    sourceChannel: 'fear',
    targetChannel: 'anger',
    coverage: 'partial',
    mechanicTags: ['right_size_force', 'locate_edge'],
    coreMechanic: 'Let risk reveal boundary, refusal, or action.',
    preferredPrimitiveIds: ['interrupt_pattern', 'clean_exit'],
    seedMoves: [{ title: 'What Must Be Protected', source: INVENTORY_SOURCE }],
    internalExpression: 'Name the line or action the risk calls for.',
    externalExpression: 'Place a boundary, refusal, or intervention at the risk edge.',
    completionSignal: 'Risk becomes directed protection or clean action.',
    failureMode: 'Fear becomes control or anger becomes reckless defense.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'fear:neutral->sadness:neutral': family({
    vector: 'fear:neutral->sadness:neutral',
    role: 'translate',
    sourceChannel: 'fear',
    targetChannel: 'sadness',
    coverage: 'partial',
    mechanicTags: ['reveal_care', 'name_tenderness', 'locate_edge'],
    coreMechanic: 'Let threat reveal care and contact.',
    preferredPrimitiveIds: ['repair_without_performance', 'name_care_distance'],
    seedMoves: [{ title: 'What Matters Enough To Be Threatened', source: INVENTORY_SOURCE }],
    internalExpression: 'Name what the threat shows you care about.',
    externalExpression: 'Own impact or make contact with what matters without demanding soothing.',
    completionSignal: 'Threat becomes legible care and distance.',
    failureMode: 'Fear uses care to control, or sadness collapses the risk signal.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'fear:neutral->joy:neutral': family({
    vector: 'fear:neutral->joy:neutral',
    role: 'translate',
    sourceChannel: 'fear',
    targetChannel: 'joy',
    coverage: 'partial',
    mechanicTags: ['restore_participation', 'orient_to_threshold'],
    mechanicOperation: {
      title: 'Turn The Edge Into An Experiment',
      intent: 'Translate clean fear into clean joy by making the threshold small, reversible, and playable.',
      steps: [
        'Name the edge your fear is tracking.',
        'Name the smallest experiment that would let you touch the edge without pretending it is safe.',
        'Define the opt-out, pause, or retreat condition before you begin.',
        'Choose one scout step that creates curiosity, participation, or learning.',
      ],
      output: 'A safe-enough experiment with an opt-out condition and one scout step.',
      completionCriteria: 'The feared edge has become a specific experiment the player can enter, pause, or exit cleanly.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Name the edge your fear is tracking and what makes it feel threshold-like.',
          output: 'A named threshold.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let yourself feel the edge as sensation and curiosity before solving or escaping it.',
          output: 'A received edge with curiosity still available.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate real danger from discomfort, novelty, visibility, or uncertainty.',
          output: 'A danger / discomfort distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Size the experiment so it builds capacity instead of proving bravery.',
          output: 'A safe-enough experiment design.',
        },
        show_up: {
          role: 'action',
          prompt: 'Take the scout step with the opt-out condition already named.',
          output: 'A completed scout step or scheduled experiment.',
        },
      },
    },
    coreMechanic: 'Let the edge become curiosity and participation.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'clean_exit'],
    seedMoves: [{ title: 'Risk As Experiment', source: INVENTORY_SOURCE }],
    internalExpression: 'Find the experiment or game at the edge of fear.',
    externalExpression: 'Scout, test, or enter one safe-enough participation step.',
    completionSignal: 'The edge has become a playable experiment.',
    failureMode: 'Joy denies risk or fear blocks participation indefinitely.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'fear:neutral->neutrality:neutral': family({
    vector: 'fear:neutral->neutrality:neutral',
    role: 'translate',
    sourceChannel: 'fear',
    targetChannel: 'neutrality',
    coverage: 'partial',
    mechanicTags: ['map_field', 'locate_edge', 'settle_coherence'],
    coreMechanic: 'Let alertness become stable orientation.',
    preferredPrimitiveIds: ['clean_exit', 'create_sequence'],
    seedMoves: [{ title: 'Map Known And Unknown', source: INVENTORY_SOURCE }],
    internalExpression: 'Set down alarm enough to map knowns, unknowns, and timing.',
    externalExpression: 'Create a simple sequence, safety condition, or off-ramp.',
    completionSignal: 'The field is oriented without suppressing alertness.',
    failureMode: 'Neutrality becomes denial or fear keeps scanning forever.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'joy:neutral->anger:neutral': family({
    vector: 'joy:neutral->anger:neutral',
    role: 'translate',
    sourceChannel: 'joy',
    targetChannel: 'anger',
    coverage: 'partial',
    mechanicTags: ['reveal_desire', 'right_size_force', 'restore_participation'],
    coreMechanic: 'Let aliveness meet obstacle, desire, or boundary.',
    preferredPrimitiveIds: ['interrupt_pattern', 'make_meaning_actionable'],
    seedMoves: [{ title: 'Where Growth Needs A Line', source: INVENTORY_SOURCE }],
    internalExpression: 'Name what aliveness wants and what blocks it.',
    externalExpression: 'Place a clean line or action in service of participation.',
    completionSignal: 'Growth has a boundary or directed force.',
    failureMode: 'Joy becomes pressure or anger attacks the life-force.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'joy:neutral->sadness:neutral': family({
    vector: 'joy:neutral->sadness:neutral',
    role: 'translate',
    sourceChannel: 'joy',
    targetChannel: 'sadness',
    coverage: 'partial',
    mechanicTags: ['name_tenderness', 'reveal_care'],
    mechanicOperation: {
      title: 'Find The Care In The Joy',
      intent: 'Translate clean joy into clean sadness by finding the care inside the joy.',
      steps: [
        'Name the delight, aliveness, or possibility that is present.',
        'Ask what care is inside this joy: what does this aliveness show you matters?',
        'Name the tenderness, distance, impermanence, or longing connected to that care.',
        'Make one contact, note, ritual, or witness move that honors the care without performing happiness.',
      ],
      output: 'A care-and-distance statement plus one tender honoring move.',
      completionCriteria: 'The player can name the care inside the joy without collapsing the joy or forcing repair.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Notice the joy and ask what care lives inside it.',
          output: 'A named care inside the joy.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the joy soften enough to receive the care, longing, or devotion inside it.',
          output: 'A felt care inside the joy.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate clean care from nostalgia, clinging, performance, or pressure to stay happy.',
          output: 'A clean-care / attachment distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Ask how mature care would honor this joy without possessing it.',
          output: 'A mature honoring stance.',
        },
        show_up: {
          role: 'action',
          prompt: 'Make one contact, note, ritual, or witness move that gives the care a real form.',
          output: 'A completed honoring move.',
        },
      },
    },
    coreMechanic: 'Let delight reveal tenderness, care, or distance.',
    preferredPrimitiveIds: ['name_care_distance', 'repair_without_performance'],
    seedMoves: [{ title: 'What Joy Makes Tender', source: INVENTORY_SOURCE }],
    internalExpression: 'Name what your aliveness shows you care about.',
    externalExpression: 'Make contact with the care underneath joy without performing delight.',
    completionSignal: 'Aliveness reveals care without losing vitality.',
    failureMode: 'Joy bypasses tenderness or sadness extinguishes aliveness.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'joy:neutral->fear:neutral': family({
    vector: 'joy:neutral->fear:neutral',
    role: 'translate',
    sourceChannel: 'joy',
    targetChannel: 'fear',
    coverage: 'stub',
    mechanicTags: ['locate_edge', 'orient_to_threshold', 'restore_participation'],
    mechanicOperation: {
      title: 'Map The Exposure In The Possibility',
      intent: 'Translate clean joy into clean fear by identifying what becomes exposed if the possibility is chosen.',
      steps: [
        'Name the possibility, invitation, or growth path that feels alive.',
        'Name what would become visible, vulnerable, committed, or at stake if you said yes.',
        'Identify the missing information, support, boundary, or capacity condition.',
        'Make one bounded ask, scout step, or safety condition that lets the possibility stay real.',
      ],
      output: 'An exposure map: If I participate in ___, the edge is ___, and I need ___ next.',
      completionCriteria: 'The possibility has a clear edge and a bounded next move instead of vague enthusiasm.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Name the alive possibility and what saying yes would expose.',
          output: 'A possibility / exposure statement.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the possibility stay alive while you receive the vulnerability it brings with it.',
          output: 'A felt exposure inside the possibility.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate real exposure from fantasy, overpromising, or borrowed urgency.',
          output: 'A real-exposure / inflated-exposure distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose the support, boundary, or pacing that lets the possibility mature.',
          output: 'A participation condition.',
        },
        show_up: {
          role: 'action',
          prompt: 'Make the bounded ask, scout step, or safety condition that lets the possibility stay real.',
          output: 'A sent ask, scout step, or named condition.',
        },
      },
    },
    coreMechanic: 'Let possibility reveal exposure, edge, or risk.',
    preferredPrimitiveIds: ['bound_the_ask', 'clean_exit'],
    seedMoves: [{ title: 'What Possibility Asks Exposure', source: INVENTORY_SOURCE }],
    internalExpression: 'Name what becomes risky if you participate.',
    externalExpression: 'Ask, scout, or set a safety condition around the possibility.',
    completionSignal: 'The possibility has a clear edge.',
    failureMode: 'Joy overpromises or fear shuts the possibility down.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'joy:neutral->neutrality:neutral': family({
    vector: 'joy:neutral->neutrality:neutral',
    role: 'translate',
    sourceChannel: 'joy',
    targetChannel: 'neutrality',
    coverage: 'partial',
    mechanicTags: ['map_field', 'settle_coherence', 'restore_participation'],
    coreMechanic: 'Let aliveness settle into coherence.',
    preferredPrimitiveIds: ['create_handoff', 'create_sequence'],
    seedMoves: [{ title: 'Let Growth Find Ground', source: INVENTORY_SOURCE }],
    internalExpression: 'Place delight inside timing, capacity, and whole-field view.',
    externalExpression: 'Create a structure or sequence that lets aliveness continue.',
    completionSignal: 'Growth has ground without losing aliveness.',
    failureMode: 'Neutrality dampens joy or joy refuses containment.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'neutrality:neutral->anger:neutral': family({
    vector: 'neutrality:neutral->anger:neutral',
    role: 'translate',
    sourceChannel: 'neutrality',
    targetChannel: 'anger',
    coverage: 'stub',
    mechanicTags: ['reveal_desire', 'right_size_force', 'map_field'],
    mechanicOperation: {
      title: 'Find Where Force Belongs',
      intent: 'Translate clean neutrality into clean anger by locating the desire, obstruction, or line inside the whole field.',
      steps: [
        'Map the field: name the people, constraints, values, and timing that matter.',
        'Find the place where movement is blocked, desire is unnamed, or a line is missing.',
        'Write the clean force sentence: I want ___, I will not ___, or I am moving toward ___.',
        'Choose the smallest sufficient expression of force: claim, line, refusal, demand, or intervention.',
      ],
      output: 'A clean force sentence and the smallest sufficient expression of that force.',
      completionCriteria: 'The player knows where force belongs in the field and can express it without losing the field view.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Map the field and notice where desire, obstruction, or pressure concentrates.',
          output: 'A named force point.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the field reveal where force wants to gather without choosing the action yet.',
          output: 'A received desire or obstruction point.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate clean force from blame, urgency, collapse, or the wish not to choose.',
          output: 'A clean-force / distorted-force distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose the smallest sufficient level of force for this field.',
          output: 'A right-sized force choice.',
        },
        show_up: {
          role: 'action',
          prompt: 'Express the clean force as a claim, line, refusal, demand, or intervention.',
          output: 'A spoken, sent, or enacted force move.',
        },
      },
    },
    coreMechanic: 'Let whole-field seeing reveal desire, obstruction, or force.',
    preferredPrimitiveIds: ['interrupt_pattern', 'create_handoff'],
    seedMoves: [{ title: 'What Needs Force Now', source: INVENTORY_SOURCE }],
    internalExpression: 'Name which part of the field needs a line, refusal, or act.',
    externalExpression: 'Turn the field map into one clean line, owner, or intervention.',
    completionSignal: 'The whole field reveals where force belongs.',
    failureMode: 'Neutrality avoids choosing or anger collapses the field view.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'neutrality:neutral->sadness:neutral': family({
    vector: 'neutrality:neutral->sadness:neutral',
    role: 'translate',
    sourceChannel: 'neutrality',
    targetChannel: 'sadness',
    coverage: 'partial',
    mechanicTags: ['reveal_care', 'name_tenderness', 'map_field'],
    mechanicOperation: {
      title: 'Find What Matters In The Field',
      intent: 'Translate clean neutrality into clean sadness by letting the whole-field view become tender and specific.',
      steps: [
        'Name the situation as a whole without solving it yet.',
        'Ask which person, value, relationship, loss, or possibility becomes tender when the whole field is held.',
        'Name the care and the distance: I care about ___, and the distance is ___.',
        'Choose one witnessing, contact, remembrance, or honoring move that does not demand closure.',
      ],
      output: 'A care-and-distance statement plus one witnessing or honoring move.',
      completionCriteria: 'The field is no longer abstract; it reveals specific care that can be felt and honored.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Hold the whole field and notice what becomes tender or meaningful.',
          output: 'A named care point in the field.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the field touch you until the care becomes felt instead of merely observed.',
          output: 'A felt care point in the field.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate clean care from abstraction, guilt, fixing, or collapse.',
          output: 'A clean-care / field-abstraction distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose how mature care would honor the distance without forcing closure.',
          output: 'A mature honoring stance.',
        },
        show_up: {
          role: 'action',
          prompt: 'Make one witnessing, contact, remembrance, or honoring move.',
          output: 'A completed witness, contact, remembrance, or honoring move.',
        },
      },
    },
    coreMechanic: 'Let whole-field seeing reveal care and distance.',
    preferredPrimitiveIds: ['name_care_distance', 'repair_without_performance'],
    seedMoves: [{ title: 'What Matters In This Field', source: INVENTORY_SOURCE }],
    internalExpression: 'Name the care that becomes visible when the whole field is held.',
    externalExpression: 'Make one contact, witness, or repair move toward what matters.',
    completionSignal: 'The field becomes tender and specific.',
    failureMode: 'Field view stays abstract or sadness collapses the system map.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'neutrality:neutral->fear:neutral': family({
    vector: 'neutrality:neutral->fear:neutral',
    role: 'translate',
    sourceChannel: 'neutrality',
    targetChannel: 'fear',
    coverage: 'partial',
    mechanicTags: ['locate_edge', 'map_field'],
    mechanicOperation: {
      title: 'Find The Field Edge',
      intent: 'Translate clean neutrality into clean fear by locating the relevant unknown, risk, or threshold in the whole field.',
      steps: [
        'Map what is stable, known, resourced, or already decided.',
        'Find the edge: what is unknown, risky, time-sensitive, exposed, or threshold-like?',
        'Separate the real edge from imagined consequences.',
        'Create one bounded question, scout step, support ask, or safety condition for that edge.',
      ],
      output: 'A field-edge question and one bounded orienting move.',
      completionCriteria: 'The field has a named edge and the next orienting move is specific enough to do.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Map the stable parts of the field and notice where the unknown or risk begins.',
          output: 'A named field edge.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the unknown be present without rushing to control it, so the real edge can become clearer.',
          output: 'A received field edge.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate the real edge from anxious scanning or false neutrality.',
          output: 'A real-edge / scanning distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose the level of contact the edge can handle now: question, scout, ask, or pause.',
          output: 'A right-sized orienting choice.',
        },
        show_up: {
          role: 'action',
          prompt: 'Ask the bounded question, take the scout step, or create the safety condition.',
          output: 'A completed orienting move.',
        },
      },
    },
    coreMechanic: 'Let whole-field seeing reveal edge and risk.',
    preferredPrimitiveIds: ['bound_the_ask', 'create_handoff'],
    seedMoves: [{ title: 'What Edge Matters Now', source: INVENTORY_SOURCE }],
    internalExpression: 'Name the edge, unknown, or risk that matters in the field.',
    externalExpression: 'Create a bounded ask, role, or scout step around that edge.',
    completionSignal: 'The field has a discernible edge.',
    failureMode: 'Neutrality hides from risk or fear fragments the whole.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
  'neutrality:neutral->joy:neutral': family({
    vector: 'neutrality:neutral->joy:neutral',
    role: 'translate',
    sourceChannel: 'neutrality',
    targetChannel: 'joy',
    coverage: 'stub',
    mechanicTags: ['restore_participation', 'map_field'],
    mechanicOperation: {
      title: 'Find The Live Part',
      intent: 'Translate clean neutrality into clean joy by identifying where the whole field still has energy, invitation, or participation.',
      steps: [
        'Map the situation without trying to improve it.',
        'Notice where there is appetite, curiosity, relief, beauty, play, growth, or energy.',
        'Name the participation point: the field wants life through ___.',
        'Create one invitation, experiment, contribution, or shared moment that lets that life participate.',
      ],
      output: 'A live-part statement and one participation move.',
      completionCriteria: 'The player can identify where aliveness belongs in the field and give it a small real form.',
      practiceVariants: {
        wake_up: {
          role: 'processing',
          prompt: 'Map the situation and notice where appetite, curiosity, beauty, or energy appears.',
          output: 'A named live part.',
        },
        open_up: {
          role: 'processing',
          prompt: 'Let the live part get a little bigger in your attention before turning it into usefulness.',
          output: 'A received live part with felt energy.',
        },
        clean_up: {
          role: 'processing',
          prompt: 'Separate clean aliveness from distraction, productivity pressure, or forced positivity.',
          output: 'A clean-aliveness / false-aliveness distinction.',
        },
        grow_up: {
          role: 'bridge',
          prompt: 'Choose a form of participation that fits the field capacity and timing.',
          output: 'A right-sized participation form.',
        },
        show_up: {
          role: 'action',
          prompt: 'Create the invitation, experiment, contribution, or shared moment.',
          output: 'A completed participation move.',
        },
      },
    },
    coreMechanic: 'Let whole-field seeing reveal aliveness and participation.',
    preferredPrimitiveIds: ['make_meaning_actionable', 'create_handoff'],
    seedMoves: [{ title: 'Where The Field Wants To Grow', source: INVENTORY_SOURCE }],
    internalExpression: 'Name where the field has energy, appetite, or possibility.',
    externalExpression: 'Create one invitation, experiment, or contribution path.',
    completionSignal: 'The whole field reveals a real participation point.',
    failureMode: 'Neutrality stays static or joy ignores the field.',
    sourceRefs: [INVENTORY_SOURCE],
  }),
}

export function getVectorMoveFamily(vector: VectorKey): VectorMoveFamily | null {
  return VECTOR_MOVE_FAMILIES[vector] ?? null
}

export function getVectorMoveFamilyForStates(from: AlchemyState, to: AlchemyState): VectorMoveFamily | null {
  return getVectorMoveFamily(vectorKey(from, to) as VectorKey)
}

export function getVectorMoveFamilyForEdge(edge: AlchemyEdge): VectorMoveFamily | null {
  return getVectorMoveFamilyForStates(edge.from, edge.to)
}

export function allVectorMoveFamilies(): VectorMoveFamily[] {
  return Object.values(VECTOR_MOVE_FAMILIES)
}

export function validateVectorMoveFamilies(): string[] {
  const errors: string[] = []
  const families = allVectorMoveFamilies()
  const channels: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

  for (const family of families) {
    if (family.vector !== vectorKey(
      { channel: family.sourceChannel, altitude: family.role === 'metabolize' ? 'dissatisfied' : 'neutral' },
      { channel: family.targetChannel, altitude: family.role === 'transcend' ? 'satisfied' : 'neutral' },
    )) {
      errors.push(`${family.vector} does not match role/channel metadata`)
    }

    if (family.preferredPrimitiveIds.length === 0) errors.push(`${family.vector} has no preferred primitives`)
    if (family.mechanicTags.length === 0) errors.push(`${family.vector} has no mechanic tags`)
    if (family.mechanicOperation) {
      if (!family.mechanicOperation.title.trim()) errors.push(`${family.vector} has a mechanic operation with no title`)
      if (!family.mechanicOperation.intent.trim()) errors.push(`${family.vector} has a mechanic operation with no intent`)
      if (family.mechanicOperation.steps.length === 0) errors.push(`${family.vector} has a mechanic operation with no steps`)
      if (!family.mechanicOperation.output.trim()) errors.push(`${family.vector} has a mechanic operation with no output`)
      if (!family.mechanicOperation.completionCriteria.trim()) {
        errors.push(`${family.vector} has a mechanic operation with no completion criteria`)
      }
      for (const lens of ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up'] as const) {
        const variant = family.mechanicOperation.practiceVariants[lens]
        if (!variant) {
          errors.push(`${family.vector} has no ${lens} practice variant`)
          continue
        }
        if (!variant.prompt.trim()) errors.push(`${family.vector} ${lens} variant has no prompt`)
        if (!variant.output.trim()) errors.push(`${family.vector} ${lens} variant has no output`)
      }
      if (family.mechanicOperation.practiceVariants.show_up?.role !== 'action') {
        errors.push(`${family.vector} show_up variant must be action-oriented`)
      }
    }
    if (family.seedMoves.length === 0) errors.push(`${family.vector} has no seed moves`)
    if (!family.coreMechanic.trim()) errors.push(`${family.vector} has no core mechanic`)
    if (!family.completionSignal.trim()) errors.push(`${family.vector} has no completion signal`)
  }

  for (const channel of channels) {
    if (!getVectorMoveFamily(`${channel}:dissatisfied->${channel}:neutral` as VectorKey)) {
      errors.push(`missing metabolize family for ${channel}`)
    }
    if (!getVectorMoveFamily(`${channel}:neutral->${channel}:satisfied` as VectorKey)) {
      errors.push(`missing transcend family for ${channel}`)
    }

    for (const target of channels) {
      if (channel === target) continue
      if (!getVectorMoveFamily(`${channel}:neutral->${target}:neutral` as VectorKey)) {
        errors.push(`missing translate family for ${channel}->${target}`)
      }
    }
  }

  return errors
}
