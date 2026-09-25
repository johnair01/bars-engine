import type { AlchemyAltitude, EmotionChannel } from './types'
import type { AlchemyState } from './alchemy-graph'

export type CompoundEdgeKind = 'sheng' | 'ke'
export type CompoundDirectionKind = 'source_dominant' | 'target_dominant' | 'dominant_channel'
export type CompoundNameStatus = 'named' | 'candidate'
export type CompoundTreatmentOperation = 'stabilize' | 'transcend' | 'maintain_satisfied_expression'

export interface CompoundEmotionSlot {
  id: string
  edgeKind: CompoundEdgeKind
  channels: readonly [EmotionChannel, EmotionChannel]
  dominantChannel: EmotionChannel
  directionKind: CompoundDirectionKind
  label: string
  alternateLabels: string[]
  nameStatus: CompoundNameStatus
  feltSense: string
  leadReading?: string
  goldReading?: string
}

export interface ResolveCompoundEmotionInput {
  a: AlchemyState
  b: AlchemyState
  dominantChannel: EmotionChannel
}

export interface ComponentTreatmentGuidance {
  channel: EmotionChannel
  altitude: AlchemyAltitude
  operation: CompoundTreatmentOperation
  targetAltitude: AlchemyAltitude
  note: string
}

export interface CompoundEmotionResolution {
  slot: CompoundEmotionSlot
  componentStates: readonly [AlchemyState, AlchemyState]
  componentTreatment: ComponentTreatmentGuidance[]
  treatmentRule: string
  directCompoundMoveRecommended: false
}

const TREATMENT_RULE =
  'Do not treat a compound directly. Refine the two component channels; the compound transmutes as the components become clean.'

function shengSlot(input: {
  source: EmotionChannel
  target: EmotionChannel
  dominantChannel: EmotionChannel
  label: string
  alternateLabels?: string[]
  feltSense: string
  nameStatus?: CompoundNameStatus
  leadReading?: string
  goldReading?: string
}): CompoundEmotionSlot {
  const directionKind = input.dominantChannel === input.source ? 'source_dominant' : 'target_dominant'
  return {
    id: `${input.source}-${input.target}__${input.dominantChannel}-dominant`,
    edgeKind: 'sheng',
    channels: [input.source, input.target],
    dominantChannel: input.dominantChannel,
    directionKind,
    label: input.label,
    alternateLabels: input.alternateLabels ?? [],
    nameStatus: input.nameStatus ?? 'candidate',
    feltSense: input.feltSense,
    leadReading: input.leadReading,
    goldReading: input.goldReading,
  }
}

function keSlot(input: {
  a: EmotionChannel
  b: EmotionChannel
  dominantChannel: EmotionChannel
  label: string
  alternateLabels?: string[]
  feltSense: string
  nameStatus?: CompoundNameStatus
  leadReading?: string
  goldReading?: string
}): CompoundEmotionSlot {
  return {
    id: `${input.a}-${input.b}__${input.dominantChannel}-dominant`,
    edgeKind: 'ke',
    channels: [input.a, input.b],
    dominantChannel: input.dominantChannel,
    directionKind: 'dominant_channel',
    label: input.label,
    alternateLabels: input.alternateLabels ?? [],
    nameStatus: input.nameStatus ?? 'candidate',
    feltSense: input.feltSense,
    leadReading: input.leadReading,
    goldReading: input.goldReading,
  }
}

