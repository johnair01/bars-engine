/**
 * Translate .twee source to Flow JSON (quest flow grammar).
 */

import { parseTwee } from '@/lib/twee-parser'
import type { ParsedPassage, ParsedTwineStory } from '@/lib/twine-parser'
import { hasInputBarContent } from './parsePassageContent'
import type {
  CompletionCondition,
  FlowAction,
  FlowNode,
  FlowOutput,
} from './types'

/** Extract event names from tags, e.g. emits:nation_selected or emits:bar_created intended_impact_bar_attached */
function extractEmitsFromTags(tags: string[]): string[] {
  const emitTag = tags.find((t) => t.startsWith('emits:'))
  if (!emitTag) return []
  const value = emitTag.slice(6).trim() // after "emits:"
  return value ? value.split(/\s+/).filter(Boolean) : []
}

/** Get user-facing copy: strip [TOKEN], {{INPUT}}, [[links]]; truncate for flow. */
function getCopyFromPassage(p: ParsedPassage): string {
  let text = p.text
  text = text.replace(/\[TOKEN\]\s+SET\s+\w+=\w+\s*/g, '')
  text = text.replace(/\{\{INPUT:[^}]+\}\}/g, '')
  text = text.replace(/\[{2,}([\s\S]*?)\]{2,}/g, '')
  text = text.trim().replace(/\n+/g, ' ')
  if (text.length > 300) text = text.slice(0, 297) + '...'
  return text || p.name
}

/** Determine flow node type from passage. */
function getNodeType(
  p: ParsedPassage,
  isStart: boolean
): 'introduction' | 'prompt' | 'choice' | 'action' | 'BAR_capture' | 'completion' | 'handoff' {
  const tags = p.tags
  const emits = extractEmitsFromTags(tags)
  const hasBarInput = hasInputBarContent(p.text)

  if (p.name === 'BeginPlay' || emits.includes('begin_play')) return 'handoff'
  if (
    emits.includes('bar_created') ||
    (emits.includes('onboarding_completed') && emits.includes('intended_impact_bar_attached'))
  )
    return 'completion'
  if (tags.includes('action') && hasBarInput) return 'BAR_capture'
  if (
    tags.includes('choice') ||
    tags.includes('template') ||
    tags.includes('choose-one') ||
    tags.includes('hidden-tagging')
  )
    return 'choice'
  if (emits.length > 0) return 'prompt' // result passages (Nation_*, etc.)
  if (isStart) return 'introduction'
  return 'prompt'
}

/** Build actions from links for a node. */
function buildActions(
  p: ParsedPassage,
  nodeType: string,
  emits: string[]
): FlowAction[] {
  if (p.links.length === 0) {
    if (nodeType === 'handoff')
      return [
        {
          type: 'unlock_next_step',
          requires: [],
          emits: ['handoff_triggered', 'step_unlocked'],
          next_node_id: null,
        },
      ]
    return []
  }

  const actions: FlowAction[] = []
  for (const link of p.links) {
    const actionType =
      nodeType === 'choice'
        ? 'choose'
        : nodeType === 'BAR_capture'
          ? 'create_BAR'
          : nodeType === 'completion'
            ? 'confirm'
            : 'read'
    const actionEmits =
      nodeType === 'choice'
        ? ['choice_selected']
        : nodeType === 'BAR_capture'
          ? ['bar_created']
          : nodeType === 'introduction'
            ? ['orientation_viewed']
            : nodeType === 'completion'
              ? emits.length > 0 ? emits : ['quest_completed']
              : ['prompt_viewed']

    const useEmits = nodeType === 'prompt' && emits.length > 0 ? emits : actionEmits
    actions.push({
      type: actionType,
      requires: actionType === 'create_BAR' ? ['create'] : ['observe'],
      emits: useEmits,
      next_node_id: link.target,
      label: link.label,
    })
  }
  return actions
}

/** Fix requires for create_BAR - needs create capability. */
function fixActionRequires(actions: FlowAction[]): void {
  for (const a of actions) {
    if (a.type === 'create_BAR') a.requires = ['create']
    else if (a.type === 'read' || a.type === 'choose') a.requires = ['observe']
    else if (a.type === 'unlock_next_step') a.requires = []
  }
}

export function translateTweeToFlow(
  tweeSource: string,
  options?: { flowId?: string; campaignId?: string }
): FlowOutput {
  const parsed = parseTwee(tweeSource)
  return translateParsedToFlow(parsed, options)
}

export function translateParsedToFlow(
  parsed: ParsedTwineStory,
  options?: { flowId?: string; campaignId?: string }
): FlowOutput {
  const { title, startPassage, passages } = parsed

  const flowId = options?.flowId ?? `${title.toLowerCase().replace(/\s+/g, '-')}-flow-v1`
  const campaignId = options?.campaignId ?? 'bruised_banana_residency'

  const nodes: FlowNode[] = []
  const allEvents: string[] = []

  for (const p of passages) {
    const isStart = p.name === startPassage
    const nodeType = getNodeType(p, isStart)
    const emits = extractEmitsFromTags(p.tags)
    allEvents.push(...emits)

    const actions = buildActions(p, nodeType, emits)
    fixActionRequires(actions)

    const node: FlowNode = {
      id: p.name,
      type: nodeType,
      copy: getCopyFromPassage(p),
      actions,
    }

    if (nodeType === 'completion') {
      node.emits = ['quest_completed']
    }
    if (nodeType === 'handoff') {
      node.target_ref = 'dashboard'
    }

    nodes.push(node)
  }

  const completionConditions: CompletionCondition[] = []
  const completionNode = nodes.find((n) => n.type === 'completion')
  const handoffNode = nodes.find((n) => n.type === 'handoff')
  if (completionNode) {
    completionConditions.push({ type: 'node_reached', node_id: completionNode.id })
  }
  if (handoffNode) {
    completionConditions.push({ type: 'node_reached', node_id: handoffNode.id })
    completionConditions.push({ type: 'handoff_triggered' })
  }
  if (completionConditions.length === 0 && completionNode) {
    completionConditions.push({ type: 'node_reached', node_id: completionNode.id })
  }

  const expected_events = [
    'orientation_viewed',
    'prompt_viewed',
    'choice_selected',
    ...new Set(allEvents),
  ].filter((e, i, arr) => arr.indexOf(e) === i)

  return {
    flow_id: flowId,
    campaign_id: campaignId,
    start_node_id: startPassage,
    nodes,
    completion_conditions: completionConditions,
    expected_events,
  }
}
