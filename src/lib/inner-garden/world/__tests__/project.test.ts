/**
 * Inner Garden world-representation — the four load-bearing property tests.
 * These prove the design claims WITHOUT any renderer.
 *
 * Run: npx tsx src/lib/inner-garden/world/__tests__/project.test.ts
 */
import assert from 'node:assert'
import { applyOverlay, countSemanticAnchors, projectFarm, projectSharedFarm } from '../project'
import type { FarmOverlay, GardenSeed, OsSnapshot } from '../scene'

// --- fixtures ---

function seed(id: string, over: Partial<GardenSeed> = {}): GardenSeed {
  return {
    id,
    lensId: 'lens-week',
    element: 'water',
    altitude: 'dissatisfied',
    stage: 'seed',
    blocked: false,
    ...over,
  }
}

function baseOs(): OsSnapshot {
  return {
    playerId: 'player-1',
    lenses: [
      { id: 'lens-week', periodKey: 'weekly:2026-W28', title: 'This Week' },
      { id: 'lens-day', periodKey: 'daily:2026-07-12', title: 'Today' },
    ],
    seeds: [
      seed('bar-a'),
      seed('bar-b', { lensId: 'lens-day', element: 'fire', blocked: true }),
      seed('bar-c', { lensId: null, element: null }), // → unsorted plot
    ],
    campaignRefs: ['campaign-x'],
  }
}

// === 1. Determinism =========================================================
{
  const os = baseOs()
  const a = projectFarm('player-1', os)
  const b = projectFarm('player-1', os)
  assert.strictEqual(a.layoutHash, b.layoutHash, 'same inputs → same layoutHash')
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b), 'same inputs → identical scene')

  // Reordering inputs that shouldn't matter does not change the projection.
  const shuffled: OsSnapshot = { ...os, seeds: [...os.seeds].reverse(), lenses: [...os.lenses].reverse() }
  const c = projectFarm('player-1', shuffled)
  assert.strictEqual(a.layoutHash, c.layoutHash, 'input order is irrelevant to layout')

  // A real content change DOES change the hash.
  const changed = projectFarm('player-1', { ...os, seeds: [...os.seeds, seed('bar-d')] })
  assert.notStrictEqual(a.layoutHash, changed.layoutHash, 'adding a BAR changes the hash')
  console.log('  ✓ 1. determinism')
}

// === 2. Semantic safety: overlay cannot remove OS-owned content =============
{
  const scene = projectFarm('player-1', baseOs())
  const semanticBefore = countSemanticAnchors(scene)

  // A hostile overlay: try to "delete" a weed by targeting its id, plus moves + decor.
  const overlay: FarmOverlay = {
    overrides: {
      'bar-b': { cell: { x: 2, y: 2 }, skin: 'golden' }, // the blocked seed + its weed
      'lens-week': { cell: { x: 3, y: 3 } },
      'nonexistent-id': { cell: { x: 9, y: 9 } }, // orphan → ignored, no crash
    },
    decorations: [{ id: 'fence-1', kind: 'fence', cell: { x: 4, y: 4 } }],
  }
  const after = applyOverlay(overlay, scene)

  assert.strictEqual(
    countSemanticAnchors(after),
    semanticBefore,
    'overlay never removes a semantic anchor',
  )
  // Every semantic anchor id survives.
  const idsBefore = scene.anchors.filter(a => a.linkedType).map(a => a.id).sort()
  const idsAfter = new Set(after.anchors.map(a => a.id))
  for (const id of idsBefore) assert.ok(idsAfter.has(id), `semantic anchor ${id} survives overlay`)
  // The weed is still present even though its owning seed was targeted.
  assert.ok(after.anchors.some(a => a.id === 'weed:bar-b'), 'weed survives (dies only by Cleaning)')
  // Decoration was added.
  assert.ok(after.anchors.some(a => a.anchorType === 'decoration'), 'decoration added')
  console.log('  ✓ 2. semantic safety')
}

// === 3. Append-stability: adding an entity never moves existing ones ========
{
  const os = baseOs()
  const before = projectFarm('player-1', os)
  const cellOf = (s: typeof before, id: string) => {
    const a = s.anchors.find(x => x.id === id)!
    return `${a.tileX},${a.tileY}`
  }
  const seedCellBefore = cellOf(before, 'seed:bar-a')
  const fieldCellBefore = cellOf(before, 'field:lens-week')

  // Add a new seed AND a new lens.
  const grown: OsSnapshot = {
    ...os,
    seeds: [...os.seeds, seed('bar-new', { lensId: 'lens-week' })],
    lenses: [...os.lenses, { id: 'lens-month', periodKey: 'monthly:2026-07', title: 'This Month' }],
  }
  const after = projectFarm('player-1', grown)

  assert.strictEqual(cellOf(after, 'seed:bar-a'), seedCellBefore, 'existing seed does not move')
  assert.strictEqual(cellOf(after, 'field:lens-week'), fieldCellBefore, 'existing field does not move')
  assert.ok(after.anchors.some(a => a.id === 'seed:bar-new'), 'new seed appended')
  assert.ok(after.anchors.some(a => a.id === 'field:lens-month'), 'new field appended')
  console.log('  ✓ 3. append-stability')
}

// === 4. Scale smoke: 1000 farms, no stored maps, bounded + deterministic ====
{
  const start = Date.now()
  let totalAnchors = 0
  let maxAnchors = 0
  const seeds: GardenSeed[] = Array.from({ length: 12 }, (_, i) => seed(`bar-${i}`))
  const os: OsSnapshot = { ...baseOs(), seeds }

  for (let i = 0; i < 1000; i++) {
    const scene = projectFarm(`player-${i}`, { ...os, playerId: `player-${i}` })
    totalAnchors += scene.anchors.length
    maxAnchors = Math.max(maxAnchors, scene.anchors.length)
    // Nothing is persisted — the scene is a pure in-memory value (no I/O by construction).
  }
  const ms = Date.now() - start

  assert.ok(maxAnchors < 200, `per-farm anchors bounded (max ${maxAnchors})`)
  assert.ok(ms < 5000, `1000 farms projected in bounded time (${ms}ms)`)

  // Shared farm uses the same IR.
  const commons = projectSharedFarm('campaign-x')
  assert.ok(commons.anchors.length > 0 && commons.layoutHash.length === 8, 'shared farm is a FarmScene')
  assert.strictEqual(
    projectSharedFarm('campaign-x').layoutHash,
    commons.layoutHash,
    'shared farm is deterministic too',
  )
  console.log(`  ✓ 4. scale smoke (1000 farms, ${ms}ms, max ${maxAnchors} anchors/farm, 0 stored maps)`)
}

console.log('inner-garden/world: all property tests passed ✓')
