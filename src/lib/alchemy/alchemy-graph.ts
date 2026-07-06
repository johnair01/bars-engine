import type { AlchemyAltitude, EmotionChannel } from './types'

export type AlchemyElement = 'metal' | 'water' | 'wood' | 'fire' | 'earth'
export type AlchemyPracticeOperation =
  | 'stabilize'
  | 'translate'
  | 'transcend'
  | 'generate'
  | 'control'
  | 'controlled_descent'

export type AlchemyTargetIntent =
  | 'satisfaction'
  | 'stabilization'
  | 'metabolizable_dissatisfaction'

export interface AlchemyState {
  channel: EmotionChannel
  altitude: AlchemyAltitude
}

export interface AlchemyStateMeta extends AlchemyState {
  key: string
  element: AlchemyElement
  label: string
  aliases: string[]
  resource: string
}

export interface AlchemyEdge {
  operation: AlchemyPracticeOperation
  from: AlchemyState
  to: AlchemyState
  vector: string
  moveId: string
  moveName: string
  prompt: string
  doctrineLineageId?: string
}

export interface AlchemyCombinationCounts {
  channels: number
  altitudes: number
  states: number
  orderedStatePairsIncludingSelf: number
  orderedStatePairsExcludingSelf: number
  theoreticalChannelPairs: number
  canonicalChannelMoveFamilies: number
  currentSceneResolutionVectors: number
  growthPracticeDirectEdges: number
  masteryPracticeDirectEdges: number
}

export const ALCHEMY_CHANNELS: EmotionChannel[] = ['fear', 'sadness', 'joy', 'anger', 'neutrality']
export const ALCHEMY_ALTITUDES: AlchemyAltitude[] = ['dissatisfied', 'neutral', 'satisfied']

const CHANNEL_META: Record<
  EmotionChannel,
  {
    element: AlchemyElement
    resource: string
    dissatisfied: { label: string; aliases: string[] }
    neutral: { label: string; aliases: string[] }
    satisfied: { label: string; aliases: string[] }
    stabilize: { id: string; name: string }
    transcend: { id: string; name: string }
  }
> = {
  fear: {
    element: 'metal',
    resource: 'discernment',
    dissatisfied: { label: 'anxiety', aliases: ['anxious', 'worried', 'dread'] },
    neutral: { label: 'Fear', aliases: ['clean fear', 'discernment', 'risk signal'] },
    satisfied: { label: 'excitement', aliases: ['courage', 'wonder', 'openness'] },
    stabilize: { id: 'fear_stabilize', name: 'Orient Fear' },
    transcend: { id: 'metal_transcend', name: 'Step Through' },
  },
  sadness: {
    element: 'water',
    resource: 'meaning',
    dissatisfied: { label: 'grief', aliases: ['heavy sadness', 'distance', 'loss'] },
    neutral: { label: 'Sadness', aliases: ['clean sadness', 'care signal', 'honoring'] },
    satisfied: { label: 'poignance', aliases: ['connection', 'fulfillment', 'receiving'] },
    stabilize: { id: 'sadness_stabilize', name: 'Hold Sadness' },
    transcend: { id: 'water_transcend', name: 'Reclaim Meaning' },
  },
  joy: {
    element: 'wood',
    resource: 'possibility',
    dissatisfied: { label: 'restlessness', aliases: ['restless', 'mania', 'comparison', 'hyperstimulation'] },
    neutral: { label: 'Joy', aliases: ['clean joy', 'aliveness', 'delight signal'] },
    satisfied: { label: 'bliss', aliases: ['delight', 'flourishing', 'participation'] },
    stabilize: { id: 'joy_stabilize', name: 'Settle Joy' },
    transcend: { id: 'wood_transcend', name: 'Commit to Growth' },
  },
  anger: {
    element: 'fire',
    resource: 'agency',
    dissatisfied: { label: 'frustration', aliases: ['hot anger', 'resentment', 'attack'] },
    neutral: { label: 'Anger', aliases: ['clean anger', 'boundary signal', 'directed passion'] },
    satisfied: { label: 'triumph', aliases: ['warmth', 'honored boundary', 'agency'] },
    stabilize: { id: 'anger_stabilize', name: 'Aim Anger' },
    transcend: { id: 'fire_transcend', name: 'Achieve Breakthrough' },
  },
  neutrality: {
    element: 'earth',
    resource: 'presence',
    dissatisfied: { label: 'apathy', aliases: ['numbness', 'boredom', 'stagnation', 'flatness'] },
    neutral: { label: 'Neutral', aliases: ['neutrality', 'clean neutrality', 'whole-system signal'] },
    satisfied: { label: 'peace', aliases: ['peaceful', 'coherence', 'grounded presence', 'stillness'] },
    stabilize: { id: 'neutrality_stabilize', name: 'Restore Neutrality' },
    transcend: { id: 'earth_transcend', name: 'Stabilize Coherence' },
  },
}

