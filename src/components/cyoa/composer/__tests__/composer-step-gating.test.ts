/**
 * Composer Step Gating — Integration Test
 *
 * Validates that the ComposerStepRenderer's gating consumption pattern
 * correctly filters branches. Since this is a pure-logic test (no React DOM),
 * we test the filtering + data flow that the renderer depends on.
 *
 * The renderer renders ONLY visible branches — this test proves that the
 * gating pipeline (computeFilteredOptions → getVisibleFaces/Templates)
 * produces the correct visible subset for each step.
 *
 * @see src/components/cyoa/composer/ComposerStepRenderer.tsx
 * @see src/hooks/useComposerGating.ts
 */

import assert from 'node:assert'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { ComposerDataBag } from '@/lib/cyoa-composer/types'
import type { TemplateCatalogEntry, CampaignBranchConfig } from '@/lib/cyoa-composer/branch-visibility'
import {
  computeFilteredOptions,
  getVisibleFaces,
  getVisibleTemplates,
  getAutoResolvedValue,
  sortFacesByAffinity,
} from '@/lib/cyoa-composer/branch-visibility'
import { resolveAdaptiveSteps } from '@/lib/cyoa-composer/adaptive-resolver'

// ---------------------------------------------------------------------------
// Shared catalog for all tests
// ---------------------------------------------------------------------------

const CATALOG: TemplateCatalogEntry[] = [
  {
    templateKey: 'hero-journey',
    templateKind: 'quest',
    label: 'Hero Journey',
    compatibleFaces: ['shaman', 'challenger'],
    compatibleChannels: [],
  },
  {
    templateKey: 'community-build',
    templateKind: 'quest',
    label: 'Community Build',
    compatibleFaces: ['regent', 'diplomat'],
    compatibleChannels: [],
  },
  {
    templateKey: 'universal-path',
    templateKind: 'quest',
    label: 'Universal Path',
    compatibleFaces: [],
    compatibleChannels: [],
  },
  {
    templateKey: 'fear-quest',
    templateKind: 'quest',
    label: 'Fear Quest',
    compatibleFaces: [],
    compatibleChannels: ['Fear'],
  },
]

// ---------------------------------------------------------------------------
// Face Selection — visibility gating
// ---------------------------------------------------------------------------

console.log('── face_selection: all faces visible when no constraints ──')
{
  const dataBag: ComposerDataBag = {}
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleFaces(options.faces)
  assert.strictEqual(visible.length, 6, 'All 6 faces should be visible')
}

console.log('── face_selection: only locked face visible ──')
{
  const dataBag: ComposerDataBag = { lockedFace: 'shaman' }
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleFaces(options.faces)
  assert.strictEqual(visible.length, 1, 'Only locked face should be visible')
  assert.strictEqual(visible[0]!.face, 'shaman', 'Locked face should be shaman')
}

console.log('── face_selection: campaign-excluded faces hidden ──')
{
  const dataBag: ComposerDataBag = {}
  const config: CampaignBranchConfig = { excludedFaces: ['sage', 'diplomat'] }
  const options = computeFilteredOptions(dataBag, CATALOG, config)
  const visible = getVisibleFaces(options.faces)
  assert.strictEqual(visible.length, 4, 'Should show 4 faces (6 minus 2 excluded)')
  const visibleNames = visible.map(f => f.face)
  assert.ok(!visibleNames.includes('sage'), 'Sage should be excluded')
  assert.ok(!visibleNames.includes('diplomat'), 'Diplomat should be excluded')
}

console.log('── face_selection: auto-resolved when 1 face visible ──')
{
  const dataBag: ComposerDataBag = { lockedFace: 'architect' }
  const options = computeFilteredOptions(dataBag, CATALOG)
  const autoVal = getAutoResolvedValue(options, 'face_selection')
  assert.strictEqual(autoVal, 'architect', 'Should auto-resolve to locked face')
}

// ---------------------------------------------------------------------------
// Narrative Template — face-gated visibility
// ---------------------------------------------------------------------------

console.log('── narrative_template: face-compatible templates only ──')
{
  const dataBag: ComposerDataBag = { lockedFace: 'shaman' }
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleTemplates(options.narrativeTemplates)
  const visibleKeys = visible.map(t => t.templateKey)
  assert.ok(visibleKeys.includes('hero-journey'), 'Hero Journey compatible with shaman')
  assert.ok(visibleKeys.includes('universal-path'), 'Universal Path always visible')
  assert.ok(visibleKeys.includes('fear-quest'), 'Fear Quest (no face restriction) visible')
  assert.ok(!visibleKeys.includes('community-build'), 'Community Build NOT compatible with shaman')
}

console.log('── narrative_template: all templates visible when no face locked ──')
{
  const dataBag: ComposerDataBag = {}
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleTemplates(options.narrativeTemplates)
  assert.strictEqual(visible.length, CATALOG.length, 'All templates visible when unconstrained')
}

