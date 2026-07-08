import type { AllyshipDomain, Subject } from '@/lib/allyship-deck/types'
import type { Superpower, SuperpowerOrientation } from '@/lib/superpowers/types'
import type { AlchemyEdge, AlchemyPracticeOperation, AlchemyState } from './alchemy-graph'
import type { EmotionChannel } from './types'
import {
  getVectorMoveFamilyForStates,
  type VectorMoveFamily,
  type VectorMoveMechanicOperation,
  type VectorMovePracticeLens,
  type VectorMovePracticeVariant,
} from './vector-move-families'

export type ShowUpVectorType =
  | 'stabilize'
  | 'transcend'
  | 'neutral_translate'
  | 'generative_translate'
  | 'mastery_integration_translate'

export type ShowUpPrimitiveId =
  | 'identify_signal'
  | 'bound_the_ask'
  | 'name_care_distance'
  | 'clean_exit'
  | 'interrupt_pattern'
  | 'create_sequence'
  | 'create_handoff'
  | 'restore_flow'
  | 'make_meaning_actionable'
  | 'repair_without_performance'

export type ShowUpOrientation = SuperpowerOrientation
export type ShowUpSubject = Subject

export interface ShowUpPrimitive {
  id: ShowUpPrimitiveId
  label: string
  vectorTypes: ShowUpVectorType[]
  preferredOperations: AlchemyPracticeOperation[]
  sourceChannels?: EmotionChannel[]
  targetChannels?: EmotionChannel[]
  chargeMechanic: string
  baseAct: string
  innerArtifactFamilies: string[]
  outerActFamilies: string[]
  completionLogic: string
  driftReflection: string
  proofPrototypeIds: string[]
}

export interface ShowUpCardContext {
  deckCardId?: string
  cardFamily?: string
  operation?: string
}

export interface ShowUpTranslationInput {
  primitiveId: ShowUpPrimitiveId
  stateVector: string
  orientation: ShowUpOrientation
  subject: ShowUpSubject
  superpower: Superpower
  domain: AllyshipDomain
  blocker: string
  cardContext?: ShowUpCardContext
}

export interface TranslatedShowUpMove {
  primitiveId: ShowUpPrimitiveId
  stateVector: string
  vectorMechanic: string
  orientation: ShowUpOrientation
  subject: ShowUpSubject
  superpower: Superpower
  domain: AllyshipDomain
  domainOutput: string
  blocker: string
  title: string
  instruction: string
  completion: string
  reflectionPrompt: string
  cardContext?: ShowUpCardContext
}

export interface ShowUpPrimitiveMatchInput {
  from: AlchemyState
  to: AlchemyState
  operation?: AlchemyPracticeOperation
}

export interface ShowUpPrimitiveMatch {
  primitive: ShowUpPrimitive
  vectorType: ShowUpVectorType
  score: number
  reasons: string[]
}

export interface ShowUpRecommendationContext {
  orientation: ShowUpOrientation
  subject: ShowUpSubject
  superpower: Superpower
  domain: AllyshipDomain
  blocker: string
  cardContext?: ShowUpCardContext
}

export interface VectorMovePracticeLensSelection {
  lens: VectorMovePracticeLens
  role: VectorMovePracticeVariant['role']
  reason: string
}

export interface ShowUpRecommendation {
  edge: AlchemyEdge
  primitiveMatch: ShowUpPrimitiveMatch
  move: TranslatedShowUpMove
  vectorFamily?: VectorMoveFamily
  mechanicOperation?: VectorMoveMechanicOperation
  selectedPracticeLens?: VectorMovePracticeLens
  selectedPracticeVariant?: VectorMovePracticeVariant
  practiceLensSelection?: VectorMovePracticeLensSelection
}

