import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import { resolveFeelingState } from '@/lib/alchemy/alchemy-graph'
import { planBeginnerRouteHand, planPracticeRoutes, type BeginnerRouteHandRole } from '@/lib/alchemy/move-planner'
import { recommendShowUpMovesForEdges } from '@/lib/alchemy/show-up-primitives'
import type {
  ChargeStateInput,
  MoveAttemptDraft,
  MoveAttemptMissingField,
  MoveRecommendationRole,
  MoveAttemptVectorStatus,
  MoveRecommendationServiceInput,
  MoveRecommendationServiceResult,
} from './types'

const DEFAULT_BLOCKER = 'The blocker has not been named yet.'

function resolveChargeState(input: ChargeStateInput): AlchemyState | null {
  if (!input) return null
  if (typeof input !== 'string') return input
  const resolved = resolveFeelingState(input)
  return resolved ? { channel: resolved.channel, altitude: resolved.altitude } : null
}

function vectorStatusFor(
  presentState: AlchemyState | null,
  desiredState: AlchemyState | null,
): MoveAttemptVectorStatus {
  if (presentState && desiredState) return 'full'
  if (presentState || desiredState) return 'partial'
  return 'none'
}

function missingFieldsFor(input: {
  presentState: AlchemyState | null
  desiredState: AlchemyState | null
}): MoveAttemptMissingField[] {
  const missing: MoveAttemptMissingField[] = []
  if (!input.presentState) missing.push('present')
  if (!input.desiredState) missing.push('desired')
  return missing
}

function nextQuestionFor(missingFields: readonly MoveAttemptMissingField[]): string | null {
  if (missingFields.includes('present')) return 'What charge is alive right now?'
  if (missingFields.includes('desired')) return 'What would resolution feel like?'
  if (missingFields.includes('blocker')) return 'What is making this hard to move?'
  return null
}

function contextFor(input: MoveRecommendationServiceInput) {
  return {
    sourceSurface: input.sourceSurface,
    ...(input.playerId ? { playerId: input.playerId } : {}),
    ...(input.campaignRef ? { campaignRef: input.campaignRef } : {}),
    ...(input.stewardId ? { stewardId: input.stewardId } : {}),
    ...(input.barId ? { barId: input.barId } : {}),
    ...(input.questId ? { questId: input.questId } : {}),
    ...(input.deckCardId ? { deckCardId: input.deckCardId } : {}),
    ...(input.shadow321SessionId ? { shadow321SessionId: input.shadow321SessionId } : {}),
    ...(input.alchemyArcId ? { alchemyArcId: input.alchemyArcId } : {}),
  }
}

function draftForRecommendation(input: {
  serviceInput: MoveRecommendationServiceInput
  presentState: AlchemyState
  desiredState: AlchemyState
  blocker: string
  route: NonNullable<MoveRecommendationServiceResult['routes'][number]>
  recommendations: NonNullable<MoveRecommendationServiceResult['primaryRecommendation']>[]
  recommendation: NonNullable<MoveRecommendationServiceResult['primaryRecommendation']>
  role: MoveRecommendationRole
}): MoveAttemptDraft {
  return {
    sourceSurface: input.serviceInput.sourceSurface,
    status: 'recommended',
    context: contextFor(input.serviceInput),
    vectorStatus: 'full',
    vectorSnapshot: {
      present: input.presentState,
      desired: input.desiredState,
      blocker: input.blocker,
    },
    routeSnapshot: input.route,
    recommendationRole: input.role,
    recommendedPrimitiveIds: input.recommendations.map((recommendation) => recommendation.primitiveMatch.primitive.id),
    chosenPrimitiveId: input.recommendation.primitiveMatch.primitive.id,
    translationSnapshot: input.recommendation.move,
    ...(input.recommendation.mechanicOperation
      ? { mechanicOperationSnapshot: input.recommendation.mechanicOperation }
      : {}),
    ...(input.recommendation.selectedPracticeLens
      ? { selectedPracticeLens: input.recommendation.selectedPracticeLens }
      : {}),
    ...(input.recommendation.selectedPracticeVariant
      ? { selectedPracticeVariant: input.recommendation.selectedPracticeVariant }
      : {}),
  }
}

