import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  GrammarError, addBridge, addWord, buildTriangle, emptyConstellation, eighthRayShift, extendTriangle, setCharge,
  trianglesHolding, triangleCharge, triangleById, undoShift, project, returnToWall, emptyPractice,
} from '../constellation'
import { TUTORIAL_STEPS, emptyTutorialLog, learningPractice, makeThisMine } from '../tutorial'
import { barContext, cleanArrival, entryChoices, exitsFor, makeEmber, modeLabel, returnOutcome } from '../lifecycle'
import type { Constellation } from '../types'

const throwsGrammar = (fn: () => unknown, re?: RegExp) => assert.throws(fn, (e: unknown) => e instanceof GrammarError && (!re || re.test(e.message)))

function wall(labels: string[], charges: number[] = []) {
  let c: Constellation = emptyConstellation('c-test')
  const ids: string[] = []
  labels.forEach((l, i) => { const r = addWord(c, l, charges[i] ?? 0); c = r.constellation; ids.push(r.word.id) })
  return { c, ids }
}

function testWordsAndCharge() {
  const { c, ids } = wall(['a', 'b', 'c'], [-2, 0, 5])
  assert.equal(c.words[2].charge, 3, 'charge clamps to +3')
  throwsGrammar(() => addWord(c, '  A '), /already/)
  throwsGrammar(() => addWord(c, '   '))
  const c2 = setCharge(c, ids[0], -9)
  assert.equal(c2.words[0].charge, -3)
  assert.equal(c2.history.length, 1)
  assert.equal(setCharge(c2, ids[0], -3), c2, 'no change, no history')
}

function testTrianglesNeedExactlyThree() {
  const { c, ids } = wall(['a', 'b', 'c', 'd'])
  throwsGrammar(() => buildTriangle(c, ids.slice(0, 2)))
  throwsGrammar(() => buildTriangle(c, ids))
  throwsGrammar(() => buildTriangle(c, [ids[0], ids[0], ids[1]]))
  throwsGrammar(() => buildTriangle(c, [ids[0], ids[1], 'nope']))
  const { triangle } = buildTriangle(c, ids.slice(0, 3))
  assert.equal(triangle.wordIds.length, 3)
}

function testExtensionSharesTheWordObject() {
  const w = wall(['a', 'b', 'c', 'd', 'e', 'f'], [-1, -1, -1])
  const ids = w.ids
  let c = w.c
  const root = buildTriangle(c, ids.slice(0, 3)); c = root.constellation
  throwsGrammar(() => extendTriangle(c, root.triangle.id, ids[3], [ids[4], ids[5]]), /one of the selected/)
  throwsGrammar(() => extendTriangle(c, root.triangle.id, ids[0], [ids[4]]), /exactly two/)
  throwsGrammar(() => extendTriangle(c, root.triangle.id, ids[0], [ids[0], ids[4]]), /shared word/)
  throwsGrammar(() => extendTriangle(c, root.triangle.id, ids[0], [ids[4], ids[4]]))
  const ext = extendTriangle(c, root.triangle.id, ids[1], [ids[4], ids[5]]); c = ext.constellation
  assert.equal(ext.triangle.wordIds[0], ids[1], 'same word id, not a copy')
  assert.equal(c.words.length, 6, 'no new word objects for the anchor')
  assert.equal(ext.triangle.parentTriangleId, root.triangle.id)
  assert.equal(trianglesHolding(c, ids[1]).length, 2)
  // grows outward: the anchor is corner 1 (lower right), so the new triangle sits to the lower right of its parent
  assert.ok(ext.triangle.x > root.triangle.x && ext.triangle.y > root.triangle.y)
  // branching from any word works, and nothing extends on its own
  assert.equal(c.triangles.length, 2)
}

function testChargePropagatesThroughSharedWord() {
  const w = wall(['a', 'b', 'c', 'd', 'e'], [-1, 1, 2, 3, 0])
  const ids = w.ids
  let c = w.c
  const root = buildTriangle(c, ids.slice(0, 3)); c = root.constellation
  const ext = extendTriangle(c, root.triangle.id, ids[1], [ids[3], ids[4]]); c = ext.constellation
  const t1 = () => triangleCharge(c, triangleById(c, root.triangle.id)!)
  const t2 = () => triangleCharge(c, triangleById(c, ext.triangle.id)!)
  assert.equal(t1(), 2); assert.equal(t2(), 4)
  c = setCharge(c, ids[1], -3)
  assert.equal(t1(), -2); assert.equal(t2(), 0, 'both triangles read the shared word')
}

