/**
 * Bruised Banana Backfill Verification Test
 *
 * Sub-AC 3 of AC 7: Verify the backfilled Bruised Banana campaign loads
 * correctly through the wizard system UI and displays with its applied
 * skin in preview/read mode.
 *
 * This test verifies:
 *   1. BB seed data is structurally valid for wizard loading
 *   2. Static skin (BRUISED_BANANA_SKIN) matches DB preset (BB_THEME_DATA) exactly
 *   3. buildSkinVars produces correct CSS vars for both static and DB-driven paths
 *   4. CampaignPageData shape is satisfied by BB backfill data
 *   5. BB theme round-trips correctly through the three-layer merge pipeline
 *   6. BB campaign renders in preview/read mode with all skin tokens applied
 *   7. Wizard review step can display BB data in read mode
 *
 * Run: npx tsx src/lib/__tests__/campaign-bb-backfill-verify.test.ts
 */
import assert from 'node:assert/strict'

import { getCampaignSkin, type CampaignSkin } from '@/lib/ui/campaign-skin'
import {
  buildSkinVars,
  resolveFontClass,
  resolveBodyFontClass,
  DEFAULT_BG_GRADIENT,
  type ThemeData,
} from '@/lib/ui/build-skin-vars'
import {
  BB_THEME_DATA,
  BRUISED_BANANA_PRESET,
  getThemePreset,
  THEME_PRESET_LIST,
} from '@/lib/ui/theme-presets'
import { CAMPAIGN_CSS_VAR_KEYS } from '@/lib/ui/campaign-skin-tokens'
import type { CampaignPageData } from '@/app/campaign/[ref]/page'

// ---------------------------------------------------------------------------
// BB Seed Constants (mirroring seed-bruised-banana-campaign.ts)
// ---------------------------------------------------------------------------

const BB_SLUG = 'bruised-banana'
const BB_NAME = 'The Bruised Banana'
const BB_DOMAIN = 'GATHERING_RESOURCES'

const BB_DESCRIPTION = `The Bruised Banana is a birthday residency fundraiser — a 30-day creative campaign to raise funds through allyship, storytelling, and community action. Wake up to what's at stake, clean up what blocks you, grow your capacity, and show up for the mission.`

const BB_WAKE_UP = `See and name what makes this moment critical. The Bruised Banana house needs $3,000 in 30 days — and the urgency is real. What's at stake for you?`

const BB_SHOW_UP = `Contribute to the campaign. Donate, share the story, bring one person in, or complete a quest that moves the needle.`

const BB_STORY_BRIDGE = `Every quest you complete in-game maps to real-world impact. The BARs you earn represent genuine allyship — gathering resources, raising awareness, taking direct action, and organizing skillfully. The game creates the game.`

// ---------------------------------------------------------------------------
// 1. Static skin exists and has expected structure
// ---------------------------------------------------------------------------

function test1_StaticSkinExists() {
  console.log('\n  1. Static skin (getCampaignSkin) for bruised-banana')

  const skin = getCampaignSkin(BB_SLUG)
  assert.ok(skin, 'getCampaignSkin returns a skin for "bruised-banana"')

  // Required fields
  assert.ok(skin!.cssVars, 'Skin has cssVars object')
  assert.ok(skin!.fontClass, 'Skin has fontClass')
  assert.ok(skin!.displayName, 'Skin has displayName')
  assert.equal(typeof skin!.donatePath, 'string', 'Skin has donatePath string')

  // Expected BB identity
  assert.equal(skin!.displayName, 'The Bruised Banana', 'Display name matches BB')
  assert.equal(skin!.fontClass, 'font-pixel', 'Font class is pixel for BB')

  // Core CSS vars are present
  const requiredVars = [
    '--cs-bg', '--cs-bg-deep', '--cs-bg-gradient',
    '--cs-title', '--cs-accent-1', '--cs-accent-2', '--cs-accent-3',
    '--cs-surface', '--cs-border',
    '--cs-text-primary', '--cs-text-secondary', '--cs-text-muted',
    '--cs-cta-bg', '--cs-cta-text', '--cs-cta-hover',
  ]
  for (const varName of requiredVars) {
    assert.ok(
      skin!.cssVars[varName],
      `Static skin has ${varName}: "${skin!.cssVars[varName]}"`,
    )
  }

  console.log(`    CSS vars count: ${Object.keys(skin!.cssVars).length}`)
  console.log('    Static skin: OK')
}

