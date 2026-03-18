/**
 * Validates flow JSON against the flow schema before simulation.
 * Agents must validate fixtures before run; use deterministic IDs.
 * @see docs/simulation/flow-json-schema.md
 */

import type { FlowJSON, FlowNode } from './types'

export interface ValidationError {
  path: string
  message: string
}

/**
 * Validates flow JSON structure. Returns empty array if valid.
 */
export function validateFlowSchema(flow: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (!flow || typeof flow !== 'object') {
    errors.push({ path: '', message: 'flow must be an object' })
    return errors
  }

  const f = flow as Record<string, unknown>

  if (typeof f.flow_id !== 'string' || !f.flow_id) {
    errors.push({ path: 'flow_id', message: 'flow_id must be a non-empty string' })
  }

  if (typeof f.start_node_id !== 'string' || !f.start_node_id) {
    errors.push({ path: 'start_node_id', message: 'start_node_id must be a non-empty string' })
  }

  if (!Array.isArray(f.nodes)) {
    errors.push({ path: 'nodes', message: 'nodes must be an array' })
  } else {
    const nodes = f.nodes as FlowNode[]
    const nodeIds = new Set(nodes.map((nn) => nn?.id).filter(Boolean) as string[])
    const ids = new Set<string>()
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      if (!n || typeof n !== 'object') {
        errors.push({ path: `nodes[${i}]`, message: 'node must be an object' })
        continue
      }
      if (typeof n.id !== 'string' || !n.id) {
        errors.push({ path: `nodes[${i}].id`, message: 'node.id must be a non-empty string' })
      } else if (ids.has(n.id)) {
        errors.push({ path: `nodes[${i}].id`, message: `duplicate node id: ${n.id}` })
      } else {
        ids.add(n.id)
      }
      if (typeof n.type !== 'string' || !n.type) {
        errors.push({ path: `nodes[${i}].type`, message: 'node.type must be a non-empty string' })
      }
      if (!Array.isArray(n.actions)) {
        errors.push({ path: `nodes[${i}].actions`, message: 'node.actions must be an array' })
      } else {
        for (let j = 0; j < n.actions.length; j++) {
          const a = n.actions[j]
          if (a && typeof a === 'object' && a.next_node_id && typeof a.next_node_id === 'string') {
            if (!nodeIds.has(a.next_node_id)) {
              errors.push({
                path: `nodes[${i}].actions[${j}].next_node_id`,
                message: `next_node_id "${a.next_node_id}" references non-existent node`,
              })
            }
          }
        }
      }
    }

    if (f.start_node_id && typeof f.start_node_id === 'string') {
      const startExists = nodes.some((nn) => nn.id === f.start_node_id)
      if (!startExists) {
        errors.push({
          path: 'start_node_id',
          message: `start_node_id "${f.start_node_id}" not found in nodes`,
        })
      }
    }
  }

  return errors
}

/**
 * Type guard: returns true if flow passes validation.
 */
export function isValidFlow(flow: unknown): flow is FlowJSON {
  return validateFlowSchema(flow).length === 0
}
