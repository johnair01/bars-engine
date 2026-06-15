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

  // ── WAKE UP × Gathering Resources (Detect charge → Awareness) ──
  'WAKE-GR-SHAMAN': {
    title: "What's Actually Scarce",
    primaryQuestion: 'What is actually depleted here — and what only feels depleted?',
    campaignQuestion: 'What does this effort actually lack — money, time, hands, or hope?',
    optimizesFor: 'Seeing the real resource gap before reacting to the felt one.',
    forbiddenMoves: ['Assuming scarcity without looking', 'Counting only money', 'Panic-inventory'],
    failureModes: ['Confusing "I\'m tired" with "we\'re broke"', 'Resource tunnel-vision'],
    remediation: 'Name the one resource that, if present, would change everything.',
    flavor: 'Not every empty cup is the same cup.',
    capabilities: ['exploration', 'rest'],
  },
  'WAKE-GR-CHALLENGER': {
    title: "The Number You Won't Look At",
    primaryQuestion: 'What resource truth am I refusing to look at directly?',
    campaignQuestion: 'What number are we avoiding — the real cost, the real shortfall?',
    optimizesFor: 'Surfacing the avoided figure so planning can be honest.',
    forbiddenMoves: ['Vague "we\'ll figure it out"', 'Rounding away the gap', 'Magical thinking'],
    failureModes: ['Optimism as avoidance', 'Budgets that omit the scary line'],
    remediation: 'Write the exact amount needed. Look at it for ten seconds.',
    capabilities: ['exploration', 'agency'],
  },
  'WAKE-GR-REGENT': {
    title: "What's Worth Funding",
    primaryQuestion: 'Of all that is depleted, what actually deserves resourcing first?',
    campaignQuestion: 'What in this campaign most deserves the resources we can gather?',
    optimizesFor: 'Prioritizing the resource need that matters most.',
    forbiddenMoves: ['Funding the loudest need', 'Spreading thin', 'Neglecting the core'],
    failureModes: ['Resourcing optics over substance', 'Everything is "priority"'],
    remediation: 'Rank the top three needs. Fund the first before the rest.',
    capabilities: ['rest', 'agency'],
  },
  'WAKE-GR-ARCHITECT': {
    title: 'The Untapped Vein',
    primaryQuestion: 'What resource is already here, underused, waiting to be grown?',
    campaignQuestion: 'What asset does this campaign already have that we could multiply?',
    optimizesFor: 'Spotting latent resources with upside.',
    forbiddenMoves: ['Only seeing lack', "Ignoring what's already working", 'Sunk-cost gazing'],
    failureModes: ['Scarcity blindness to existing assets', 'Under-leveraging a strength'],
    remediation: 'Name one resource you already have that could double.',
    capabilities: ['exploration', 'participation'],
  },
  'WAKE-GR-DIPLOMAT': {
    title: 'Who Holds the Purse',
    primaryQuestion: 'Whose resources, trust, or permission actually shape this?',
    campaignQuestion: 'Who are the givers, gatekeepers, and stakeholders in this ask?',
    optimizesFor: 'Seeing the relational map of resource flow and power.',
    forbiddenMoves: ['Ignoring gatekeepers', 'Treating money as apolitical', 'Bypassing consent'],
    failureModes: ['Missing who controls access', 'Stepping on a key relationship'],
    remediation: 'List who must say yes for resources to move. Start there.',
    capabilities: ['connection', 'participation'],
  },
  'WAKE-GR-SAGE': {
    title: 'The Story the Lack Tells',
    primaryQuestion: 'What pattern does this scarcity reveal about how I resource my life?',
    campaignQuestion: 'What does this shortfall reveal about the larger system around it?',
    optimizesFor: 'Reading scarcity as a signal about a bigger pattern.',
    forbiddenMoves: ['Treating each shortfall as isolated', 'Bypassing into "abundance mindset"'],
    failureModes: ['Missing the recurring pattern', 'Spiritualizing systemic lack'],
    remediation: 'Ask whether this lack has happened before. Name the pattern.',
    capabilities: ['exploration', 'connection'],
  },

  // ── CLEAN UP × Gathering Resources (Transform charge → Insight) ──
  'CLEAN-GR-SHAMAN': {
    title: 'Name the Money Feeling',
    primaryQuestion: 'Which channel is live around this resource — fear, anger, sadness, numbness, or reach?',
    campaignQuestion: "What emotional channel is driving how we're resourcing this — and is it clean?",
    optimizesFor: 'Locating the active channel so the charge can move.',
    forbiddenMoves: ['Acting on the charge before naming it', 'Assuming it\'s "just logistics"'],
    failureModes: ['Fear masquerading as strategy', 'Anger budgeting'],
    remediation: 'Name the channel out loud: "This is fear / anger / sadness about money."',
    capabilities: ['exploration'],
  },
  'CLEAN-GR-CHALLENGER': {
    title: 'The Money Story',
    primaryQuestion: 'What story about deserving, scarcity, or worth am I treating as fact?',
    campaignQuestion: 'What limiting story — "we can\'t ask for that much" — are we believing?',
    optimizesFor: 'Exposing the inherited resource script.',
    forbiddenMoves: ['Defending the story', '"But it\'s true"', 'Identifying with the lack'],
    failureModes: ['Scarcity script as identity', 'Inherited shame as realism'],
    remediation: "Write the story as a sentence. Then write the version that isn't certain.",
    flavor: 'Inherited scripts run the budget until you read them aloud.',
    capabilities: ['agency', 'exploration'],
  },
  'CLEAN-GR-REGENT': {
    title: "The Capability You're Missing",
    primaryQuestion: 'Which capability is offline — can I not act, connect, explore, rest, or participate around this?',
    campaignQuestion: 'What capability does this campaign lack — agency to ask, connection to mobilize?',
    optimizesFor: 'Naming the missing capability behind the resource block.',
    forbiddenMoves: ['Adding tactics when the block is a missing capability', 'Willpower over capacity'],
    failureModes: ["Doing more of a move you can't yet make", 'Capability-blind planning'],
    remediation: "Match the block to a capability. That's the move to grow next.",
    capabilities: ['agency', 'rest'],
  },
  'CLEAN-GR-ARCHITECT': {
    title: 'Move the Charge',
    primaryQuestion: 'Do I transcend this feeling, translate it to another channel, or neutralize it?',
    campaignQuestion: "How do we convert this campaign's charge into usable fuel — transcend, translate, neutralize?",
    optimizesFor: 'Choosing the alchemical operation that frees resourcing.',
    forbiddenMoves: ['Suppressing the charge', 'Venting it onto others', 'Forcing positivity'],
    failureModes: ['Neutralizing what should be transcended', 'Dumping anger on donors'],
    remediation: 'Pick one: transcend (let it ripen), translate (e.g. fear → agency), or neutralize. Then do it.',
    capabilities: ['agency', 'connection'],
  },
  'CLEAN-GR-DIPLOMAT': {
    title: 'Fear Into Invitation',
    primaryQuestion: 'Which channel, if I moved this charge there, would serve the ask better?',
    campaignQuestion: 'What would the ask feel like if it came from connection instead of fear?',
    optimizesFor: 'Aiming the charge toward a relationally generative channel.',
    forbiddenMoves: ['Asking from resentment', 'Guilt-tripping', 'Performing calm'],
    failureModes: ['Fear-driven asks that repel', 'Manipulation dressed as warmth'],
    remediation: 'Re-aim the ask from Connection: invite people into something good.',
    capabilities: ['connection'],
  },
  'CLEAN-GR-SAGE': {
    title: 'What the Shortfall Taught',
    primaryQuestion: 'What does this resource struggle teach me that I can keep?',
    campaignQuestion: "What's the durable lesson this campaign's resourcing is offering?",
    optimizesFor: 'Converting the struggle into reusable insight (a BAR).',
    forbiddenMoves: ['Rushing past the lesson', '"Just get the money"', 'Premature closure'],
    failureModes: ["Repeating the lesson because it wasn't extracted", 'Hollow takeaways'],
    remediation: "Write one sentence you'll carry into the next ask.",
    capabilities: ['exploration', 'connection'],
  },

  // ── GROW UP × Gathering Resources (Develop capability → Wisdom) ──
  'GROW-GR-SHAMAN': {
    title: 'The Capacity Trying to Grow',
    primaryQuestion: 'What resourcing capacity in me is trying to grow right now?',
    campaignQuestion: 'What capability is this campaign asking us to develop?',
    optimizesFor: 'Noticing the growth edge the resource work is surfacing.',
    forbiddenMoves: ['Forcing growth', 'Skipping the seedling', "Importing someone else's path"],
    failureModes: ['Naming a capacity you wish for over the one actually emerging'],
    remediation: 'Name the capacity one size bigger than today. Practice it once.',
    capabilities: ['participation', 'exploration'],
  },
  'GROW-GR-CHALLENGER': {
    title: 'The Edge of the Ask',
    primaryQuestion: 'What must evolve in me to ask or steward at the next level?',
    campaignQuestion: 'What must the team learn to resource this at the scale it needs?',
    optimizesFor: 'Locating the precise developmental edge.',
    forbiddenMoves: ["Comfortable practice that isn't the edge", 'Busywork as growth'],
    failureModes: ['Training the strength, avoiding the edge', 'Pseudo-growth'],
    remediation: "Name the thing that scares you slightly. That's the edge — step to it.",
    capabilities: ['agency'],
  },
  'GROW-GR-REGENT': {
    title: 'Worth Practicing',
    primaryQuestion: 'Which resourcing skill deserves deliberate, repeated practice?',
    campaignQuestion: 'What practice should this campaign repeat until it is reliable?',
    optimizesFor: 'Committing to repeatable practice over one-off effort.',
    forbiddenMoves: ['Hoping skill appears', 'One-and-done', 'Practicing the wrong rep'],
    failureModes: ['Inconsistency', 'Stewarding everything so nothing deepens'],
    remediation: 'Choose one rep ("make one real ask weekly"). Schedule it.',
    capabilities: ['rest', 'agency'],
  },
  'GROW-GR-ARCHITECT': {
    title: 'Strengthen the Channel',
    primaryQuestion: 'Which existing capability, if strengthened, would unlock resourcing?',
    campaignQuestion: 'What capacity, amplified, would most increase what we can gather?',
    optimizesFor: 'Investing growth where it compounds.',
    forbiddenMoves: ['Spreading practice thin', 'Strengthening the irrelevant', 'Vanity skills'],
    failureModes: ['Growth without leverage', "Polishing a capability you don't need"],
    remediation: 'Pick the capability with the highest leverage. Train it deliberately.',
    capabilities: ['participation', 'exploration'],
  },
  'GROW-GR-DIPLOMAT': {
    title: 'Growing Without Leaving People',
    primaryQuestion: 'As I grow my capacity to resource, how does it land on the people around me?',
    campaignQuestion: 'How does scaling this campaign affect the relationships that carry it?',
    optimizesFor: 'Growing in a way that strengthens, not strains, relationships.',
    forbiddenMoves: ['Growth that burns helpers', 'Leaving people behind', 'Extractive scaling'],
    failureModes: ['Capacity gains that cost trust', 'Isolating success'],
    remediation: 'Name one person your growth affects. Bring them with you.',
    capabilities: ['connection', 'participation'],
  },
  'GROW-GR-SAGE': {
    title: 'Who Resourcing Is Making Me',
    primaryQuestion: 'Who am I becoming through learning to gather and steward resources?',
    campaignQuestion: 'What is this campaign making us, as a community, become?',
    optimizesFor: 'Integrating the identity shift the work is producing.',
    forbiddenMoves: ['Skipping reflection', 'Achievement without integration', 'A new mask'],
    failureModes: ['Capacity gained, self un-integrated', "Growth that doesn't stick"],
    remediation: 'Finish the sentence: "I am becoming someone who ______."',
    capabilities: ['connection', 'participation'],
  },

  // ── SHOW UP × Gathering Resources (Invest capacity → Artifact) ──
  'SHOW-GR-SHAMAN': {
    title: 'Aim the Resources',
    primaryQuestion: "Where exactly will I invest what I've gathered?",
    campaignQuestion: "Where will this campaign's resources actually go — concretely?",
    optimizesFor: 'Committing gathered resources to a specific target.',
    forbiddenMoves: ['Hoarding "until ready"', 'Vague allocation', 'Endless gathering'],
    failureModes: ['Resources that never deploy', 'Paralysis by optimization'],
    remediation: 'Name the first concrete place the resources go this week.',
    capabilities: ['agency'],
  },
  'SHOW-GR-CHALLENGER': {
    title: 'The Ask Goes Live',
    primaryQuestion: 'What concrete resourcing act must I take now?',
    campaignQuestion: 'What intervention launches the gather — the page, the ask, the event?',
    optimizesFor: 'Shipping the actual ask or intervention.',
    forbiddenMoves: ['One more prep step', 'Private readiness', 'Soft launch to no one'],
    failureModes: ['Perpetual pre-launch', 'The ask that never posts'],
    remediation: 'Post the ask today. Make it real and specific.',
    flavor: 'A proposal names the next step when no one else will.',
    capabilities: ['agency'],
  },
  'SHOW-GR-REGENT': {
    title: 'Hold the Funds Well',
    primaryQuestion: 'What ongoing stewardship will keep these resources trustworthy?',
    campaignQuestion: 'How will we steward and account for what is given — transparently?',
    optimizesFor: 'Building accountable stewardship of gathered resources.',
    forbiddenMoves: ['Opaque handling', 'Spending without record', 'Mission drift'],
    failureModes: ['Trust eroded by sloppiness', 'Funds without follow-through'],
    remediation: 'Set one transparency practice (a public update, a ledger). Keep it.',
    capabilities: ['rest', 'connection'],
  },
  'SHOW-GR-ARCHITECT': {
    title: 'Build the Ladder',
    primaryQuestion: 'What structure makes the resourcing repeatable and growing?',
    campaignQuestion: 'What structure — milestones, tiers, matches — amplifies this campaign?',
    optimizesFor: 'Creating structure that compounds resource flow.',
    forbiddenMoves: ['One-off heroics', 'Structure for its own sake', 'Over-engineering'],
    failureModes: ["A push that can't repeat", 'Scaffolding nobody uses'],
    remediation: 'Add one structural lever: a milestone ladder ($200 / $400 / $800) or a match.',
    capabilities: ['participation', 'agency'],
  },
  'SHOW-GR-DIPLOMAT': {
    title: "Invite, Don't Extract",
    primaryQuestion: 'Who must be invited, and what power dynamic must I name to do this cleanly?',
    campaignQuestion: 'Who do we invite to give — and whose consent and power must we honor?',
    optimizesFor: 'Resourcing through invitation and honored consent, not extraction.',
    forbiddenMoves: ['Pressuring givers', "Using someone's story without consent", 'Debt-making'],
    failureModes: ['Extraction dressed as community', 'Transactional asks that sour'],
    remediation: 'Invite one person with full consent and no strings. Name the dynamic aloud.',
    capabilities: ['connection', 'participation'],
  },
  'SHOW-GR-SAGE': {
    title: 'What Remains After',
    primaryQuestion: 'What lasting artifact or story will remain from this resourcing?',
    campaignQuestion: 'What does this campaign leave behind — capacity, relationships, a story?',
    optimizesFor: 'Ensuring the effort leaves durable value beyond the dollars.',
    forbiddenMoves: ['Burning the bridge after', 'No thank-you', 'The story untold'],
    failureModes: ['Money raised, nothing built', 'Goodwill spent and not renewed'],
    remediation: 'Name the artifact that outlives the campaign. Tell its story to one giver.',
    capabilities: ['connection', 'participation'],
  },
}