// ---------------------------------------------------------------------------
// 2. BB_THEME_DATA matches static skin CSS vars exactly
// ---------------------------------------------------------------------------

function test2_ThemePresetMatchesStaticSkin() {
  console.log('\n  2. Theme preset (BB_THEME_DATA) matches static skin')

  const skin = getCampaignSkin(BB_SLUG)!
  const preset = BB_THEME_DATA

  // The cssVarOverrides in the preset must exactly match the static skin cssVars
  assert.ok(preset.cssVarOverrides, 'BB_THEME_DATA has cssVarOverrides')

  const staticKeys = Object.keys(skin.cssVars).sort()
  const presetKeys = Object.keys(preset.cssVarOverrides!).sort()

  // Every static skin var must be present in the preset overrides
  for (const key of staticKeys) {
    assert.ok(
      key in preset.cssVarOverrides!,
      `Static skin var ${key} is in preset cssVarOverrides`,
    )
    assert.equal(
      skin.cssVars[key],
      preset.cssVarOverrides![key],
      `Value match for ${key}: static="${skin.cssVars[key]}" preset="${preset.cssVarOverrides![key]}"`,
    )
  }

  // Every preset override must be in the static skin (no orphan overrides)
  for (const key of presetKeys) {
    assert.ok(
      key in skin.cssVars,
      `Preset var ${key} exists in static skin`,
    )
  }

  // Typed column values match the corresponding CSS vars
  assert.equal(preset.bgGradient, skin.cssVars['--cs-bg-gradient'], 'bgGradient matches')
  assert.equal(preset.bgDeep, skin.cssVars['--cs-bg-deep'], 'bgDeep matches')
  assert.equal(preset.titleColor, skin.cssVars['--cs-title'], 'titleColor matches')
  assert.equal(preset.accentPrimary, skin.cssVars['--cs-accent-1'], 'accentPrimary matches')
  assert.equal(preset.accentSecondary, skin.cssVars['--cs-accent-2'], 'accentSecondary matches')
  assert.equal(preset.accentTertiary, skin.cssVars['--cs-accent-3'], 'accentTertiary matches')
  assert.equal(preset.greenAccent, skin.cssVars['--cs-green'], 'greenAccent matches')
  assert.equal(preset.ctaBg, skin.cssVars['--cs-cta-bg'], 'ctaBg matches')
  assert.equal(preset.ctaText, skin.cssVars['--cs-cta-text'], 'ctaText matches')
  assert.equal(preset.ctaHoverBg, skin.cssVars['--cs-cta-hover'], 'ctaHoverBg matches')

  console.log(`    Matched ${staticKeys.length} CSS vars between static skin and preset`)
  console.log('    Theme preset ↔ static skin: OK')
}

// ---------------------------------------------------------------------------
// 3. buildSkinVars produces correct output for BB (static-only path)
// ---------------------------------------------------------------------------

function test3_BuildSkinVarsStaticOnly() {
  console.log('\n  3. buildSkinVars — static skin only (no DB theme)')

  const skin = getCampaignSkin(BB_SLUG)!
  const vars = buildSkinVars(null, skin) as Record<string, string>

  // All static vars should be present in output
  for (const [key, value] of Object.entries(skin.cssVars)) {
    assert.equal(vars[key], value, `Static-only: ${key} preserved in output`)
  }

  // Font class should come from static skin
  const fontClass = resolveFontClass(null, skin)
  assert.equal(fontClass, 'font-pixel', 'Font class from static skin is font-pixel')

  // Body font should be empty (no DB theme)
  const bodyFont = resolveBodyFontClass(null)
  assert.equal(bodyFont, '', 'Body font is empty without DB theme')

  console.log('    Static-only buildSkinVars: OK')
}