export const SHOW_UP_PRIMITIVES: readonly ShowUpPrimitive[] = [
  {
    id: 'identify_signal',
    label: 'Identify Signal',
    vectorTypes: ['stabilize'],
    preferredOperations: ['stabilize'],
    chargeMechanic: 'Distorted charge becomes clean signal.',
    baseAct: 'Name the signal and what it is asking for.',
    innerArtifactFamilies: ['signal statement', 'self-trust note', 'inner permission'],
    outerActFamilies: ['clarifying message', 'named concern', 'request for shared reality'],
    completionLogic: 'The signal is named in a form that can guide the next move.',
    driftReflection: 'Did naming the signal create clarity, or did it become analysis without movement?',
    proofPrototypeIds: [],
  },
  {
    id: 'bound_the_ask',
    label: 'Bound The Ask',
    vectorTypes: ['stabilize'],
    preferredOperations: ['stabilize'],
    sourceChannels: ['fear', 'neutrality'],
    targetChannels: ['fear', 'neutrality'],
    chargeMechanic: 'Uncertain need becomes askable.',
    baseAct: 'Convert vague need into bounded request.',
    innerArtifactFamilies: ['ask constraint', 'capacity rule', 'personal ask template'],
    outerActFamilies: ['sent ask', 'scheduled ask', 'resource request'],
    completionLogic: 'The ask has one resource, one reason, one time window, and one next step.',
    driftReflection: 'Did the constraint make asking more possible, or did it become another way to delay asking?',
    proofPrototypeIds: ['MP02-internal', 'MP02-external'],
  },
  {
    id: 'name_care_distance',
    label: 'Name Care And Distance',
    vectorTypes: ['stabilize'],
    preferredOperations: ['stabilize'],
    sourceChannels: ['sadness'],
    targetChannels: ['sadness'],
    chargeMechanic: 'Collapse becomes care plus distance.',
    baseAct: 'Name what matters and what is currently distant.',
    innerArtifactFamilies: ['care map', 'grief permission', 'one-inch commitment'],
    outerActFamilies: ['message', 'visit', 'offering', 'support request', 'scheduled presence'],
    completionLogic: 'Care and distance are named clearly enough to support one next move.',
    driftReflection: 'Did naming care restore movement, or did it intensify collapse?',
    proofPrototypeIds: [],
  },
  {
    id: 'clean_exit',
    label: 'Clean Exit',
    vectorTypes: ['generative_translate', 'neutral_translate'],
    preferredOperations: ['generate', 'control'],
    sourceChannels: ['fear'],
    targetChannels: ['fear'],
    chargeMechanic: 'Threat or obligation becomes option and agency.',
    baseAct: 'Create an exit, pause, refusal, or off-ramp.',
    innerArtifactFamilies: ['inner exit', 'refusal rule', 'what-to-carry-forward note'],
    outerActFamilies: ['off-ramp message', 'renegotiation', 'boundary', 'safe exit path'],
    completionLogic: 'A clean option exists and can be used when pressure returns.',
    driftReflection: 'Did the exit create more agency, or did it hide accountability?',
    proofPrototypeIds: ['MP08-internal', 'MP08-external'],
  },
  {
    id: 'interrupt_pattern',
    label: 'Interrupt Pattern',
    vectorTypes: ['stabilize', 'transcend'],
    preferredOperations: ['stabilize', 'transcend'],
    sourceChannels: ['anger'],
    targetChannels: ['anger'],
    chargeMechanic: 'Desire and boundary become precise force.',
    baseAct: 'Stop the next repetition of a harmful or stuck pattern.',
    innerArtifactFamilies: ['permission to interrupt', 'line statement', 'protected-value note'],
    outerActFamilies: ['interruption question', 'boundary', 'refusal', 'escalation path'],
    completionLogic: 'The next repetition is interrupted, or the line is placed before it repeats.',
    driftReflection: 'Did the interruption protect the named value, or did it become spectacle?',
    proofPrototypeIds: ['MP05-external', 'MP12-external'],
  },
  {
    id: 'create_sequence',
    label: 'Create Sequence',
    vectorTypes: ['stabilize', 'transcend'],
    preferredOperations: ['stabilize', 'transcend'],
    sourceChannels: ['neutrality', 'fear'],
    targetChannels: ['neutrality', 'fear'],
    chargeMechanic: 'Confusion becomes order that supports continuation.',
    baseAct: 'Define next decision, owner, and checkpoint.',
    innerArtifactFamilies: ['personal decision path', 'capacity-preserving rule'],
    outerActFamilies: ['group sequence', 'role assignment', 'checkpoint agreement'],
    completionLogic: 'A next decision, owner, and checkpoint are named.',
    driftReflection: 'Did the sequence create continuation, or did structure become avoidance?',
    proofPrototypeIds: [],
  },
  {
    id: 'create_handoff',
    label: 'Create Handoff',
    vectorTypes: ['stabilize', 'neutral_translate'],
    preferredOperations: ['stabilize', 'control', 'generate'],
    sourceChannels: ['sadness', 'anger', 'neutrality'],
    targetChannels: ['neutrality'],
    chargeMechanic: 'Overheld responsibility becomes shared structure.',
    baseAct: 'Move a held task from personality into agreement.',
    innerArtifactFamilies: ['non-glue boundary', 'invisible-labor inventory'],
    outerActFamilies: ['handoff agreement', 'role rotation', 'support structure'],
    completionLogic: 'One invisible labor item becomes a boundary, role, owner, rotation, or agreement.',
    driftReflection: 'Did the handoff create shared structure, or did you remain the hidden bridge?',
    proofPrototypeIds: ['MP19-internal', 'MP19-external'],
  },
  {
    id: 'restore_flow',
    label: 'Restore Flow',
    vectorTypes: ['transcend'],
    preferredOperations: ['transcend'],
    sourceChannels: ['sadness'],
    targetChannels: ['sadness'],
    chargeMechanic: 'Stuck care becomes available movement.',
    baseAct: 'Let care move one step without forcing resolution.',
    innerArtifactFamilies: ['ritual', 'grief container', 'value remembrance'],
    outerActFamilies: ['repair gesture', 'offering', 'witness request', 'shared ritual'],
    completionLogic: 'Care moves one step through a ritual, offering, witness, or gesture.',
    driftReflection: 'Did flow return, or did the move force resolution too soon?',
    proofPrototypeIds: [],
  },
  {
    id: 'make_meaning_actionable',
    label: 'Make Meaning Actionable',
    vectorTypes: ['generative_translate', 'transcend'],
    preferredOperations: ['generate', 'transcend'],
    sourceChannels: ['sadness', 'anger'],
    targetChannels: ['joy', 'anger'],
    chargeMechanic: 'Meaning becomes participation or action.',
    baseAct: 'Turn story into a next move.',
    innerArtifactFamilies: ['new sentence to live by', 'meaning arc', 'morale note'],
    outerActFamilies: ['recap', 'invitation', 'public truth', 'narrative ask'],
    completionLogic: 'The story changes a next action, ask, or participation path.',
    driftReflection: 'Did the meaning enable action, or did narrative replace material change?',
    proofPrototypeIds: [],
  },
  {
    id: 'repair_without_performance',
    label: 'Repair Without Performance',
    vectorTypes: ['stabilize', 'transcend', 'neutral_translate', 'generative_translate'],
    preferredOperations: ['stabilize', 'transcend', 'generate'],
    sourceChannels: ['fear', 'sadness'],
    targetChannels: ['sadness'],
    chargeMechanic: 'Avoided impact becomes accountable contact.',
    baseAct: 'Own impact without demanding soothing.',
    innerArtifactFamilies: ['accountability script', 'no-defensiveness commitment'],
    outerActFamilies: ['repair message', 'repair conversation', 'amended behavior'],
    completionLogic: 'Impact is owned without demanding forgiveness, reassurance, or emotional labor.',
    driftReflection: 'Did the repair own impact, or did it perform transformation to escape accountability?',
    proofPrototypeIds: [],
  },
] as const

