/**
 * BAR Production — Unit Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/bar-production.test.ts
 *
 * Tests the pure data-building logic for channel-typed BAR artifact production.
 * All tests are pure (no DB access) — they exercise the builders that produce
 * BarCreateData from CYOA selections + arc state.
 *
 * Key invariants tested:
 *   - Action BAR carries correct Challenger move channel typing
 *   - Intake BAR carries correct emotional channel typing
 *   - Reflection BAR IS the epiphany (isEpiphany flag)
 *   - All BARs carry correct phase type, nation, and strandMetadata
 *   - Non-AI first-class: all production is deterministic from selections
 */

import assert from 'node:assert'
import {
  buildActionBarData,
  buildIntakeBarData,
  buildReflectionBarData,
  parseBarAlchemyMetadata,
  isAlchemyBar,
  getActionBarChallengerMove,
  getChallengerMoveElement,
  getChallengerMoveEnergyDelta,
  assertWakeUpTyping,
  type ActionBarContext,
  type IntakeBarContext,
  type ReflectionBarContext,
  type ActionBarMetadata,
  type IntakeBarMetadata,
  type ReflectionBarMetadata,
} from '../bar-production'

import { PHASE_BAR_CHANNEL_TYPE, VERTICAL_SLICE } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// Action BAR production
// ═══════════════════════════════════════════════════════════════════════════

const actionCtx: ActionBarContext = {
  playerId: 'player-1',
  channel: 'Anger',
  moveId: 'issue_challenge',
  response: 'I will confront the thing I have been avoiding.',
}

// ─── type field ────────────────────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.type, PHASE_BAR_CHANNEL_TYPE.action, 'Action BAR type is "action"')
  assert.strictEqual(data.type, 'action')
}

// ─── channel → nation mapping ──────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.nation, 'anger', 'Anger channel maps to "anger" nation')
  assert.strictEqual(data.emotionalAlchemyTag, 'anger', 'Anger channel maps to "anger" tag')
}

{
  const data = buildActionBarData({ ...actionCtx, channel: 'Fear' })
  assert.strictEqual(data.nation, 'fear', 'Fear channel maps to "fear" nation')
}

{
  const data = buildActionBarData({ ...actionCtx, channel: 'Sadness' })
  assert.strictEqual(data.nation, 'sadness', 'Sadness channel maps to "sadness" nation')
}

{
  const data = buildActionBarData({ ...actionCtx, channel: 'Joy' })
  assert.strictEqual(data.nation, 'joy', 'Joy channel maps to "joy" nation')
}

{
  const data = buildActionBarData({ ...actionCtx, channel: 'Neutrality' })
  assert.strictEqual(data.nation, 'neutrality', 'Neutrality channel maps to "neutrality" nation')
}

// ─── vertical slice defaults ───────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.gameMasterFace, 'challenger', 'Default face is Challenger')
  assert.strictEqual(data.moveType, 'wakeUp', 'Default wave move is Wake Up')
}

// ─── custom face/wave ──────────────────────────────────────────────────────
{
  const data = buildActionBarData({ ...actionCtx, face: 'shaman', waveMove: 'cleanUp' })
  assert.strictEqual(data.gameMasterFace, 'shaman', 'Custom face is respected')
  assert.strictEqual(data.moveType, 'cleanUp', 'Custom wave move is respected')
}

// ─── status ────────────────────────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.status, 'seed', 'BAR starts as seed')
}

// ─── description ───────────────────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.description, 'I will confront the thing I have been avoiding.', 'Player response is description')
}

// ─── title generation ──────────────────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  assert.strictEqual(data.title, 'Issue Challenge — Anger Action', 'Default title from move + channel')
}

{
  const data = buildActionBarData({ ...actionCtx, responseTitle: 'My Custom Title' })
  assert.strictEqual(data.title, 'My Custom Title', 'Custom title overrides default')
}

{
  const data = buildActionBarData({ ...actionCtx, moveId: 'propose_move' })
  assert.strictEqual(data.title, 'Declare Intention — Anger Action', 'propose_move uses Declare Intention title')
}

