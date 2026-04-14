/**
 * Tests for CYOA Composer Branch-Point Detection
 *
 * Verifies Sub-AC 1 of AC 11: branch-point detection logic that identifies
 * revalidation-eligible points in the CYOA spoke flow.
 *
 * Tests the pure logic layer — no DB, no server actions.
 * @see src/lib/cyoa-composer/branch-point-detection.ts
 *
 * Run: tsx src/lib/cyoa-composer/__tests__/branch-point-detection.test.ts
 */

import assert from 'node:assert'
import {
  classifyNodeById,
  detectBranchPoint,
  isSelectionStep,
  shouldRevalidateOnResume,
  computeRevalidationChecks,
  isBranchPoint,
} from '../branch-point-detection'
import type { CyoaBuildCheckpoint, CyoaBuildState } from '@/lib/cyoa/build-contract'
import { createBuildState, createCheckpoint, markRevalidated } from '@/lib/cyoa/build-contract'
import type { ComposerDataBag } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCheckpoint(opts?: { needsRevalidation?: boolean }): CyoaBuildCheckpoint {
  const state = createBuildState({
    buildId: 'build_test_1',
    campaignRef: 'camp_test',
    spokeIndex: 0,
  })
  const cp = createCheckpoint(state)
  if (opts?.needsRevalidation === false) {
    return markRevalidated(cp)
  }
  return cp
}

// ---------------------------------------------------------------------------
// classifyNodeById — structural patterns
// ---------------------------------------------------------------------------

{
  console.log('▸ classifyNodeById — Portal_N nodes are portal_fork branch points')
  for (const n of ['Portal_1', 'Portal_2', 'Portal_5', 'Portal_8']) {
    const result = classifyNodeById(n)
    assert.equal(result.isBranchPoint, true, `${n} should be a branch point`)
    assert.equal(result.kind, 'portal_fork', `${n} should be portal_fork`)
  }
}

{
  console.log('▸ classifyNodeById — Room_N nodes are portal_fork branch points')
  for (const n of ['Room_1', 'Room_2', 'Room_10', 'Room_99']) {
    const result = classifyNodeById(n)
    assert.equal(result.isBranchPoint, true, `${n} should be a branch point`)
    assert.equal(result.kind, 'portal_fork', `${n} kind`)
  }
}

{
  console.log('▸ classifyNodeById — spoke entry nodes are spoke_entry branch points')
  for (const n of ['start', 'spoke_entry', 'spoke_entry_0', 'spoke_start_1']) {
    const result = classifyNodeById(n)
    assert.equal(result.isBranchPoint, true, `${n} should be a branch point`)
    assert.equal(result.kind, 'spoke_entry', `${n} kind`)
  }
}

{
  console.log('▸ classifyNodeById — terminal nodes are NOT branch points')
  for (const n of ['terminal', 'gscp_terminal', 'end_node', 'complete_1', 'finish']) {
    const result = classifyNodeById(n)
    assert.equal(result.isBranchPoint, false, `${n} should NOT be a branch point`)
    assert.equal(result.kind, null, `${n} should have null kind`)
  }
}

{
  console.log('▸ classifyNodeById — arbitrary node IDs are not structurally classified')
  for (const n of ['passage_42', 'depth_2_sage', 'node_intro', 'BB_Intro']) {
    const result = classifyNodeById(n)
    assert.equal(result.isBranchPoint, false, `${n} should not be structurally classified`)
  }
}

{
  console.log('▸ classifyNodeById — Portal_0 and Portal_9 do NOT match (only 1-8)')
  assert.equal(classifyNodeById('Portal_0').isBranchPoint, false)
  assert.equal(classifyNodeById('Portal_9').isBranchPoint, false)
}

// ---------------------------------------------------------------------------
// detectBranchPoint — full analysis with choice data
// ---------------------------------------------------------------------------

{
  console.log('▸ detectBranchPoint — structural wins over choice count')
  const result = detectBranchPoint('Portal_3', 0)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'portal_fork')
}

{
  console.log('▸ detectBranchPoint — choice_node for ≥ 2 choices')
  const result = detectBranchPoint('passage_42', 3)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'choice_node')
}

