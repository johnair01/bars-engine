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

  // SCL-B6: site-signal smoke — cert triage can reference spec path in message body
  const scl = siteSignalInputSchema.safeParse({
    pageUrl: 'http://localhost:3000/campaign/hub?ref=bruised-banana',
    pathname: '/campaign/hub',
    search: '?ref=bruised-banana',
    message:
      'SCL site-signal-card-club-chs-portal-bar-journey: hub → landing → Wake path + PostWake library CTAs OK after deploy.',
  })
  assert(scl.success, 'SCL-shaped site-signal payload parses')
  if (scl.success) {
    const block = formatSiteSignalFeedbackBlock(scl.data)
    assert(
      block.includes('site-signal-card-club-chs-portal-bar-journey'),
      'spec id in formatted block for triage',
    )
  }

  const badImage = siteSignalInputSchema.safeParse({
    pageUrl: 'http://localhost:3000/foo',
    pathname: '/foo',
    message: 'ok',
    imageUrl: 'https://evil.example.com/phish.png',
  })
  assert(!badImage.success, 'reject non-blob imageUrl')

  const blobUrl = 'https://abc.public.blob.vercel-storage.com/signal-feedback/p/1.png'
  const withImg = siteSignalInputSchema.safeParse({
    pageUrl: 'http://localhost:3000/foo',
    pathname: '/foo',
    message: 'screen',
    imageUrl: blobUrl,
  })
  assert(withImg.success, 'accept Vercel Blob imageUrl')
  if (withImg.success) {
    const block = formatSiteSignalFeedbackBlock(withImg.data)
    assert(block.includes('--- Screenshot ---'), 'screenshot section')
    assert(block.includes(blobUrl), 'image url in block')
  }

   
  console.log('site-signal-schema tests passed')
}

run()
