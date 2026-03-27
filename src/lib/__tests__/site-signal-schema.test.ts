/**
 * Run: npx tsx src/lib/__tests__/site-signal-schema.test.ts
 */

import { formatSiteSignalFeedbackBlock, siteSignalInputSchema } from '@/lib/feedback/site-signal-schema'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const ok = siteSignalInputSchema.safeParse({
    pageUrl: 'http://localhost:3000/foo',
    pathname: '/foo',
    search: '?x=1',
    hash: '#a',
    documentTitle: ' Test ',
    message: ' Broken ',
  })
  assert(ok.success, 'valid payload')
  if (ok.success) {
    const block = formatSiteSignalFeedbackBlock({ ...ok.data, isAdmin: true })
    assert(block.includes('[admin]'), 'admin prefix')
    assert(block.includes('pageUrl: http://localhost:3000/foo'), 'url line')
    assert(block.includes('What felt wrong'), 'section')
    assert(block.includes('Broken'), 'trimmed message')
  }

  const bad = siteSignalInputSchema.safeParse({
    pageUrl: '',
    pathname: '/',
    message: '',
  })
  assert(!bad.success, 'reject empty')

  // eslint-disable-next-line no-console -- test runner
  console.log('site-signal-schema tests passed')
}

run()