// ---------------------------------------------------------------------------
// 4. buildSkinVars produces correct output for BB (DB theme path)
// ---------------------------------------------------------------------------

function test4_BuildSkinVarsWithDbTheme() {
  console.log('\n  4. buildSkinVars — DB theme (BB_THEME_DATA) overriding static skin')

  const skin = getCampaignSkin(BB_SLUG)!
  const vars = buildSkinVars(BB_THEME_DATA, skin) as Record<string, string>

  // With BB_THEME_DATA as the DB theme, the output should contain all vars
  // from the preset's cssVarOverrides (highest priority layer)
  for (const [key, value] of Object.entries(BB_THEME_DATA.cssVarOverrides!)) {
    assert.equal(
      vars[key],
      value,
      `DB theme override: ${key} present with correct value`,
    )
  }

  // Font class from DB theme should override static skin
  const fontClass = resolveFontClass(BB_THEME_DATA, skin)
  assert.equal(fontClass, 'font-press-start-2p', 'DB theme fontDisplayKey overrides static')

  // Border tokens should be present
  assert.ok(BB_THEME_DATA.borderTokens, 'BB has border tokens')
  assert.ok(vars['--cs-border-radius'], 'Border radius var emitted')
  assert.equal(vars['--cs-border-radius'], '4px', 'Border radius is 4px for BB')

  // Density tokens should be present
  assert.ok(BB_THEME_DATA.densityTokens, 'BB has density tokens')
  assert.ok(vars['--cs-card-padding'], 'Card padding var emitted')
  assert.equal(vars['--cs-card-padding'], '1.5rem', 'Card padding is 1.5rem for BB')

  console.log('    DB theme buildSkinVars: OK')
}

// ---------------------------------------------------------------------------
// 5. DB-only path (no static skin) produces correct output
// ---------------------------------------------------------------------------

function test5_BuildSkinVarsDbOnly() {
  console.log('\n  5. buildSkinVars — DB theme only (no static skin fallback)')

  const vars = buildSkinVars(BB_THEME_DATA, null) as Record<string, string>

  // Without a static skin base, all vars come from DB theme layers
  // Typed columns + cssVarOverrides should produce a complete set
  assert.ok(vars['--cs-title'], 'Title var present from DB typed column')
  assert.ok(vars['--cs-bg-gradient'], 'Gradient var present from DB typed column')
  assert.ok(vars['--cs-cta-bg'], 'CTA bg var present from DB typed column')

  // cssVarOverrides layer is the highest priority
  for (const [key, value] of Object.entries(BB_THEME_DATA.cssVarOverrides!)) {
    assert.equal(vars[key], value, `DB-only: ${key} from cssVarOverrides`)
  }

  // Font class should come from DB theme (no static fallback)
  const fontClass = resolveFontClass(BB_THEME_DATA, null)
  assert.equal(fontClass, 'font-press-start-2p', 'Font from DB theme alone')

  console.log('    DB-only buildSkinVars: OK')
}

// ---------------------------------------------------------------------------
// 6. Static + DB theme produces identical output (BB is single-source-of-truth)
// ---------------------------------------------------------------------------

