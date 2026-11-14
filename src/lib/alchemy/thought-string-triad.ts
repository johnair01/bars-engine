import {
  buildAlchemyEdge,
  getAlchemyStateMeta,
  SHENG_CYCLE,
  stateKey,
  type AlchemyEdge,
  type AlchemyState,
} from './alchemy-graph'

/**
 * A word's read is authored by the player. It is deliberately separate from
 * the optional Emotional Alchemy anchor below: a word can be important without
 * being one of the five EA channels.
 */
export type ThoughtStringOrientation = 'constricting' | 'supportive' | 'mixed' | 'unread'

export interface ThoughtStringWordRead {
  activation: 0 | 1 | 2 | 3
  orientation: ThoughtStringOrientation
}

export interface ThoughtStringAnchor {
  wordId: string
  state: AlchemyState
  /** Proposed anchors are visible to the player but cannot drive game logic. */
  status: 'proposed' | 'confirmed' | 'declined'
}

export interface ElementalTriad {
  /** Bump this if the source move-table grammar changes. */
  ruleVersion: 'ea-v1'
  states: readonly [AlchemyState, AlchemyState, AlchemyState]
  shengEdges: readonly [AlchemyEdge, AlchemyEdge]
  keClosingEdge: AlchemyEdge
}

export interface SupportedElementalTriad extends ElementalTriad {
  /** Only confirmed word IDs appear here; raw notes and unselected words do not. */
  confirmedWordIds: readonly [string, string, string]
}

function nextShengState(state: AlchemyState): AlchemyState {
  return { channel: SHENG_CYCLE[state.channel], altitude: state.altitude }
}

/**
 * Derives the fixed EA teaching triangle rooted at a chosen canonical state.
 * It does not map player language to a state; that confirmation belongs to the
 * player and happens before this function is called.
 */
export function deriveElementalTriad(root: AlchemyState): ElementalTriad {
  const middle = nextShengState(root)
  const end = nextShengState(middle)

  return {
    ruleVersion: 'ea-v1',
    states: [root, middle, end],
    shengEdges: [
      buildAlchemyEdge('generate', root, middle),
      buildAlchemyEdge('generate', middle, end),
    ],
    keClosingEdge: buildAlchemyEdge('control', root, end),
  }
}

function firstConfirmedWordId(anchors: readonly ThoughtStringAnchor[], state: AlchemyState): string | null {
  return anchors
    .filter((anchor) => anchor.status === 'confirmed' && stateKey(anchor.state) === stateKey(state))
    .map((anchor) => anchor.wordId)
    .sort()[0] ?? null
}

/**
 * Finds only complete, player-confirmed EA triangles already represented in a
 * thought string. The deterministic sort makes the same saved input render the
 * same list every time.
 */
export function deriveSupportedElementalTriads(
  anchors: readonly ThoughtStringAnchor[],
): SupportedElementalTriad[] {
  const roots = anchors
    .filter((anchor) => anchor.status === 'confirmed')
    .map((anchor) => anchor.state)
    .sort((a, b) => stateKey(a).localeCompare(stateKey(b)))

  const seen = new Set<string>()
  const supported: SupportedElementalTriad[] = []

  for (const root of roots) {
    const triad = deriveElementalTriad(root)
    const [first, second, third] = triad.states
    const wordIds = [
      firstConfirmedWordId(anchors, first),
      firstConfirmedWordId(anchors, second),
      firstConfirmedWordId(anchors, third),
    ] as const

    if (wordIds[0] === null || wordIds[1] === null || wordIds[2] === null) continue

    const key = triad.states.map(stateKey).join('|')
    if (seen.has(key)) continue
    seen.add(key)

    supported.push({
      ...triad,
      confirmedWordIds: [wordIds[0], wordIds[1], wordIds[2]],
    })
  }

  return supported
}

/** A display-only helper; it keeps element labels derived from the EA registry. */
export function elementalTriadElements(triad: ElementalTriad): readonly [string, string, string] {
  return triad.states.map((state) => getAlchemyStateMeta(state).element) as [string, string, string]
}
