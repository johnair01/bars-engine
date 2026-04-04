/**
 * Unit tests for resolve-campaign-skin synchronous utilities.
 *
 * These test the non-DB functions: resolveCampaignSkinSync,
 * getDefaultResolvedSkin, extractCssVarDeclarations, generateScopedStyleBlock.
 *
 * The async resolveCampaignSkin() requires a DB connection and should
 * be tested via integration tests.
 *
 * Run: npx tsx src/lib/ui/__tests__/resolve-campaign-skin.test.ts
 */

import {
  resolveCampaignSkinSync,
  getDefaultResolvedSkin,
  extractCssVarDeclarations,
  generateScopedStyleBlock,
  type ResolvedCampaignSkin,
} from '../resolve-campaign-skin'
import { getCampaignSkin } from '../campaign-skin'
import { BB_THEME_DATA, MINIMAL_DARK_THEME_DATA } from '../theme-presets'
import type { ThemeData } from '../build-skin-vars'
import { DEFAULT_BORDER_TOKENS, DEFAULT_DENSITY_TOKENS } from '../campaign-skin-tokens'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

function assertIncludes(str: string, substr: string, message: string): void {
  if (!str.includes(substr)) {
    throw new Error(`FAIL: ${message}\n  Expected to include: "${substr}"\n  Got: "${str}"`)
  }
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
// Tests
// ---------------------------------------------------------------------------

console.log('\nresolveCampaignSkinSync')

test('returns default skin when no theme or static skin', () => {
  const resolved = resolveCampaignSkinSync(null, null)
  assert(typeof resolved.cssProperties === 'object', 'cssProperties should be an object')
  assert(resolved.fontDisplayClass === '', 'fontDisplayClass should be empty string')
  assert(resolved.hasDbTheme === false, 'hasDbTheme should be false')
  assert(resolved.hasStaticSkin === false, 'hasStaticSkin should be false')
})

test('applies static skin when no DB theme', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const resolved = resolveCampaignSkinSync(null, staticSkin)
  const vars = resolved.cssProperties as Record<string, string>
  assert(vars['--cs-bg'] === '#1a1a5e', '--cs-bg should be bruised banana indigo')
  assert(vars['--cs-title'] === '#f0d000', '--cs-title should be pixel yellow')
  assert(resolved.fontDisplayClass === 'font-pixel', 'should use pixel font')
  assert(resolved.hasStaticSkin === true, 'hasStaticSkin should be true')
  assert(resolved.hasDbTheme === false, 'hasDbTheme should be false')
})

test('DB theme overrides static skin values', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const dbTheme: ThemeData = {
    titleColor: '#ff0000',
  }
  const resolved = resolveCampaignSkinSync(dbTheme, staticSkin)
  const vars = resolved.cssProperties as Record<string, string>
  // titleColor override should win
  assert(vars['--cs-title'] === '#ff0000', '--cs-title should be overridden to red')
  // Static skin values should still be present for non-overridden props
  assert(vars['--cs-bg'] === '#1a1a5e', '--cs-bg should remain from static skin')
  assert(resolved.hasDbTheme === true, 'hasDbTheme should be true')
})

test('cssVarOverrides have highest priority', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const dbTheme: ThemeData = {
    titleColor: '#ff0000',
    cssVarOverrides: {
      '--cs-title': '#00ff00',
    },
  }
  const resolved = resolveCampaignSkinSync(dbTheme, staticSkin)
  const vars = resolved.cssProperties as Record<string, string>
  // cssVarOverrides should beat typed column
  assert(vars['--cs-title'] === '#00ff00', '--cs-title should be green (from cssVarOverrides)')
})

test('resolves border tokens with defaults', () => {
  const resolved = resolveCampaignSkinSync(null, null)
  assert(resolved.borderTokens.borderRadius === DEFAULT_BORDER_TOKENS.borderRadius,
    'borderRadius should use default')
  assert(resolved.borderTokens.borderWidth === DEFAULT_BORDER_TOKENS.borderWidth,
    'borderWidth should use default')
})

