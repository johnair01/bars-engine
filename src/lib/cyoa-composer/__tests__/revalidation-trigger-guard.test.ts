/**
 * Tests for Revalidation Trigger Guard — Combined Condition Logic
 *
 * Validates the core invariant: revalidation fires ONLY when BOTH
 * isAtBranchPoint AND isSessionResume (checkpoint.needsRevalidation) are true.
 *
 * Four possible states:
 *   - Fresh session, any node       → NO revalidation
 *   - Resumed session, linear node  → NO revalidation
 *   - Resumed session, branch point → REVALIDATION
 *   - Fresh session, branch point   → NO revalidation
 *
 * Tests use the pure functions from branch-point-detection.ts which
 * encode the combined condition logic used by useRevalidationTriggerGuard.
 *
 * @see src/hooks/useRevalidationTriggerGuard.ts — React hook wrapper
 * @see src/lib/cyoa-composer/branch-point-detection.ts — pure functions
 */

import assert from 'node:assert'
import {
  shouldRevalidateOnResume,
  detectBranchPoint,
  isBranchPoint,
  classifyNodeById,
  isSelectionStep,
  computeRevalidationChecks,
} from '@/lib/cyoa-composer/branch-point-detection'
import type { CyoaBuildCheckpoint, CyoaBuildState } from '@/lib/cyoa/build-contract'
import { createBuildState, createCheckpoint, markRevalidated } from '@/lib/cyoa/build-contract'
import type { ComposerDataBag } from '@/lib/cyoa-composer/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCheckpoint(needsRevalidation: boolean): CyoaBuildCheckpoint {
  const state = createBuildState({
    buildId: 'test-build',
    campaignRef: 'test-campaign',
    spokeIndex: 0,
  })
  const cp = createCheckpoint(state)
  return needsRevalidation ? cp : markRevalidated(cp)
}

// ---------------------------------------------------------------------------
// shouldRevalidateOnResume — Combined gate
// ---------------------------------------------------------------------------

{
  // CASE 1: No checkpoint → never revalidate (regardless of branch point)
  assert.equal(
    shouldRevalidateOnResume(null, 'Portal_1', 3),
    false,
    'No checkpoint → no revalidation even at branch point',
  )
  assert.equal(
    shouldRevalidateOnResume(null, 'linear_node', 1),
    false,
    'No checkpoint → no revalidation at linear node',
  )
}

{
  // CASE 2: Checkpoint with needsRevalidation: false → never revalidate
  const cp = makeCheckpoint(false)
  assert.equal(
    shouldRevalidateOnResume(cp, 'Portal_1', 3),
    false,
    'Revalidated checkpoint → no revalidation even at branch point',
  )
  assert.equal(
    shouldRevalidateOnResume(cp, 'spoke_entry', 1),
    false,
    'Revalidated checkpoint → no revalidation even at spoke entry',
  )
}

{
  // CASE 3: Checkpoint with needsRevalidation: true + linear node → NO revalidation
  // This is the "resumed session, linear node" case
  const cp = makeCheckpoint(true)
  assert.equal(
    shouldRevalidateOnResume(cp, 'linear_passage', 1),
    false,
    'Needs revalidation but linear node (1 choice) → no revalidation',
  )
  assert.equal(
    shouldRevalidateOnResume(cp, 'some_node', 0),
    false,
    'Needs revalidation but terminal-like node (0 choices) → no revalidation',
  )
  assert.equal(
    shouldRevalidateOnResume(cp, 'terminal_end', 0),
    false,
    'Needs revalidation but terminal node → no revalidation',
  )
}

{
  // CASE 4: Checkpoint with needsRevalidation: true + branch point → REVALIDATION
  // This is the ONLY case where revalidation fires
  const cp = makeCheckpoint(true)

  // Portal fork
  assert.equal(
    shouldRevalidateOnResume(cp, 'Portal_1', 3),
    true,
    'Needs revalidation at Portal fork → REVALIDATE',
  )

  // Room fork
  assert.equal(
    shouldRevalidateOnResume(cp, 'Room_5', 2),
    true,
    'Needs revalidation at Room fork → REVALIDATE',
  )

  // Spoke entry
  assert.equal(
    shouldRevalidateOnResume(cp, 'spoke_entry', 1),
    true,
    'Needs revalidation at spoke entry → REVALIDATE',
  )

  // Choice node with ≥ 2 choices
  assert.equal(
    shouldRevalidateOnResume(cp, 'some_passage', 2),
    true,
    'Needs revalidation at choice node (2 choices) → REVALIDATE',
  )

  // Composer step entry (selection step)
  assert.equal(
    shouldRevalidateOnResume(cp, 'composer_node', 0, 'face_selection'),
    true,
    'Needs revalidation at face_selection composer step → REVALIDATE',
  )

  assert.equal(
    shouldRevalidateOnResume(cp, 'composer_node', 0, 'emotional_checkin'),
    true,
    'Needs revalidation at emotional_checkin composer step → REVALIDATE',
  )

  assert.equal(
    shouldRevalidateOnResume(cp, 'composer_node', 0, 'narrative_template'),
    true,
    'Needs revalidation at narrative_template composer step → REVALIDATE',
  )
}

