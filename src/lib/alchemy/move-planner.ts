import {
  type AlchemyEdge,
  type AlchemyState,
  type AlchemyTargetIntent,
  type AlchemyCombinationCounts,
  allAlchemyStates,
  allGrowthPracticeEdges,
  allMasteryPracticeEdges,
  buildAlchemyEdge,
  getAlchemyCombinationCounts,
  growthPracticeEdgesFrom,
  masteryPracticeEdgesFrom,
  resolveFeelingState,
  stateKey,
  targetIntentFor,
} from './alchemy-graph'

export type AlchemyRouteMode = 'growth' | 'mastery'
export type AlchemyRouteType = 'completion' | 'stabilization' | 'metabolization'
export type BeginnerRouteHandRole = 'metabolize' | 'translate' | 'transcend' | 'single'

export interface AlchemyMovePath {
  moves: AlchemyEdge[]
  states: AlchemyState[]
}

export interface AlchemyPracticeRoute extends AlchemyMovePath {
  mode: AlchemyRouteMode
  targetIntent: AlchemyTargetIntent
  routeType: AlchemyRouteType
  whyThisRoute: string
  risk: string
  bestWhen: string
  blockerPrompt: string
}

export interface BeginnerRouteHand extends AlchemyPracticeRoute {
  mode: 'growth'
  roles: BeginnerRouteHandRole[]
}

export interface PlanPracticeRouteOpts {
  mode?: AlchemyRouteMode
  maxPaths?: number
  maxDepth?: number
}

export interface PracticeRouteUnreachable {
  mode: AlchemyRouteMode
  from: AlchemyState
  to: AlchemyState
  targetIntent: AlchemyTargetIntent
  reason: string
}

export type {
  AlchemyEdge as AlchemyPracticeMove,
  AlchemyState,
  AlchemyTargetIntent,
  AlchemyCombinationCounts,
}

export {
  allAlchemyStates,
  allGrowthPracticeEdges,
  allMasteryPracticeEdges,
  getAlchemyCombinationCounts,
  growthPracticeEdgesFrom as directPracticeMovesFrom,
  resolveFeelingState,
  stateKey,
}

function pathSignature(moves: AlchemyEdge[]): string {
  return moves.map((move) => move.vector).join('|')
}

function routeMetadata(
  mode: AlchemyRouteMode,
  targetIntent: AlchemyTargetIntent,
): Pick<AlchemyPracticeRoute, 'routeType' | 'whyThisRoute' | 'risk' | 'bestWhen' | 'blockerPrompt'> {
  if (targetIntent === 'satisfaction') {
    return {
      routeType: 'completion',
      whyThisRoute: 'This route aims at a satisfied state, where the emotional signal becomes usable resource.',
      risk: mode === 'mastery'
        ? 'Mastery routes may pass through harder material; do not treat intensity as failure.'
        : 'Growth routes can become performance if the player rushes past clean signal.',
      bestWhen: 'Use when the player can practice through the charge and wants completion.',
      blockerPrompt: 'What blocks the final step from clean emotion into satisfaction?',
    }
  }

  if (targetIntent === 'stabilization') {
    return {
      routeType: 'stabilization',
      whyThisRoute: 'This route stops when the emotion is doing its job cleanly.',
      risk: 'Stopping at neutral can feel unfinished if the player expects a reward state.',
      bestWhen: 'Use when peace, bliss, triumph, poignance, or excitement feels too far away.',
      blockerPrompt: 'What keeps this emotion from doing its job cleanly?',
    }
  }

  return {
    routeType: 'metabolization',
    whyThisRoute: 'This route aims for a more workable dissatisfaction rather than a nicer feeling.',
    risk: 'The result can look worse on a mood chart while becoming more honest and metabolizable.',
    bestWhen: 'Use when the current state is vague, collapsed, or evasive and needs a clearer charge.',
    blockerPrompt: 'What makes this dissatisfaction easier to work with than the current one?',
  }
}

function sortCandidateEdges(
  edges: AlchemyEdge[],
  currentState: AlchemyState,
  target: AlchemyState,
): AlchemyEdge[] {
  return [...edges].sort((a, b) => {
    const aHitsTargetChannel = a.to.channel === target.channel ? 0 : 1
    const bHitsTargetChannel = b.to.channel === target.channel ? 0 : 1
    const aVertical = a.from.channel === a.to.channel ? 0 : 1
    const bVertical = b.from.channel === b.to.channel ? 0 : 1
    const aDescent = a.operation === 'controlled_descent' ? 1 : 0
    const bDescent = b.operation === 'controlled_descent' ? 1 : 0

    if (currentState.altitude === 'dissatisfied') {
      return aVertical - bVertical || aHitsTargetChannel - bHitsTargetChannel || aDescent - bDescent
    }

    if (currentState.channel !== target.channel) {
      return aHitsTargetChannel - bHitsTargetChannel || aVertical - bVertical || aDescent - bDescent
    }

    return aVertical - bVertical || aHitsTargetChannel - bHitsTargetChannel || aDescent - bDescent
  })
}