{
  console.log('▸ detectBranchPoint — exactly 2 choices is a branch point')
  const result = detectBranchPoint('some_node', 2)
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'choice_node')
}

{
  console.log('▸ detectBranchPoint — 1 choice is NOT a branch point (linear)')
  const result = detectBranchPoint('passage_10', 1)
  assert.equal(result.isBranchPoint, false)
}

{
  console.log('▸ detectBranchPoint — 0 choices is NOT a branch point')
  const result = detectBranchPoint('passage_10', 0)
  assert.equal(result.isBranchPoint, false)
}

{
  console.log('▸ detectBranchPoint — composer step entry is a branch point')
  const result = detectBranchPoint('node_42', 0, 'face_selection')
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'composer_step_entry')
}

{
  console.log('▸ detectBranchPoint — confirmation step is NOT a branch point')
  const result = detectBranchPoint('node_42', 0, 'confirmation')
  assert.equal(result.isBranchPoint, false)
}

{
  console.log('▸ detectBranchPoint — charge_text step is NOT a branch point')
  const result = detectBranchPoint('node_42', 0, 'charge_text')
  assert.equal(result.isBranchPoint, false)
}

{
  console.log('▸ detectBranchPoint — emotional_checkin IS a branch point')
  const result = detectBranchPoint('node_42', 0, 'emotional_checkin')
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'composer_step_entry')
}

{
  console.log('▸ detectBranchPoint — narrative_template IS a branch point')
  const result = detectBranchPoint('node_42', 0, 'narrative_template')
  assert.equal(result.isBranchPoint, true)
  assert.equal(result.kind, 'composer_step_entry')
}

// ---------------------------------------------------------------------------
// isSelectionStep
// ---------------------------------------------------------------------------

{
  console.log('▸ isSelectionStep — selection steps')
  assert.equal(isSelectionStep('emotional_checkin'), true)
  assert.equal(isSelectionStep('face_selection'), true)
  assert.equal(isSelectionStep('narrative_template'), true)
}

{
  console.log('▸ isSelectionStep — non-selection steps')
  assert.equal(isSelectionStep('charge_text'), false)
  assert.equal(isSelectionStep('confirmation'), false)
}

// ---------------------------------------------------------------------------
// shouldRevalidateOnResume — session resume gate
// ---------------------------------------------------------------------------

{
  console.log('▸ shouldRevalidateOnResume — false when no checkpoint')
  assert.equal(shouldRevalidateOnResume(null, 'Portal_3', 2), false)
}

{
  console.log('▸ shouldRevalidateOnResume — false when needsRevalidation is false')
  const cp = makeCheckpoint({ needsRevalidation: false })
  assert.equal(shouldRevalidateOnResume(cp, 'Portal_3', 2), false)
}

{
  console.log('▸ shouldRevalidateOnResume — true at Portal fork with needsRevalidation')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'Portal_3', 2), true)
}

{
  console.log('▸ shouldRevalidateOnResume — true at choice node (≥2 choices) with needsRevalidation')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'passage_42', 3), true)
}

{
  console.log('▸ shouldRevalidateOnResume — false at linear node (1 choice) even with needsRevalidation')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'passage_42', 1), false)
}

{
  console.log('▸ shouldRevalidateOnResume — true at composer step entry with needsRevalidation')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'node_42', 0, 'face_selection'), true)
}

{
  console.log('▸ shouldRevalidateOnResume — false at confirmation step even with needsRevalidation')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'node_42', 0, 'confirmation'), false)
}

{
  console.log('▸ shouldRevalidateOnResume — false at terminal node')
  const cp = makeCheckpoint({ needsRevalidation: true })
  assert.equal(shouldRevalidateOnResume(cp, 'gscp_terminal', 0), false)
}

// ---------------------------------------------------------------------------
// computeRevalidationChecks — staleness detection
// ---------------------------------------------------------------------------

{
  console.log('▸ computeRevalidationChecks — detects new daily check-in')
  const restored: ComposerDataBag = { dailyCheckInId: 'old_checkin' }
  const fresh: ComposerDataBag = { dailyCheckInId: 'new_checkin' }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.equal(checks.length, 1)
  assert.equal(checks[0].aspect, 'emotional_vector')
  assert.equal(checks[0].stale, true)
}