export function allShowUpPrimitives(): readonly ShowUpPrimitive[] {
  return SHOW_UP_PRIMITIVES
}

export function getShowUpPrimitive(id: ShowUpPrimitiveId): ShowUpPrimitive {
  const primitive = SHOW_UP_PRIMITIVES.find((item) => item.id === id)
  if (!primitive) throw new Error(`Unknown Show Up primitive: ${id}`)
  return primitive
}

const DOMAIN_OUTPUT_LABELS: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'resource movement',
  RAISE_AWARENESS: 'truth signal',
  DIRECT_ACTION: 'intervention',
  SKILLFUL_ORGANIZING: 'agreement structure',
}

const SUPERPOWER_STYLE: Record<Superpower, string> = {
  connector: 'through trust, consent, and bridges',
  storyteller: 'through truthful meaning and memory',
  strategist: 'through constraints, sequence, and leverage',
  disruptor: 'through precise interruption',
  alchemist: 'through metabolizing residue into usable capacity',
  escape_artist: 'through exits, options, and agency',
  coach: 'through a practice rep that brings capacity online',
}

function firstOutputFamily(primitive: ShowUpPrimitive, orientation: ShowUpOrientation): string {
  return orientation === 'internal'
    ? primitive.innerArtifactFamilies[0]
    : primitive.outerActFamilies[0]
}