function testEighthRay() {
  const w = wall(['a', 'b', 'c', 'd', 'e', 'f'], [-2, -1, 0, 2, 2, 2])
  const ids = w.ids
  let c = w.c
  const neg = buildTriangle(c, ids.slice(0, 3)); c = neg.constellation
  const pos = buildTriangle(c, ids.slice(3, 6)); c = pos.constellation
  throwsGrammar(() => eighthRayShift(c, neg.triangle.id, ids[0], { paused: false }), /pause/)
  throwsGrammar(() => eighthRayShift(c, pos.triangle.id, ids[3], { paused: true }), /negative/)
  throwsGrammar(() => eighthRayShift(c, neg.triangle.id, ids[3], { paused: true }), /own words/)
  throwsGrammar(() => eighthRayShift(c, neg.triangle.id, ids[2], { paused: true }), /charged words/)
  const after = eighthRayShift(c, neg.triangle.id, ids[0], { paused: true })
  assert.equal(after.words[0].charge, -1)
  assert.equal(after.history.at(-1)?.kind, 'eighth_ray')
  assert.equal(after.triangles.length, c.triangles.length, 'replaces and clears nothing')
  const undone = undoShift(after, after.history.at(-1)!.id)
  assert.equal(undone.words[0].charge, -2, 'reversible')
  throwsGrammar(() => undoShift(undone, after.history.at(-1)!.id), /already/)
  // a later change to the same word blocks an out-of-order undo
  const moved = setCharge(after, ids[0], 2)
  throwsGrammar(() => undoShift(moved, after.history.at(-1)!.id), /moved/)
}

function testBridgeKeepsBothPatterns() {
  const w = wall(['a', 'b', 'c', 'd', 'e', 'f'], [-2, -1, 0, 2, 2, 2])
  const ids = w.ids
  let c = w.c
  const neg = buildTriangle(c, ids.slice(0, 3)); c = neg.constellation
  const pos = buildTriangle(c, ids.slice(3, 6)); c = pos.constellation
  throwsGrammar(() => addBridge(c, pos.triangle.id, neg.triangle.id, 'x'), /charged/)
  throwsGrammar(() => addBridge(c, neg.triangle.id, pos.triangle.id, '  '))
  const b = addBridge(c, neg.triangle.id, pos.triangle.id, 'A small invitation is safe enough')
  assert.deepEqual(b.words, c.words, 'the charged pattern is not erased')
  assert.equal(b.bridges.length, 1)
}

function testProjection() {
  const p = learningPractice()
  const t = p.constellation.triangles[0]
  const on = project(p, t.id)
  assert.equal(on.projectedTriangleId, t.id)
  assert.equal(returnToWall(on).projectedTriangleId, null)
  throwsGrammar(() => project(p, 'missing'))
}

function testTutorialIsolation() {
  const a = learningPractice(), b = learningPractice()
  assert.notEqual(a.constellation.id, b.constellation.id)
  assert.equal(a.constellation.triangles.length, 1)
  assert.equal(a.constellation.words.length, b.constellation.words.length, 'restart gives the same wall')
  const mine = makeThisMine()
  assert.deepEqual([mine.constellation.words, mine.constellation.triangles, mine.constellation.history], [[], [], []])
  assert.notEqual(mine.constellation.id, a.constellation.id)
  // The tutorial module can reach nothing that writes: its imports are the pure grammar and the types.
  const src = readFileSync(path.join(__dirname, '..', 'tutorial.ts'), 'utf8')
  const imports = [...src.matchAll(/from '([^']+)'/g)].map(m => m[1])
  assert.deepEqual(imports.sort(), ['./constellation', './types'])
  // Tutorial steps read state; none can fail the learner.
  assert.equal(TUTORIAL_STEPS.length, 7)
  assert.equal(TUTORIAL_STEPS.filter(s => s.seen(a, a, emptyTutorialLog())).length, 0)
  const done = TUTORIAL_STEPS.find(s => s.id === 'return')!
  assert.ok(done.seen(a, a, { projected: true, returned: true }))
}