test('merges partial border tokens with defaults', () => {
  const dbTheme: ThemeData = {
    borderTokens: { borderRadius: '16px' },
  }
  const resolved = resolveCampaignSkinSync(dbTheme, null)
  assert(resolved.borderTokens.borderRadius === '16px', 'borderRadius should be overridden')
  assert(resolved.borderTokens.borderWidth === DEFAULT_BORDER_TOKENS.borderWidth,
    'borderWidth should use default when not overridden')
})

test('resolves density tokens with defaults', () => {
  const resolved = resolveCampaignSkinSync(null, null)
  assert(resolved.densityTokens.contentDensity === 'balanced',
    'contentDensity should default to balanced')
})

test('resolves bgGradient from theme, then static, then default', () => {
  // No theme, no static → default
  const r1 = resolveCampaignSkinSync(null, null)
  assertIncludes(r1.bgGradient, '#1a1a2e', 'default bgGradient should be minimal dark')

  // Static skin → static wins
  const staticSkin = getCampaignSkin('bruised-banana')
  const r2 = resolveCampaignSkinSync(null, staticSkin)
  assertIncludes(r2.bgGradient, '#1a1a5e', 'static skin bgGradient should win')

  // DB theme → DB wins
  const r3 = resolveCampaignSkinSync({ bgGradient: 'linear-gradient(red, blue)' }, staticSkin)
  assert(r3.bgGradient === 'linear-gradient(red, blue)', 'DB theme bgGradient should win')
})

test('resolves font classes from DB theme over static', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const dbTheme: ThemeData = {
    fontDisplayKey: 'space-grotesk',
    fontBodyKey: 'lora',
  }
  const resolved = resolveCampaignSkinSync(dbTheme, staticSkin)
  assert(resolved.fontDisplayClass === 'font-space-grotesk', 'display font should be space-grotesk')
  assert(resolved.fontBodyClass === 'font-lora', 'body font should be lora')
})

test('passes through meta.campaignName when no static skin', () => {
  const resolved = resolveCampaignSkinSync(null, null, { campaignName: 'Test Campaign' })
  assert(resolved.displayName === 'Test Campaign', 'displayName should come from meta')
})

console.log('\ngetDefaultResolvedSkin')

test('returns a valid resolved skin', () => {
  const resolved = getDefaultResolvedSkin()
  const vars = resolved.cssProperties as Record<string, string>
  // Should have MINIMAL_DARK values
  assert(typeof vars['--cs-bg'] === 'string', 'should have --cs-bg')
  assert(resolved.hasDbTheme === true, 'hasDbTheme should be true (MINIMAL_DARK is ThemeData)')
  assert(resolved.hasStaticSkin === false, 'hasStaticSkin should be false')
})

console.log('\nextractCssVarDeclarations')

test('extracts --cs-* vars as semicolon-separated declarations', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const resolved = resolveCampaignSkinSync(null, staticSkin)
  const declarations = extractCssVarDeclarations(resolved)
  assertIncludes(declarations, '--cs-bg: #1a1a5e', 'should include --cs-bg')
  assertIncludes(declarations, '--cs-title: #f0d000', 'should include --cs-title')
  assert(!declarations.includes('undefined'), 'should not contain undefined values')
})

console.log('\ngenerateScopedStyleBlock')

test('wraps declarations in a CSS selector block', () => {
  const staticSkin = getCampaignSkin('bruised-banana')
  const resolved = resolveCampaignSkinSync(null, staticSkin)
  const block = generateScopedStyleBlock(resolved)
  assertIncludes(block, '.campaign-skin {', 'should use default selector')
  assertIncludes(block, '--cs-bg: #1a1a5e', 'should include CSS vars')
  assert(block.endsWith('}'), 'should end with closing brace')
})

test('accepts custom selector', () => {
  const resolved = getDefaultResolvedSkin()
  const block = generateScopedStyleBlock(resolved, '[data-campaign]')
  assertIncludes(block, '[data-campaign] {', 'should use custom selector')
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