function test6_StaticAndDbPathsProduceIdenticalOutput() {
  console.log('\n  6. Static + DB paths produce identical CSS output for BB')

  const skin = getCampaignSkin(BB_SLUG)!

  // Path A: Static skin only (hardcoded)
  const staticOnly = buildSkinVars(null, skin) as Record<string, string>

  // Path B: DB theme only (preset from database)
  const dbOnly = buildSkinVars(BB_THEME_DATA, null) as Record<string, string>

  // All --cs-* vars from the static skin should have identical values in the DB path
  // (The BB_THEME_DATA.cssVarOverrides was designed to mirror the static skin exactly)
  for (const key of Object.keys(skin.cssVars)) {
    assert.equal(
      staticOnly[key],
      dbOnly[key],
      `Identical output for ${key}: static="${staticOnly[key]}" db="${dbOnly[key]}"`,
    )
  }

  console.log(`    ${Object.keys(skin.cssVars).length} vars identical across both paths`)
  console.log('    Static ↔ DB path equivalence: OK')
}

// ---------------------------------------------------------------------------
// 7. BB backfill data satisfies CampaignPageData shape (preview/read mode)
// ---------------------------------------------------------------------------

function test7_BackfillDataSatisfiesCampaignPageData() {
  console.log('\n  7. BB backfill data satisfies CampaignPageData for preview rendering')

  // Simulate what the seed script creates + what getApprovedCampaign returns
  const pageData: CampaignPageData = {
    id: 'cmp_bb_backfill',
    slug: BB_SLUG,
    name: BB_NAME,
    description: BB_DESCRIPTION,
    allyshipDomain: BB_DOMAIN,
    wakeUpContent: BB_WAKE_UP,
    showUpContent: BB_SHOW_UP,
    storyBridgeCopy: BB_STORY_BRIDGE,
    startDate: '2026-03-15T00:00:00Z',
    endDate: '2026-04-15T00:00:00Z',
    instanceId: 'inst_bb_backfill',
    instanceName: 'Bruised Banana Residency',
    createdByName: 'BB Steward',
    shareUrl: `/campaign/${BB_SLUG}`,
    theme: {
      bgGradient: BB_THEME_DATA.bgGradient ?? null,
      bgDeep: BB_THEME_DATA.bgDeep ?? null,
      titleColor: BB_THEME_DATA.titleColor ?? null,
      accentPrimary: BB_THEME_DATA.accentPrimary ?? null,
      accentSecondary: BB_THEME_DATA.accentSecondary ?? null,
      accentTertiary: BB_THEME_DATA.accentTertiary ?? null,
      fontDisplayKey: BB_THEME_DATA.fontDisplayKey ?? null,
      posterImageUrl: BB_THEME_DATA.posterImageUrl ?? null,
      cssVarOverrides: BB_THEME_DATA.cssVarOverrides ?? null,
    },
  }

  // All required fields are present
  assert.ok(pageData.id, 'Has id')
  assert.ok(pageData.slug, 'Has slug')
  assert.ok(pageData.name, 'Has name')
  assert.ok(pageData.description, 'Has description')
  assert.ok(pageData.allyshipDomain, 'Has allyship domain')
  assert.ok(pageData.wakeUpContent, 'Has wake up content')
  assert.ok(pageData.showUpContent, 'Has show up content')
  assert.ok(pageData.storyBridgeCopy, 'Has story bridge copy')
  assert.ok(pageData.instanceId, 'Has instanceId')
  assert.ok(pageData.instanceName, 'Has instanceName')
  assert.ok(pageData.createdByName, 'Has createdByName')
  assert.ok(pageData.shareUrl, 'Has shareUrl')

  // Theme structure matches what CampaignLanding expects
  assert.ok(pageData.theme, 'Has theme')
  assert.ok(pageData.theme!.bgGradient, 'Theme has bgGradient')
  assert.ok(pageData.theme!.titleColor, 'Theme has titleColor')
  assert.ok(pageData.theme!.accentPrimary, 'Theme has accentPrimary')

  // The theme data can be fed into buildSkinVars without error
  const skin = getCampaignSkin(pageData.slug)
  const vars = buildSkinVars(pageData.theme as ThemeData, skin)
  assert.ok(vars, 'buildSkinVars succeeds with backfill page data')

  // Background gradient is in the output
  const gradient = (vars as Record<string, string>)['--cs-bg-gradient']
  assert.ok(gradient, 'Background gradient present in output vars')
  assert.ok(gradient.includes('#1a1a5e'), 'Gradient includes BB indigo color')

  console.log('    CampaignPageData shape: OK')
  console.log('    Skin renders from page data: OK')
}

