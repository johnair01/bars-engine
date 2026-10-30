import assert from 'node:assert/strict'
import { GrammarError, addWord, buildTriangle, emptyConstellation, extendTriangle, removeTriangle, renameWord, setCharge, triangleById } from '../constellation'
import { SIDE, centroid, edgesOf, equilateralAt, extensionPoints, freeEdgeIndexes, reflect } from '../geometry'
import { commitDraft, extensionFor, ghostFor, nextEmptySlot, type Draft } from '../draft'
import { sanitizeConstellation } from '../validate'
import type { Constellation } from '../types'

const near = (a: number, b: number, msg?: string) => assert.ok(Math.abs(a - b) < 1e-6, msg ?? `${a} ≉ ${b}`)
const throwsGrammar = (fn: () => unknown, re?: RegExp) => assert.throws(fn, (e: unknown) => e instanceof GrammarError && (!re || re.test(e.message)))
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

function wall(labels: string[], charges: number[] = []) {
  let c: Constellation = emptyConstellation('c-lines')
  const ids: string[] = []
  labels.forEach((l, i) => { const r = addWord(c, l, charges[i] ?? 0); c = r.constellation; ids.push(r.word.id) })
  return { c, ids }
}

function testGeometry() {
  const [p0, p1, p2] = equilateralAt(0, 0)
  near(dist(p0, p1), SIDE); near(dist(p1, p2), SIDE); near(dist(p2, p0), SIDE)
  assert.ok(p0.y === p1.y && p2.y < p0.y, 'base first, apex up')
  const r = reflect(p2, p0, p1)
  near(dist(r, p0), SIDE); near(dist(r, p1), SIDE)
  assert.ok(r.y > p0.y, 'the reflection lands on the far side of the line')
  near(centroid([p0, p1, p2]).x, 0)
}

function testExtensionSharesALine() {
  const { c, ids } = wall(['base', 'right', 'left', 'x', 'y'])
  const root = buildTriangle(c, ids.slice(0, 3))
  const ext = extendTriangle(root.constellation, root.triangle.id, ids[1], [ids[3], ids[4]])
  const [a, b] = [root.triangle.points[1], root.triangle.points[2]] // the line "right" runs p1 → p2
  const shared = ext.triangle.points
  // the new triangle's first line is the same two points, reversed, and carries the same word
  assert.deepEqual([shared[0], shared[1]], [b, a])
  assert.equal(ext.triangle.wordIds[0], ids[1])
  near(dist(shared[2], a), SIDE); near(dist(shared[2], b), SIDE)
  assert.ok(dist(centroid(shared), centroid(root.triangle.points)) > SIDE * 0.5, 'it sits beside the parent, not on it')
  // the two new words are the two new lines, in drawing order a→c then c→b
  assert.deepEqual(ext.triangle.wordIds.slice(1), [ids[3], ids[4]])
  const edges = edgesOf(ext.constellation)
  assert.equal(edges.length, 5, 'two triangles share one line: 3 + 3 − 1')
  assert.equal(edges.find(e => e.wordId === ids[1])?.triangleIds.length, 2)
}

function testOneTriangleOnEachSideOfALine() {
  const { c, ids } = wall(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
  const root = buildTriangle(c, ids.slice(0, 3))
  const ext = extendTriangle(root.constellation, root.triangle.id, ids[1], [ids[3], ids[4]])
  throwsGrammar(() => extendTriangle(ext.constellation, root.triangle.id, ids[1], [ids[5], ids[6]]), /already has a triangle/)
  throwsGrammar(() => extendTriangle(ext.constellation, ext.triangle.id, ids[1], [ids[5], ids[6]]), /already has a triangle/)
  assert.deepEqual(freeEdgeIndexes(ext.constellation, triangleById(ext.constellation, root.triangle.id)!), [0, 2])
  // the other lines still branch
  const next = extendTriangle(ext.constellation, root.triangle.id, ids[0], [ids[5], ids[6]])
  assert.equal(next.constellation.triangles.length, 3)
  const [t0, t1, t2] = next.constellation.triangles.map(t => centroid(t.points))
  assert.ok(dist(t0, t1) > 1 && dist(t0, t2) > 1 && dist(t1, t2) > 1)
}

function testStandaloneTrianglesDoNotOverlap() {
  const w9 = wall(["a", "b", "c", "d", "e", "f", "g", "h", "i"])
  const ids = w9.ids
  let c = w9.c
  c = buildTriangle(c, ids.slice(0, 3)).constellation
  c = buildTriangle(c, ids.slice(3, 6)).constellation
  c = buildTriangle(c, ids.slice(6, 9)).constellation
  const cs = c.triangles.map(t => centroid(t.points))
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) assert.ok(dist(cs[i], cs[j]) > SIDE * 0.6)
}