function edgesForMode(mode: AlchemyRouteMode, state: AlchemyState): AlchemyEdge[] {
  return mode === 'growth' ? growthPracticeEdgesFrom(state) : masteryPracticeEdgesFrom(state)
}

export function planPracticeRoutes(
  from: AlchemyState,
  to: AlchemyState,
  opts: PlanPracticeRouteOpts = {},
): AlchemyPracticeRoute[] {
  const mode = opts.mode ?? 'growth'
  const maxPaths = opts.maxPaths ?? 3
  const maxDepth = opts.maxDepth ?? (mode === 'mastery' ? 9 : 7)
  const targetKey = stateKey(to)
  const targetIntent = targetIntentFor(to)
  const metadata = routeMetadata(mode, targetIntent)
  const queue: AlchemyMovePath[] = [{ states: [from], moves: [] }]
  const results: AlchemyPracticeRoute[] = []
  const seenResults = new Set<string>()

  while (queue.length > 0 && results.length < maxPaths) {
    const currentPath = queue.shift()!
    const currentState = currentPath.states[currentPath.states.length - 1]!

    if (stateKey(currentState) === targetKey) {
      const signature = pathSignature(currentPath.moves)
      if (!seenResults.has(signature)) {
        seenResults.add(signature)
        results.push({
          ...currentPath,
          mode,
          targetIntent,
          ...metadata,
        })
      }
      continue
    }

    if (currentPath.moves.length >= maxDepth) continue

    const nextMoves = sortCandidateEdges(edgesForMode(mode, currentState), currentState, to)
    for (const move of nextMoves) {
      const alreadyVisited = currentPath.states.some((state) => stateKey(state) === stateKey(move.to))
      if (alreadyVisited) continue

      queue.push({
        states: [...currentPath.states, move.to],
        moves: [...currentPath.moves, move],
      })
    }
  }

  return results
}

function beginnerRoleForEdge(edge: AlchemyEdge, onlyMove: boolean): BeginnerRouteHandRole {
  if (onlyMove) return 'single'
  if (edge.operation === 'stabilize') return 'metabolize'
  if (edge.operation === 'translate') return 'translate'
  if (edge.operation === 'transcend') return 'transcend'
  return 'single'
}

export function planBeginnerRouteHand(
  from: AlchemyState,
  to: AlchemyState,
): BeginnerRouteHand {
  const moves: AlchemyEdge[] = []
  let current: AlchemyState = from

  if (current.altitude === 'dissatisfied') {
    const next: AlchemyState = { channel: current.channel, altitude: 'neutral' }
    moves.push(buildAlchemyEdge('stabilize', current, next))
    current = next
  }

  if (current.channel !== to.channel) {
    const targetNeutral: AlchemyState = { channel: to.channel, altitude: 'neutral' }
    moves.push(buildAlchemyEdge('translate', current, targetNeutral))
    current = targetNeutral
  }

  if (to.altitude === 'satisfied' && current.altitude !== 'satisfied') {
    moves.push(buildAlchemyEdge('transcend', current, to))
    current = to
  } else if (to.altitude === 'neutral' && (current.channel !== to.channel || current.altitude !== to.altitude)) {
    moves.push(buildAlchemyEdge('translate', current, to))
    current = to
  } else if (to.altitude === 'dissatisfied' && (current.channel !== to.channel || current.altitude !== to.altitude)) {
    const fallback = planPracticeRoutes(from, to, { mode: 'growth', maxPaths: 1 })[0]
    if (fallback) {
      return {
        ...fallback,
        mode: 'growth',
        roles: fallback.moves.map((move, index) => beginnerRoleForEdge(move, fallback.moves.length === 1 && index === 0)),
      }
    }
  }

  const targetIntent = targetIntentFor(to)
  const metadata = routeMetadata('growth', targetIntent)
  const onlyMove = moves.length === 1

  return {
    moves,
    states: moves.reduce<AlchemyState[]>((states, move) => [...states, move.to], [from]),
    mode: 'growth',
    targetIntent,
    ...metadata,
    roles: moves.map((move) => beginnerRoleForEdge(move, onlyMove)),
  }
}

export function explainPracticeRouteUnreachable(
  from: AlchemyState,
  to: AlchemyState,
  mode: AlchemyRouteMode = 'growth',
): PracticeRouteUnreachable | null {
  if (planPracticeRoutes(from, to, { mode, maxPaths: 1 }).length > 0) return null

  return {
    mode,
    from,
    to,
    targetIntent: targetIntentFor(to),
    reason: mode === 'growth'
      ? 'Growth mode could not route this target without a controlled descent or repeated state.'
      : 'Mastery mode could not route this target within the configured graph depth.',
  }
}

export function planAlchemyMoves(
  from: AlchemyState,
  to: AlchemyState,
  opts: Omit<PlanPracticeRouteOpts, 'mode'> = {},
): AlchemyPracticeRoute[] {
  return planPracticeRoutes(from, to, { ...opts, mode: 'growth' })
}
