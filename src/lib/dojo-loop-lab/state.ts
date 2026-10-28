import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { ThoughtStringAnchor, ThoughtStringWordRead } from '@/lib/alchemy/thought-string-triad'
import { personalMoveForDomain, type DojoAllyshipDomain, type DojoPersonalMove } from './action-grammar'

export type LoopLabState = {
  wordReads: Record<string, ThoughtStringWordRead>
  anchors: ThoughtStringAnchor[]
  selectedEaMoveId?: 'metal_wood'
  actionStack: {
    lifeLens: 'career'
    container: 'gathering'
    allyshipDomain: DojoAllyshipDomain
    personalMove: DojoPersonalMove
  }
  selectedActionFormId?: string
  editedNextStep?: string
  projectedTriangleId: 'initial' | 'budded'
  started: boolean
}

export const LOOP_LAB_ANCHORS: ThoughtStringAnchor[] = [
  { wordId: 'wonder', state: { channel: 'fear', altitude: 'satisfied' }, status: 'proposed' },
  { wordId: 'poignance', state: { channel: 'sadness', altitude: 'satisfied' }, status: 'proposed' },
  { wordId: 'joy', state: { channel: 'joy', altitude: 'satisfied' }, status: 'proposed' },
]

export function initialLoopLabState(): LoopLabState {
  return {
    wordReads: {
      wonder: { activation: 3, orientation: 'supportive' },
      poignance: { activation: 2, orientation: 'mixed' },
      joy: { activation: 2, orientation: 'supportive' },
    },
    anchors: LOOP_LAB_ANCHORS.map(anchor => ({ ...anchor, state: { ...anchor.state } })),
    selectedEaMoveId: 'metal_wood',
    actionStack: { lifeLens: 'career', container: 'gathering', allyshipDomain: 'SKILLFUL_ORGANIZING', personalMove: 'grow_up' },
    projectedTriangleId: 'initial',
    started: false,
  }
}

export type LoopLabEvent =
  | { type: 'begin' }
  | { type: 'reset' }
  | { type: 'project'; triangleId: 'initial' | 'budded' }
  | { type: 'set-read'; wordId: string; read: ThoughtStringWordRead }
  | { type: 'set-anchor'; wordId: string; status: ThoughtStringAnchor['status'] }
  | { type: 'set-domain'; domain: DojoAllyshipDomain }
  | { type: 'set-ea-move'; moveId: 'metal_wood' }
  | { type: 'select-form'; formId?: string }
  | { type: 'edit-next-step'; value: string }

export function loopLabReducer(state: LoopLabState, event: LoopLabEvent): LoopLabState {
  if (event.type === 'reset') return initialLoopLabState()
  if (event.type === 'begin') return { ...state, started: true }
  if (event.type === 'project') return { ...state, projectedTriangleId: event.triangleId }
  if (event.type === 'set-read') return { ...state, wordReads: { ...state.wordReads, [event.wordId]: event.read } }
  if (event.type === 'set-anchor') return { ...state, anchors: state.anchors.map(anchor => anchor.wordId === event.wordId ? { ...anchor, status: event.status } : anchor) }
  if (event.type === 'set-domain') return {
    ...state,
    actionStack: { ...state.actionStack, allyshipDomain: event.domain, personalMove: personalMoveForDomain(event.domain) },
    selectedActionFormId: undefined,
    editedNextStep: undefined,
  }
  if (event.type === 'set-ea-move') return { ...state, selectedEaMoveId: event.moveId }
  if (event.type === 'select-form') return { ...state, selectedActionFormId: event.formId, editedNextStep: undefined }
  return { ...state, editedNextStep: event.value }
}

export function confirmedAnchors(anchors: readonly ThoughtStringAnchor[]): ThoughtStringAnchor[] {
  return anchors.filter(anchor => anchor.status === 'confirmed')
}

export function anchorLabel(state: AlchemyState): string {
  const labels: Record<AlchemyState['channel'], string> = { fear: 'Fear / Metal', sadness: 'Sadness / Water', joy: 'Joy / Wood', anger: 'Anger / Fire', neutrality: 'Neutrality / Earth' }
  return `${labels[state.channel]} / ${state.altitude}`
}