{
  // Non-selection composer steps are NOT branch points (no meaningful re-decision)
  const cp = makeCheckpoint(true)

  assert.equal(
    shouldRevalidateOnResume(cp, 'composer_node', 0, 'charge_text'),
    false,
    'charge_text is free-text, not a selection → no revalidation',
  )

  assert.equal(
    shouldRevalidateOnResume(cp, 'composer_node', 0, 'confirmation'),
    false,
    'confirmation is review, not a selection → no revalidation',
  )
}

// ---------------------------------------------------------------------------
// detectBranchPoint — Structural + runtime classification
// ---------------------------------------------------------------------------

{
  // Portal nodes
  const result = detectBranchPoint('Portal_1', 3)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'portal_fork')
}

{
  // Room nodes
  const result = detectBranchPoint('Room_2', 2)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'portal_fork')
}

{
  // Spoke entry nodes
  const result = detectBranchPoint('spoke_entry_main', 1)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'spoke_entry')
}

{
  // Choice node (≥ 2 choices, non-structural)
  const result = detectBranchPoint('some_passage', 3)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'choice_node')
}

{
  // Composer step entry (selection step)
  const result = detectBranchPoint('node_x', 0, 'face_selection')
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'composer_step_entry')
}

{
  // Linear passage (1 choice, no structural pattern)
  const result = detectBranchPoint('linear_node', 1)
  assert.equal(result.isBranchPoint, false)
  assert.equal(result.kind, null)
}

{
  // Terminal node
  const result = detectBranchPoint('terminal_end', 0)
  assert.equal(result.isBranchPoint, false)
  assert.equal(result.kind, null)
}

// ---------------------------------------------------------------------------
// isBranchPoint — convenience boolean
// ---------------------------------------------------------------------------

{
  assert.equal(isBranchPoint('Portal_3', 2), true)
  assert.equal(isBranchPoint('linear_node', 1), false)
  assert.equal(isBranchPoint('some_node', 5), true)
  assert.equal(isBranchPoint('node_x', 0, 'face_selection'), true)
  assert.equal(isBranchPoint('node_x', 0, 'charge_text'), false)
}

// ---------------------------------------------------------------------------
// isSelectionStep — classifies which composer steps are branch points
// ---------------------------------------------------------------------------

{
  assert.equal(isSelectionStep('emotional_checkin'), true)
  assert.equal(isSelectionStep('face_selection'), true)
  assert.equal(isSelectionStep('narrative_template'), true)
  assert.equal(isSelectionStep('charge_text'), false)
  assert.equal(isSelectionStep('confirmation'), false)
}

// ---------------------------------------------------------------------------
// computeRevalidationChecks — aspect-level staleness
// ---------------------------------------------------------------------------

{
  // No changes → empty checks
  const bag: ComposerDataBag = {
    dailyCheckInId: 'checkin-1',
    lockedFace: 'REGENT' as any,
    narrativeTemplateId: 'tmpl-1',
  }
  const checks = computeRevalidationChecks(bag, bag)
  assert.equal(checks.length, 0, 'Identical bags → no stale aspects')
}

{
  // Daily check-in changed → emotional_vector stale
  const restored: ComposerDataBag = {
    dailyCheckInId: 'checkin-old',
  }
  const fresh: ComposerDataBag = {
    dailyCheckInId: 'checkin-new',
  }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.ok(
    checks.some((c) => c.aspect === 'emotional_vector' && c.stale),
    'Changed daily check-in → emotional_vector stale',
  )
}

{
  // Face changed → face_availability stale
  const restored: ComposerDataBag = {
    lockedFace: 'REGENT' as any,
  }
  const fresh: ComposerDataBag = {
    lockedFace: 'SAGE' as any,
  }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.ok(
    checks.some((c) => c.aspect === 'face_availability' && c.stale),
    'Changed face → face_availability stale',
  )
}

{
  // Template changed → template_availability stale
  const restored: ComposerDataBag = {
    narrativeTemplateId: 'tmpl-old',
  }
  const fresh: ComposerDataBag = {
    narrativeTemplateId: 'tmpl-new',
  }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.ok(
    checks.some((c) => c.aspect === 'template_availability' && c.stale),
    'Changed template → template_availability stale',
  )
}

// ---------------------------------------------------------------------------
// markRevalidated — clears the flag (integration with trigger guard)
// ---------------------------------------------------------------------------

{
  const cp = makeCheckpoint(true)
  assert.equal(cp.needsRevalidation, true)

  const revalidated = markRevalidated(cp)
  assert.equal(revalidated.needsRevalidation, false, 'markRevalidated clears flag')

  // Original is not mutated
  assert.equal(cp.needsRevalidation, true, 'Original checkpoint unchanged')

  // shouldRevalidateOnResume returns false after marking revalidated
  assert.equal(
    shouldRevalidateOnResume(revalidated, 'Portal_1', 3),
    false,
    'Revalidated checkpoint never triggers revalidation',
  )
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log('✅ revalidation-trigger-guard: all assertions passed')