export const SHENG_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy: 'anger',
  anger: 'neutrality',
  neutrality: 'fear',
  fear: 'sadness',
  sadness: 'joy',
}

export const KE_CYCLE: Record<EmotionChannel, EmotionChannel> = {
  joy: 'neutrality',
  neutrality: 'sadness',
  sadness: 'anger',
  anger: 'fear',
  fear: 'joy',
}

const GENERATIVE_MOVE_META: Record<EmotionChannel, { id: string; name: string }> = {
  joy: { id: 'wood_fire', name: 'Declare Intention' },
  anger: { id: 'fire_earth', name: 'Integrate Gains' },
  neutrality: { id: 'earth_metal', name: 'Reveal Stakes' },
  fear: { id: 'metal_water', name: 'Deepen Value' },
  sadness: { id: 'water_wood', name: 'Renew Vitality' },
}

const CONTROL_MOVE_META: Record<EmotionChannel, { id: string; name: string }> = {
  joy: { id: 'wood_earth', name: 'Consolidate Energy' },
  anger: { id: 'fire_metal', name: 'Temper Action' },
  neutrality: { id: 'earth_water', name: 'Reopen Sensitivity' },
  fear: { id: 'metal_wood', name: 'Activate Hope' },
  sadness: { id: 'water_fire', name: 'Mobilize Grief' },
}

export function stateKey(state: AlchemyState): string {
  return `${state.channel}:${state.altitude}`
}

export function vectorKey(from: AlchemyState, to: AlchemyState): string {
  return `${stateKey(from)}->${stateKey(to)}`
}

export function getAlchemyStateMeta(state: AlchemyState): AlchemyStateMeta {
  const meta = CHANNEL_META[state.channel]
  const altitudeMeta = meta[state.altitude]
  return {
    ...state,
    key: stateKey(state),
    element: meta.element,
    label: altitudeMeta.label,
    aliases: altitudeMeta.aliases,
    resource: meta.resource,
  }
}

export function allAlchemyStates(): AlchemyStateMeta[] {
  return ALCHEMY_CHANNELS.flatMap((channel) =>
    ALCHEMY_ALTITUDES.map((altitude) => getAlchemyStateMeta({ channel, altitude })),
  )
}

export function targetIntentFor(state: AlchemyState): AlchemyTargetIntent {
  if (state.altitude === 'satisfied') return 'satisfaction'
  if (state.altitude === 'neutral') return 'stabilization'
  return 'metabolizable_dissatisfaction'
}

export function resolveFeelingState(feeling: string): AlchemyStateMeta | null {
  const normalized = feeling.trim().toLowerCase()
  if (!normalized) return null

  return allAlchemyStates().find((state) => {
    if (state.key === normalized || state.label.toLowerCase() === normalized) return true
    return state.aliases.some((alias) => alias.toLowerCase() === normalized)
  }) ?? null
}

function altitudeUp(altitude: AlchemyAltitude): AlchemyAltitude | null {
  if (altitude === 'dissatisfied') return 'neutral'
  if (altitude === 'neutral') return 'satisfied'
  return null
}

function altitudeDown(altitude: AlchemyAltitude): AlchemyAltitude | null {
  if (altitude === 'satisfied') return 'neutral'
  if (altitude === 'neutral') return 'dissatisfied'
  return null
}