function testEntryAndLifecycle() {
  assert.deepEqual(entryChoices({ barCount: 0 }).map(c => c.route), ['learn', 'alive', 'make'])
  assert.deepEqual(entryChoices({ barCount: 2 }).map(c => c.route), ['learn', 'alive', 'make', 'bar'])
  assert.equal(modeLabel({ kind: 'tutorial' }), 'Learning constellation')
  assert.equal(modeLabel({ kind: 'seed', seedId: 's' }), 'Private practice')
  assert.equal(modeLabel({ kind: 'incipient_bar', draftId: 'd' }), 'Drafting a BAR')
  assert.equal(modeLabel({ kind: 'bar', barId: 'b' }, 'Garden shed'), 'Working: Garden shed')
  const has = (ctx: Parameters<typeof exitsFor>[0], id: string) => exitsFor(ctx).some(e => e.id === id)
  assert.ok(has({ kind: 'seed', seedId: 's' }, 'discard') && has({ kind: 'seed', seedId: 's' }, 'settle') && has({ kind: 'seed', seedId: 's' }, 'plant_bar'))
  assert.ok(has({ kind: 'incipient_bar', draftId: 'd' }, 'keep_drafting') && has({ kind: 'incipient_bar', draftId: 'd' }, 'plant_bar'))
  assert.ok(has({ kind: 'bar', barId: 'b' }, 'return_bar') && has({ kind: 'bar', barId: 'b' }, 'settle'))
  for (const ctx of [{ kind: 'tutorial' }, { kind: 'seed', seedId: 's' }, { kind: 'incipient_bar', draftId: 'd' }, { kind: 'bar', barId: 'b' }] as const) {
    assert.ok(has(ctx, 'return_nook'), `${ctx.kind} can always leave`)
    for (const e of exitsFor(ctx)) assert.doesNotMatch(e.label, /pass|complete|heal|fail/i)
  }
  assert.deepEqual(barContext({ id: 'b', title: 'T', emotionalAlchemyTag: 'Fire' }), { id: 'b', title: 'T', element: 'fire' })
  assert.deepEqual(barContext({ id: 'b', title: 'T', emotionalAlchemyTag: 'grief' }), { id: 'b', title: 'T' })
  assert.deepEqual(cleanArrival({}), {}, 'arrival gates nothing')
  assert.deepEqual(cleanArrival({ intention: ' hi ', platform: ['a', ' ', 'b', 'c', 'd'] }), { intention: 'hi', platform: ['a', 'b', 'c'] })
}

function testEmbersAndOutcomes() {
  assert.throws(() => makeEmber({ ctx: { kind: 'tutorial' }, sourceId: 'x', settled: true }), /no embers/)
  assert.throws(() => makeEmber({ ctx: { kind: 'seed', seedId: 's' }, sourceId: 's', settled: false }), /settle/)
  const e = makeEmber({ ctx: { kind: 'seed', seedId: 's' }, sourceId: 's', settled: true, intensity: 2, element: 'wood', ingredients: ['Laughter', ' '] })
  assert.equal(e.status, 'held'); assert.equal(e.sourceKind, 'practice_seed'); assert.deepEqual(e.selectedIngredients, ['Laughter'])
  const link = returnOutcome({ barId: 'b', constellationId: 'c', selectedOutcomes: [] }, 'next_move', ' Ask Sam ')
  assert.equal(link.selectedOutcomes[0].summary, 'Ask Sam')
  assert.throws(() => returnOutcome(link, 'next_move', ' '))
  assert.equal(emptyPractice().constellation.words.length, 0)
}

for (const t of [testWordsAndCharge, testTrianglesNeedExactlyThree, testExtensionSharesTheWordObject, testChargePropagatesThroughSharedWord,
  testEighthRay, testBridgeKeepsBothPatterns, testProjection, testTutorialIsolation, testEntryAndLifecycle, testEmbersAndOutcomes]) t()
console.log('dojo-practice: ok')

import { sanitizeConstellation } from '../validate'
function testSanitize() {
  const { c, ids } = wall(['a', 'b', 'c'], [-2, 9, 0])
  const t = buildTriangle(c, ids).constellation
  assert.deepEqual(sanitizeConstellation(JSON.parse(JSON.stringify(t)))?.words.map(w => w.charge), [-2, 3, 0])
  const bad = JSON.parse(JSON.stringify(t))
  bad.triangles.push({ id: 'x', wordIds: [ids[0], ids[0], ids[1]], x: 1, y: 1 }, { id: 'y', wordIds: [ids[0], ids[1], 'ghost'], x: 1, y: 1 }, { id: 'z', wordIds: [ids[0], ids[1]], x: 1, y: 1 })
  assert.equal(sanitizeConstellation(bad)?.triangles.length, 1, 'malformed triangles are dropped')
  assert.equal(sanitizeConstellation('nope'), null)
}
testSanitize()
console.log('dojo-practice validate: ok')
