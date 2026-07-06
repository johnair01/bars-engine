import type { AllyshipDomain, Operation, OutputBar } from '@/lib/allyship-deck/types'
import type { EmotionChannel } from './types'
import type { VectorMovePracticeLens } from './vector-move-families'

export type ToolRating = 'strong' | 'medium' | 'weak' | 'not_recommended'

export type EmotionalAlchemyToolId =
  | 'charge_dialogue_321'
  | 'felt_thread'
  | 'bar_capture'
  | 'story_turnaround'
  | 'put_it_on_the_board'
  | 'clean_line'
  | 'return_to_body'
  | 'one_true_next_move'
  | 'make_it_a_game'
  | 'happy_apples'
  | 'make_it_real'

export type EmotionalAlchemyToolTier = 'mvp' | 'next'
export type EmotionalAlchemyMoveRole = 'metabolize' | 'translate' | 'transcend'

export type ToolOutputKind =
  | 'part_dialogue'
  | 'felt_handle'
  | 'bar_reflection'
  | 'belief_reframe'
  | 'field_map'
  | 'clean_line'
  | 'regulation_signal'
  | 'next_action'
  | 'appreciation_scan'
  | 'ritual_artifact'
  | 'quest_seed'
  | 'internal_commitment'

export type ToolProtocolStep = {
  prompt: string
  output: string
}

export interface EmotionalAlchemyTool {
  id: EmotionalAlchemyToolId
  tier: EmotionalAlchemyToolTier
  genericName: string
  barsName: string
  sourceLineage: string
  coreMechanic: string
  waveRatings: Record<VectorMovePracticeLens, ToolRating>
  moveRoleRatings: Record<EmotionalAlchemyMoveRole, ToolRating>
  channelRatings: Record<EmotionChannel, ToolRating>
  operationAffinity: Partial<Record<Operation, ToolRating>>
  domainAffinity: Partial<Record<AllyshipDomain, ToolRating>>
  outputBarAffinity: Partial<Record<OutputBar, ToolRating>>
  outputKinds: ToolOutputKind[]
  protocol: ToolProtocolStep[]
  completionCriteria: string[]
  whenNotToUse: string[]
  preferAnotherToolWhen: string[]
}

export const TOOL_RATING_SCORE: Record<ToolRating, number> = {
  strong: 3,
  medium: 2,
  weak: 1,
  not_recommended: 0,
}

export const EMOTIONAL_ALCHEMY_TOOL_IDS: EmotionalAlchemyToolId[] = [
  'charge_dialogue_321',
  'felt_thread',
  'bar_capture',
  'story_turnaround',
  'put_it_on_the_board',
  'clean_line',
  'return_to_body',
  'one_true_next_move',
  'make_it_a_game',
  'happy_apples',
  'make_it_real',
]

export const MVP_EMOTIONAL_ALCHEMY_TOOL_IDS: EmotionalAlchemyToolId[] = [
  'charge_dialogue_321',
  'felt_thread',
  'bar_capture',
  'story_turnaround',
  'put_it_on_the_board',
  'clean_line',
  'one_true_next_move',
  'make_it_a_game',
]

