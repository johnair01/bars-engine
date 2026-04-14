/**
 * Tests for NarrativeTemplate Preview Palette Mapping
 *
 * Validates that the Wuxing palette resolution correctly:
 * - Maps EmotionalChannel → ElementKey → ELEMENT_TOKENS palette
 * - Resolves altitude to CardAltitude glow/border treatment
 * - Derives MoveFamily (Transcend vs Translate) from vector
 * - Produces correct CSS custom properties
 * - Handles all 5 channels and 3 altitudes
 * - Handles lowercase channel convenience function
 * - buildNarrativeTemplatePreview with and without vector
 *
 * Pattern: node:assert + console.log (matches existing test conventions)
 * @see src/lib/narrative-template/__tests__/config-validation.test.ts — sibling
 */

import assert from 'node:assert'
import {
  resolveWuxingPalette,
  resolveTemplatePreviewPalette,
  buildNarrativeTemplatePreview,
  buildPreviewFromReceipt,
  resolveWuxingPaletteFromLowercase,
} from '../preview'
import type { EmotionalVector } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// resolveWuxingPalette — channel+altitude → palette
// ---------------------------------------------------------------------------

console.log('--- resolveWuxingPalette ---')

// Fear → metal
const fearPalette = resolveWuxingPalette('Fear', 'dissatisfied')
assert.strictEqual(fearPalette.element, 'metal', 'Fear maps to metal')
assert.strictEqual(fearPalette.channel, 'Fear')
assert.strictEqual(fearPalette.sigil, '金')
assert.strictEqual(fearPalette.frame, '#8e9aab', 'metal frame = silver-slate')
assert.strictEqual(fearPalette.altitude, 'dissatisfied')
assert.strictEqual(fearPalette.glowRadius, '0px', 'dissatisfied = no glow')
assert.strictEqual(fearPalette.borderOpacity, 0.3)
console.log('  Fear/dissatisfied → metal ✓')

// Joy → wood
const joyPalette = resolveWuxingPalette('Joy', 'satisfied')
assert.strictEqual(joyPalette.element, 'wood', 'Joy maps to wood')
assert.strictEqual(joyPalette.sigil, '木')
assert.strictEqual(joyPalette.frame, '#4a7c59', 'wood frame = sage')
assert.strictEqual(joyPalette.glowRadius, '12px', 'satisfied = full glow')
assert.strictEqual(joyPalette.borderOpacity, 1.0)
console.log('  Joy/satisfied → wood ✓')

// Anger → fire
const angerPalette = resolveWuxingPalette('Anger', 'neutral')
assert.strictEqual(angerPalette.element, 'fire', 'Anger maps to fire')
assert.strictEqual(angerPalette.sigil, '火')
assert.strictEqual(angerPalette.glowRadius, '4px', 'neutral = mid glow')
console.log('  Anger/neutral → fire ✓')

// Sadness → water
const sadPalette = resolveWuxingPalette('Sadness', 'neutral')
assert.strictEqual(sadPalette.element, 'water', 'Sadness maps to water')
assert.strictEqual(sadPalette.sigil, '水')
console.log('  Sadness/neutral → water ✓')

// Neutrality → earth
const neutralPalette = resolveWuxingPalette('Neutrality', 'satisfied')
assert.strictEqual(neutralPalette.element, 'earth', 'Neutrality maps to earth')
assert.strictEqual(neutralPalette.sigil, '土')
assert.strictEqual(neutralPalette.frame, '#b5651d', 'earth frame = terracotta')
console.log('  Neutrality/satisfied → earth ✓')

// ---------------------------------------------------------------------------
// resolveTemplatePreviewPalette — vector → full palette pair
// ---------------------------------------------------------------------------

console.log('\n--- resolveTemplatePreviewPalette ---')

// Transcend: same channel (Fear → Fear, altitude shift)
const transcendVector: EmotionalVector = {
  channelFrom: 'Fear',
  altitudeFrom: 'dissatisfied',
  channelTo: 'Fear',
  altitudeTo: 'neutral',
}
const transcendPalette = resolveTemplatePreviewPalette(transcendVector)
assert.strictEqual(transcendPalette.moveFamily, 'Transcend', 'same channel = Transcend')
assert.strictEqual(transcendPalette.source.element, 'metal')
assert.strictEqual(transcendPalette.destination.element, 'metal')
assert.strictEqual(transcendPalette.source.altitude, 'dissatisfied')
assert.strictEqual(transcendPalette.destination.altitude, 'neutral')
assert.ok(transcendPalette.sourceCssVars['--element-frame'], 'source CSS vars present')
assert.ok(transcendPalette.destinationAltitudeCssVars['--glow-radius'], 'dest altitude CSS vars present')
console.log('  Transcend (Fear→Fear) ✓')

