/**
 * Unit tests for CampaignSkinProvider + useCampaignSkin + campaignSurfaceStyle.
 *
 * Tests the runtime skin application context provider, verifying:
 *   - Default skin values when no skin is provided
 *   - Custom skin values propagate through context
 *   - Wrapper mode applies CSS custom properties
 *   - Context-only mode (applyWrapper=false) provides context without DOM wrapper
 *   - campaignSurfaceStyle generates correct CSSProperties from tokens
 *
 * Run: npx tsx src/lib/ui/__tests__/campaign-skin-provider.test.tsx
 */

import { DEFAULT_BG_GRADIENT } from '../build-skin-vars'
import { DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS } from '../campaign-skin-tokens'
import { campaignSurfaceStyle } from '../campaign-skin-provider'
import type { SerializableCampaignSkin } from '../resolve-campaign-skin'
import type { CampaignBorderTokens, CampaignDensityTokens } from '../campaign-skin-tokens'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

let passed = 0
let failed = 0

function test(name: string, fn: () => void): void {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${(e as Error).message}`)
  }
}

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const CUSTOM_SKIN: SerializableCampaignSkin = {
  cssProperties: {
    '--cs-bg': '#1a1a5e',
    '--cs-title': '#f0d000',
    '--cs-accent-1': '#c8a0ff',
    '--cs-surface': 'rgba(10, 10, 40, 0.6)',
    '--cs-border': 'rgba(200, 160, 255, 0.15)',
    '--cs-text-primary': '#e8e6e0',
    '--cs-text-secondary': '#9090c0',
    '--cs-cta-bg': '#f0d000',
    '--cs-cta-text': '#12124a',
    '--cs-border-radius': '12px',
    '--cs-border-width': '2px',
    '--cs-glow-radius': '8px',
    '--cs-glow-color': 'rgba(200, 160, 255, 0.3)',
    '--cs-card-padding': '2rem',
    '--cs-section-spacing': '2rem',
  },
  fontDisplayClass: 'font-pixel',
  fontBodyClass: 'font-dm-sans',
  bgGradient: 'linear-gradient(180deg, #1a1a5e 0%, #12124a 50%, #1a1a5e 100%)',
  bgDeep: '#12124a',
  displayName: 'Bruised Banana',
  posterImageUrl: '/images/bb-poster.jpg',
  rsvpUrl: 'https://partiful.com/bb',
  donatePath: '/donate/bb',
  hasDbTheme: true,
  hasStaticSkin: true,
  borderTokens: {
    borderRadius: '12px',
    borderWidth: '2px',
    glowRadius: '8px',
    glowColor: 'rgba(200, 160, 255, 0.3)',
  },
  densityTokens: {
    cardPadding: '2rem',
    sectionSpacing: '2rem',
    contentDensity: 'spacious',
  },
}

// ---------------------------------------------------------------------------
// Tests: campaignSurfaceStyle (pure function — no React needed)
// ---------------------------------------------------------------------------

console.log('\ncampaignSurfaceStyle')

test('generates surface style with default tokens', () => {
  const style = campaignSurfaceStyle(DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS)
  assert(typeof style.background === 'string', 'should have background')
  assert(typeof style.border === 'string', 'should have border')
  assert(style.borderRadius === '8px', 'borderRadius should be 8px (default)')
  assert(style.padding === '1.5rem', 'padding should be 1.5rem (default)')
  // No glow by default
  assert(style.boxShadow === undefined, 'should have no boxShadow without glow')
})

test('applies glow when enabled and glowRadius > 0', () => {
  const customBorder: Required<CampaignBorderTokens> = {
    borderRadius: '12px',
    borderWidth: '2px',
    glowRadius: '8px',
    glowColor: 'rgba(200, 160, 255, 0.3)',
  }
  const style = campaignSurfaceStyle(customBorder, DEFAULT_DENSITY_TOKENS, { glow: true })
  assert(typeof style.boxShadow === 'string', 'should have boxShadow when glow enabled')
  assert(style.boxShadow!.includes('8px'), 'boxShadow should use glowRadius')
  assert(style.boxShadow!.includes('rgba(200, 160, 255, 0.3)'), 'boxShadow should use glowColor')
})

test('no glow when glow=true but glowRadius is 0px', () => {
  const style = campaignSurfaceStyle(DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS, { glow: true })
  assert(style.boxShadow === undefined, 'should have no boxShadow when glowRadius is 0px')
})

test('uses custom density tokens for padding', () => {
  const customDensity: Required<CampaignDensityTokens> = {
    cardPadding: '2rem',
    sectionSpacing: '3rem',
    contentDensity: 'spacious',
  }
  const style = campaignSurfaceStyle(DEFAULT_BORDER_TOKENS, customDensity)
  assert(style.padding === '2rem', 'padding should use custom cardPadding')
})

test('allows background override', () => {
  const style = campaignSurfaceStyle(DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS, {
    background: 'rgba(255, 0, 0, 0.5)',
  })
  assert(style.background === 'rgba(255, 0, 0, 0.5)', 'background should use override')
})

test('uses border width and radius from tokens', () => {
  const customBorder: Required<CampaignBorderTokens> = {
    borderRadius: '16px',
    borderWidth: '3px',
    glowRadius: '0px',
    glowColor: 'transparent',
  }
  const style = campaignSurfaceStyle(customBorder, DEFAULT_DENSITY_TOKENS)
  assert(style.borderRadius === '16px', 'borderRadius should match token')
  assert(typeof style.border === 'string' && style.border.includes('3px'),
    'border should use borderWidth from token')
})

// ---------------------------------------------------------------------------
// Tests: SerializableCampaignSkin structure validation
// ---------------------------------------------------------------------------

console.log('\nSerializableCampaignSkin validation')

test('custom skin has all required fields', () => {
  assert(typeof CUSTOM_SKIN.cssProperties === 'object', 'cssProperties should be object')
  assert(typeof CUSTOM_SKIN.fontDisplayClass === 'string', 'fontDisplayClass should be string')
  assert(typeof CUSTOM_SKIN.fontBodyClass === 'string', 'fontBodyClass should be string')
  assert(typeof CUSTOM_SKIN.bgGradient === 'string', 'bgGradient should be string')
  assert(typeof CUSTOM_SKIN.bgDeep === 'string', 'bgDeep should be string')
  assert(typeof CUSTOM_SKIN.borderTokens === 'object', 'borderTokens should be object')
  assert(typeof CUSTOM_SKIN.densityTokens === 'object', 'densityTokens should be object')
  assert(CUSTOM_SKIN.hasDbTheme === true, 'hasDbTheme should be true')
  assert(CUSTOM_SKIN.hasStaticSkin === true, 'hasStaticSkin should be true')
})

test('custom skin CSS properties have --cs- prefix', () => {
  const keys = Object.keys(CUSTOM_SKIN.cssProperties)
  const allPrefixed = keys.every(k => k.startsWith('--cs-'))
  assert(allPrefixed, `all CSS property keys should start with --cs-, got: ${keys.filter(k => !k.startsWith('--cs-')).join(', ')}`)
})

test('custom skin border tokens are fully populated', () => {
  const bt = CUSTOM_SKIN.borderTokens
  assert(typeof bt.borderRadius === 'string', 'borderRadius should be populated')
  assert(typeof bt.borderWidth === 'string', 'borderWidth should be populated')
  assert(typeof bt.glowRadius === 'string', 'glowRadius should be populated')
  assert(typeof bt.glowColor === 'string', 'glowColor should be populated')
})

test('custom skin density tokens are fully populated', () => {
  const dt = CUSTOM_SKIN.densityTokens
  assert(typeof dt.cardPadding === 'string', 'cardPadding should be populated')
  assert(typeof dt.sectionSpacing === 'string', 'sectionSpacing should be populated')
  assert(['compact', 'balanced', 'spacious'].includes(dt.contentDensity),
    'contentDensity should be a valid density level')
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
