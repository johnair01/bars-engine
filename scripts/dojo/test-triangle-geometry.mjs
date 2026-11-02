import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const html = await readFile(new URL('../../src/app/dojo/triangle-workshop/loop-lab/route.ts', import.meta.url), 'utf8')
for (const id of ['triangle-one', 'triangle-two']) {
  const match = html.match(new RegExp(`id="${id}" points="([^"]+)"`))
  assert.ok(match, `Missing ${id}`)
  const vertices = match[1].trim().split(/\s+/).map(pair => pair.split(',').map(Number))
  assert.equal(vertices.length, 3)
  const lengths = vertices.map((p, i) => Math.hypot(p[0] - vertices[(i + 1) % 3][0], p[1] - vertices[(i + 1) % 3][1]))
  assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-7, `${id} must be equilateral`)
}
console.log('Both full-screen wall triangles are equilateral.')