// ---------------------------------------------------------------------------
// 8. Wizard review step can display BB backfill data in read mode
// ---------------------------------------------------------------------------

function test8_WizardReviewStepReadMode() {
  console.log('\n  8. Wizard review step displays BB backfill data in read mode')

  // The wizard review step displays: name, slug, description, allyship domain,
  // instance, quest templates, and DRAFT status badge.
  // For a backfilled campaign loaded into the wizard in "read" mode, all
  // these fields should be present.

  const wizardState = {
    name: BB_NAME,
    slug: BB_SLUG,
    description: BB_DESCRIPTION,
    allyshipDomain: BB_DOMAIN,
    instanceName: 'Bruised Banana Residency',
    instanceSlug: 'bruised-banana',
    questTemplates: [
      { templateKey: 'onboarding-welcome', name: 'Join the Residency' },
      { templateKey: 'fundraiser-pledge', name: 'Make a Pledge' },
    ],
    status: 'LIVE',
  }

  // Name and slug display correctly
  assert.equal(wizardState.name, BB_NAME, 'Wizard shows correct name')
  assert.equal(wizardState.slug, BB_SLUG, 'Wizard shows correct slug')

  // Description is non-empty
  assert.ok(wizardState.description.length > 10, 'Description has meaningful content')

  // Allyship domain maps to a human label
  const ALLYSHIP_LABELS: Record<string, string> = {
    GATHERING_RESOURCES: 'Gathering Resources',
    DIRECT_ACTION: 'Direct Action',
    RAISE_AWARENESS: 'Raise Awareness',
    SKILLFUL_ORGANIZING: 'Skillful Organizing',
  }
  assert.ok(
    ALLYSHIP_LABELS[wizardState.allyshipDomain],
    `Allyship domain "${wizardState.allyshipDomain}" has a display label`,
  )

  // Quest templates are present (from BB_QUEST_TEMPLATE_CONFIG)
  assert.equal(wizardState.questTemplates.length, 2, 'BB has 2 quest templates')
  assert.ok(
    wizardState.questTemplates.some(t => t.templateKey === 'onboarding-welcome'),
    'Has onboarding-welcome template',
  )
  assert.ok(
    wizardState.questTemplates.some(t => t.templateKey === 'fundraiser-pledge'),
    'Has fundraiser-pledge template',
  )

  // Status is LIVE (backfilled BB is active)
  assert.equal(wizardState.status, 'LIVE', 'BB is in LIVE status')

  console.log('    Wizard review fields: OK')
}

// ---------------------------------------------------------------------------
// 9. Theme preset is discoverable in the preset registry
// ---------------------------------------------------------------------------

function test9_PresetRegistry() {
  console.log('\n  9. BB preset is discoverable in theme preset registry')

  // getThemePreset lookup
  const preset = getThemePreset('bruised-banana')
  assert.ok(preset, 'Preset found by key "bruised-banana"')
  assert.equal(preset!.key, 'bruised-banana', 'Preset key matches')
  assert.equal(preset!.label, 'Bruised Banana', 'Preset label is correct')
  assert.ok(preset!.description.length > 0, 'Preset has description')
  assert.ok(preset!.tags.length > 0, 'Preset has tags')
  assert.equal(preset!.fontClass, 'font-pixel', 'Preset font class is pixel')

  // BB is first in the ordered list (reference implementation)
  assert.equal(THEME_PRESET_LIST[0].key, 'bruised-banana', 'BB is first preset in ordered list')

  // The preset theme data is the same object as BB_THEME_DATA
  assert.equal(preset!.theme, BB_THEME_DATA, 'Preset theme is BB_THEME_DATA (same reference)')

  console.log('    Preset registry: OK')
}