console.log('── narrative_template: channel-gated filtering ──')
{
  const dataBag: ComposerDataBag = { channel: 'Fear' }
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleTemplates(options.narrativeTemplates)
  const visibleKeys = visible.map(t => t.templateKey)
  // fear-quest is Fear-compatible, others either universal or no channel restriction
  assert.ok(visibleKeys.includes('fear-quest'), 'Fear Quest matches Fear channel')
  assert.ok(visibleKeys.includes('hero-journey'), 'Hero Journey has no channel restriction')
}

// ---------------------------------------------------------------------------
// Compound gating — face + channel
// ---------------------------------------------------------------------------

console.log('── compound: face + channel narrows templates correctly ──')
{
  const dataBag: ComposerDataBag = { lockedFace: 'regent', channel: 'Fear' }
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleTemplates(options.narrativeTemplates)
  const visibleKeys = visible.map(t => t.templateKey)
  // community-build: regent-compatible, no channel restriction → visible
  assert.ok(visibleKeys.includes('community-build'), 'Community Build: regent + no channel restriction')
  // hero-journey: NOT regent-compatible → hidden
  assert.ok(!visibleKeys.includes('hero-journey'), 'Hero Journey: not regent-compatible')
  // universal-path: no restrictions → visible
  assert.ok(visibleKeys.includes('universal-path'), 'Universal Path: always visible')
  // fear-quest: no face restriction, Fear channel → visible
  assert.ok(visibleKeys.includes('fear-quest'), 'Fear Quest: no face restriction + Fear channel')
}

// ---------------------------------------------------------------------------
// Adaptive resolution — step skipping with gating
// ---------------------------------------------------------------------------

console.log('── adaptive: pre-filled face skips face_selection step ──')
{
  const resolution = resolveAdaptiveSteps({
    spokeFace: 'challenger',
  })
  const faceStep = resolution.steps.find(s => s.id === 'face_selection')
  assert.ok(faceStep, 'face_selection step exists')
  assert.ok(faceStep.skipped, 'face_selection should be skipped when face pre-filled')
  assert.strictEqual(resolution.resolvedBag.lockedFace, 'challenger', 'Bag has spoke face')
}

console.log('── adaptive: gating narrows templates after face pre-fill ──')
{
  const resolution = resolveAdaptiveSteps({
    spokeFace: 'diplomat',
  })
  // Now compute gating with the resolved bag
  const options = computeFilteredOptions(resolution.resolvedBag, CATALOG)
  const visible = getVisibleTemplates(options.narrativeTemplates)
  const visibleKeys = visible.map(t => t.templateKey)
  assert.ok(visibleKeys.includes('community-build'), 'Community Build: diplomat-compatible')
  assert.ok(!visibleKeys.includes('hero-journey'), 'Hero Journey: not diplomat-compatible')
}

// ---------------------------------------------------------------------------
// Affinity sorting with gating
// ---------------------------------------------------------------------------

console.log('── affinity: faces sorted by emotional vector alignment ──')
{
  const dataBag: ComposerDataBag = {}
  const options = computeFilteredOptions(dataBag, CATALOG)
  const visible = getVisibleFaces(options.faces)
  const sorted = sortFacesByAffinity(visible, {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Fear',
    altitudeTo: 'neutral',
  })
  // Same channel → inward moves (wakeUp, growUp) preferred
  // Shaman has [wakeUp, growUp] → best match
  assert.strictEqual(sorted[0]!.face, 'shaman', 'Shaman should sort first for same-channel vector')
}

// ---------------------------------------------------------------------------
// Summary: the renderer contract
// ---------------------------------------------------------------------------

console.log('── renderer contract: visible subsets are correct for rendering ──')
{
  // This is the exact data flow the ComposerStepRenderer uses:
  // 1. Server passes resolution + templateCatalog
  // 2. useComposerGating calls computeFilteredOptions
  // 3. Renderer accesses gating.visibleFaces / gating.visibleTemplates
  // 4. Renderer maps ONLY over visible items — hidden branches never mount

  const dataBag: ComposerDataBag = { lockedFace: 'architect' }
  const config: CampaignBranchConfig = { excludedTemplateKeys: ['fear-quest'] }
  const options = computeFilteredOptions(dataBag, CATALOG, config)

  // Face step: only architect visible
  const faces = getVisibleFaces(options.faces)
  assert.strictEqual(faces.length, 1)
  assert.strictEqual(faces[0]!.face, 'architect')

  // Template step: architect-compatible minus excluded
  const templates = getVisibleTemplates(options.narrativeTemplates)
  const templateKeys = templates.map(t => t.templateKey)
  assert.ok(!templateKeys.includes('hero-journey'), 'hero-journey not architect-compatible')
  assert.ok(!templateKeys.includes('community-build'), 'community-build not architect-compatible')
  assert.ok(templateKeys.includes('universal-path'), 'universal-path always visible')
  assert.ok(!templateKeys.includes('fear-quest'), 'fear-quest excluded by campaign config')
}

console.log('\n✓ All composer step gating tests passed')
