import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { humanoidV1WalkableMetadataSchema } from '../humanoid-v1-walkable'

const root = join(process.cwd(), 'public/sprites/walkable')

for (const base of ['argyra-bold-heart', 'default']) {
  const raw = JSON.parse(readFileSync(join(root, `${base}.json`), 'utf-8'))
  const parsed = humanoidV1WalkableMetadataSchema.safeParse(raw)
  assert.strictEqual(parsed.success, true, `${base}.json should match schema`)
}

console.log('humanoid-v1-walkable-metadata: OK')