// ─── strandMetadata (provenance) ───────────────────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  const meta = JSON.parse(data.strandMetadata) as ActionBarMetadata

  assert.strictEqual(meta.alchemyEngine, true, 'Metadata marks as alchemyEngine')
  assert.strictEqual(meta.arcPhase, 'action', 'Metadata arcPhase is "action"')
  assert.strictEqual(meta.channel, 'Anger', 'Metadata carries emotional channel')
  assert.deepStrictEqual(meta.regulation, { from: 'neutral', to: 'neutral' }, 'Action regulation: neutral → neutral')
  assert.strictEqual(meta.challengerMoveId, 'issue_challenge', 'Metadata carries moveId at top level')
  assert.strictEqual(meta.waveMove, 'wakeUp', 'Metadata carries wave move')
  assert.strictEqual(meta.face, 'challenger', 'Metadata carries face')
}

// ─── issue_challenge challenger move metadata ──────────────────────────────
{
  const data = buildActionBarData(actionCtx)
  const meta = JSON.parse(data.strandMetadata) as ActionBarMetadata

  assert.deepStrictEqual(meta.challengerMove, {
    moveId: 'issue_challenge',
    canonicalMoveId: 'fire_transcend',
    title: 'Issue Challenge',
    energyDelta: 2,
    element: 'fire',
    narrative: 'Anger → boundary honored',
  }, 'issue_challenge carries full fire_transcend metadata')
}

// ─── propose_move challenger move metadata ─────────────────────────────────
{
  const data = buildActionBarData({ ...actionCtx, moveId: 'propose_move' })
  const meta = JSON.parse(data.strandMetadata) as ActionBarMetadata

  assert.deepStrictEqual(meta.challengerMove, {
    moveId: 'propose_move',
    canonicalMoveId: 'wood_fire',
    title: 'Declare Intention',
    energyDelta: 1,
    element: 'fire',
    narrative: 'Momentum into action',
  }, 'propose_move carries full wood_fire metadata')
}

// ═══════════════════════════════════════════════════════════════════════════
// Intake BAR production
// ═══════════════════════════════════════════════════════════════════════════

const intakeCtx: IntakeBarContext = {
  playerId: 'player-1',
  channel: 'Fear',
  content: 'I feel stuck because of an upcoming deadline.',
}

{
  const data = buildIntakeBarData(intakeCtx)
  assert.strictEqual(data.type, 'intake', 'Intake BAR type is "intake"')
  assert.strictEqual(data.nation, 'fear', 'Fear channel maps to "fear" nation')
  assert.strictEqual(data.emotionalAlchemyTag, 'fear', 'Fear channel maps to "fear" tag')
  assert.strictEqual(data.title, 'Wake Up — Fear Intake', 'Default intake title')
  assert.strictEqual(data.status, 'seed', 'Intake BAR starts as seed')
}

{
  const data = buildIntakeBarData({ ...intakeCtx, title: 'My Intake' })
  assert.strictEqual(data.title, 'My Intake', 'Custom intake title overrides default')
}

{
  const data = buildIntakeBarData({ ...intakeCtx, content: '   ' })
  assert.strictEqual(data.description, 'Intake phase completed.', 'Empty content gets default description')
}

{
  const data = buildIntakeBarData(intakeCtx)
  const meta = JSON.parse(data.strandMetadata) as IntakeBarMetadata
  assert.strictEqual(meta.alchemyEngine, true, 'Intake metadata marks alchemyEngine')
  assert.strictEqual(meta.arcPhase, 'intake', 'Intake metadata arcPhase is "intake"')
  assert.strictEqual(meta.channel, 'Fear', 'Intake metadata carries channel')
  assert.deepStrictEqual(meta.regulation, { from: 'dissatisfied', to: 'neutral' }, 'Intake regulation: dissatisfied → neutral')
}

// ═══════════════════════════════════════════════════════════════════════════
// Reflection BAR production (epiphany artifact)
// ═══════════════════════════════════════════════════════════════════════════

const reflectionCtx: ReflectionBarContext = {
  playerId: 'player-1',
  channel: 'Anger',
  content: 'I see now that my anger was protecting something I care about.',
  intakeBarId: 'bar-intake-1',
  actionBarId: 'bar-action-1',
}

{
  const data = buildReflectionBarData(reflectionCtx)
  assert.strictEqual(data.type, 'reflection', 'Reflection BAR type is "reflection"')
  assert.strictEqual(data.nation, 'anger', 'Anger maps to "anger" nation')
  assert.strictEqual(data.title, 'Anger Epiphany — Wake Up', 'Reflection title is epiphany-style')
}

