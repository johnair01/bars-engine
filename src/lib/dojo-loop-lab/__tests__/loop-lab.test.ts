import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveSupportedElementalTriads } from '@/lib/alchemy/thought-string-triad'
import { resolveDojoActionGrammar } from '../action-grammar'
import { initialLoopLabState, loopLabReducer } from '../state'

const allConfirmed = ['wonder', 'poignance', 'joy'].reduce(
  (state, wordId) => loopLabReducer(state, { type: 'set-anchor', wordId, status: 'confirmed' }),
  initialLoopLabState(),
)
const first = deriveSupportedElementalTriads(allConfirmed.anchors)
assert.equal(first.length, 1)
assert.deepEqual(deriveSupportedElementalTriads([...allConfirmed.anchors].reverse()), first, 'confirmed anchors have a stable EA triad')

for (const status of ['proposed', 'declined'] as const) {
  const state = loopLabReducer(allConfirmed, { type: 'set-anchor', wordId: 'joy', status })
  assert.deepEqual(deriveSupportedElementalTriads(state.anchors), [], `${status} anchors do not derive an overlay`)
}
const removed = loopLabReducer(allConfirmed, { type: 'set-anchor', wordId: 'joy', status: 'proposed' })
assert.equal(removed.projectedTriangleId, 'initial', 'removing confirmation changes only the overlay state')
assert.equal(removed.anchors.find(anchor => anchor.wordId === 'wonder')?.status, 'confirmed')
assert.equal(initialLoopLabState().anchors.some(anchor => anchor.wordId === 'hope'), false, 'hope is never inferred as an EA state from text')

const stableInput = { version: 'v1' as const, lifeLens: 'career' as const, container: 'gathering' as const, allyshipDomain: 'SKILLFUL_ORGANIZING' as const, personalMove: 'grow_up' as const, eaMoveId: 'metal_wood' as const }
assert.deepEqual(resolveDojoActionGrammar(stableInput), resolveDojoActionGrammar(stableInput), 'explicit action grammar is stable')
assert.equal(resolveDojoActionGrammar({ ...stableInput, personalMove: 'show_up' }).actionForms.length, 0, 'mismatched stack has no inferred form')
const expectedForms = [
  ['SKILLFUL_ORGANIZING', 'grow_up', 'bounded_pilot_design'],
  ['GATHERING_RESOURCES', 'open_up', 'witness_invitation'],
  ['RAISE_AWARENESS', 'wake_up', 'pilot_invitation_copy'],
  ['DIRECT_ACTION', 'show_up', 'host_pilot'],
] as const
for (const [allyshipDomain, personalMove, formId] of expectedForms) {
  assert.equal(resolveDojoActionGrammar({ ...stableInput, allyshipDomain, personalMove }).actionForms[0]?.id, formId)
}

const route = readFileSync(new URL('../../../app/dojo/triangle-workshop/loop-lab/loop-lab.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(route, /@\/actions\/dojo-practice|savePractice|exitPractice|createEmber|returnOutcomeToBar/, 'Lab has no persistence action imports or calls')
console.log('dojo loop lab contracts: ok')
