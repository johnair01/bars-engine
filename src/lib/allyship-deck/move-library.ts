/**
 * Allyship Deck — canonical move-library data (ADK Phase 1).
 * Authoritative grammar: .specify/specs/allyship-deck/move-library-core-rules.md
 *
 * 5 Basic Moves × 6 Operations × 4 Domains = 120 move cards.
 * The 30 submoves (move × operation) are transcribed verbatim from the core rules.
 */

import type {
  BasicMove,
  Operation,
  AllyshipDomain,
  Capability,
  Channel,
  OutputBar,
  MoveCard,
} from './types'

export interface MoveDef {
  key: BasicMove
  label: string
  abbr: string // id segment
  purpose: string
  question: string
  outputBar: OutputBar
  /** seed stem for the campaign-register question */
  campaignStem: string
}

export const MOVES: MoveDef[] = [
  { key: 'wake_up', label: 'Wake Up', abbr: 'WAKE', purpose: 'Detect charge', question: 'What is happening?', outputBar: 'awareness', campaignStem: 'What needs to be seen in this campaign' },
  { key: 'open_up', label: 'Open Up', abbr: 'OPEN', purpose: 'Receive charge', question: 'What energy is trying to get through?', outputBar: 'experience', campaignStem: 'What energy or need is trying to get through in this campaign' },
  { key: 'clean_up', label: 'Clean Up', abbr: 'CLEAN', purpose: 'Transform charge', question: 'What move is missing?', outputBar: 'insight', campaignStem: 'What move is missing for this campaign' },
  { key: 'grow_up', label: 'Grow Up', abbr: 'GROW', purpose: 'Develop capability', question: 'Who must I become?', outputBar: 'wisdom', campaignStem: 'What capacity must we build for this campaign' },
  { key: 'show_up', label: 'Show Up', abbr: 'SHOW', purpose: 'Invest capacity', question: 'What shall I create?', outputBar: 'artifact', campaignStem: 'What must we create or do for this campaign' },
]

export interface OperationDef {
  key: Operation
  label: string
  verb: string
  essence: string
}

export const OPERATIONS: OperationDef[] = [
  { key: 'shaman', label: 'Shaman', verb: 'Notice', essence: 'What is here?' },
  { key: 'challenger', label: 'Challenger', verb: 'Challenge', essence: 'What resists?' },
  { key: 'regent', label: 'Regent', verb: 'Steward', essence: 'What deserves responsibility?' },
  { key: 'architect', label: 'Architect', verb: 'Amplify', essence: 'What value wants to be increased?' },
  { key: 'diplomat', label: 'Diplomat', verb: 'Care', essence: 'What relationships or power dynamics matter?' },
  { key: 'sage', label: 'Sage', verb: 'Integrate', essence: 'What larger truth is emerging?' },
]

export interface DomainDef {
  key: AllyshipDomain
  label: string
  abbr: string
  /** the domain's contextual lens (what this domain is about) */
  lens: string
}

export const DOMAINS: DomainDef[] = [
  { key: 'GATHERING_RESOURCES', label: 'Gather Resources', abbr: 'GR', lens: 'need, asking, and marshaling resources' },
  { key: 'RAISE_AWARENESS', label: 'Raise Awareness', abbr: 'RA', lens: 'attention, truth, and what must become visible' },
  { key: 'DIRECT_ACTION', label: 'Direct Action', abbr: 'DA', lens: 'the line, intervention, and what must change' },
  { key: 'SKILLFUL_ORGANIZING', label: 'Skillful Organizing', abbr: 'SO', lens: 'structure, coordination, and who does what' },
]

export interface CapabilityDef {
  capability: Capability
  channel: Channel
  channelLabel: string
  dissatisfied: string
  satisfaction: string
  statement: string
}