{
  const data = buildReflectionBarData(reflectionCtx)
  const meta = JSON.parse(data.strandMetadata) as ReflectionBarMetadata
  assert.strictEqual(meta.isEpiphany, true, 'Reflection BAR IS the epiphany')
  assert.strictEqual(meta.intakeBarId, 'bar-intake-1', 'References intake BAR')
  assert.strictEqual(meta.actionBarId, 'bar-action-1', 'References action BAR')
  assert.deepStrictEqual(meta.regulation, { from: 'neutral', to: 'satisfied' }, 'Reflection regulation: neutral → satisfied')
}

// ═══════════════════════════════════════════════════════════════════════════
// Metadata parsing helpers
// ═══════════════════════════════════════════════════════════════════════════

assert.strictEqual(parseBarAlchemyMetadata(null), null, 'Null input returns null')
assert.strictEqual(parseBarAlchemyMetadata(JSON.stringify({ foo: 'bar' })), null, 'Non-alchemy JSON returns null')
assert.strictEqual(parseBarAlchemyMetadata('not json'), null, 'Invalid JSON returns null')

{
  const meta: ActionBarMetadata = {
    alchemyEngine: true,
    arcPhase: 'action',
    channel: 'Anger',
    regulation: { from: 'neutral', to: 'neutral' },
    waveMove: 'wakeUp',
    face: 'challenger',
    challengerMoveId: 'issue_challenge',
    challengerMove: {
      moveId: 'issue_challenge',
      canonicalMoveId: 'fire_transcend',
      title: 'Issue Challenge',
      energyDelta: 2,
      element: 'fire',
      narrative: 'Anger → boundary honored',
    },
  }
  const result = parseBarAlchemyMetadata(JSON.stringify(meta))
  assert.deepStrictEqual(result, meta, 'Parses valid alchemy metadata')
}

// ─── isAlchemyBar ──────────────────────────────────────────────────────────
assert.strictEqual(isAlchemyBar(JSON.stringify({ alchemyEngine: true, arcPhase: 'action' })), true, 'Alchemy BAR detected')
assert.strictEqual(isAlchemyBar(JSON.stringify({ type: 'regular' })), false, 'Non-alchemy BAR rejected')
assert.strictEqual(isAlchemyBar(null), false, 'Null rejected')

// ─── getActionBarChallengerMove ────────────────────────────────────────────
{
  const meta: ActionBarMetadata = {
    alchemyEngine: true,
    arcPhase: 'action',
    channel: 'Anger',
    regulation: { from: 'neutral', to: 'neutral' },
    waveMove: 'wakeUp',
    face: 'challenger',
    challengerMoveId: 'issue_challenge',
    challengerMove: {
      moveId: 'issue_challenge',
      canonicalMoveId: 'fire_transcend',
      title: 'Issue Challenge',
      energyDelta: 2,
      element: 'fire',
      narrative: 'Anger → boundary honored',
    },
  }
  const result = getActionBarChallengerMove(JSON.stringify(meta))
  assert.deepStrictEqual(result, meta.challengerMove, 'Extracts challenger move from action BAR')
}

assert.strictEqual(
  getActionBarChallengerMove(JSON.stringify({ alchemyEngine: true, arcPhase: 'intake' })),
  null,
  'Returns null for intake BAR',
)
assert.strictEqual(getActionBarChallengerMove(null), null, 'Returns null for null')

// ─── Move element/energy helpers ───────────────────────────────────────────
assert.strictEqual(getChallengerMoveElement('issue_challenge'), 'fire', 'issue_challenge element is fire')
assert.strictEqual(getChallengerMoveElement('propose_move'), 'fire', 'propose_move element is fire')
assert.strictEqual(getChallengerMoveEnergyDelta('issue_challenge'), 2, 'issue_challenge energy +2')
assert.strictEqual(getChallengerMoveEnergyDelta('propose_move'), 1, 'propose_move energy +1')

// ═══════════════════════════════════════════════════════════════════════════
// Cross-phase BAR consistency
// ═══════════════════════════════════════════════════════════════════════════

