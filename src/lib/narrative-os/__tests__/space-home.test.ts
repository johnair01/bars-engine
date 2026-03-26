import assert from 'node:assert'
import { getSpaceHomePayload } from '../space-home'
import { SPACE_IDS } from '../types'

for (const id of SPACE_IDS) {
  const p = getSpaceHomePayload(id)
  assert.strictEqual(p.spaceId, id)
  assert.ok(p.primaryCta.href.startsWith('/'))
  assert.ok(p.destinations.length > 0)
  assert.strictEqual(p.gameMapHash, `space-${id}`)
}

console.log('narrative-os space-home tests ok')
