import { it, expect } from 'vitest'
import { storesPage } from '../stores-page'
import { demoStores } from '../stores'
it('the live page script parses and posts the call', () => {
  const html = storesPage({ ...demoStores(), demo: false })
  const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1])
  for (const code of m) new Function(code)
  expect(html).toContain('/api/board/gallery/call')
})