{
  console.log('▸ computeRevalidationChecks — no staleness when same check-in')
  const restored: ComposerDataBag = { dailyCheckInId: 'same_id' }
  const fresh: ComposerDataBag = { dailyCheckInId: 'same_id' }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.equal(checks.length, 0)
}

{
  console.log('▸ computeRevalidationChecks — detects face change')
  const restored: ComposerDataBag = { lockedFace: 'shaman' }
  const fresh: ComposerDataBag = { lockedFace: 'challenger' }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.ok(checks.some((c) => c.aspect === 'face_availability'))
}

{
  console.log('▸ computeRevalidationChecks — detects template change')
  const restored: ComposerDataBag = { narrativeTemplateId: 'old_template' }
  const fresh: ComposerDataBag = { narrativeTemplateId: 'new_template' }
  const checks = computeRevalidationChecks(restored, fresh)
  assert.ok(checks.some((c) => c.aspect === 'template_availability'))
}

{
  console.log('▸ computeRevalidationChecks — empty when nothing changed')
  const bag: ComposerDataBag = {
    lockedFace: 'shaman',
    dailyCheckInId: 'same',
    narrativeTemplateId: 'same_template',
  }
  const checks = computeRevalidationChecks(bag, bag)
  assert.equal(checks.length, 0)
}

// ---------------------------------------------------------------------------
// isBranchPoint — simple boolean utility
// ---------------------------------------------------------------------------

{
  console.log('▸ isBranchPoint — convenience wrapper matches detectBranchPoint')
  assert.equal(isBranchPoint('Portal_3'), true)
  assert.equal(isBranchPoint('passage_42', 3), true)
  assert.equal(isBranchPoint('passage_42', 1), false)
  assert.equal(isBranchPoint('passage_42', 0), false)
  assert.equal(isBranchPoint('node_42', 0, 'face_selection'), true)
  assert.equal(isBranchPoint('node_42', 0, 'confirmation'), false)
  assert.equal(isBranchPoint('gscp_terminal', 0), false)
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

{
  console.log('▸ Edge case — empty string nodeId is not a branch point')
  assert.equal(isBranchPoint('', 0), false)
}

{
  console.log('▸ Edge case — null composerStep treated as no step')
  assert.equal(isBranchPoint('passage_1', 0, null), false)
  assert.equal(isBranchPoint('passage_1', 0, undefined), false)
}

{
  console.log('▸ Edge case — very high choice count is still a branch point')
  assert.equal(isBranchPoint('passage_1', 100), true)
}

{
  console.log('▸ Edge case — spoke_entry is case-insensitive')
  assert.equal(classifyNodeById('Start').isBranchPoint, true)
  assert.equal(classifyNodeById('START').isBranchPoint, true)
  assert.equal(classifyNodeById('Spoke_Entry').isBranchPoint, true)
}

// ---------------------------------------------------------------------------
// E2E: Session resume revalidation flow
// ---------------------------------------------------------------------------

{
  console.log('▸ E2E — session resume flow: revalidation at branch point only')

  // Player saves mid-session at a linear passage
  const cp = makeCheckpoint({ needsRevalidation: true })

  // Resume at linear node → no revalidation
  assert.equal(shouldRevalidateOnResume(cp, 'passage_5', 1), false)

  // Navigate to a choice node → revalidation fires
  assert.equal(shouldRevalidateOnResume(cp, 'choice_crossroads', 3), true)

  // After revalidation, checkpoint is marked as revalidated
  const revalidated = markRevalidated(cp)
  assert.equal(shouldRevalidateOnResume(revalidated, 'choice_crossroads', 3), false)
}

{
  console.log('▸ E2E — composer step resume flow')

  const cp = makeCheckpoint({ needsRevalidation: true })

  // Resume at face selection (selection step) → revalidation fires
  assert.equal(shouldRevalidateOnResume(cp, 'node_1', 0, 'face_selection'), true)

  // After revalidation complete, no more revalidation
  const done = markRevalidated(cp)
  assert.equal(shouldRevalidateOnResume(done, 'node_1', 0, 'face_selection'), false)
}

console.log('\n✅ All branch-point-detection tests passed')