function buildEdge(
  operation: AlchemyPracticeOperation,
  from: AlchemyState,
  to: AlchemyState,
): AlchemyEdge {
  const fromMeta = getAlchemyStateMeta(from)
  const toMeta = getAlchemyStateMeta(to)
  const channelMeta = CHANNEL_META[from.channel]

  if (operation === 'stabilize') {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: channelMeta.stabilize.id,
      moveName: channelMeta.stabilize.name,
      doctrineLineageId: channelMeta.transcend.id,
      prompt: `Let ${fromMeta.label} become clean ${toMeta.label}.`,
    }
  }

  if (operation === 'transcend') {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: channelMeta.transcend.id,
      moveName: channelMeta.transcend.name,
      prompt: `Practice clean ${fromMeta.label} until it opens into ${toMeta.label}.`,
    }
  }

  if (operation === 'translate') {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: `${from.channel}_to_${to.channel}_translate`,
      moveName: `Translate ${fromMeta.label} Into ${toMeta.label}`,
      prompt: `Let clean ${fromMeta.label} become available as clean ${toMeta.label}.`,
    }
  }

  if (operation === 'generate') {
    const move = GENERATIVE_MOVE_META[from.channel]
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: move.id,
      moveName: move.name,
      prompt: `Let ${fromMeta.label} nourish ${toMeta.label}.`,
    }
  }

  if (operation === 'control') {
    const move = CONTROL_MOVE_META[from.channel]
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: move.id,
      moveName: move.name,
      prompt: `Use ${fromMeta.label} to precisely reach ${toMeta.label}.`,
    }
  }

  return {
    operation,
    from,
    to,
    vector: vectorKey(from, to),
    moveId: `${from.channel}_controlled_descent`,
    moveName: `Descend with ${fromMeta.label}`,
    prompt: `Step down from ${fromMeta.label} into ${toMeta.label} without collapse.`,
  }
}

export function buildAlchemyEdge(
  operation: AlchemyPracticeOperation,
  from: AlchemyState,
  to: AlchemyState,
): AlchemyEdge {
  return buildEdge(operation, from, to)
}

export function growthPracticeEdgesFrom(state: AlchemyState): AlchemyEdge[] {
  const edges: AlchemyEdge[] = []
  const up = altitudeUp(state.altitude)

  if (up) {
    edges.push(buildEdge(state.altitude === 'dissatisfied' ? 'stabilize' : 'transcend', state, {
      channel: state.channel,
      altitude: up,
    }))
  }

  edges.push(buildEdge('generate', state, {
    channel: SHENG_CYCLE[state.channel],
    altitude: state.altitude,
  }))

  edges.push(buildEdge('control', state, {
    channel: KE_CYCLE[state.channel],
    altitude: state.altitude,
  }))

  return edges
}

export function masteryPracticeEdgesFrom(state: AlchemyState): AlchemyEdge[] {
  const edges = [...growthPracticeEdgesFrom(state)]
  const down = altitudeDown(state.altitude)

  if (down) {
    edges.push(buildEdge('controlled_descent', state, {
      channel: state.channel,
      altitude: down,
    }))
  }

  return edges
}

export function allGrowthPracticeEdges(): AlchemyEdge[] {
  return allAlchemyStates().flatMap(growthPracticeEdgesFrom)
}

export function allMasteryPracticeEdges(): AlchemyEdge[] {
  return allAlchemyStates().flatMap(masteryPracticeEdgesFrom)
}

export function allSceneResolutionEdges(): AlchemyEdge[] {
  const upwardAltitudes: AlchemyAltitude[] = ['dissatisfied', 'neutral']
  const controlAltitudes: AlchemyAltitude[] = ['neutral', 'satisfied']
  return [
    ...ALCHEMY_CHANNELS.flatMap((channel) =>
      upwardAltitudes.flatMap((altitude) => {
        const state = { channel, altitude }
        const up = altitudeUp(altitude)!
        return [
          buildEdge(altitude === 'dissatisfied' ? 'stabilize' : 'transcend', state, { channel, altitude: up }),
          buildEdge('generate', state, { channel: SHENG_CYCLE[channel], altitude: up }),
        ]
      }),
    ),
    ...ALCHEMY_CHANNELS.flatMap((channel) =>
      controlAltitudes.map((altitude) => {
        const state = { channel, altitude }
        const down = altitudeDown(altitude)!
        return buildEdge('control', state, { channel: KE_CYCLE[channel], altitude: down })
      }),
    ),
  ]
}

export function getAlchemyCombinationCounts(): AlchemyCombinationCounts {
  const states = allAlchemyStates().length
  return {
    channels: ALCHEMY_CHANNELS.length,
    altitudes: ALCHEMY_ALTITUDES.length,
    states,
    orderedStatePairsIncludingSelf: states * states,
    orderedStatePairsExcludingSelf: states * (states - 1),
    theoreticalChannelPairs: ALCHEMY_CHANNELS.length * ALCHEMY_CHANNELS.length,
    canonicalChannelMoveFamilies: ALCHEMY_CHANNELS.length * 3,
    currentSceneResolutionVectors: allSceneResolutionEdges().length,
    growthPracticeDirectEdges: allGrowthPracticeEdges().length,
    masteryPracticeDirectEdges: allMasteryPracticeEdges().length,
  }
}
