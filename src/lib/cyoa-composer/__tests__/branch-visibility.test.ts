/**
 * Tests for CYOA Composer — Branch-Visibility Filtering Engine
 *
 * Validates: constraint extraction, face filtering, narrative template
 * filtering, WAVE move filtering, composite option set computation,
 * auto-resolution detection, and affinity sorting.
 */

import assert from 'node:assert'
import type { GameMasterFace, EmotionalVector, PersonalMoveType } from '@/lib/quest-grammar/types'
import type { ComposerDataBag } from '../types'
import type { TemplateCatalogEntry, BranchConstraints } from '../branch-visibility'
import {
  extractConstraints,
  filterFaceOptions,
  filterNarrativeTemplateOptions,
  filterWaveMoveOptions,
  computeFilteredOptions,
  getVisibleFaces,
  getVisibleTemplates,
  getVisibleMoves,
  getAutoResolvedValue,
  sortFacesByAffinity,
  FACE_MOVE_AFFINITY,
} from '../branch-visibility'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function emptyBag(): ComposerDataBag {
  return {}
}

function bagWithFace(face: GameMasterFace): ComposerDataBag {
  return { lockedFace: face }
}

function bagWithChannel(channel: string): ComposerDataBag {
  return { channel: channel as ComposerDataBag['channel'] }
}

function bagWithFaceAndChannel(face: GameMasterFace, channel: string): ComposerDataBag {
  return { lockedFace: face, channel: channel as ComposerDataBag['channel'] }
}

function sampleCatalog(): TemplateCatalogEntry[] {
  return [
    {
      templateKey: 'hero-journey',
      templateKind: 'epiphany',
      label: 'Hero Journey',
      compatibleFaces: ['shaman', 'challenger'],
      compatibleChannels: ['Fear', 'Anger'],
    },
    {
      templateKey: 'community-build',
      templateKind: 'kotter',
      label: 'Community Build',
      compatibleFaces: ['regent', 'diplomat'],
      compatibleChannels: ['Joy', 'Sadness'],
    },
    {
      templateKey: 'universal-path',
      templateKind: 'epiphany',
      label: 'Universal Path',
      compatibleFaces: [], // Universal — compatible with all faces
      compatibleChannels: [], // Universal — compatible with all channels
    },
    {
      templateKey: 'architect-plan',
      templateKind: 'kotter',
      label: 'Architect Plan',
      compatibleFaces: ['architect'],
      compatibleChannels: ['Neutrality'],
    },
  ]
}

// ---------------------------------------------------------------------------
// extractConstraints
// ---------------------------------------------------------------------------

{
  // Empty bag produces null constraints
  const c = extractConstraints(emptyBag())
  assert.equal(c.lockedFace, null)
  assert.equal(c.lockedChannel, null)
  assert.equal(c.lockedAltitude, null)
  assert.equal(c.lockedTemplateKey, null)
  assert.deepStrictEqual(c.excludedFaces, [])
  assert.deepStrictEqual(c.excludedTemplateKeys, [])
}

{
  // Bag with locked face extracts face
  const c = extractConstraints(bagWithFace('shaman'))
  assert.equal(c.lockedFace, 'shaman')
}

{
  // Campaign exclusions are forwarded
  const c = extractConstraints(emptyBag(), {
    excludedFaces: ['sage'],
    excludedTemplateKeys: ['hero-journey'],
  })
  assert.deepStrictEqual(c.excludedFaces, ['sage'])
  assert.deepStrictEqual(c.excludedTemplateKeys, ['hero-journey'])
}

// ---------------------------------------------------------------------------
// filterFaceOptions — no locked face
// ---------------------------------------------------------------------------

{
  // No constraints → all 6 faces visible
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  assert.equal(faces.length, 6)
  assert.ok(faces.every((f) => f.visible))
}

// ---------------------------------------------------------------------------
// filterFaceOptions — locked face
// ---------------------------------------------------------------------------

