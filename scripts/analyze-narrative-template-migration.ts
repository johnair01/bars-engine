#!/usr/bin/env npx tsx
/**
 * Migration Analysis Utility — NarrativeTemplate Unification
 *
 * Scans existing QuestTemplate and AdventureTemplate records, identifies all
 * field mappings to the unified NarrativeTemplate model, and produces a
 * dry-run report. NO WRITES — purely diagnostic.
 *
 * Run:
 *   npx tsx scripts/analyze-narrative-template-migration.ts
 *
 * Output:
 *   - Counts of existing records per source model
 *   - Field-by-field mapping analysis to NarrativeTemplate spine
 *   - Identification of kind (EPIPHANY / KOTTER / ORIENTATION / CUSTOM)
 *   - Face affinity extraction from existing data
 *   - JSON configBlob shape inference per record
 *   - Warnings for unmappable fields or data quality issues
 *   - Summary: what WOULD be migrated and how
 *
 * @see prisma/schema.prisma — NarrativeTemplate model
 * @see src/lib/quest-grammar/types.ts — EpiphanyBeatType, KotterBeatType, GameMasterFace
 * @see src/lib/cyoa-build/types.ts — CyoaBuild references narrativeTemplateKey
 */

import './require-db-env'
import { db } from '../src/lib/db'

// ---------------------------------------------------------------------------
// Constants — mirror quest-grammar types for analysis without importing
// (scripts run outside Next.js module resolution)
// ---------------------------------------------------------------------------

const GAME_MASTER_FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

const EPIPHANY_BEATS = ['orientation', 'rising_engagement', 'tension', 'integration', 'transcendence', 'consequence'] as const
const KOTTER_BEATS = ['urgency', 'coalition', 'vision', 'communicate', 'obstacles', 'wins', 'build_on', 'anchor'] as const

const QUEST_TEMPLATE_CATEGORIES = ['onboarding', 'fundraising', 'awareness', 'direct_action', 'community', 'custom'] as const

type NarrativeTemplateKind = 'EPIPHANY' | 'KOTTER' | 'ORIENTATION' | 'CUSTOM'

// ---------------------------------------------------------------------------
// Types for the migration report
// ---------------------------------------------------------------------------