export const COMPOUND_EMOTION_SLOTS: readonly CompoundEmotionSlot[] = [
  shengSlot({
    source: 'joy',
    target: 'anger',
    dominantChannel: 'joy',
    label: 'Eagerness',
    feltSense: 'hungry wanting leaning into effort',
  }),
  shengSlot({
    source: 'joy',
    target: 'anger',
    dominantChannel: 'anger',
    label: 'Determination',
    alternateLabels: ['Ambition'],
    feltSense: 'the want has become the will to overcome',
  }),
  shengSlot({
    source: 'anger',
    target: 'neutrality',
    dominantChannel: 'anger',
    label: 'Satisfaction',
    alternateLabels: ['Vindication'],
    feltSense: 'the fight mostly won, force discharging into ease',
  }),
  shengSlot({
    source: 'anger',
    target: 'neutrality',
    dominantChannel: 'neutrality',
    label: 'Relief',
    alternateLabels: ['Repose'],
    feltSense: 'the let-go after exertion',
  }),
  shengSlot({
    source: 'neutrality',
    target: 'fear',
    dominantChannel: 'neutrality',
    label: 'Curiosity',
    feltSense: 'open attention just beginning to differentiate',
  }),
  shengSlot({
    source: 'neutrality',
    target: 'fear',
    dominantChannel: 'fear',
    label: 'Wariness',
    alternateLabels: ['Caution'],
    feltSense: 'the edge now reads as risk',
  }),
  shengSlot({
    source: 'fear',
    target: 'sadness',
    dominantChannel: 'fear',
    label: 'Dread',
    nameStatus: 'named',
    feltSense: 'what I need to feel safe is far or slipping away',
    leadReading: 'Dread',
    goldReading: 'The sublime / mono no aware',
  }),
  shengSlot({
    source: 'fear',
    target: 'sadness',
    dominantChannel: 'sadness',
    label: 'Forlornness',
    alternateLabels: ['Desolation'],
    feltSense: 'fear collapsed into the ache of the loss itself',
  }),
  shengSlot({
    source: 'sadness',
    target: 'joy',
    dominantChannel: 'sadness',
    label: 'Nostalgia',
    alternateLabels: ['Wistfulness'],
    feltSense: 'grief sweetened by what was wanted',
  }),
  shengSlot({
    source: 'sadness',
    target: 'joy',
    dominantChannel: 'joy',
    label: 'Hope',
    alternateLabels: ['Yearning'],
    feltSense: 'aliveness rising out of loss',
  }),
  keSlot({
    a: 'sadness',
    b: 'anger',
    dominantChannel: 'sadness',
    label: 'Disappointment',
    nameStatus: 'named',
    feltSense: 'the let-down deflation; grief over thwarted drive',
  }),
  keSlot({
    a: 'sadness',
    b: 'anger',
    dominantChannel: 'anger',
    label: 'Bitterness',
    alternateLabels: ['Aggrievement'],
    feltSense: "the loss won't settle; hardens into grievance",
  }),
  keSlot({
    a: 'anger',
    b: 'fear',
    dominantChannel: 'anger',
    label: 'Disgust',
    alternateLabels: ['Contempt'],
    nameStatus: 'named',
    feltSense: 'recoil-and-reject; beneath me / get it away',
  }),
  keSlot({
    a: 'anger',
    b: 'fear',
    dominantChannel: 'fear',
    label: 'Intimidation',
    alternateLabels: ['Cowed'],
    feltSense: 'the hostile threat dominates; anger present but overpowered',
  }),
  keSlot({
    a: 'joy',
    b: 'neutrality',
    dominantChannel: 'joy',
    label: 'Restlessness',
    alternateLabels: ['Itch'],
    feltSense: "desire disrupting the calm; can't sit still",
  }),
  keSlot({
    a: 'joy',
    b: 'neutrality',
    dominantChannel: 'neutrality',
    label: 'Contentment',
    feltSense: 'stillness absorbing desire; enough',
  }),
  keSlot({
    a: 'neutrality',
    b: 'sadness',
    dominantChannel: 'neutrality',
    label: 'Acceptance',
    alternateLabels: ['Serenity'],
    feltSense: 'the ground containing sorrow; grief held in peace',
  }),
  keSlot({
    a: 'neutrality',
    b: 'sadness',
    dominantChannel: 'sadness',
    label: 'Melancholy',
    feltSense: 'grief coloring the stillness; the pensive ache',
  }),
  keSlot({
    a: 'fear',
    b: 'joy',
    dominantChannel: 'fear',
    label: 'Trepidation',
    alternateLabels: ['Inhibition'],
    feltSense: 'fear pruning desire; the held-back reach',
    leadReading: 'Trepidation',
    goldReading: 'Reverent approach',
  }),
  keSlot({
    a: 'fear',
    b: 'joy',
    dominantChannel: 'joy',
    label: 'Thrill',
    alternateLabels: ['Temptation'],
    feltSense: 'desire winning over fear; drawn toward the scary thing',
    leadReading: 'Recklessness',
    goldReading: 'Thrill',
  }),
] as const

export function listCompoundEmotionSlots(): readonly CompoundEmotionSlot[] {
  return COMPOUND_EMOTION_SLOTS
}

export function getCompoundEmotionSlot(id: string): CompoundEmotionSlot | null {
  return COMPOUND_EMOTION_SLOTS.find((slot) => slot.id === id) ?? null
}

export function findCompoundSlotsForChannel(channel: EmotionChannel): CompoundEmotionSlot[] {
  return COMPOUND_EMOTION_SLOTS.filter((slot) => slot.channels.includes(channel))
}

export function findCompoundSlotsForPair(a: EmotionChannel, b: EmotionChannel): CompoundEmotionSlot[] {
  if (a === b) return []
  return COMPOUND_EMOTION_SLOTS.filter((slot) => slot.channels.includes(a) && slot.channels.includes(b))
}

function treatmentFor(state: AlchemyState): ComponentTreatmentGuidance {
  if (state.altitude === 'dissatisfied') {
    return {
      ...state,
      operation: 'stabilize',
      targetAltitude: 'neutral',
      note: `Stabilize ${state.channel}: make the signal legible before asking it to transform.`,
    }
  }

  if (state.altitude === 'neutral') {
    return {
      ...state,
      operation: 'transcend',
      targetAltitude: 'satisfied',
      note: `Transcend ${state.channel}: let clean ${state.channel} complete into its satisfied resource.`,
    }
  }

  return {
    ...state,
    operation: 'maintain_satisfied_expression',
    targetAltitude: 'satisfied',
    note: `Keep ${state.channel} in satisfied expression; do not turn the compound into a separate treatment target.`,
  }
}

export function resolveCompoundEmotion(input: ResolveCompoundEmotionInput): CompoundEmotionResolution | null {
  const slots = findCompoundSlotsForPair(input.a.channel, input.b.channel)
  const slot = slots.find((candidate) => candidate.dominantChannel === input.dominantChannel)
  if (!slot) return null

  return {
    slot,
    componentStates: [input.a, input.b],
    componentTreatment: [treatmentFor(input.a), treatmentFor(input.b)],
    treatmentRule: TREATMENT_RULE,
    directCompoundMoveRecommended: false,
  }
}