function outputLabelFor(
  primitive: ShowUpPrimitive,
  orientation: ShowUpOrientation,
  domain: AllyshipDomain,
): string {
  if (orientation === 'internal') return firstOutputFamily(primitive, orientation)
  return `${DOMAIN_OUTPUT_LABELS[domain]} / ${firstOutputFamily(primitive, orientation)}`
}

function titleFor(input: ShowUpTranslationInput, primitive: ShowUpPrimitive): string {
  const direction = input.orientation === 'internal' ? 'Inner' : 'Outer'
  return `${direction} ${primitive.label}`
}

function instructionFor(input: ShowUpTranslationInput, primitive: ShowUpPrimitive): string {
  const style = SUPERPOWER_STYLE[input.superpower]

  if (primitive.id === 'bound_the_ask') {
    if (input.orientation === 'internal') {
      return [
        'Create a personal ask constraint:',
        'When I need support for ___, I ask ___ for ___ by ___ so that ___ can move.',
        `Use ${style}. Keep the ask small enough that you can imagine making it without needing to become a different person first.`,
      ].join('\n\n')
    }

    return [
      'Send or schedule one bounded ask:',
      'I am asking for ___ because ___ by ___. The next step would be ___.',
      `Use ${style}. Send it to one named person or group, or schedule the send with a clean send condition.`,
    ].join('\n\n')
  }

  if (primitive.id === 'clean_exit') {
    if (input.orientation === 'internal') {
      return [
        'Create a clean inner exit:',
        'The cage I am naming is ___. The obligation that is real is ___. The obligation that is guilt or theater is ___. The clean exit I allow myself is ___. What I carry forward is ___.',
        `Use ${style}. The exit should create agency without hiding accountability.`,
      ].join('\n\n')
    }

    return [
      'Communicate one clean off-ramp:',
      'I need to pause / leave / renegotiate ___. What I can still honor is ___. What I cannot continue is ___. The next clean step is ___.',
      `Use ${style}. If sending would create risk, prepare the off-ramp and name the safety condition required before sending.`,
    ].join('\n\n')
  }

  if (primitive.id === 'create_handoff') {
    if (input.orientation === 'internal') {
      return [
        'Create a non-glue boundary:',
        'The invisible labor I have been holding is ___. The care underneath it is ___. The part that is mine to hold is ___. The part that needs structure instead of me is ___. My non-glue boundary is ___.',
        `Use ${style}. The boundary should stop your body or personality from being the whole structure.`,
      ].join('\n\n')
    }

    return [
      'Create one handoff agreement:',
      'I have been holding ___ informally. For this to keep working, it needs ___. Can we agree that ___ owns ___ by ___?',
      `Use ${style}. Create enough trust and clarity that the handoff can survive without you as glue.`,
    ].join('\n\n')
  }

  if (primitive.id === 'interrupt_pattern') {
    if (input.domain === 'RAISE_AWARENESS') {
      return [
        'Ask one pattern-interrupting question:',
        'What are we not saying because politeness is safer than truth?',
        `Use ${style}. Name the pattern you are interrupting, not the person you are blaming.`,
      ].join('\n\n')
    }

    return [
      'Stop the next repetition:',
      'The repeating harm is ___. The next likely repetition is ___. The line I will hold is ___. The person/value protected is ___.',
      `Use ${style}. Make the interruption at the next repetition: state the line, refuse the pattern, or redirect the action.`,
    ].join('\n\n')
  }

  return [
    `${primitive.baseAct}`,
    `Use ${style} in the field of ${DOMAIN_OUTPUT_LABELS[input.domain]}.`,
    `Shape the move around this blocker: ${input.blocker}`,
  ].join('\n\n')
}