{
  // Locked face → only that face visible
  const constraints: BranchConstraints = {
    lockedFace: 'shaman',
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  const visible = faces.filter((f) => f.visible)
  assert.equal(visible.length, 1)
  assert.equal(visible[0]!.face, 'shaman')

  // Hidden faces have a reason
  const hidden = faces.filter((f) => !f.visible)
  assert.equal(hidden.length, 5)
  assert.ok(hidden.every((f) => f.hiddenReason != null))
}

// ---------------------------------------------------------------------------
// filterFaceOptions — campaign exclusions
// ---------------------------------------------------------------------------

{
  // Exclude sage and diplomat → 4 visible
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: ['sage', 'diplomat'],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  const visible = faces.filter((f) => f.visible)
  assert.equal(visible.length, 4)
  assert.ok(!visible.some((f) => f.face === 'sage'))
  assert.ok(!visible.some((f) => f.face === 'diplomat'))
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — no constraints
// ---------------------------------------------------------------------------

{
  // No constraints → all templates visible
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  assert.equal(templates.length, 4)
  assert.ok(templates.every((t) => t.visible))
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — locked face filters
// ---------------------------------------------------------------------------

{
  // Locked face 'shaman' → hero-journey (compatible) + universal-path visible
  const constraints: BranchConstraints = {
    lockedFace: 'shaman',
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  const visible = templates.filter((t) => t.visible)
  assert.equal(visible.length, 2)
  assert.ok(visible.some((t) => t.templateKey === 'hero-journey'))
  assert.ok(visible.some((t) => t.templateKey === 'universal-path'))
  // community-build and architect-plan should be hidden
  const hidden = templates.filter((t) => !t.visible)
  assert.equal(hidden.length, 2)
  assert.ok(hidden.every((t) => t.hiddenReason!.includes('face')))
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — locked channel filters
// ---------------------------------------------------------------------------

{
  // Locked channel 'Fear' → hero-journey (has Fear) + universal-path (universal)
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: 'Fear',
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  const visible = templates.filter((t) => t.visible)
  assert.equal(visible.length, 2)
  assert.ok(visible.some((t) => t.templateKey === 'hero-journey'))
  assert.ok(visible.some((t) => t.templateKey === 'universal-path'))
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — locked face + channel (combined filter)
// ---------------------------------------------------------------------------

{
  // Locked face 'shaman' + channel 'Fear' → only hero-journey + universal
  const constraints: BranchConstraints = {
    lockedFace: 'shaman',
    lockedChannel: 'Fear',
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  const visible = templates.filter((t) => t.visible)
  assert.equal(visible.length, 2)
  assert.ok(visible.some((t) => t.templateKey === 'hero-journey'))
  assert.ok(visible.some((t) => t.templateKey === 'universal-path'))
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — locked template
// ---------------------------------------------------------------------------

{
  // Locked template → only that template visible
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: 'hero-journey',
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  const visible = templates.filter((t) => t.visible)
  assert.equal(visible.length, 1)
  assert.equal(visible[0]!.templateKey, 'hero-journey')
}

// ---------------------------------------------------------------------------
// filterNarrativeTemplateOptions — campaign exclusions
// ---------------------------------------------------------------------------

{
  // Exclude hero-journey → 3 visible
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: ['hero-journey'],
  }
  const templates = filterNarrativeTemplateOptions(sampleCatalog(), constraints)
  const visible = templates.filter((t) => t.visible)
  assert.equal(visible.length, 3)
  assert.ok(!visible.some((t) => t.templateKey === 'hero-journey'))
}

// ---------------------------------------------------------------------------
// filterWaveMoveOptions — no restrictions
// ---------------------------------------------------------------------------

{
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const moves = filterWaveMoveOptions(constraints)
  assert.equal(moves.length, 4)
  assert.ok(moves.every((m) => m.visible))
}

// ---------------------------------------------------------------------------
// filterWaveMoveOptions — whitelist
// ---------------------------------------------------------------------------

{
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const moves = filterWaveMoveOptions(constraints, {
    allowedMoves: ['wakeUp', 'showUp'],
  })
  const visible = moves.filter((m) => m.visible)
  assert.equal(visible.length, 2)
  assert.ok(visible.some((m) => m.move === 'wakeUp'))
  assert.ok(visible.some((m) => m.move === 'showUp'))
}

// ---------------------------------------------------------------------------
// filterWaveMoveOptions — blacklist
// ---------------------------------------------------------------------------

{
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const moves = filterWaveMoveOptions(constraints, {
    excludedMoves: ['cleanUp'],
  })
  const visible = moves.filter((m) => m.visible)
  assert.equal(visible.length, 3)
  assert.ok(!visible.some((m) => m.move === 'cleanUp'))
}

// ---------------------------------------------------------------------------
// computeFilteredOptions — full pipeline
// ---------------------------------------------------------------------------

{
  // Empty bag, full catalog, no restrictions → everything visible
  const result = computeFilteredOptions(emptyBag(), sampleCatalog())
  assert.equal(getVisibleFaces(result.faces).length, 6)
  assert.equal(getVisibleTemplates(result.narrativeTemplates).length, 4)
  assert.equal(getVisibleMoves(result.waveMoves).length, 4)
  assert.equal(result.summary.length, 5) // 5 composer steps
}

{
  // Locked face narrows templates
  const result = computeFilteredOptions(
    bagWithFace('architect'),
    sampleCatalog(),
  )
  assert.equal(getVisibleFaces(result.faces).length, 1) // Only architect
  const visibleTemplates = getVisibleTemplates(result.narrativeTemplates)
  assert.equal(visibleTemplates.length, 2) // architect-plan + universal-path
  assert.ok(visibleTemplates.some((t) => t.templateKey === 'architect-plan'))
  assert.ok(visibleTemplates.some((t) => t.templateKey === 'universal-path'))
}

{
  // Campaign exclusions propagate through
  const result = computeFilteredOptions(
    emptyBag(),
    sampleCatalog(),
    {
      excludedFaces: ['sage', 'diplomat'],
      excludedTemplateKeys: ['architect-plan'],
      waveMoveRestrictions: { excludedMoves: ['showUp'] },
    },
  )
  assert.equal(getVisibleFaces(result.faces).length, 4)
  assert.equal(getVisibleTemplates(result.narrativeTemplates).length, 3)
  assert.equal(getVisibleMoves(result.waveMoves).length, 3)
}

// ---------------------------------------------------------------------------
// getAutoResolvedValue
// ---------------------------------------------------------------------------

{
  // Single visible face → auto-resolved
  const result = computeFilteredOptions(
    bagWithFace('shaman'),
    sampleCatalog(),
  )
  const autoFace = getAutoResolvedValue(result, 'face_selection')
  assert.equal(autoFace, 'shaman')
}

{
  // Multiple visible faces → no auto-resolution
  const result = computeFilteredOptions(emptyBag(), sampleCatalog())
  const autoFace = getAutoResolvedValue(result, 'face_selection')
  assert.equal(autoFace, null)
}

{
  // Single visible template → auto-resolved
  const result = computeFilteredOptions(
    emptyBag(),
    [
      {
        templateKey: 'only-one',
        templateKind: 'epiphany',
        label: 'Only One',
        compatibleFaces: [],
        compatibleChannels: [],
      },
    ],
  )
  const autoTemplate = getAutoResolvedValue(result, 'narrative_template')
  assert.equal(autoTemplate, 'only-one')
}

{
  // Non-selection steps return null
  const result = computeFilteredOptions(emptyBag(), sampleCatalog())
  assert.equal(getAutoResolvedValue(result, 'emotional_checkin'), null)
  assert.equal(getAutoResolvedValue(result, 'charge_text'), null)
  assert.equal(getAutoResolvedValue(result, 'confirmation'), null)
}

// ---------------------------------------------------------------------------
// sortFacesByAffinity
// ---------------------------------------------------------------------------

{
  // No emotional vector → faces unchanged
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  const sorted = sortFacesByAffinity(faces)
  assert.equal(sorted.length, 6)
  // Should be same order
  assert.deepStrictEqual(
    sorted.map((f) => f.face),
    faces.map((f) => f.face),
  )
}

{
  // Same-channel vector (Transcend) → prefers wakeUp/growUp faces → shaman/architect/diplomat first
  const vector: EmotionalVector = {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Fear',
    altitudeTo: 'satisfied',
  }
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  const sorted = sortFacesByAffinity(faces, vector)
  // Sage has all 4 moves → highest affinity (2/2 match)
  // Shaman has wakeUp+growUp → 2/2 match
  // Architect has growUp → 1/2 match
  // Diplomat has growUp → 1/2 match
  assert.equal(sorted[0]!.face === 'sage' || sorted[0]!.face === 'shaman', true)
}

{
  // Cross-channel vector (Translate) → prefers cleanUp/showUp faces
  const vector: EmotionalVector = {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  }
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: [],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  const sorted = sortFacesByAffinity(faces, vector)
  // Sage has all 4 → 2/2
  // Regent has cleanUp+showUp → 2/2
  // Challenger has showUp → 1/2
  assert.ok(
    sorted[0]!.face === 'sage' || sorted[0]!.face === 'regent',
    `Expected sage or regent first, got ${sorted[0]!.face}`,
  )
}

// ---------------------------------------------------------------------------
// FACE_MOVE_AFFINITY — correctness
// ---------------------------------------------------------------------------

{
  // Sage has affinity for all 4 moves
  assert.equal(FACE_MOVE_AFFINITY.sage.length, 4)
  // Each face has at least 2 affinities
  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of faces) {
    assert.ok(
      FACE_MOVE_AFFINITY[face].length >= 2,
      `${face} should have at least 2 move affinities`,
    )
  }
}

// ---------------------------------------------------------------------------
// StepVisibilitySummary
// ---------------------------------------------------------------------------

{
  // Summary reflects actual visibility counts
  const result = computeFilteredOptions(
    bagWithFace('shaman'),
    sampleCatalog(),
    { excludedFaces: ['sage'] },
  )
  const faceSummary = result.summary.find((s) => s.stepId === 'face_selection')!
  assert.equal(faceSummary.totalOptions, 6)
  assert.equal(faceSummary.visibleOptions, 1) // Only shaman (locked)
  assert.ok(faceSummary.autoResolved)

  const templateSummary = result.summary.find((s) => s.stepId === 'narrative_template')!
  assert.equal(templateSummary.totalOptions, 4)
  assert.equal(templateSummary.visibleOptions, 2) // hero-journey + universal-path
  assert.ok(!templateSummary.autoResolved) // 2 > 1

  const confirmSummary = result.summary.find((s) => s.stepId === 'confirmation')!
  assert.ok(!confirmSummary.autoResolved) // Never auto-resolved
}

// ---------------------------------------------------------------------------
// Edge: empty catalog
// ---------------------------------------------------------------------------

{
  const result = computeFilteredOptions(emptyBag(), [])
  assert.equal(result.narrativeTemplates.length, 0)
  const templateSummary = result.summary.find((s) => s.stepId === 'narrative_template')!
  assert.equal(templateSummary.visibleOptions, 0)
  assert.ok(templateSummary.autoResolved) // 0 <= 1
}

// ---------------------------------------------------------------------------
// Edge: all faces excluded → 0 visible
// ---------------------------------------------------------------------------

{
  const constraints: BranchConstraints = {
    lockedFace: null,
    lockedChannel: null,
    lockedAltitude: null,
    lockedTemplateKey: null,
    excludedFaces: ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'],
    excludedTemplateKeys: [],
  }
  const faces = filterFaceOptions(constraints)
  assert.equal(faces.filter((f) => f.visible).length, 0)
}

// ---------------------------------------------------------------------------
// Monotonic narrowing: locking a face can only hide templates, never show new ones
// ---------------------------------------------------------------------------

{
  // Before locking: count visible templates
  const beforeResult = computeFilteredOptions(emptyBag(), sampleCatalog())
  const beforeVisible = getVisibleTemplates(beforeResult.narrativeTemplates).length

  // After locking shaman: visible templates should be <= before
  const afterResult = computeFilteredOptions(bagWithFace('shaman'), sampleCatalog())
  const afterVisible = getVisibleTemplates(afterResult.narrativeTemplates).length

  assert.ok(
    afterVisible <= beforeVisible,
    `Locking a face should never increase visible templates (${afterVisible} > ${beforeVisible})`,
  )
}

console.log('branch-visibility: all tests passed')