// Translate: different channels (Joy → Anger = wood → fire, shēng cycle)
const translateVector: EmotionalVector = {
  channelFrom: 'Joy',
  altitudeFrom: 'neutral',
  channelTo: 'Anger',
  altitudeTo: 'satisfied',
}
const translatePalette = resolveTemplatePreviewPalette(translateVector)
assert.strictEqual(translatePalette.moveFamily, 'Translate', 'different channels = Translate')
assert.strictEqual(translatePalette.source.element, 'wood', 'Joy source = wood')
assert.strictEqual(translatePalette.destination.element, 'fire', 'Anger dest = fire')
assert.strictEqual(translatePalette.sourceCssVars['--element-frame'], '#4a7c59')
assert.strictEqual(translatePalette.destinationCssVars['--element-frame'], '#c1392b')
console.log('  Translate (Joy→Anger / wood→fire) ✓')

// ---------------------------------------------------------------------------
// buildNarrativeTemplatePreview — with and without vector
// ---------------------------------------------------------------------------

console.log('\n--- buildNarrativeTemplatePreview ---')

const mockTemplate = {
  id: 'tpl_001',
  key: 'epiphany-default',
  name: 'Epiphany Bridge',
  description: 'Standard 6-beat personal quest arc',
  kind: 'EPIPHANY' as const,
  stepCount: 6,
  questModel: 'personal' as const,
  faceAffinities: ['shaman' as const, 'diplomat' as const],
  status: 'active' as const,
}

// Without vector → null palette
const previewNoVector = buildNarrativeTemplatePreview(mockTemplate)
assert.strictEqual(previewNoVector.palette, null, 'no vector = null palette')
assert.strictEqual(previewNoVector.name, 'Epiphany Bridge')
assert.strictEqual(previewNoVector.kind, 'EPIPHANY')
assert.deepStrictEqual(previewNoVector.faceAffinities, ['shaman', 'diplomat'])
console.log('  Preview without vector → null palette ✓')

// With vector → resolved palette
const previewWithVector = buildNarrativeTemplatePreview(mockTemplate, translateVector)
assert.ok(previewWithVector.palette !== null, 'with vector = non-null palette')
assert.strictEqual(previewWithVector.palette!.source.element, 'wood')
assert.strictEqual(previewWithVector.palette!.destination.element, 'fire')
assert.strictEqual(previewWithVector.palette!.moveFamily, 'Translate')
console.log('  Preview with vector → resolved palette ✓')

// With explicit null vector → null palette
const previewNullVector = buildNarrativeTemplatePreview(mockTemplate, null)
assert.strictEqual(previewNullVector.palette, null, 'explicit null = null palette')
console.log('  Preview with null vector → null palette ✓')

// ---------------------------------------------------------------------------
// resolveWuxingPaletteFromLowercase — convenience function
// ---------------------------------------------------------------------------

console.log('\n--- resolveWuxingPaletteFromLowercase ---')

const lowerFear = resolveWuxingPaletteFromLowercase('fear', 'neutral')
assert.ok(lowerFear !== null, 'recognized channel returns palette')
assert.strictEqual(lowerFear!.element, 'metal')
assert.strictEqual(lowerFear!.channel, 'Fear')
console.log('  "fear" → metal ✓')

const lowerJoy = resolveWuxingPaletteFromLowercase('joy', 'satisfied')
assert.ok(lowerJoy !== null)
assert.strictEqual(lowerJoy!.element, 'wood')
console.log('  "joy" → wood ✓')

const unknown = resolveWuxingPaletteFromLowercase('excitement', 'neutral')
assert.strictEqual(unknown, null, 'unrecognized channel returns null')
console.log('  "excitement" → null ✓')

// ---------------------------------------------------------------------------
// All channels × all altitudes exhaustive check
// ---------------------------------------------------------------------------

console.log('\n--- Exhaustive channel×altitude coverage ---')