type FieldMapping = {
  sourceField: string
  targetField: string
  transformation: string
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

type RecordAnalysis = {
  sourceModel: string
  sourceId: string
  sourceKey: string
  sourceName: string
  inferredKind: NarrativeTemplateKind
  inferredStepCount: number
  inferredFaceAffinities: string[]
  inferredQuestModel: 'personal' | 'communal'
  fieldMappings: FieldMapping[]
  configBlobShape: Record<string, string>
  warnings: string[]
  proposedKey: string
}

type MigrationReport = {
  timestamp: string
  mode: 'dry-run'
  sourceCounts: {
    questTemplates: number
    adventureTemplates: number
    storyArcTemplates: number
    adventures: number
  }
  existingNarrativeTemplates: number
  analyses: RecordAnalysis[]
  summary: {
    totalMigrationCandidates: number
    byKind: Record<NarrativeTemplateKind, number>
    byQuestModel: Record<string, number>
    unmappableRecords: number
    warningCount: number
    keyCollisions: string[]
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseJson(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return null
}

function inferKindFromCategory(category: string): NarrativeTemplateKind {
  switch (category) {
    case 'onboarding':
      return 'ORIENTATION'
    case 'fundraising':
    case 'awareness':
    case 'direct_action':
    case 'community':
      return 'KOTTER' // communal quest categories map to Kotter
    case 'custom':
      return 'CUSTOM'
    default:
      return 'CUSTOM'
  }
}

function inferQuestModelFromCategory(category: string): 'personal' | 'communal' {
  switch (category) {
    case 'onboarding':
      return 'personal'
    case 'fundraising':
    case 'awareness':
    case 'direct_action':
    case 'community':
      return 'communal'
    case 'custom':
      return 'personal'
    default:
      return 'personal'
  }
}

function inferStepCountFromKind(kind: NarrativeTemplateKind, settings: Record<string, unknown> | null): number {
  // Try to extract from settings first
  if (settings) {
    const beats = settings.beats ?? settings.steps ?? settings.stages
    if (Array.isArray(beats)) return beats.length
    const stepCount = settings.stepCount ?? settings.numSteps ?? settings.beatCount
    if (typeof stepCount === 'number') return stepCount
  }
  // Fall back to kind defaults
  switch (kind) {
    case 'EPIPHANY': return EPIPHANY_BEATS.length   // 6
    case 'KOTTER': return KOTTER_BEATS.length       // 8
    case 'ORIENTATION': return 6                     // face-discovery default
    case 'CUSTOM': return 4                          // conservative default
  }
}

function extractFaceAffinities(settings: Record<string, unknown> | null, narrativeHooks: Record<string, unknown> | null): string[] {
  const faces: string[] = []

  // Check defaultSettings for face references
  if (settings) {
    const lens = settings.developmentalLens ?? settings.face ?? settings.gameMasterFace
    if (typeof lens === 'string' && (GAME_MASTER_FACES as readonly string[]).includes(lens)) {
      faces.push(lens)
    }
    const faceList = settings.faceAffinities ?? settings.faces ?? settings.enabledFaces
    if (Array.isArray(faceList)) {
      for (const f of faceList) {
        if (typeof f === 'string' && (GAME_MASTER_FACES as readonly string[]).includes(f) && !faces.includes(f)) {
          faces.push(f)
        }
      }
    }
  }

  // Check narrativeHooks for NPC-related face references
  if (narrativeHooks) {
    const npcTriggers = narrativeHooks.npcTriggers
    if (Array.isArray(npcTriggers)) {
      for (const trigger of npcTriggers) {
        const t = trigger as Record<string, unknown>
        const face = t.face ?? t.encounterFace
        if (typeof face === 'string' && (GAME_MASTER_FACES as readonly string[]).includes(face) && !faces.includes(face)) {
          faces.push(face)
        }
      }
    }
  }

  return faces
}

function sanitizeKey(source: string, prefix: string): string {
  return `${prefix}-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

// ---------------------------------------------------------------------------
// Analyzers
// ---------------------------------------------------------------------------

function analyzeQuestTemplate(qt: {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  defaultSettings: unknown
  copyTemplate: unknown
  narrativeHooks: unknown
  status: string
  sortOrder: number
}): RecordAnalysis {
  const warnings: string[] = []
  const settings = safeParseJson(qt.defaultSettings)
  const copyTpl = safeParseJson(qt.copyTemplate)
  const hooks = safeParseJson(qt.narrativeHooks)

  const kind = inferKindFromCategory(qt.category)
  const questModel = inferQuestModelFromCategory(qt.category)
  const stepCount = inferStepCountFromKind(kind, settings)
  const faceAffinities = extractFaceAffinities(settings, hooks)

  // Build field mappings
  const fieldMappings: FieldMapping[] = [
    {
      sourceField: 'key',
      targetField: 'key',
      transformation: `Prefix with "qt-": "${sanitizeKey(qt.key, 'qt')}"`,
      confidence: 'high',
    },
    {
      sourceField: 'name',
      targetField: 'name',
      transformation: 'Direct copy',
      confidence: 'high',
    },
    {
      sourceField: 'description',
      targetField: 'description',
      transformation: 'Direct copy (nullable)',
      confidence: 'high',
    },
    {
      sourceField: 'category',
      targetField: 'kind',
      transformation: `Category "${qt.category}" → NarrativeTemplateKind.${kind}`,
      confidence: kind === 'CUSTOM' && qt.category !== 'custom' ? 'low' : 'high',
    },
    {
      sourceField: 'defaultSettings',
      targetField: 'configBlob',
      transformation: 'Restructure into kind-specific configBlob shape',
      confidence: settings ? 'medium' : 'low',
      notes: settings ? `Keys present: ${Object.keys(settings).join(', ')}` : 'Empty or null defaultSettings',
    },
    {
      sourceField: 'copyTemplate',
      targetField: 'configBlob (merged)',
      transformation: 'Merge copyTemplate into configBlob as "copyDefaults" key',
      confidence: copyTpl ? 'medium' : 'high',
      notes: copyTpl ? `Keys present: ${Object.keys(copyTpl).join(', ')}` : 'Empty — no merge needed',
    },
    {
      sourceField: 'narrativeHooks',
      targetField: 'configBlob.narrativeHooks',
      transformation: 'Preserve as nested key within configBlob (L3 reserved)',
      confidence: hooks ? 'medium' : 'high',
      notes: hooks ? 'L3 hooks present — will be preserved' : 'Null — L3 not yet wired',
    },
    {
      sourceField: 'status',
      targetField: 'status',
      transformation: 'Direct copy',
      confidence: 'high',
    },
    {
      sourceField: 'sortOrder',
      targetField: 'sortOrder',
      transformation: 'Direct copy',
      confidence: 'high',
    },
    {
      sourceField: '(derived)',
      targetField: 'stepCount',
      transformation: `Inferred from kind: ${stepCount}`,
      confidence: settings && (settings.beats || settings.steps) ? 'high' : 'medium',
    },
    {
      sourceField: '(derived)',
      targetField: 'faceAffinities',
      transformation: faceAffinities.length > 0
        ? `Extracted faces: [${faceAffinities.join(', ')}]`
        : 'Empty array (face-neutral)',
      confidence: faceAffinities.length > 0 ? 'medium' : 'high',
    },
    {
      sourceField: '(derived)',
      targetField: 'questModel',
      transformation: `Category "${qt.category}" → "${questModel}"`,
      confidence: 'high',
    },
  ]

  // Build configBlob shape description
  const configBlobShape: Record<string, string> = {}
  if (kind === 'EPIPHANY') {
    configBlobShape.beats = `EpiphanyBeatType[] (default: ${EPIPHANY_BEATS.join(', ')})`
    configBlobShape.defaultSegment = 'SegmentVariant (from defaultSettings)'
  } else if (kind === 'KOTTER') {
    configBlobShape.beats = `KotterBeatType[] (default: ${KOTTER_BEATS.join(', ')})`
    configBlobShape.defaultSegment = 'SegmentVariant (from defaultSettings)'
  } else if (kind === 'ORIENTATION') {
    configBlobShape.faces = 'GameMasterFace[] (discovery flow faces)'
    configBlobShape.subPackets = 'object[] (orientation sub-steps)'
  }
  if (settings) {
    configBlobShape.originalSettings = `Preserved original keys: ${Object.keys(settings).join(', ') || '(empty)'}`
  }
  if (copyTpl && Object.keys(copyTpl).length > 0) {
    configBlobShape.copyDefaults = `From copyTemplate: ${Object.keys(copyTpl).join(', ')}`
  }
  if (hooks) {
    configBlobShape.narrativeHooks = 'L3 reserved — preserved as-is'
  }

  // Validation warnings
  if (!settings && !copyTpl) {
    warnings.push('Both defaultSettings and copyTemplate are empty — configBlob will be minimal')
  }
  if (qt.status === 'archived') {
    warnings.push('Source record is archived — migrated NarrativeTemplate will also be archived')
  }
  if (kind === 'CUSTOM' && qt.category !== 'custom') {
    warnings.push(`Category "${qt.category}" did not map cleanly to a structured kind — fell through to CUSTOM`)
  }

  return {
    sourceModel: 'QuestTemplate',
    sourceId: qt.id,
    sourceKey: qt.key,
    sourceName: qt.name,
    inferredKind: kind,
    inferredStepCount: stepCount,
    inferredFaceAffinities: faceAffinities,
    inferredQuestModel: questModel,
    fieldMappings,
    configBlobShape,
    warnings,
    proposedKey: sanitizeKey(qt.key, 'qt'),
  }
}

function analyzeAdventureTemplate(at: {
  id: string
  key: string
  name: string
  description: string | null
  passageSlots: string
  startNodeId: string
  ownership: string
  composerStepOverrides: unknown
}): RecordAnalysis {
  const warnings: string[] = []

  // Parse passageSlots to infer step count
  let slots: Array<{ nodeId: string; label?: string; order: number }> = []
  try {
    const parsed = typeof at.passageSlots === 'string' ? JSON.parse(at.passageSlots) : at.passageSlots
    if (Array.isArray(parsed)) slots = parsed
  } catch {
    warnings.push('Failed to parse passageSlots JSON')
  }

  const composerOverrides = safeParseJson(at.composerStepOverrides)

  // AdventureTemplates define CYOA structure, not quest arc type
  // They map to NarrativeTemplate as CUSTOM kind (structural templates)
  const kind: NarrativeTemplateKind = 'CUSTOM'
  const stepCount = slots.length || 4

  // Extract face affinities from composer overrides
  const faceAffinities: string[] = []
  if (composerOverrides) {
    const steps = composerOverrides.steps
    if (Array.isArray(steps)) {
      for (const step of steps) {
        const s = step as Record<string, unknown>
        if (s.key === 'face' && s.enabled === false) {
          warnings.push('Face step is disabled in composerStepOverrides — template may be face-agnostic')
        }
      }
    }
  }

  const fieldMappings: FieldMapping[] = [
    {
      sourceField: 'key',
      targetField: 'key',
      transformation: `Prefix with "at-": "${sanitizeKey(at.key, 'at')}"`,
      confidence: 'high',
    },
    {
      sourceField: 'name',
      targetField: 'name',
      transformation: 'Direct copy',
      confidence: 'high',
    },
    {
      sourceField: 'description',
      targetField: 'description',
      transformation: 'Direct copy (nullable)',
      confidence: 'high',
    },
    {
      sourceField: '(fixed)',
      targetField: 'kind',
      transformation: `AdventureTemplate → NarrativeTemplateKind.CUSTOM (structural template)`,
      confidence: 'high',
      notes: 'AdventureTemplates define passage structure, not quest arc progression',
    },
    {
      sourceField: 'passageSlots',
      targetField: 'configBlob.passageSlots',
      transformation: `Preserved as JSON array (${slots.length} slots)`,
      confidence: 'high',
    },
    {
      sourceField: 'startNodeId',
      targetField: 'configBlob.startNodeId',
      transformation: `Preserved: "${at.startNodeId}"`,
      confidence: 'high',
    },
    {
      sourceField: 'ownership',
      targetField: 'configBlob.ownership',
      transformation: `Preserved: "${at.ownership}"`,
      confidence: 'high',
    },
    {
      sourceField: 'composerStepOverrides',
      targetField: 'configBlob.composerStepOverrides',
      transformation: composerOverrides
        ? 'Preserved as nested JSON in configBlob'
        : 'Null — no overrides',
      confidence: 'high',
    },
    {
      sourceField: '(derived)',
      targetField: 'stepCount',
      transformation: `From passageSlots length: ${stepCount}`,
      confidence: slots.length > 0 ? 'high' : 'low',
    },
    {
      sourceField: '(derived)',
      targetField: 'questModel',
      transformation: '"personal" (default — AdventureTemplates are player-facing)',
      confidence: 'medium',
    },
  ]

  const configBlobShape: Record<string, string> = {
    passageSlots: `Array of ${slots.length} passage slot definitions`,
    startNodeId: at.startNodeId,
    ownership: at.ownership,
  }
  if (composerOverrides) {
    configBlobShape.composerStepOverrides = `Composer step ordering (${JSON.stringify(composerOverrides).length} bytes)`
  }

  // Slot-level detail
  if (slots.length > 0) {
    configBlobShape.slotNodeIds = slots.map(s => s.nodeId).join(', ')
  }

  return {
    sourceModel: 'AdventureTemplate',
    sourceId: at.id,
    sourceKey: at.key,
    sourceName: at.name,
    inferredKind: kind,
    inferredStepCount: stepCount,
    inferredFaceAffinities: faceAffinities,
    inferredQuestModel: 'personal',
    fieldMappings,
    configBlobShape,
    warnings,
    proposedKey: sanitizeKey(at.key, 'at'),
  }
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

async function main() {
  console.log('════════════════════════════════════════════════════════════════')
  console.log('  NarrativeTemplate Migration Analysis — DRY RUN')
  console.log('  No writes will be performed.')
  console.log('════════════════════════════════════════════════════════════════')
  console.log()

  // ── 1. Fetch source data ──────────────────────────────────────────────

  const [questTemplates, adventureTemplates, storyArcTemplateCount, adventureCount, existingNarrativeTemplates] =
    await Promise.all([
      db.questTemplate.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.adventureTemplate.findMany({ orderBy: { key: 'asc' } }),
      db.storyArcTemplate.count(),
      db.adventure.count(),
      db.narrativeTemplate.count(),
    ])

  console.log('📊 Source Record Counts:')
  console.log(`   QuestTemplate:          ${questTemplates.length}`)
  console.log(`   AdventureTemplate:       ${adventureTemplates.length}`)
  console.log(`   StoryArcTemplate:        ${storyArcTemplateCount} (L3 reserved — not migrated)`)
  console.log(`   Adventure:               ${adventureCount} (checked for playbookTemplate)`)
  console.log(`   NarrativeTemplate (dst): ${existingNarrativeTemplates} existing`)
  console.log()

  // ── 2. Analyze QuestTemplates ─────────────────────────────────────────

  const analyses: RecordAnalysis[] = []

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  QUEST TEMPLATE ANALYSIS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (const qt of questTemplates) {
    const analysis = analyzeQuestTemplate(qt)
    analyses.push(analysis)
    printRecordAnalysis(analysis)
  }

  if (questTemplates.length === 0) {
    console.log('   (no QuestTemplate records found)')
    console.log()
  }

  // ── 3. Analyze AdventureTemplates ────────────────────────────────────

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ADVENTURE TEMPLATE ANALYSIS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (const at of adventureTemplates) {
    const analysis = analyzeAdventureTemplate(at)
    analyses.push(analysis)
    printRecordAnalysis(analysis)
  }

  if (adventureTemplates.length === 0) {
    console.log('   (no AdventureTemplate records found)')
    console.log()
  }

  // ── 4. Check Adventures with playbookTemplate ────────────────────────

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ADVENTURE playbookTemplate SCAN')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const adventuresWithPlaybook = await db.adventure.findMany({
    where: { playbookTemplate: { not: null } },
    select: { id: true, slug: true, title: true, adventureType: true, playbookTemplate: true },
  })

  if (adventuresWithPlaybook.length > 0) {
    console.log(`   Found ${adventuresWithPlaybook.length} adventures with playbookTemplate:`)
    for (const adv of adventuresWithPlaybook) {
      const tpl = safeParseJson(adv.playbookTemplate)
      const tplKeys = tpl ? Object.keys(tpl).join(', ') : '(unparseable)'
      console.log(`   • ${adv.slug} [${adv.adventureType ?? 'null'}] — keys: ${tplKeys}`)
      console.log(`     NOTE: playbookTemplate is adventure-instance config, not a NarrativeTemplate candidate.`)
      console.log(`     It defines archetype questions/moves for CHARACTER_CREATOR or CYOA_INTAKE adventures.`)
      console.log(`     These remain on Adventure — no migration needed.`)
    }
  } else {
    console.log('   (no adventures with playbookTemplate found)')
  }
  console.log()

  // ── 5. Check StoryArcTemplates ───────────────────────────────────────

  if (storyArcTemplateCount > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  STORY ARC TEMPLATE NOTE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   ${storyArcTemplateCount} StoryArcTemplate records exist (L3 reserved).`)
    console.log('   These define campaign-level narrative arcs (linear/branching/cyclical/emergent).')
    console.log('   They are NOT migration candidates — they complement NarrativeTemplate,')
    console.log('   not replace it. StoryArcTemplate.definition references NarrativeTemplate')
    console.log('   keys for beat-level template selection.')
    console.log()
  }

  // ── 6. Summary report ────────────────────────────────────────────────

  const byKind: Record<NarrativeTemplateKind, number> = { EPIPHANY: 0, KOTTER: 0, ORIENTATION: 0, CUSTOM: 0 }
  const byQuestModel: Record<string, number> = { personal: 0, communal: 0 }
  let warningCount = 0
  const allKeys = new Set<string>()
  const keyCollisions: string[] = []

  for (const a of analyses) {
    byKind[a.inferredKind]++
    byQuestModel[a.inferredQuestModel]++
    warningCount += a.warnings.length
    if (allKeys.has(a.proposedKey)) {
      keyCollisions.push(a.proposedKey)
    }
    allKeys.add(a.proposedKey)
  }

  // Also check against existing NarrativeTemplate keys
  if (existingNarrativeTemplates > 0) {
    const existingKeys = await db.narrativeTemplate.findMany({ select: { key: true } })
    for (const a of analyses) {
      if (existingKeys.some(e => e.key === a.proposedKey)) {
        keyCollisions.push(`${a.proposedKey} (conflicts with existing NarrativeTemplate)`)
      }
    }
  }

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    mode: 'dry-run',
    sourceCounts: {
      questTemplates: questTemplates.length,
      adventureTemplates: adventureTemplates.length,
      storyArcTemplates: storyArcTemplateCount,
      adventures: adventureCount,
    },
    existingNarrativeTemplates,
    analyses,
    summary: {
      totalMigrationCandidates: analyses.length,
      byKind,
      byQuestModel,
      unmappableRecords: analyses.filter(a => a.warnings.some(w => w.includes('fell through'))).length,
      warningCount,
      keyCollisions,
    },
  }

  console.log('════════════════════════════════════════════════════════════════')
  console.log('  MIGRATION SUMMARY')
  console.log('════════════════════════════════════════════════════════════════')
  console.log()
  console.log(`  Total migration candidates: ${report.summary.totalMigrationCandidates}`)
  console.log(`    From QuestTemplate:       ${questTemplates.length}`)
  console.log(`    From AdventureTemplate:   ${adventureTemplates.length}`)
  console.log()
  console.log('  By NarrativeTemplateKind:')
  for (const [kind, count] of Object.entries(byKind)) {
    console.log(`    ${kind}: ${count}`)
  }
  console.log()
  console.log('  By Quest Model:')
  for (const [model, count] of Object.entries(byQuestModel)) {
    console.log(`    ${model}: ${count}`)
  }
  console.log()
  console.log(`  Warnings: ${warningCount}`)
  console.log(`  Unmappable records: ${report.summary.unmappableRecords}`)
  console.log(`  Key collisions: ${keyCollisions.length > 0 ? keyCollisions.join(', ') : 'none'}`)
  console.log(`  Existing NarrativeTemplates: ${existingNarrativeTemplates}`)
  console.log()

  // ── 7. Field mapping reference table ─────────────────────────────────

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  FIELD MAPPING REFERENCE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('  QuestTemplate → NarrativeTemplate:')
  console.log('  ┌──────────────────────┬───────────────────────┬─────────────┐')
  console.log('  │ Source Field          │ Target Field          │ Confidence  │')
  console.log('  ├──────────────────────┼───────────────────────┼─────────────┤')
  console.log('  │ key                  │ key (prefixed "qt-")  │ high        │')
  console.log('  │ name                 │ name                  │ high        │')
  console.log('  │ description          │ description           │ high        │')
  console.log('  │ category             │ kind (mapped)         │ high        │')
  console.log('  │ defaultSettings      │ configBlob            │ medium      │')
  console.log('  │ copyTemplate         │ configBlob.copyDflt   │ medium      │')
  console.log('  │ narrativeHooks       │ configBlob.hooks      │ medium      │')
  console.log('  │ status               │ status                │ high        │')
  console.log('  │ sortOrder            │ sortOrder             │ high        │')
  console.log('  │ (derived: category)  │ stepCount             │ medium      │')
  console.log('  │ (derived: settings)  │ faceAffinities        │ medium      │')
  console.log('  │ (derived: category)  │ questModel            │ high        │')
  console.log('  └──────────────────────┴───────────────────────┴─────────────┘')
  console.log()
  console.log('  AdventureTemplate → NarrativeTemplate:')
  console.log('  ┌──────────────────────┬───────────────────────┬─────────────┐')
  console.log('  │ Source Field          │ Target Field          │ Confidence  │')
  console.log('  ├──────────────────────┼───────────────────────┼─────────────┤')
  console.log('  │ key                  │ key (prefixed "at-")  │ high        │')
  console.log('  │ name                 │ name                  │ high        │')
  console.log('  │ description          │ description           │ high        │')
  console.log('  │ (fixed)              │ kind → CUSTOM         │ high        │')
  console.log('  │ passageSlots         │ configBlob.slots      │ high        │')
  console.log('  │ startNodeId          │ configBlob.start      │ high        │')
  console.log('  │ ownership            │ configBlob.ownership  │ high        │')
  console.log('  │ composerStepOverrides│ configBlob.composer   │ high        │')
  console.log('  │ (derived: slots.len) │ stepCount             │ high        │')
  console.log('  │ (default)            │ questModel → personal │ medium      │')
  console.log('  └──────────────────────┴───────────────────────┴─────────────┘')
  console.log()

  // ── 8. NOT-MIGRATED reference ────────────────────────────────────────

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  NOT MIGRATED (stays on source models)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('  • Adventure.playbookTemplate — instance-level config, not registry template')
  console.log('  • StoryArcTemplate — L3 reserved, complements NarrativeTemplate')
  console.log('  • Campaign.questTemplateConfig — campaign-level QT selection (references QT keys)')
  console.log('  • Campaign.narrativeConfig — L3 campaign narrative config')
  console.log('  • QuestTemplate.id/createdAt/updatedAt — source model lifecycle fields')
  console.log('  • AdventureTemplate.cmaGeneratorDrafts — relation stays on source model')
  console.log()

  console.log('════════════════════════════════════════════════════════════════')
  console.log('  DRY RUN COMPLETE — No writes performed.')
  console.log(`  Report generated at: ${report.timestamp}`)
  console.log('════════════════════════════════════════════════════════════════')

  // Output JSON report for programmatic consumption
  const jsonPath = 'reports/narrative-template-migration-analysis.json'
  const fs = await import('fs')
  const path = await import('path')
  const reportDir = path.resolve('reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  fs.writeFileSync(
    path.resolve(jsonPath),
    JSON.stringify(report, null, 2),
    'utf-8'
  )
  console.log(`\n  📄 JSON report written to: ${jsonPath}`)
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

function printRecordAnalysis(a: RecordAnalysis) {
  console.log()
  console.log(`  ┌─ ${a.sourceModel}: ${a.sourceKey}`)
  console.log(`  │  Name: ${a.sourceName}`)
  console.log(`  │  ID:   ${a.sourceId}`)
  console.log(`  │`)
  console.log(`  │  Proposed NarrativeTemplate key: "${a.proposedKey}"`)
  console.log(`  │  Kind:       ${a.inferredKind}`)
  console.log(`  │  StepCount:  ${a.inferredStepCount}`)
  console.log(`  │  QuestModel: ${a.inferredQuestModel}`)
  console.log(`  │  Faces:      ${a.inferredFaceAffinities.length > 0 ? a.inferredFaceAffinities.join(', ') : '[] (face-neutral)'}`)
  console.log(`  │`)
  console.log(`  │  ConfigBlob shape:`)
  for (const [key, desc] of Object.entries(a.configBlobShape)) {
    console.log(`  │    ${key}: ${desc}`)
  }
  console.log(`  │`)
  console.log(`  │  Field mappings (${a.fieldMappings.length}):`)
  for (const fm of a.fieldMappings) {
    const conf = fm.confidence === 'high' ? '✅' : fm.confidence === 'medium' ? '🟡' : '🔴'
    console.log(`  │    ${conf} ${fm.sourceField} → ${fm.targetField}`)
    console.log(`  │       ${fm.transformation}`)
    if (fm.notes) {
      console.log(`  │       ⓘ ${fm.notes}`)
    }
  }

  if (a.warnings.length > 0) {
    console.log(`  │`)
    console.log(`  │  ⚠️  Warnings (${a.warnings.length}):`)
    for (const w of a.warnings) {
      console.log(`  │    • ${w}`)
    }
  }
  console.log(`  └────────────────────────────────────────────────`)
  console.log()
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

main()
  .catch((e) => {
    console.error('❌ Analysis failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
