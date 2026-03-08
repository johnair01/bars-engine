/**
 * Validate IR story nodes before compile.
 * @see .specify/specs/twine-authoring-ir/spec.md
 */

import type { IRNode } from './types'

const VALID_TYPES = ['passage', 'choice_node', 'informational'] as const

export interface ValidateResult {
  errors: string[]
  warnings: string[]
  valid: boolean
}

/**
 * Validate IR nodes. Returns errors and warnings.
 * valid = errors.length === 0
 */
export function validateIrStory(nodes: IRNode[]): ValidateResult {
  const errors: string[] = []
  const warnings: string[] = []
  const nodeIds = new Set<string>()
  const allTargets = new Set<string>()

  for (const node of nodes) {
    if (!node.node_id || String(node.node_id).trim() === '') {
      errors.push('Empty or missing node_id')
      continue
    }
    const id = String(node.node_id).trim()
    if (nodeIds.has(id)) {
      errors.push(`Duplicate node_id: ${id}`)
    }
    nodeIds.add(id)

    if (node.type && !VALID_TYPES.includes(node.type as (typeof VALID_TYPES)[number])) {
      errors.push(`Invalid type "${node.type}" for node ${id}; must be one of: ${VALID_TYPES.join(', ')}`)
    }

    for (const c of node.choices ?? []) {
      if (c.next_node) allTargets.add(String(c.next_node).trim())
    }
    if (node.next_node) allTargets.add(String(node.next_node).trim())
  }

  for (const target of allTargets) {
    if (target && !nodeIds.has(target)) {
      errors.push(`Missing target: "${target}" (referenced but not defined)`)
    }
  }

  if (nodes.length === 0) {
    errors.push('No nodes provided')
  }

  return {
    errors,
    warnings,
    valid: errors.length === 0,
  }
}