export function recommendChargeMetabolismMove(
  input: MoveRecommendationServiceInput,
): MoveRecommendationServiceResult {
  const presentState = resolveChargeState(input.present)
  const desiredState = resolveChargeState(input.desired)
  const vectorStatus = vectorStatusFor(presentState, desiredState)
  const missingFields = missingFieldsFor({
    presentState,
    desiredState,
  })

  if (!presentState || !desiredState) {
    return {
      vectorStatus,
      missingFields,
      nextQuestion: nextQuestionFor(missingFields),
      presentState,
      desiredState,
      routes: [],
      routeHandRecommendations: [],
      routeHandAttemptDrafts: [],
      metabolizeRecommendation: null,
      satisfactionRecommendation: null,
      primaryRecommendation: null,
      alternateRecommendations: [],
      metabolizeAttemptDraft: null,
      satisfactionAttemptDraft: null,
      attemptDraft: null,
    }
  }

  const blocker = input.blocker?.trim() || DEFAULT_BLOCKER
  const useBeginnerRouteHand = input.sourceSurface === 'allyship_deck' && input.mode === undefined
  const beginnerRoute = useBeginnerRouteHand ? planBeginnerRouteHand(presentState, desiredState) : null
  const routes = beginnerRoute
    ? [beginnerRoute]
    : planPracticeRoutes(presentState, desiredState, {
        mode: input.mode ?? 'growth',
        maxPaths: Math.max(1, (input.maxAlternates ?? 2) + 1),
      })
  const firstRoute = routes[0] ?? null

  if (!firstRoute) {
    return {
      vectorStatus,
      missingFields,
      nextQuestion: null,
      presentState,
      desiredState,
      routes: [],
      routeHandRecommendations: [],
      routeHandAttemptDrafts: [],
      metabolizeRecommendation: null,
      satisfactionRecommendation: null,
      primaryRecommendation: null,
      alternateRecommendations: [],
      metabolizeAttemptDraft: null,
      satisfactionAttemptDraft: null,
      attemptDraft: null,
    }
  }

  const recommendationContext = {
    orientation: input.orientation ?? 'internal',
    subject: input.subject ?? 'self',
    superpower: input.superpower ?? 'coach',
    domain: input.domain ?? 'DIRECT_ACTION',
    blocker,
    ...(input.cardContext ? { cardContext: input.cardContext } : {}),
  }
  const recommendations = recommendShowUpMovesForEdges(firstRoute.moves, recommendationContext)
  const routeRoles = hasBeginnerRouteRoles(firstRoute)
    ? firstRoute.roles
    : firstRoute.moves.map((move, index) => fallbackRoleForEdge(move, firstRoute.moves.length === 1 && index === 0))
  const routeHandRecommendations = recommendations
  const routeHandAttemptDrafts = routeHandRecommendations.map((recommendation, index) =>
    draftForRecommendation({
      serviceInput: input,
      presentState,
      desiredState,
      blocker,
      route: firstRoute,
      recommendations,
      recommendation,
      role: routeRoles[index] ?? 'single',
    }),
  )
  const metabolizeRecommendation = routeHandRecommendations.find((recommendation) =>
    recommendation.edge.operation === 'stabilize'
  ) ?? routeHandRecommendations[0] ?? null
  const satisfactionRecommendation = routeHandRecommendations.find((recommendation) =>
    recommendation.edge.operation === 'transcend'
  ) ?? null
  const isSingleRecommendation = routeHandRecommendations.length <= 1
  const primaryRecommendation = metabolizeRecommendation
  const alternateRecommendations = recommendations.slice(1, (input.maxAlternates ?? 2) + 1)
  const metabolizeAttemptDraft = routeHandAttemptDrafts.find((draft) =>
    draft.translationSnapshot?.stateVector === metabolizeRecommendation?.edge.vector
  ) ?? null
  const satisfactionAttemptDraft = routeHandAttemptDrafts.find((draft) =>
    draft.translationSnapshot?.stateVector === satisfactionRecommendation?.edge.vector
  ) ?? null

  return {
    vectorStatus,
    missingFields,
    nextQuestion: null,
    presentState,
    desiredState,
    routes,
    routeHandRecommendations,
    metabolizeRecommendation,
    satisfactionRecommendation: isSingleRecommendation ? null : satisfactionRecommendation,
    primaryRecommendation,
    alternateRecommendations,
    routeHandAttemptDrafts,
    metabolizeAttemptDraft,
    satisfactionAttemptDraft: isSingleRecommendation ? null : satisfactionAttemptDraft,
    attemptDraft: metabolizeAttemptDraft,
  }
}

function hasBeginnerRouteRoles(route: { roles?: unknown }): route is { roles: BeginnerRouteHandRole[] } {
  return Array.isArray(route.roles)
}

function fallbackRoleForEdge(
  edge: { operation: string },
  onlyMove: boolean,
): BeginnerRouteHandRole {
  if (onlyMove) return 'single'
  if (edge.operation === 'stabilize') return 'metabolize'
  if (edge.operation === 'translate' || edge.operation === 'generate' || edge.operation === 'control') return 'translate'
  if (edge.operation === 'transcend') return 'transcend'
  return 'single'
}
