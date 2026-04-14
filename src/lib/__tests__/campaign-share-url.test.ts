/**
 * Campaign share URL generation — Tests
 *
 * Run with: npx tsx src/lib/__tests__/campaign-share-url.test.ts
 */

import { buildCampaignShareUrl, extractSlugFromShareUrl } from '../campaign-share-url'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function testBuildShareUrl_relative() {
  delete process.env.NEXT_PUBLIC_BASE_URL
  const url = buildCampaignShareUrl('bruised-banana')
  assert(url === '/campaign/bruised-banana', `Expected relative URL, got: ${url}`)
}

function testBuildShareUrl_withBase() {
  process.env.NEXT_PUBLIC_BASE_URL = 'https://bars.example.com'
  const url = buildCampaignShareUrl('my-campaign')
  assert(
    url === 'https://bars.example.com/campaign/my-campaign',
    `Expected full URL, got: ${url}`
  )
  delete process.env.NEXT_PUBLIC_BASE_URL
}

function testBuildShareUrl_encodesSpecialChars() {
  delete process.env.NEXT_PUBLIC_BASE_URL
  const url = buildCampaignShareUrl('hello world')
  assert(url === '/campaign/hello%20world', `Expected encoded URL, got: ${url}`)
}

function testBuildShareUrl_hyphensAndNumbers() {
  delete process.env.NEXT_PUBLIC_BASE_URL
  const url = buildCampaignShareUrl('campaign-2026-spring')
  assert(url === '/campaign/campaign-2026-spring', `Expected hyphenated URL, got: ${url}`)
}

function testExtractSlug_relative() {
  const slug = extractSlugFromShareUrl('/campaign/bruised-banana')
  assert(slug === 'bruised-banana', `Expected 'bruised-banana', got: ${slug}`)
}

function testExtractSlug_fullUrl() {
  const slug = extractSlugFromShareUrl('https://bars.example.com/campaign/my-campaign')
  assert(slug === 'my-campaign', `Expected 'my-campaign', got: ${slug}`)
}

function testExtractSlug_withQueryParams() {
  const slug = extractSlugFromShareUrl('/campaign/test-slug?invite=abc')
  assert(slug === 'test-slug', `Expected 'test-slug', got: ${slug}`)
}

function testExtractSlug_withHash() {
  const slug = extractSlugFromShareUrl('/campaign/test-slug#section')
  assert(slug === 'test-slug', `Expected 'test-slug', got: ${slug}`)
}

function testExtractSlug_decodesEncoded() {
  const slug = extractSlugFromShareUrl('/campaign/hello%20world')
  assert(slug === 'hello world', `Expected 'hello world', got: ${slug}`)
}

function testExtractSlug_nonCampaignUrl() {
  const slug = extractSlugFromShareUrl('/admin/campaigns')
  assert(slug === null, `Expected null for non-campaign URL, got: ${slug}`)
}

function testExtractSlug_emptyString() {
  const slug = extractSlugFromShareUrl('')
  assert(slug === null, `Expected null for empty string, got: ${slug}`)
}

function testRoundTrip() {
  delete process.env.NEXT_PUBLIC_BASE_URL
  const original = 'my-cool-campaign'
  const url = buildCampaignShareUrl(original)
  const extracted = extractSlugFromShareUrl(url)
  assert(extracted === original, `Round-trip failed: ${original} → ${url} → ${extracted}`)
}

function main() {
  testBuildShareUrl_relative()
  testBuildShareUrl_withBase()
  testBuildShareUrl_encodesSpecialChars()
  testBuildShareUrl_hyphensAndNumbers()
  testExtractSlug_relative()
  testExtractSlug_fullUrl()
  testExtractSlug_withQueryParams()
  testExtractSlug_withHash()
  testExtractSlug_decodesEncoded()
  testExtractSlug_nonCampaignUrl()
  testExtractSlug_emptyString()
  testRoundTrip()
  console.log('✅ All campaign-share-url tests passed')
}

main()