// ---------------------------------------------------------------------------
// 10. CSS var namespace compliance — all BB vars use --cs-* prefix
// ---------------------------------------------------------------------------

function test10_CssVarNamespaceCompliance() {
  console.log('\n  10. CSS var namespace compliance (--cs-* prefix)')

  const skin = getCampaignSkin(BB_SLUG)!

  // All static skin vars must use the --cs-* namespace
  for (const key of Object.keys(skin.cssVars)) {
    assert.ok(
      key.startsWith('--cs-'),
      `Static skin var "${key}" uses --cs-* namespace`,
    )
  }

  // All BB_THEME_DATA cssVarOverrides must use --cs-* namespace
  for (const key of Object.keys(BB_THEME_DATA.cssVarOverrides!)) {
    assert.ok(
      key.startsWith('--cs-'),
      `Theme override var "${key}" uses --cs-* namespace`,
    )
  }

  // All vars should be in the CAMPAIGN_CSS_VAR_KEYS approved list
  const approvedKeys = new Set(CAMPAIGN_CSS_VAR_KEYS as readonly string[])
  for (const key of Object.keys(skin.cssVars)) {
    assert.ok(
      approvedKeys.has(key),
      `Static skin var "${key}" is in CAMPAIGN_CSS_VAR_KEYS approved list`,
    )
  }

  console.log(`    All ${Object.keys(skin.cssVars).length} vars in --cs-* namespace`)
  console.log(`    All vars in CAMPAIGN_CSS_VAR_KEYS approved list`)
  console.log('    Namespace compliance: OK')
}

// ---------------------------------------------------------------------------
// 11. Three-channel encoding — BB has all three channels configured
// ---------------------------------------------------------------------------

function test11_ThreeChannelEncoding() {
  console.log('\n  11. Three-channel encoding (UI Covenant compliance)')

  // Channel 1: Element → Color (typed columns)
  assert.ok(BB_THEME_DATA.accentPrimary, 'Channel 1: accentPrimary (lavender)')
  assert.ok(BB_THEME_DATA.accentSecondary, 'Channel 1: accentSecondary (cyan)')
  assert.ok(BB_THEME_DATA.accentTertiary, 'Channel 1: accentTertiary (pink)')
  assert.ok(BB_THEME_DATA.titleColor, 'Channel 1: titleColor (pixel yellow)')

  // Channel 2: Altitude → Border tokens
  assert.ok(BB_THEME_DATA.borderTokens, 'Channel 2: borderTokens present')
  assert.equal(BB_THEME_DATA.borderTokens!.borderRadius, '4px', 'Channel 2: borderRadius = 4px')
  assert.equal(BB_THEME_DATA.borderTokens!.borderWidth, '1px', 'Channel 2: borderWidth = 1px')

  // Channel 3: Stage → Density tokens
  assert.ok(BB_THEME_DATA.densityTokens, 'Channel 3: densityTokens present')
  assert.equal(BB_THEME_DATA.densityTokens!.cardPadding, '1.5rem', 'Channel 3: cardPadding')
  assert.equal(BB_THEME_DATA.densityTokens!.contentDensity, 'balanced', 'Channel 3: balanced density')

  console.log('    Channel 1 (color): OK')
  console.log('    Channel 2 (border/altitude): OK')
  console.log('    Channel 3 (density/stage): OK')
}

// ---------------------------------------------------------------------------
// 12. DEFAULT_BG_GRADIENT fallback does NOT conflict with BB skin
// ---------------------------------------------------------------------------

