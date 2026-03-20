/**
 * Compile CMA v0 graph → Twee 3 (SugarCube) via twine-authoring IR.
 * @see .specify/specs/cyoa-modular-charge-authoring/ADR-cma-v0.md
 */

import { irToTwee } from '@/lib/twine-authoring-ir/irToTwee'

import type { CmaStory } from './types'
import { cmaStoryToIrNodes } from './cmaStoryToIr'

/**
 * Build Twee source. Does not validate — run `validateQuestGraph` first for author-time checks.
 * Canonical path: CMA → `IRNode[]` → `irToTwee`.
 */
export function cmaStoryToTwee(
  story: CmaStory,
  options?: { title?: string }
): string {
  const nodes = cmaStoryToIrNodes(story)
  return irToTwee(nodes, {
    title: options?.title ?? story.id ?? 'CMA modular story',
    startNode: story.startId,
  })
}