const channels = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const
const altitudes = ['dissatisfied', 'neutral', 'satisfied'] as const
const expectedElements: Record<string, string> = {
  Fear: 'metal',
  Anger: 'fire',
  Sadness: 'water',
  Joy: 'wood',
  Neutrality: 'earth',
}

for (const ch of channels) {
  for (const alt of altitudes) {
    const p = resolveWuxingPalette(ch, alt)
    assert.strictEqual(p.element, expectedElements[ch], `${ch}/${alt} → ${expectedElements[ch]}`)
    assert.strictEqual(p.altitude, alt)
    assert.ok(p.frame.startsWith('#'), `${ch}/${alt} frame is hex`)
    assert.ok(p.glow.startsWith('#'), `${ch}/${alt} glow is hex`)
    assert.ok(typeof p.borderOpacity === 'number', `${ch}/${alt} borderOpacity is number`)
  }
}
console.log('  All 15 channel×altitude combos ✓')

// ---------------------------------------------------------------------------
// buildPreviewFromReceipt — hub ledger integration (no fan-out queries)
// ---------------------------------------------------------------------------

console.log('\n--- buildPreviewFromReceipt ---')

const mockReceipt = {
  buildId: 'build_abc123',
  face: 'shaman' as const,
  templateKind: 'EPIPHANY',
  templateKey: 'epiphany-bridge-default',
  emotionalVector: {
    channelFrom: 'Fear' as const,
    altitudeFrom: 'dissatisfied' as const,
    channelTo: 'Joy' as const,
    altitudeTo: 'satisfied' as const,
  },
}

const receiptPreview = buildPreviewFromReceipt(mockReceipt)
assert.strictEqual(receiptPreview.id, 'build_abc123', 'id from buildId')
assert.strictEqual(receiptPreview.key, 'epiphany-bridge-default', 'key from templateKey')
assert.strictEqual(receiptPreview.kind, 'EPIPHANY', 'kind from templateKind')
assert.strictEqual(receiptPreview.name, 'Epiphany Bridge Default', 'humanized name from key')
assert.strictEqual(receiptPreview.questModel, 'personal', 'EPIPHANY = personal')
assert.deepStrictEqual(receiptPreview.faceAffinities, ['shaman'], 'face from receipt')
assert.ok(receiptPreview.palette !== null, 'palette resolved from emotionalVector')
assert.strictEqual(receiptPreview.palette!.source.element, 'metal', 'Fear → metal')
assert.strictEqual(receiptPreview.palette!.destination.element, 'wood', 'Joy → wood')
assert.strictEqual(receiptPreview.palette!.moveFamily, 'Translate', 'Fear→Joy = Translate')
console.log('  EPIPHANY receipt → preview with Translate palette ✓')

// KOTTER kind → communal questModel
const kotterReceipt = {
  buildId: 'build_kotter1',
  face: 'regent' as const,
  templateKind: 'KOTTER',
  templateKey: 'kotter-change-model',
  emotionalVector: {
    channelFrom: 'Anger' as const,
    altitudeFrom: 'neutral' as const,
    channelTo: 'Anger' as const,
    altitudeTo: 'satisfied' as const,
  },
}
const kotterPreview = buildPreviewFromReceipt(kotterReceipt)
assert.strictEqual(kotterPreview.questModel, 'communal', 'KOTTER = communal')
assert.strictEqual(kotterPreview.palette!.moveFamily, 'Transcend', 'same channel = Transcend')
console.log('  KOTTER receipt → communal + Transcend palette ✓')

// Unknown templateKind → fallback to CUSTOM
const unknownKindReceipt = {
  buildId: 'build_unk1',
  face: 'sage' as const,
  templateKind: 'UNKNOWN_KIND',
  templateKey: 'custom-thing',
  emotionalVector: {
    channelFrom: 'Neutrality' as const,
    altitudeFrom: 'neutral' as const,
    channelTo: 'Neutrality' as const,
    altitudeTo: 'neutral' as const,
  },
}
const unknownPreview = buildPreviewFromReceipt(unknownKindReceipt)
assert.strictEqual(unknownPreview.kind, 'CUSTOM', 'unknown kind falls back to CUSTOM')
assert.strictEqual(unknownPreview.questModel, 'personal', 'CUSTOM = personal')
console.log('  Unknown templateKind → CUSTOM fallback ✓')

console.log('\n✅ All preview palette tests passed')