function completionFor(input: ShowUpTranslationInput, primitive: ShowUpPrimitive): string {
  if (primitive.id === 'bound_the_ask') {
    return input.orientation === 'internal'
      ? 'Done when the ask constraint is written and tied to a specific use trigger.'
      : 'Done when the bounded ask is sent, or scheduled with a named recipient and send condition.'
  }

  if (primitive.id === 'clean_exit') {
    return input.orientation === 'internal'
      ? 'Done when you have a written refusal rule or inner exit commitment that can be used when pressure returns.'
      : 'Done when the pause, refusal, renegotiation, or off-ramp is communicated, or prepared with a specific safety reason for not sending yet.'
  }

  if (primitive.id === 'create_handoff') {
    return input.orientation === 'internal'
      ? 'Done when you have one boundary or rule that stops your body/personality from being the whole structure.'
      : 'Done when one invisible labor item becomes a named role, rotation, owner, checkpoint, or agreement.'
  }

  if (primitive.id === 'interrupt_pattern') {
    return input.domain === 'RAISE_AWARENESS'
      ? 'Done when the question is asked in the relevant room/thread, or sent to the accountable group.'
      : 'Done when the next repetition is interrupted, or a boundary is placed before it can repeat.'
  }

  const output = firstOutputFamily(primitive, input.orientation)
  return `Done when you create a ${output}: ${primitive.completionLogic}`
}

export function translateShowUpPrimitive(input: ShowUpTranslationInput): TranslatedShowUpMove {
  const primitive = getShowUpPrimitive(input.primitiveId)

  return {
    primitiveId: primitive.id,
    stateVector: input.stateVector,
    vectorMechanic: primitive.chargeMechanic,
    orientation: input.orientation,
    subject: input.subject,
    superpower: input.superpower,
    domain: input.domain,
    domainOutput: outputLabelFor(primitive, input.orientation, input.domain),
    blocker: input.blocker,
    title: titleFor(input, primitive),
    instruction: instructionFor(input, primitive),
    completion: completionFor(input, primitive),
    reflectionPrompt: primitive.driftReflection,
    ...(input.cardContext ? { cardContext: input.cardContext } : {}),
  }
}

function vectorTypeFor(input: ShowUpPrimitiveMatchInput): ShowUpVectorType {
  if (input.operation === 'stabilize') return 'stabilize'
  if (input.operation === 'transcend') return 'transcend'
  if (input.operation === 'translate') return 'neutral_translate'
  if (input.operation === 'generate') return 'generative_translate'
  if (input.operation === 'controlled_descent') return 'mastery_integration_translate'
  if (input.operation === 'control') return 'neutral_translate'

  if (input.from.channel === input.to.channel) {
    if (input.from.altitude === 'dissatisfied' && input.to.altitude === 'neutral') return 'stabilize'
    if (input.from.altitude === 'neutral' && input.to.altitude === 'satisfied') return 'transcend'
    return 'mastery_integration_translate'
  }

  if (input.to.altitude === 'satisfied') return 'generative_translate'
  if (input.from.altitude === input.to.altitude) return 'neutral_translate'
  return 'mastery_integration_translate'
}

function scorePrimitiveForVector(
  primitive: ShowUpPrimitive,
  input: ShowUpPrimitiveMatchInput,
  vectorType: ShowUpVectorType,
): Omit<ShowUpPrimitiveMatch, 'primitive'> | null {
  let score = 0
  const reasons: string[] = []

  if (primitive.vectorTypes.includes(vectorType)) {
    score += 50
    reasons.push(`supports ${vectorType}`)
  }

  if (input.operation && primitive.preferredOperations.includes(input.operation)) {
    score += 20
    reasons.push(`prefers ${input.operation}`)
  }

  if (primitive.sourceChannels?.includes(input.from.channel)) {
    score += 10
    reasons.push(`matches source ${input.from.channel}`)
  }

  if (primitive.targetChannels?.includes(input.to.channel)) {
    score += 8
    reasons.push(`matches target ${input.to.channel}`)
  }

  if (
    primitive.sourceChannels?.includes(input.from.channel)
    && primitive.targetChannels?.includes(input.to.channel)
    && primitive.sourceChannels.length === 1
    && primitive.targetChannels.length === 1
  ) {
    score += 12
    reasons.push('narrow source-target fit')
  }

  if (
    primitive.id === 'create_sequence'
    && input.from.channel === 'neutrality'
    && input.to.channel === 'neutrality'
  ) {
    score += 16
    reasons.push('fits neutrality coherence')
  }

  if (
    primitive.id === 'repair_without_performance'
    && vectorType === 'neutral_translate'
    && input.to.channel === 'sadness'
  ) {
    score += 14
    reasons.push('fits translate into care')
  }

  if (score === 0) return null
  return { vectorType, score, reasons }
}