const WAVE_KEYS: VectorMovePracticeLens[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
const MOVE_ROLE_KEYS: EmotionalAlchemyMoveRole[] = ['metabolize', 'translate', 'transcend']
const CHANNEL_KEYS: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

export const EMOTIONAL_ALCHEMY_TOOLS: Record<EmotionalAlchemyToolId, EmotionalAlchemyTool> = {
  charge_dialogue_321: {
    id: 'charge_dialogue_321',
    tier: 'mvp',
    genericName: 'Structured Part Dialogue',
    barsName: '321 Charge Dialogue',
    sourceLineage: 'Integral Life Practice 3-2-1 Shadow Process, BARS 321, and general parts-work lineage.',
    coreMechanic: 'Move from observing a charged part, to relating with it, to owning the clean portion of its energy.',
    waveRatings: { wake_up: 'strong', open_up: 'medium', clean_up: 'strong', grow_up: 'strong', show_up: 'medium' },
    moveRoleRatings: { metabolize: 'strong', translate: 'strong', transcend: 'medium' },
    channelRatings: { anger: 'strong', sadness: 'strong', fear: 'strong', joy: 'medium', neutrality: 'medium' },
    operationAffinity: { shaman: 'strong', challenger: 'medium', diplomat: 'strong', sage: 'strong' },
    domainAffinity: { RAISE_AWARENESS: 'medium', DIRECT_ACTION: 'medium', SKILLFUL_ORGANIZING: 'medium' },
    outputBarAffinity: { awareness: 'medium', insight: 'strong', wisdom: 'strong', artifact: 'medium' },
    outputKinds: ['part_dialogue', 'internal_commitment', 'quest_seed'],
    protocol: [
      { prompt: 'Name the charge in third person.', output: 'A sentence beginning "There is a part/figure that..."' },
      { prompt: 'Give the part a short name, image, or role.', output: 'Part name or image.' },
      { prompt: 'Address the part directly and ask what it protects, wants, or refuses.', output: 'A direct question to the part.' },
      { prompt: 'Speak as the part for three to five sentences.', output: 'A first-person part quote.' },
      { prompt: 'Name the clean energy you can reclaim.', output: 'A reclaimed-energy sentence.' },
    ],
    completionCriteria: ['A part is named.', 'The part speaks in first person.', 'A clean owned energy sentence exists.'],
    whenNotToUse: ['The player is too activated to keep perspective.', 'A concrete boundary or urgent action is already clear.'],
    preferAnotherToolWhen: ['Use Return to the Body for overwhelm.', 'Use Story Turnaround for an explicit belief.', 'Use Clean Line for a ready ask or boundary.'],
  },
  felt_thread: {
    id: 'felt_thread',
    tier: 'mvp',
    genericName: 'Felt-Sense Tracking',
    barsName: 'Find the Felt Thread',
    sourceLineage: 'BARS felt-sense praxis and general Focusing lineage.',
    coreMechanic: 'Let an unclear bodily whole form, test handles against the body, and record the phrase or image that creates fit.',
    waveRatings: { wake_up: 'strong', open_up: 'strong', clean_up: 'strong', grow_up: 'medium', show_up: 'weak' },
    moveRoleRatings: { metabolize: 'strong', translate: 'medium', transcend: 'strong' },
    channelRatings: { anger: 'medium', sadness: 'strong', fear: 'strong', joy: 'medium', neutrality: 'strong' },
    operationAffinity: { shaman: 'strong', sage: 'medium', diplomat: 'medium' },
    domainAffinity: { RAISE_AWARENESS: 'strong', SKILLFUL_ORGANIZING: 'medium' },
    outputBarAffinity: { awareness: 'strong', experience: 'strong', insight: 'medium' },
    outputKinds: ['felt_handle', 'bar_reflection'],
    protocol: [
      { prompt: 'Pause for twenty to thirty seconds before writing.', output: 'A marked pause.' },
      { prompt: 'Locate where the charge lives in the body.', output: 'Body location.' },
      { prompt: 'Describe size, texture, temperature, motion, or image.', output: 'Somatic description.' },
      { prompt: 'Try three possible handles and check each against the body.', output: 'Handle candidates and fit signal.' },
      { prompt: 'Keep the best-fitting handle.', output: 'A sentence: "What this whole thing feels like is..."' },
    ],
    completionCriteria: ['A body location is named.', 'At least one handle is tested.', 'A fit signal or no-handle-yet result is logged.'],
    whenNotToUse: ['The player needs immediate logistics, safety, or social repair.'],
    preferAnotherToolWhen: ['Use Story Turnaround for explicit beliefs.', 'Use 321 Charge Dialogue for conflicting voices.', 'Use One True Next Move when action is already clear.'],
  },
  bar_capture: {
    id: 'bar_capture',
    tier: 'mvp',
    genericName: 'Reflective Capture',
    barsName: 'BAR Capture',
    sourceLineage: 'General journaling lineage and BARS BAR seed/reflection flows.',
    coreMechanic: 'Convert internal material into a durable inspectable artifact.',
    waveRatings: { wake_up: 'strong', open_up: 'medium', clean_up: 'medium', grow_up: 'strong', show_up: 'medium' },
    moveRoleRatings: { metabolize: 'medium', translate: 'medium', transcend: 'medium' },
    channelRatings: { anger: 'medium', sadness: 'strong', fear: 'medium', joy: 'medium', neutrality: 'strong' },
    operationAffinity: { regent: 'strong', sage: 'strong', architect: 'medium' },
    domainAffinity: { RAISE_AWARENESS: 'strong', SKILLFUL_ORGANIZING: 'medium' },
    outputBarAffinity: { awareness: 'strong', insight: 'strong', wisdom: 'strong', artifact: 'medium' },
    outputKinds: ['bar_reflection', 'quest_seed', 'internal_commitment'],
    protocol: [
      { prompt: 'Write the current charge in one sentence.', output: 'Current charge sentence.' },
      { prompt: 'Write the desired satisfaction in one sentence.', output: 'Desired satisfaction sentence.' },
      { prompt: 'Write the blocker or story in one sentence.', output: 'Named blocker/story.' },
      { prompt: 'Complete: "The emotional move I am practicing is..."', output: 'Move sentence.' },
      { prompt: 'Create the cleanest next artifact.', output: 'Sentence, ask, boundary, map, message draft, or quest seed.' },
    ],
    completionCriteria: ['Current charge is named.', 'Desired satisfaction is named.', 'One next artifact exists.'],
    whenNotToUse: ['Writing has become rumination or self-attack.'],
    preferAnotherToolWhen: ['Use Return to the Body if the body is offline.', 'Use Story Turnaround if belief testing is needed.', 'Use Clean Line for external communication.'],
  },
  story_turnaround: {
    id: 'story_turnaround',
    tier: 'mvp',
    genericName: 'Belief Inquiry',
    barsName: 'Story Turnaround',
    sourceLineage: 'Local Inquiry Lite spec and general contemplative inquiry lineage.',
    coreMechanic: 'Identify the story driving stuckness, test its certainty, observe its cost, and generate a truer replacement.',
    waveRatings: { wake_up: 'medium', open_up: 'weak', clean_up: 'strong', grow_up: 'strong', show_up: 'medium' },
    moveRoleRatings: { metabolize: 'strong', translate: 'medium', transcend: 'medium' },
    channelRatings: { anger: 'strong', sadness: 'medium', fear: 'strong', joy: 'weak', neutrality: 'medium' },
    operationAffinity: { challenger: 'strong', sage: 'strong', regent: 'medium' },
    domainAffinity: { RAISE_AWARENESS: 'strong', DIRECT_ACTION: 'medium' },
    outputBarAffinity: { insight: 'strong', wisdom: 'strong', artifact: 'medium' },
    outputKinds: ['belief_reframe', 'internal_commitment', 'next_action'],
    protocol: [
      { prompt: 'Write the blocker story as "I cannot ___ because ___."', output: 'Belief sentence.' },
      { prompt: 'Ask whether this is completely true right now.', output: 'Truth check.' },
      { prompt: 'Write what happens when you believe it.', output: 'Cost in body, action, and emotion.' },
      { prompt: 'Write who you would be for ten minutes without this thought.', output: 'Without-story description.' },
      { prompt: 'Choose one replacement that is testable today.', output: 'Replacement belief and experiment.' },
    ],
    completionCriteria: ['Belief is named.', 'Cost is named.', 'A testable replacement exists.'],
    whenNotToUse: ['The problem is practical ignorance, external danger, or active overwhelm.'],
    preferAnotherToolWhen: ['Use 321 when a part needs to speak.', 'Use Felt Thread when no story is visible.', 'Use One True Next Move when action is available.'],
  },
  put_it_on_the_board: {
    id: 'put_it_on_the_board',
    tier: 'mvp',
    genericName: 'Field Mapping',
    barsName: 'Put It On The Board',
    sourceLineage: 'General systems mapping, stakeholder mapping, cognitive offloading, and BARS domains.',
    coreMechanic: 'Externalize the situation as objects and relations so the player can see where work belongs.',
    waveRatings: { wake_up: 'strong', open_up: 'medium', clean_up: 'medium', grow_up: 'strong', show_up: 'medium' },
    moveRoleRatings: { metabolize: 'medium', translate: 'strong', transcend: 'weak' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'strong' },
    operationAffinity: { architect: 'strong', regent: 'strong', shaman: 'medium' },
    domainAffinity: { GATHERING_RESOURCES: 'strong', SKILLFUL_ORGANIZING: 'strong', DIRECT_ACTION: 'medium', RAISE_AWARENESS: 'medium' },
    outputBarAffinity: { awareness: 'medium', insight: 'medium', wisdom: 'strong', artifact: 'medium' },
    outputKinds: ['field_map', 'quest_seed', 'next_action'],
    protocol: [
      { prompt: 'Draw four boxes: me, blocker, desired satisfaction, field.', output: 'Four-box map.' },
      { prompt: 'Put known facts in the field box.', output: 'Fact list.' },
      { prompt: 'Put interpretations or stories in the blocker box.', output: 'Story list.' },
      { prompt: 'Mark each item as fact, story, need, resource, threat, or desire.', output: 'Classified map.' },
      { prompt: 'Circle the one place where a move is possible now.', output: 'Work location and move sentence.' },
    ],
    completionCriteria: ['The map separates fact from story.', 'The work location is circled.', 'A next move location is named.'],
    whenNotToUse: ['The player is using analysis to avoid feeling or action.'],
    preferAnotherToolWhen: ['Use Felt Thread for bodily/vague charge.', 'Use Clean Line for a ready message.', 'Use Make It Real for grief flow.'],
  },
  clean_line: {
    id: 'clean_line',
    tier: 'mvp',
    genericName: 'Clean Ask / Boundary Script',
    barsName: 'Clean Line',
    sourceLineage: 'Existing Boundary Shield and Rose Tool plus general consent-forward communication lineage.',
    coreMechanic: 'Turn charge into a short ask, no, offer, limit, or repair line that can be spoken or held.',
    waveRatings: { wake_up: 'medium', open_up: 'weak', clean_up: 'medium', grow_up: 'strong', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'weak', translate: 'medium', transcend: 'medium' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'strong' },
    operationAffinity: { challenger: 'strong', diplomat: 'strong', regent: 'medium' },
    domainAffinity: { GATHERING_RESOURCES: 'strong', DIRECT_ACTION: 'strong', SKILLFUL_ORGANIZING: 'medium', RAISE_AWARENESS: 'medium' },
    outputBarAffinity: { artifact: 'strong', wisdom: 'medium', insight: 'medium' },
    outputKinds: ['clean_line', 'next_action', 'internal_commitment'],
    protocol: [
      { prompt: 'Name the relationship or field where the line belongs.', output: 'Recipient/field.' },
      { prompt: 'Choose script type: ask, no, offer, limit, or repair.', output: 'Script type.' },
      { prompt: 'Fill the template: "I want/need ___. I can ___. I cannot ___. Would you be willing to ___?"', output: 'Draft line.' },
      { prompt: 'Remove blame and over-explaining.', output: 'Cleaned line.' },
      { prompt: 'Choose delivery: send, save, practice, or internal line.', output: 'Delivery choice.' },
    ],
    completionCriteria: ['The line is short.', 'The line is true.', 'The line is actionable or holdable.'],
    whenNotToUse: ['The player is still trying to punish, recruit guilt, or control an outcome.'],
    preferAnotherToolWhen: ['Use Felt Thread if desire is unclear.', 'Use Story Turnaround if belief is tangled.', 'Use 321 if an exiled part is driving the line.'],
  },
  return_to_body: {
    id: 'return_to_body',
    tier: 'next',
    genericName: 'Regulation Reset',
    barsName: 'Return to the Body',
    sourceLineage: 'Existing Grounding Sequence, Grounding Cord, Breath Reset, Basic Qi Gong Reset, and general grounding lineage.',
    coreMechanic: 'Change state enough that the player can sense, choose, or complete a next move.',
    waveRatings: { wake_up: 'medium', open_up: 'strong', clean_up: 'medium', grow_up: 'medium', show_up: 'weak' },
    moveRoleRatings: { metabolize: 'medium', translate: 'weak', transcend: 'weak' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'strong', joy: 'weak', neutrality: 'strong' },
    operationAffinity: { shaman: 'strong', regent: 'medium' },
    domainAffinity: { DIRECT_ACTION: 'medium', SKILLFUL_ORGANIZING: 'medium' },
    outputBarAffinity: { experience: 'strong', awareness: 'medium' },
    outputKinds: ['regulation_signal', 'bar_reflection'],
    protocol: [
      { prompt: 'Rate activation from zero to ten.', output: 'Before rating.' },
      { prompt: 'Choose one reset: longer exhale, orienting, feet/seat scan, or slow movement.', output: 'Reset mode.' },
      { prompt: 'Do the reset without multitasking.', output: 'Completed reset.' },
      { prompt: 'Rate activation again.', output: 'After rating.' },
      { prompt: 'Write the first available next signal.', output: 'Body, emotion, thought, or action signal.' },
    ],
    completionCriteria: ['Before/after activation is logged.', 'Reset mode is named.', 'A next signal or need for stronger support is named.'],
    whenNotToUse: ['Calming down is being used to avoid needed anger, grief, or action.'],
    preferAnotherToolWhen: ['Use Story Turnaround for clear beliefs.', 'Use Make It Real for grief expression.', 'Use One True Next Move when action is ready.'],
  },
  one_true_next_move: {
    id: 'one_true_next_move',
    tier: 'mvp',
    genericName: 'Command Bridge',
    barsName: 'One True Next Move',
    sourceLineage: 'Existing Emotional First Aid Command Bridge and general next-action practice.',
    coreMechanic: 'Convert fuzzy charge into a mission sentence and one action under ten minutes.',
    waveRatings: { wake_up: 'medium', open_up: 'weak', clean_up: 'weak', grow_up: 'medium', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'weak', translate: 'medium', transcend: 'medium' },
    channelRatings: { anger: 'strong', sadness: 'weak', fear: 'medium', joy: 'medium', neutrality: 'strong' },
    operationAffinity: { challenger: 'strong', architect: 'medium', regent: 'medium' },
    domainAffinity: { DIRECT_ACTION: 'strong', SKILLFUL_ORGANIZING: 'strong', GATHERING_RESOURCES: 'medium', RAISE_AWARENESS: 'medium' },
    outputBarAffinity: { artifact: 'strong', wisdom: 'medium' },
    outputKinds: ['next_action', 'quest_seed', 'internal_commitment'],
    protocol: [
      { prompt: 'Complete: "For the next hour, my mission is ___."', output: 'Mission sentence.' },
      { prompt: 'List three actions under ten minutes.', output: 'Action candidates.' },
      { prompt: 'Cross out actions that depend on another person responding first.', output: 'Available actions.' },
      { prompt: 'Choose the smallest action that visibly advances the mission.', output: 'Chosen action.' },
      { prompt: 'Do it, schedule it, delegate it, or explicitly decline it.', output: 'Completion note.' },
    ],
    completionCriteria: ['Mission is named.', 'One action is chosen.', 'Action is done, scheduled, delegated, or declined.'],
    whenNotToUse: ['The next move would be impulsive, performative, or avoidant.'],
    preferAnotherToolWhen: ['Use Felt Thread if the charge is unidentified.', 'Use Story Turnaround if the blocker is a belief.', 'Use Clean Line if the action is interpersonal.'],
  },
  make_it_a_game: {
    id: 'make_it_a_game',
    tier: 'mvp',
    genericName: 'Playable Challenge Design',
    barsName: 'Make It A Game',
    sourceLineage: 'BARS Joy / Bliss Coverage spec and general game design / gamification lineage.',
    coreMechanic: 'Turn a dead, stuck, overwhelming, or unappealing path into a small playable challenge with rules, a win condition, feedback, and a completion signal.',
    waveRatings: { wake_up: 'strong', open_up: 'medium', clean_up: 'strong', grow_up: 'strong', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'strong', translate: 'medium', transcend: 'strong' },
    channelRatings: { anger: 'medium', sadness: 'weak', fear: 'medium', joy: 'strong', neutrality: 'medium' },
    operationAffinity: { shaman: 'medium', challenger: 'medium', regent: 'strong', architect: 'strong', diplomat: 'medium', sage: 'medium' },
    domainAffinity: { GATHERING_RESOURCES: 'medium', RAISE_AWARENESS: 'medium', DIRECT_ACTION: 'strong', SKILLFUL_ORGANIZING: 'strong' },
    outputBarAffinity: { awareness: 'medium', experience: 'medium', insight: 'medium', wisdom: 'strong', artifact: 'strong' },
    outputKinds: ['next_action', 'quest_seed', 'internal_commitment', 'bar_reflection'],
    protocol: [
      { prompt: 'Name the blocker in ordinary language.', output: 'Blocker sentence.' },
      { prompt: 'Choose the game-making frame: meaningful, playable, winnable, sustainable, participatory, or teaching.', output: 'Game frame.' },
      { prompt: 'Find the spark: real good, live part, curiosity, desire, care, challenge, or aliveness.', output: 'Spark statement.' },
      { prompt: 'Name the false-joy risk: stimulation, performance, comparison, overpromise, bypass, guilt, or entertainment demand.', output: 'False-joy risk.' },
      { prompt: 'Define the tiny game: field, move, rule, win condition, and feedback signal.', output: 'Tiny game card.' },
      { prompt: 'Add the container: timebox, scope, support, no-list, or completion marker.', output: 'Game container.' },
      { prompt: 'Play, schedule, or consciously decline one round.', output: 'Round result.' },
      { prompt: 'Check whether joy/bliss increased or sadness, fear, anger, or neutrality became primary.', output: 'Continue or handoff note.' },
    ],
    completionCriteria: [
      'A tiny game card exists.',
      'The game has a rule, round, win condition, and feedback signal.',
      'One round is played, scheduled, or consciously declined.',
      'A continue or handoff note is recorded.',
    ],
    whenNotToUse: [
      'The player is trying to force fun over grief, fear, anger, consent, or practical reality.',
      'The blocker requires a boundary, repair, or safety decision before play can be clean.',
      'The game would reward overpromise, comparison, or stimulation instead of real participation.',
    ],
    preferAnotherToolWhen: [
      'Use Felt Thread when the charge is still unclear in the body.',
      'Use Story Turnaround when guilt, worthiness, or a belief is the main blocker.',
      'Use Clean Line when the next step is an ask, boundary, or message.',
    ],
  },
  happy_apples: {
    id: 'happy_apples',
    tier: 'next',
    genericName: 'Appreciation / Resource Scan',
    barsName: 'Happy Apples',
    sourceLineage: 'Existing Happy Apples quest card and general gratitude/resource-orientation lineage.',
    coreMechanic: 'Identify small real goods without forcing a silver lining, then let one become shareable or usable.',
    waveRatings: { wake_up: 'medium', open_up: 'strong', clean_up: 'weak', grow_up: 'medium', show_up: 'medium' },
    moveRoleRatings: { metabolize: 'weak', translate: 'medium', transcend: 'strong' },
    channelRatings: { anger: 'weak', sadness: 'weak', fear: 'medium', joy: 'strong', neutrality: 'strong' },
    operationAffinity: { architect: 'strong', shaman: 'medium', sage: 'medium' },
    domainAffinity: { GATHERING_RESOURCES: 'strong', RAISE_AWARENESS: 'medium' },
    outputBarAffinity: { experience: 'strong', wisdom: 'medium', artifact: 'medium' },
    outputKinds: ['appreciation_scan', 'bar_reflection', 'next_action'],
    protocol: [
      { prompt: 'Name the current charge honestly.', output: 'Charge sentence.' },
      { prompt: 'Find three tiny things that are genuinely good right now.', output: 'Three apples.' },
      { prompt: 'Write why each is real, not why it fixes everything.', output: 'Reality notes.' },
      { prompt: 'Choose one apple to receive for thirty seconds.', output: 'Received apple.' },
      { prompt: 'Choose whether to share it, use it, or log it.', output: 'Share/use/log choice.' },
    ],
    completionCriteria: ['Three specific goods are named.', 'One is received or honestly marked unavailable.', 'A share/use/log choice exists.'],
    whenNotToUse: ['The player needs grief, anger, or boundary before appreciation can be true.'],
    preferAnotherToolWhen: ['Use Make It Real when care/distance is primary.', 'Use Put It On The Board for risk/resource mapping.', 'Use Story Turnaround when a belief blocks joy.'],
  },
  make_it_real: {
    id: 'make_it_real',
    tier: 'next',
    genericName: 'Ritual Container',
    barsName: 'Make It Real',
    sourceLineage: 'Existing quest/party ritual patterns and general symbolic action lineage.',
    coreMechanic: 'Give an emotional shift a concrete symbolic action, boundary, or artifact so the body and field can register it.',
    waveRatings: { wake_up: 'weak', open_up: 'strong', clean_up: 'medium', grow_up: 'medium', show_up: 'strong' },
    moveRoleRatings: { metabolize: 'medium', translate: 'medium', transcend: 'strong' },
    channelRatings: { anger: 'medium', sadness: 'strong', fear: 'weak', joy: 'strong', neutrality: 'medium' },
    operationAffinity: { diplomat: 'strong', sage: 'strong', regent: 'medium' },
    domainAffinity: { RAISE_AWARENESS: 'strong', DIRECT_ACTION: 'medium', SKILLFUL_ORGANIZING: 'medium' },
    outputBarAffinity: { experience: 'medium', wisdom: 'medium', artifact: 'strong' },
    outputKinds: ['ritual_artifact', 'quest_seed', 'internal_commitment'],
    protocol: [
      { prompt: 'Name what is being released, honored, received, or begun.', output: 'Ritual intent.' },
      { prompt: 'Choose a small physical symbol.', output: 'Symbol.' },
      { prompt: 'Speak or write one sentence of meaning.', output: 'Ritual sentence.' },
      { prompt: 'Perform the symbolic action for one to three minutes.', output: 'Completed symbolic action.' },
      { prompt: 'Record what changed in body, emotion, or intention.', output: 'Integration note.' },
    ],
    completionCriteria: ['Ritual intent is named.', 'Symbolic action is completed.', 'Its effect is logged.'],
    whenNotToUse: ['Practical action, consent, or safety is required first.'],
    preferAnotherToolWhen: ['Use Story Turnaround for beliefs.', 'Use Clean Line for messages.', 'Use Felt Thread for unclear charge.'],
  },
}

export function allEmotionalAlchemyTools(): EmotionalAlchemyTool[] {
  return EMOTIONAL_ALCHEMY_TOOL_IDS.map((id) => EMOTIONAL_ALCHEMY_TOOLS[id])
}

export function allMvpEmotionalAlchemyTools(): EmotionalAlchemyTool[] {
  return MVP_EMOTIONAL_ALCHEMY_TOOL_IDS.map((id) => EMOTIONAL_ALCHEMY_TOOLS[id])
}

export function getEmotionalAlchemyTool(id: EmotionalAlchemyToolId): EmotionalAlchemyTool {
  return EMOTIONAL_ALCHEMY_TOOLS[id]
}

export function compareToolRatings(a: ToolRating, b: ToolRating): number {
  return TOOL_RATING_SCORE[b] - TOOL_RATING_SCORE[a]
}

export function validateEmotionalAlchemyToolRegistry(): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const id of EMOTIONAL_ALCHEMY_TOOL_IDS) {
    const tool = EMOTIONAL_ALCHEMY_TOOLS[id]
    if (!tool) {
      errors.push(`Missing tool ${id}`)
      continue
    }
    if (seen.has(tool.id)) errors.push(`Duplicate tool id ${tool.id}`)
    seen.add(tool.id)
    if (tool.id !== id) errors.push(`Tool key ${id} does not match tool.id ${tool.id}`)
    if (!tool.genericName.trim()) errors.push(`${id} missing genericName`)
    if (!tool.barsName.trim()) errors.push(`${id} missing barsName`)
    if (!tool.coreMechanic.trim()) errors.push(`${id} missing coreMechanic`)
    if (tool.outputKinds.length === 0) errors.push(`${id} missing outputKinds`)
    if (tool.protocol.length < 3) errors.push(`${id} needs at least 3 protocol steps`)
    if (tool.completionCriteria.length === 0) errors.push(`${id} missing completionCriteria`)
    if (tool.whenNotToUse.length === 0) errors.push(`${id} missing whenNotToUse`)

    for (const wave of WAVE_KEYS) {
      if (!tool.waveRatings[wave]) errors.push(`${id} missing wave rating ${wave}`)
    }
    for (const role of MOVE_ROLE_KEYS) {
      if (!tool.moveRoleRatings[role]) errors.push(`${id} missing move role rating ${role}`)
    }
    for (const channel of CHANNEL_KEYS) {
      if (!tool.channelRatings[channel]) errors.push(`${id} missing channel rating ${channel}`)
    }
  }

  for (const id of Object.keys(EMOTIONAL_ALCHEMY_TOOLS)) {
    if (!EMOTIONAL_ALCHEMY_TOOL_IDS.includes(id as EmotionalAlchemyToolId)) {
      errors.push(`Unexpected tool key ${id}`)
    }
  }

  for (const id of MVP_EMOTIONAL_ALCHEMY_TOOL_IDS) {
    const tool = EMOTIONAL_ALCHEMY_TOOLS[id]
    if (!tool) errors.push(`MVP tool ${id} missing from registry`)
    if (tool && tool.tier !== 'mvp') errors.push(`MVP tool ${id} is not marked mvp`)
  }

  return errors
}