export const CAPABILITIES: CapabilityDef[] = [
  { capability: 'agency', channel: 'fire', channelLabel: 'Fire', dissatisfied: 'Anger', satisfaction: 'Triumph', statement: 'I can act.' },
  { capability: 'connection', channel: 'water', channelLabel: 'Water', dissatisfied: 'Sadness', satisfaction: 'Poignance', statement: 'I can connect.' },
  { capability: 'exploration', channel: 'metal', channelLabel: 'Metal', dissatisfied: 'Fear', satisfaction: 'Wonder', statement: 'I can explore.' },
  { capability: 'rest', channel: 'earth', channelLabel: 'Earth', dissatisfied: 'Neutrality', satisfaction: 'Peace', statement: 'I can rest.' },
  { capability: 'participation', channel: 'wood', channelLabel: 'Wood', dissatisfied: 'Joy (stuck)', satisfaction: 'Bliss', statement: 'I can participate.' },
]

/** The 30 canonical submoves — verbatim from move-library-core-rules.md. */
export const SUBMOVES: Record<BasicMove, Record<Operation, { action: string; question: string }>> = {
  wake_up: {
    shaman: { action: 'Notice the signal', question: 'What is here?' },
    challenger: { action: 'Notice resistance', question: 'What resists being seen?' },
    regent: { action: 'Notice stewardship', question: 'What deserves attention?' },
    architect: { action: 'Notice potential', question: 'What value wants to increase?' },
    diplomat: { action: 'Notice relationships', question: 'What relational dynamics matter?' },
    sage: { action: 'Notice meaning', question: 'What larger pattern is emerging?' },
  },
  open_up: {
    shaman: { action: 'Allow experience', question: 'What am I actually feeling?' },
    challenger: { action: 'Allow discomfort', question: 'What am I avoiding feeling?' },
    regent: { action: 'Hold responsibility', question: 'Can I stay with this?' },
    architect: { action: 'Receive the resource', question: 'What energy is hidden here?' },
    diplomat: { action: 'Care for experience', question: 'How can I relate compassionately to this?' },
    sage: { action: 'Witness experience', question: 'What happens when I stop fighting it?' },
  },
  clean_up: {
    shaman: { action: 'Identify channel', question: 'Which channel is active — Fire, Water, Metal, Earth, or Wood?' },
    challenger: { action: 'Challenge interpretation', question: 'What story am I believing?' },
    regent: { action: 'Identify missing move', question: 'What capability is unavailable?' },
    architect: { action: 'Select transformation', question: 'Transcend, Translate, or Neutralize?' },
    diplomat: { action: 'Choose destination', question: 'Which channel would better serve this situation?' },
    sage: { action: 'Extract insight', question: 'What does this teach me?' },
  },
  grow_up: {
    shaman: { action: 'Identify emerging capacity', question: 'What wants to grow?' },
    challenger: { action: 'Identify developmental edge', question: 'What must evolve?' },
    regent: { action: 'Steward growth', question: 'What deserves practice?' },
    architect: { action: 'Amplify capacity', question: 'What capability wants strengthening?' },
    diplomat: { action: 'Relate growth', question: 'How does this affect others?' },
    sage: { action: 'Integrate growth', question: 'Who am I becoming?' },
  },
  show_up: {
    shaman: { action: 'Choose domain', question: 'Where will I invest this?' },
    challenger: { action: 'Create intervention', question: 'What must change?' },
    regent: { action: 'Create stewardship', question: 'What deserves ongoing support?' },
    architect: { action: 'Create structure', question: 'What value am I amplifying?' },
    diplomat: { action: 'Create relationship', question: 'Who must be involved? What power dynamic must be addressed?' },
    sage: { action: 'Create legacy', question: 'What artifact remains?' },
  },
}

/**
 * Authored overrides — fully written cards that replace the generated scaffold.
 * Keyed by card id. The Open Up × Gathering Resources slice (the worked template).
 */