export function selectShowUpPrimitivesForVector(
  input: ShowUpPrimitiveMatchInput,
): ShowUpPrimitiveMatch[] {
  const vectorType = vectorTypeFor(input)
  const family = getVectorMoveFamilyForStates(input.from, input.to)
  const preferredPrimitiveIds = family?.preferredPrimitiveIds ?? []

  return SHOW_UP_PRIMITIVES
    .map((primitive, index) => {
      const match = scorePrimitiveForVector(primitive, input, vectorType)
      const preferredIndex = preferredPrimitiveIds.indexOf(primitive.id)

      if (preferredIndex >= 0) {
        const baseMatch = match ?? { vectorType, score: 0, reasons: [] }
        return {
          primitive,
          index,
          ...baseMatch,
          score: baseMatch.score + 1000 - preferredIndex * 100,
          reasons: [
            ...baseMatch.reasons,
            `preferred by vector family ${family?.vector}`,
          ],
        }
      }

      return match ? { primitive, index, ...match } : null
    })
    .filter((match): match is ShowUpPrimitiveMatch & { index: number } => Boolean(match))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ index: _index, ...match }) => match)
}

export function selectPrimaryShowUpPrimitiveForVector(
  input: ShowUpPrimitiveMatchInput,
): ShowUpPrimitive | null {
  return selectShowUpPrimitivesForVector(input)[0]?.primitive ?? null
}

export function selectPracticeLens(input: {
  blocker?: string | null
  mechanicOperation?: VectorMoveMechanicOperation | null
}): VectorMovePracticeLensSelection {
  const blocker = input.blocker?.trim().toLowerCase() ?? ''

  const match = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(blocker))

  let lens: VectorMovePracticeLens = 'show_up'
  let reason = 'Default to Show Up when the blocker does not indicate an earlier practice lens.'

  if (!blocker || /not been named/.test(blocker)) {
    lens = 'wake_up'
    reason = 'The blocker is unnamed, so the practice starts by identifying what is actually blocking movement.'
  } else if (match([
    /cannot receive/,
    /can't receive/,
    /can not receive/,
    /hard to receive/,
    /cannot let myself/,
    /can't let myself/,
    /cannot feel/,
    /can't feel/,
    /open/,
    /allow/,
    /available/,
    /numb/,
    /shut ?down/,
    /overwhelm/,
    /too much/,
  ])) {
    lens = 'open_up'
    reason = 'The blocker is about availability to the charge, so Open Up should come before analysis or action.'
  } else if (match([
    /do not know/,
    /don't know/,
    /cannot tell/,
    /can't tell/,
    /do not know what i feel/,
    /don't know what i feel/,
    /cannot tell what i feel/,
    /can't tell what i feel/,
    /what .*matters/,
    /what .*edge/,
    /where .*energy/,
    /where .*aliveness/,
    /unclear/,
    /confus/,
    /identify/,
    /name (the )?(charge|feeling|emotion|signal)/,
    /what (charge|feeling|emotion)/,
  ])) {
    lens = 'wake_up'
    reason = 'The blocker is about identifying the charge, so Wake Up is the useful entry point.'
  } else if (match([
    /belief/,
    /story/,
    /self[- ]?sabotage/,
    /sabotag/,
    /defen[cs]e/,
    /shadow/,
    /shame/,
    /projection/,
    /trigger/,
    /pattern/,
    /tangled/,
    /distort/,
    /means i am/,
    /means i'm/,
    /i am weak/,
    /i'm weak/,
    /unworthy/,
    /not enough/,
  ])) {
    lens = 'clean_up'
    reason = 'The blocker is tangled with belief, story, defense, or patterning, so Clean Up is needed first.'
  } else if (match([
    /matur/,
    /capacity/,
    /hold this/,
    /hold it/,
    /level/,
    /readiness/,
    /ready/,
    /responsib/,
    /integrat/,
    /grow/,
    /honou?r/,
    /without clinging/,
    /without possess/,
    /right[- ]?size/,
  ])) {
    lens = 'grow_up'
    reason = 'The blocker is about capacity or maturity, so Grow Up bridges processing into right-sized action.'
  } else if (match([
    /act/,
    /action/,
    /move/,
    /do\b/,
    /send/,
    /ask/,
    /organ/,
    /direct action/,
    /know what is true/,
    /need to/,
    /ready to/,
  ])) {
    lens = 'show_up'
    reason = 'The blocker points toward execution, so Show Up can produce a concrete action or artifact.'
  }

  const variant = input.mechanicOperation?.practiceVariants[lens]
  return {
    lens,
    role: variant?.role ?? (lens === 'grow_up' ? 'bridge' : lens === 'show_up' ? 'action' : 'processing'),
    reason,
  }
}