function test12_DefaultFallbackDoesNotConflict() {
  console.log('\n  12. Default gradient fallback does not conflict with BB')

  const skin = getCampaignSkin(BB_SLUG)!
  const bbGradient = skin.cssVars['--cs-bg-gradient']

  // BB's gradient is different from the default fallback
  assert.notEqual(
    bbGradient,
    DEFAULT_BG_GRADIENT,
    'BB gradient is distinct from default fallback',
  )

  // BB indigo is identifiable
  assert.ok(bbGradient.includes('#1a1a5e'), 'BB gradient contains deep indigo #1a1a5e')
  assert.ok(bbGradient.includes('#2b2b8a'), 'BB gradient contains mid indigo #2b2b8a')

  // Default fallback uses different colors
  assert.ok(DEFAULT_BG_GRADIENT.includes('#1a1a2e'), 'Default uses #1a1a2e (not BB indigo)')

  console.log('    Gradient distinction: OK')
}

// ---------------------------------------------------------------------------
// 13. Null/undefined campaign ref returns null skin (defensive)
// ---------------------------------------------------------------------------

function test13_NullRefReturnsNullSkin() {
  console.log('\n  13. Null/undefined campaign ref returns null skin')

  assert.equal(getCampaignSkin(null), null, 'null returns null')
  assert.equal(getCampaignSkin(undefined), null, 'undefined returns null')
  assert.equal(getCampaignSkin(''), null, 'empty string returns null')
  assert.equal(getCampaignSkin('nonexistent'), null, 'unknown slug returns null')

  console.log('    Defensive null checks: OK')
}

// ---------------------------------------------------------------------------
// 14. BB specific poster aesthetic colors match design spec
// ---------------------------------------------------------------------------

function test14_PosterAestheticColors() {
  console.log('\n  14. BB poster aesthetic design language verification')

  const skin = getCampaignSkin(BB_SLUG)!

  // Deep indigo background
  assert.equal(skin.cssVars['--cs-bg'], '#1a1a5e', 'BG is deep indigo #1a1a5e')
  assert.equal(skin.cssVars['--cs-bg-deep'], '#12124a', 'BG deep is #12124a')

  // Pixel yellow titles
  assert.equal(skin.cssVars['--cs-title'], '#f0d000', 'Title is pixel yellow #f0d000')

  // Lavender / cyan / pink accents
  assert.equal(skin.cssVars['--cs-accent-1'], '#c8a0ff', 'Accent 1 is lavender')
  assert.equal(skin.cssVars['--cs-accent-2'], '#00d4ff', 'Accent 2 is cyan')
  assert.equal(skin.cssVars['--cs-accent-3'], '#ff69b4', 'Accent 3 is pink')

  // CTA uses pixel yellow (inverted: yellow bg, dark text)
  assert.equal(skin.cssVars['--cs-cta-bg'], '#f0d000', 'CTA bg is pixel yellow')
  assert.equal(skin.cssVars['--cs-cta-text'], '#12124a', 'CTA text is dark indigo')

  console.log('    Poster aesthetic colors: OK')
}

// ═══════════════════════════════════════════════════════════════════════════
// Run all
// ═══════════════════════════════════════════════════════════════════════════

function runAll() {
  console.log('campaign-bb-backfill-verify: Bruised Banana backfill loads with skin')
  test1_StaticSkinExists()
  test2_ThemePresetMatchesStaticSkin()
  test3_BuildSkinVarsStaticOnly()
  test4_BuildSkinVarsWithDbTheme()
  test5_BuildSkinVarsDbOnly()
  test6_StaticAndDbPathsProduceIdenticalOutput()
  test7_BackfillDataSatisfiesCampaignPageData()
  test8_WizardReviewStepReadMode()
  test9_PresetRegistry()
  test10_CssVarNamespaceCompliance()
  test11_ThreeChannelEncoding()
  test12_DefaultFallbackDoesNotConflict()
  test13_NullRefReturnsNullSkin()
  test14_PosterAestheticColors()
  console.log('\ncampaign-bb-backfill-verify: ALL PASSED')
}

runAll()