function testRenameAndTakeBack() {
  const { c, ids } = wall(['a', 'b', 'c', 'd', 'e'])
  assert.equal(renameWord(c, ids[0], '  Alpha ').words[0].label, 'Alpha')
  throwsGrammar(() => renameWord(c, ids[0], 'B'), /already/)
  throwsGrammar(() => renameWord(c, ids[0], ' '))
  const root = buildTriangle(c, ids.slice(0, 3))
  const ext = extendTriangle(root.constellation, root.triangle.id, ids[1], [ids[3], ids[4]])
  throwsGrammar(() => removeTriangle(ext.constellation, root.triangle.id), /grew from it/)
  const back = removeTriangle(ext.constellation, ext.triangle.id)
  assert.equal(back.triangles.length, 1)
  assert.equal(back.words.length, 5, 'words stay in the margin')
  assert.equal(edgesOf(back).length, 3)
  // a bridge that touched the removed triangle goes with it
  const charged = setCharge(back, ids[0], -2)
  assert.equal(charged.triangles.length, 1)
}

function testDraftIsBuiltLineByLine() {
  const { c } = wall(['margin'])
  const draft: Draft = { kind: 'new', slots: [null, null, null] }
  assert.equal(nextEmptySlot(draft), 0)
  assert.equal(ghostFor(c, draft)?.length, 3, 'a ghost triangle shows where it will go')
  const full: Draft = { kind: 'new', slots: [{ label: 'Hider' }, { wordId: c.words[0].id }, { label: ' embarrassed ' }] }
  assert.equal(nextEmptySlot(full), -1)
  const done = commitDraft(c, full)
  assert.equal(done.constellation.triangles.length, 1)
  assert.deepEqual(done.constellation.words.map(w => w.label).sort(), ['Hider', 'embarrassed', 'margin'].sort())
  throwsGrammar(() => commitDraft(c, { kind: 'new', slots: [{ label: 'a' }, null, { label: 'b' }] }), /every line/)
  // typing a word that is already on the page reuses it instead of failing
  const again = commitDraft(done.constellation, { kind: 'new', slots: [{ label: 'HIDER' }, { label: 'x' }, { label: 'y' }] })
  assert.equal(again.constellation.words.filter(w => w.label.toLowerCase() === 'hider').length, 1)
  // a bad draft leaves the wall untouched
  throwsGrammar(() => commitDraft(c, { kind: 'new', slots: [{ label: 'a' }, { label: 'A' }, { label: 'b' }] }))
}

function testExtendDraft() {
  const { c, ids } = wall(['a', 'b', 'c'])
  const root = buildTriangle(c, ids)
  const draft: Draft = { kind: 'extend', triangleId: root.triangle.id, anchorWordId: ids[0], slots: [null, null] }
  assert.deepEqual(ghostFor(root.constellation, draft)?.slice(0, 2), extensionPoints(root.triangle, 0).slice(0, 2))
  const done = commitDraft(root.constellation, { ...draft, slots: [{ label: 'x' }, { label: 'y' }] })
  assert.equal(done.triangle.parentTriangleId, root.triangle.id)
  assert.equal(done.triangle.wordIds[0], ids[0])
}

function testWhichTriangleCanGrowAcrossALine() {
  const { c, ids } = wall(['a', 'b', 'c', 'd', 'e'])
  const root = buildTriangle(c, ids.slice(0, 3))
  const edge = (cc: Constellation, wordId: string) => edgesOf(cc).find(e => e.wordId === wordId)!
  assert.equal(extensionFor(root.constellation, edge(root.constellation, ids[1]))?.triangleId, root.triangle.id)
  const ext = extendTriangle(root.constellation, root.triangle.id, ids[1], [ids[3], ids[4]])
  assert.equal(extensionFor(ext.constellation, edge(ext.constellation, ids[1])), null, 'both sides of the shared line are taken')
  assert.equal(extensionFor(ext.constellation, edge(ext.constellation, ids[3]))?.triangleId, ext.triangle.id)
}

function testLegacySaveStillLoads() {
  const { c, ids } = wall(['a', 'b', 'c'])
  const legacy = JSON.parse(JSON.stringify(buildTriangle(c, ids).constellation))
  delete legacy.triangles[0].points
  legacy.triangles[0].x = 40; legacy.triangles[0].y = 50
  const loaded = sanitizeConstellation(legacy)!
  assert.equal(loaded.triangles[0].points.length, 3)
  assert.ok(loaded.triangles[0].points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))
}

for (const t of [testGeometry, testExtensionSharesALine, testOneTriangleOnEachSideOfALine, testStandaloneTrianglesDoNotOverlap,
  testRenameAndTakeBack, testDraftIsBuiltLineByLine, testExtendDraft, testWhichTriangleCanGrowAcrossALine, testLegacySaveStillLoads]) t()
console.log('dojo-practice lines: ok')