{
  const playerId = 'player-arc-1'
  const channel = 'Fear' as const

  const intake = buildIntakeBarData({ playerId, channel, content: 'stuck' })
  const action = buildActionBarData({ playerId, channel, moveId: 'issue_challenge', response: 'commit' })
  const reflection = buildReflectionBarData({ playerId, channel, content: 'epiphany' })

  // All 3 share same nation/channel
  assert.strictEqual(intake.nation, 'fear', 'Intake nation is fear')
  assert.strictEqual(action.nation, 'fear', 'Action nation is fear')
  assert.strictEqual(reflection.nation, 'fear', 'Reflection nation is fear')

  assert.strictEqual(intake.emotionalAlchemyTag, 'fear')
  assert.strictEqual(action.emotionalAlchemyTag, 'fear')
  assert.strictEqual(reflection.emotionalAlchemyTag, 'fear')

  // All 3 have distinct types
  assert.strictEqual(intake.type, 'intake')
  assert.strictEqual(action.type, 'action')
  assert.strictEqual(reflection.type, 'reflection')
  const types = new Set([intake.type, action.type, reflection.type])
  assert.strictEqual(types.size, 3, 'All 3 phase BAR types are distinct')

  // All 3 share same face + wave move defaults
  assert.strictEqual(intake.gameMasterFace, 'challenger')
  assert.strictEqual(action.gameMasterFace, 'challenger')
  assert.strictEqual(reflection.gameMasterFace, 'challenger')
  assert.strictEqual(intake.moveType, 'wakeUp')
  assert.strictEqual(action.moveType, 'wakeUp')
  assert.strictEqual(reflection.moveType, 'wakeUp')

  // Only reflection has isEpiphany
  const intakeMeta = JSON.parse(intake.strandMetadata)
  const actionMeta = JSON.parse(action.strandMetadata)
  const reflectionMeta = JSON.parse(reflection.strandMetadata)

  assert.strictEqual(intakeMeta.isEpiphany, undefined, 'Intake is not epiphany')
  assert.strictEqual(actionMeta.isEpiphany, undefined, 'Action is not epiphany')
  assert.strictEqual(reflectionMeta.isEpiphany, true, 'Reflection IS the epiphany')
}

// ═══════════════════════════════════════════════════════════════════════════
// AC 8: All 3 BARs typed to Wake Up
// Validates that every BAR produced by the vertical slice carries
// moveType = 'wakeUp' both on the BarCreateData AND inside strandMetadata.
// ═══════════════════════════════════════════════════════════════════════════

{
  // Test across ALL emotional channels to ensure Wake Up typing is universal
  const channels: Array<'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'> = [
    'Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality',
  ]

  for (const channel of channels) {
    const intake = buildIntakeBarData({ playerId: 'p-ac8', channel, content: 'intake' })
    const action = buildActionBarData({ playerId: 'p-ac8', channel, moveId: 'issue_challenge', response: 'action' })
    const reflection = buildReflectionBarData({ playerId: 'p-ac8', channel, content: 'reflect' })

    const bars = [
      { name: 'Intake', data: intake },
      { name: 'Action', data: action },
      { name: 'Reflection', data: reflection },
    ]

    for (const { name, data } of bars) {
      // Top-level moveType field on BarCreateData
      assert.strictEqual(
        data.moveType,
        'wakeUp',
        `AC8: ${name} BAR (${channel}) moveType must be 'wakeUp', got '${data.moveType}'`,
      )

      // strandMetadata.waveMove must also be 'wakeUp'
      const meta = JSON.parse(data.strandMetadata)
      assert.strictEqual(
        meta.waveMove,
        'wakeUp',
        `AC8: ${name} BAR (${channel}) strandMetadata.waveMove must be 'wakeUp', got '${meta.waveMove}'`,
      )
    }
  }
}

// Verify VERTICAL_SLICE constant enforces Wake Up
assert.strictEqual(
  VERTICAL_SLICE.waveMove,
  'wakeUp',
  'AC8: VERTICAL_SLICE.waveMove must be "wakeUp"',
)

// assertWakeUpTyping passes for valid BARs
{
  const data = buildIntakeBarData({ playerId: 'p-guard', channel: 'Joy', content: 'test' })
  assert.doesNotThrow(() => assertWakeUpTyping(data), 'assertWakeUpTyping passes for wakeUp BAR')
}

// assertWakeUpTyping rejects non-wakeUp BARs
{
  const data = buildIntakeBarData({ playerId: 'p-guard', channel: 'Joy', content: 'test' })
  data.moveType = 'cleanUp' // simulate misconfiguration
  assert.throws(
    () => assertWakeUpTyping(data),
    /must be 'wakeUp'/,
    'assertWakeUpTyping rejects non-wakeUp BAR',
  )
}

console.log('✅ bar-production.test.ts — all assertions passed (including AC8: all 3 BARs typed to Wake Up)')