export function recommendShowUpMoveForEdge(
  edge: AlchemyEdge,
  context: ShowUpRecommendationContext,
): ShowUpRecommendation | null {
  const primitiveMatch = selectShowUpPrimitivesForVector({
    from: edge.from,
    to: edge.to,
    operation: edge.operation,
  })[0]

  if (!primitiveMatch) return null
  const vectorFamily = getVectorMoveFamilyForStates(edge.from, edge.to) ?? undefined
  const mechanicOperation = vectorFamily?.mechanicOperation
  const practiceLensSelection = selectPracticeLens({
    blocker: context.blocker,
    mechanicOperation,
  })
  const selectedPracticeVariant = mechanicOperation?.practiceVariants[practiceLensSelection.lens]

  return {
    edge,
    primitiveMatch,
    move: translateShowUpPrimitive({
      primitiveId: primitiveMatch.primitive.id,
      stateVector: edge.vector,
      orientation: context.orientation,
      subject: context.subject,
      superpower: context.superpower,
      domain: context.domain,
      blocker: context.blocker,
      ...(context.cardContext ? { cardContext: context.cardContext } : {}),
    }),
    ...(vectorFamily ? { vectorFamily } : {}),
    ...(mechanicOperation ? { mechanicOperation } : {}),
    ...(selectedPracticeVariant ? { selectedPracticeVariant } : {}),
    selectedPracticeLens: practiceLensSelection.lens,
    practiceLensSelection,
  }
}

export function recommendShowUpMovesForEdges(
  edges: readonly AlchemyEdge[],
  context: ShowUpRecommendationContext,
): ShowUpRecommendation[] {
  return edges
    .map((edge) => recommendShowUpMoveForEdge(edge, context))
    .filter((recommendation): recommendation is ShowUpRecommendation => Boolean(recommendation))
}

export function validateShowUpPrimitiveDefinitions(
  primitives: readonly ShowUpPrimitive[] = SHOW_UP_PRIMITIVES,
): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const primitive of primitives) {
    if (seen.has(primitive.id)) errors.push(`Duplicate primitive id: ${primitive.id}`)
    seen.add(primitive.id)

    if (!primitive.label.trim()) errors.push(`${primitive.id} is missing label`)
    if (primitive.vectorTypes.length === 0) errors.push(`${primitive.id} is missing vectorTypes`)
    if (primitive.preferredOperations.length === 0) errors.push(`${primitive.id} is missing preferredOperations`)
    if (!primitive.chargeMechanic.trim()) errors.push(`${primitive.id} is missing chargeMechanic`)
    if (!primitive.baseAct.trim()) errors.push(`${primitive.id} is missing baseAct`)
    if (primitive.innerArtifactFamilies.length === 0) errors.push(`${primitive.id} is missing innerArtifactFamilies`)
    if (primitive.outerActFamilies.length === 0) errors.push(`${primitive.id} is missing outerActFamilies`)
    if (!primitive.completionLogic.trim()) errors.push(`${primitive.id} is missing completionLogic`)
    if (!primitive.driftReflection.trim()) errors.push(`${primitive.id} is missing driftReflection`)
  }

  return errors
}