export const AUTHORED: Record<string, Partial<MoveCard>> = {
  'OPEN-GR-SHAMAN': {
    title: 'The Empty Cup',
    primaryQuestion: 'What does the lack actually feel like in my body, before I reach for a plan?',
    campaignQuestion: 'What does their need actually feel like — and what dignity sits beneath the dollar amount?',
    optimizesFor: 'Honest contact with the felt sense of need, so resourcing starts from truth, not panic.',
    forbiddenMoves: ['Jumping straight to a budget or plan', 'Numbing the need', "Performing abundance you don't feel"],
    failureModes: ['Spiritual bypass ("I don\'t really need anything")', 'Scarcity panic', 'Talking about "the money" with no body in it'],
    remediation: 'Name the sensation of lack out loud — where it sits in the body — before you make a single ask.',
    flavor: 'The child holding the empty cup is not a problem to solve yet. First, let yourself see the cup.',
    capabilities: ['connection', 'rest'],
  },
  'OPEN-GR-CHALLENGER': {
    title: "The Ask You're Avoiding",
    primaryQuestion: 'What resource am I afraid to ask for — and what am I avoiding feeling about needing it?',
    campaignQuestion: 'What ask for them am I avoiding — and whose comfort am I protecting by not making it?',
    optimizesFor: 'Contact with the avoided discomfort of dependence; surfacing the real ask under the safe one.',
    forbiddenMoves: ['Rescuing yourself just to avoid asking', 'Self-sufficiency performance', 'Resentment in place of a request'],
    failureModes: ['Fake asking (asking for rescue, not to be changed)', 'Martyrdom', 'Saying "no" for people before they can answer'],
    remediation: 'Feel the "no" you\'re bracing against. Make the real ask anyway — for the thing you actually need.',
    flavor: 'It never worked because the asking was fake. It was asking for rescue, not asking to be changed.',
    capabilities: ['agency', 'connection'],
  },
  'OPEN-GR-REGENT': {
    title: 'Stay With the Need',
    primaryQuestion: 'Can I hold this need as mine to steward — without collapsing into helplessness or dumping it on someone else?',
    campaignQuestion: 'Can I steward their need without making it my emergency — or quietly taking it over?',
    optimizesFor: 'Staying present and responsible to the gap long enough to act from steadiness.',
    forbiddenMoves: ["Making your need someone else's emergency", 'Abdicating it entirely', 'Grabbing total control to feel safe'],
    failureModes: ['Helplessness handoff', 'Savior-summoning', 'White-knuckling it alone'],
    remediation: 'Hold the need for sixty seconds without solving it. Then choose one stewarding act you can own.',
    capabilities: ['agency', 'rest'],
  },
  'OPEN-GR-ARCHITECT': {
    title: 'The Hidden Supply',
    primaryQuestion: "What resource is already within reach that I haven't let myself receive?",
    campaignQuestion: "What resource or network for this campaign is already available that I haven't activated yet?",
    optimizesFor: 'Perceiving latent and available resources — skills, relationships, slack, standing offers.',
    forbiddenMoves: ['Hoarding', 'Discounting what\'s offered', 'The reflexive "it\'s not enough"'],
    failureModes: ['Scarcity blindness', 'Refusing help that\'s right there', 'Over-counting the future while starving the present'],
    remediation: 'List three resources already within reach. Receive one of them today.',
    capabilities: ['exploration', 'participation'],
  },
  'OPEN-GR-DIPLOMAT': {
    title: 'The Tenderness of Asking',
    primaryQuestion: "How can I relate to this need — mine and others' — with care instead of shame or scorekeeping?",
    campaignQuestion: 'Did they consent to this ask — and how do I invite givers without shaming the person or the givers?',
    optimizesFor: 'A compassionate relational stance toward resource flow; giving and receiving without debt-shame.',
    forbiddenMoves: ['Transactional scorekeeping', 'Leveraging guilt', 'Pity dressed as generosity'],
    failureModes: ['Obligation webs', 'Charity-as-power-over', 'Resentment-laden giving'],
    remediation: 'Offer or receive one resource with no strings — and say "no strings" out loud.',
    capabilities: ['connection', 'participation'],
  },
  'OPEN-GR-SAGE': {
    title: 'When You Stop Fighting the Lack',
    primaryQuestion: 'What becomes clear about this need when I stop fighting it and simply witness it?',
    campaignQuestion: 'When I stop forcing the campaign, what does it reveal it actually needs?',
    optimizesFor: 'Integrated seeing of the resource pattern — the larger truth about what the need is really about.',
    forbiddenMoves: ['Forcing the insight', 'Bypassing into "it\'s all fine"', 'Premature meaning-making'],
    failureModes: ['Spiritual gloss', 'Passivity disguised as acceptance', 'Analysis standing in for witness'],
    remediation: 'Watch the lack for three breaths without fixing it. Write the one true sentence that surfaces.',
    capabilities: ['exploration', 'connection'],
  },
}
