import assert from 'node:assert'
import { computeSpatialBindKey, computeSpatialLayoutRevision } from '../spatial-room-bind'
import type { AnchorData, TileMapData } from '../pixi-room'

const baseTiles: TileMapData = {
  '1,1': { floor: 'a' },
  '2,2': { floor: 'b' },
}

const baseAnchors: AnchorData[] = [
  {
    id: 'a1',
    anchorType: 'portal',
    tileX: 3,
    tileY: 3,
    label: 'Door',
    linkedId: null,
    linkedType: null,
    config: null,
  },
]

const h1 = computeSpatialLayoutRevision(baseTiles, baseAnchors)
const h2 = computeSpatialLayoutRevision(baseTiles, baseAnchors)
assert.strictEqual(h1, h2, 'same layout → same revision')

const moved: AnchorData[] = [{ ...baseAnchors[0]!, tileX: 4 }]
assert.notStrictEqual(
  computeSpatialLayoutRevision(baseTiles, moved),
  h1,
  'anchor move changes revision',
)

const key1 = computeSpatialBindKey('room-1', baseTiles, baseAnchors)
const key2 = computeSpatialBindKey('room-2', baseTiles, baseAnchors)
assert.notStrictEqual(key1, key2, 'different room id → different bind key')
assert.ok(key1.startsWith('room-1:'), 'bind key prefixes room id')

console.log('spatial-room-bind: ok')
