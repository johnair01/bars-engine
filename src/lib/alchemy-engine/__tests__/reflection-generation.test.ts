/**
 * Reflection Generation — Unit Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/reflection-generation.test.ts
 *
 * Tests the prompt template and suggestion builders for the Reflection phase.
 * All tests are pure (no DB, no AI) — they exercise static suggestion generation,
 * prompt construction, and channel-typing logic.
 *
 * Key invariants tested:
 *   - 3 channel-typed suggestions produced (direct, generative, challenging)
 *   - Each suggestion typed to a different emotional channel
 *   - Wuxing shēng/kè cycles correctly determine neighbor channels
 *   - Non-AI path produces complete suggestions from CYOA data alone
 *   - AI prompt templates include correct channel context and constraints
 *   - Suggestion body references player's actual intake/action content
 */

import assert from 'node:assert'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import {
  buildStaticCompletionSuggestions,
  buildCompletionSystemPrompt,
  buildCompletionUserPrompt,
  getChannelElement,
  getChannelNeighbors,
  type ReflectionCompletionSuggestion,
  type ReflectionCompletionSet,
} from '../reflection-generation'
import type { ReflectionContext } from '../reflection-aggregator'

// ═══════════════════════════════════════════════════════════════════════════
// Test fixture: a complete ReflectionContext
// ═══════════════════════════════════════════════════════════════════════════

function makeReflectionContext(channel: EmotionalChannel = 'Anger'): ReflectionContext {
  return {
    playerId: 'player-test-1',
    channel,
    face: 'challenger',
    waveMove: 'wakeUp',
    currentPhase: 'reflection',
    arcStartedAt: new Date('2026-04-07T10:00:00Z'),
    regulationTrajectory: {
      intake: { from: 'dissatisfied', to: 'neutral' },
      action: { from: 'neutral', to: 'neutral' },
      reflection: { from: 'neutral', to: 'satisfied' },
    },
    intake: {
      barId: 'bar-intake-1',
      title: 'Wake Up — Anger Intake',
      content: 'I am frustrated with how my team ignores my boundaries.',
      channel: channel.toLowerCase(),
      regulationFrom: 'dissatisfied',
      regulationTo: 'neutral',
      createdAt: new Date('2026-04-07T10:05:00Z'),
    },
    action: {
      barId: 'bar-action-1',
      title: 'Issue Challenge — Anger Action',
      content: 'I will name the boundary that keeps getting crossed and hold it clearly.',
      moveId: 'issue_challenge',
      moveTitle: 'Issue Challenge',
      canonicalMoveId: 'fire_transcend',
      energyDelta: 2,
      moveNarrative: 'Anger → boundary honored',
      channel: channel.toLowerCase(),
      regulationFrom: 'neutral',
      regulationTo: 'neutral',
      createdAt: new Date('2026-04-07T10:15:00Z'),
    },
    narrativeSummary: 'Arc: challenger face / Wake Up\nChannel: Anger\n...',
    reflectionPrompts: [
      {
        key: 'naming_impact',
        text: 'You named your dissatisfaction in Anger. Then you chose to "Issue Challenge." What shifted?',
        sourcePhase: 'both',
        placeholder: 'What changed...',
      },
      {
        key: 'action_evaluation',
        text: 'You issued a challenge — did the boundary feel real once you said it?',
        sourcePhase: 'action',
        placeholder: 'Looking back...',
      },
      {
        key: 'epiphany',
        text: 'What do you see now that you couldn\'t see before?',
        sourcePhase: 'both',
        placeholder: 'The thing I see now is...',
      },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Static suggestion builder tests
// ═══════════════════════════════════════════════════════════════════════════

// ─── Produces exactly 3 suggestions ─────────────────────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const result = buildStaticCompletionSuggestions(ctx)
  assert.strictEqual(result.suggestions.length, 3, 'Should produce exactly 3 suggestions')
  assert.strictEqual(result.source, 'static', 'Source should be "static"')
  console.log('✓ Produces exactly 3 suggestions with source=static')
}

// ─── Suggestion keys are correct ────────────────────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const keys = result.suggestions.map((s) => s.key)
  assert.deepStrictEqual(keys, ['channel_aligned', 'adjacent', 'cross'], 'Keys should be channel_aligned, adjacent, cross')
  console.log('✓ Suggestion keys are channel_aligned, adjacent, cross')
}

// ─── Framings are correct ───────────────────────────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const framings = result.suggestions.map((s) => s.framing)
  assert.deepStrictEqual(framings, ['direct', 'generative', 'challenging'], 'Framings should be direct, generative, challenging')
  console.log('✓ Framings are direct, generative, challenging')
}

// ─── Channel-aligned suggestion uses primary channel ────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const aligned = result.suggestions[0]
  assert.strictEqual(aligned.channel, 'Anger', 'Channel-aligned should use primary channel')
  assert.strictEqual(aligned.element, 'Fire', 'Anger maps to Fire element')
  console.log('✓ Channel-aligned uses primary channel (Anger → Fire)')
}

// ─── Adjacent suggestion uses shēng neighbor ────────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const adjacent = result.suggestions[1]
  // Anger (Fire) → shēng → Neutrality (Earth)
  assert.strictEqual(adjacent.channel, 'Neutrality', 'Adjacent should use shēng neighbor')
  assert.strictEqual(adjacent.element, 'Earth', 'Neutrality maps to Earth element')
  assert.strictEqual(adjacent.framing, 'generative', 'Adjacent framing should be generative')
  console.log('✓ Adjacent uses shēng neighbor (Anger → Neutrality/Earth)')
}

// ─── Cross suggestion uses kè neighbor ──────────────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const cross = result.suggestions[2]
  // Anger (Fire) → kè → Fear (Metal)
  assert.strictEqual(cross.channel, 'Fear', 'Cross should use kè neighbor')
  assert.strictEqual(cross.element, 'Metal', 'Fear maps to Metal element')
  assert.strictEqual(cross.framing, 'challenging', 'Cross framing should be challenging')
  console.log('✓ Cross uses kè neighbor (Anger → Fear/Metal)')
}

// ─── All 3 suggestions have different channels ──────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const channels = new Set(result.suggestions.map((s) => s.channel))
  assert.strictEqual(channels.size, 3, 'All 3 suggestions should have different channels')
  console.log('✓ All 3 suggestions have different channels')
}

// ─── Suggestion bodies reference player intake content ──────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const allBodies = result.suggestions.map((s) => s.body).join(' ')
  assert.ok(allBodies.includes('boundaries'), 'Bodies should reference player intake content')
  console.log('✓ Suggestion bodies reference player intake content')
}

// ─── Suggestion bodies reference action move ────────────────────────────
{
  const result = buildStaticCompletionSuggestions(makeReflectionContext('Anger'))
  const allBodies = result.suggestions.map((s) => s.body).join(' ')
  assert.ok(allBodies.includes('Issue Challenge'), 'Bodies should reference action move')
  console.log('✓ Suggestion bodies reference action move')
}

// ─── Context summary carries correct metadata ───────────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const result = buildStaticCompletionSuggestions(ctx)
  assert.strictEqual(result.contextSummary.playerId, 'player-test-1')
  assert.strictEqual(result.contextSummary.channel, 'Anger')
  assert.strictEqual(result.contextSummary.face, 'challenger')
  assert.strictEqual(result.contextSummary.waveMove, 'wakeUp')
  assert.strictEqual(result.contextSummary.intakeBarId, 'bar-intake-1')
  assert.strictEqual(result.contextSummary.actionBarId, 'bar-action-1')
  console.log('✓ Context summary carries correct metadata')
}

// ═══════════════════════════════════════════════════════════════════════════
// Channel cycle tests — all 5 channels produce valid suggestions
// ═══════════════════════════════════════════════════════════════════════════

const ALL_CHANNELS: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']

for (const channel of ALL_CHANNELS) {
  const result = buildStaticCompletionSuggestions(makeReflectionContext(channel))

  // Each channel should produce 3 distinct suggestions
  assert.strictEqual(result.suggestions.length, 3, `${channel}: should produce 3 suggestions`)

  // All suggestions have non-empty bodies
  for (const s of result.suggestions) {
    assert.ok(s.body.length > 20, `${channel}/${s.key}: body should be substantial`)
    assert.ok(s.title.length > 5, `${channel}/${s.key}: title should be non-trivial`)
    assert.ok(s.element, `${channel}/${s.key}: element should be set`)
  }

  // All 3 channels should be distinct
  const channels = new Set(result.suggestions.map((s) => s.channel))
  assert.strictEqual(channels.size, 3, `${channel}: all 3 suggestions should have distinct channels`)

  console.log(`✓ ${channel} produces 3 valid, distinct suggestions`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Wuxing neighbor helpers
// ═══════════════════════════════════════════════════════════════════════════

// ─── getChannelElement maps correctly ───────────────────────────────────
{
  assert.strictEqual(getChannelElement('Fear'), 'Metal')
  assert.strictEqual(getChannelElement('Anger'), 'Fire')
  assert.strictEqual(getChannelElement('Sadness'), 'Water')
  assert.strictEqual(getChannelElement('Joy'), 'Wood')
  assert.strictEqual(getChannelElement('Neutrality'), 'Earth')
  console.log('✓ getChannelElement maps all 5 channels correctly')
}

// ─── getChannelNeighbors returns correct shēng/kè neighbors ────────────
{
  const anger = getChannelNeighbors('Anger')
  assert.strictEqual(anger.generative, 'Neutrality', 'Anger generative → Neutrality')
  assert.strictEqual(anger.control, 'Fear', 'Anger control → Fear')

  const fear = getChannelNeighbors('Fear')
  assert.strictEqual(fear.generative, 'Sadness', 'Fear generative → Sadness')
  assert.strictEqual(fear.control, 'Joy', 'Fear control → Joy')

  const joy = getChannelNeighbors('Joy')
  assert.strictEqual(joy.generative, 'Anger', 'Joy generative → Anger')
  assert.strictEqual(joy.control, 'Neutrality', 'Joy control → Neutrality')

  console.log('✓ getChannelNeighbors returns correct shēng/kè pairs')
}

// ═══════════════════════════════════════════════════════════════════════════
// AI prompt template tests
// ═══════════════════════════════════════════════════════════════════════════

// ─── System prompt contains Challenger persona ──────────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const system = buildCompletionSystemPrompt(ctx)
  assert.ok(system.includes('Challenger'), 'System prompt should reference Challenger face')
  assert.ok(system.includes('Wake Up'), 'System prompt should reference Wake Up WAVE')
  assert.ok(system.includes('channel_aligned'), 'System prompt should describe channel_aligned suggestion')
  assert.ok(system.includes('adjacent'), 'System prompt should describe adjacent suggestion')
  assert.ok(system.includes('cross'), 'System prompt should describe cross suggestion')
  console.log('✓ System prompt contains Challenger persona and 3-suggestion structure')
}

// ─── System prompt contains channel-specific context ────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const system = buildCompletionSystemPrompt(ctx)
  assert.ok(system.includes('Fire'), 'Anger system prompt should include Fire element')
  assert.ok(system.includes('Earth'), 'Should include shēng neighbor Earth element')
  assert.ok(system.includes('Metal'), 'Should include kè neighbor Metal element')
  assert.ok(system.includes('shēng'), 'Should reference shēng cycle')
  assert.ok(system.includes('kè'), 'Should reference kè cycle')
  console.log('✓ System prompt contains channel-specific Wuxing context')
}

// ─── System prompt contains constraints ─────────────────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const system = buildCompletionSystemPrompt(ctx)
  assert.ok(system.includes('no flattery'), 'Should include Challenger constraint')
  assert.ok(system.includes('artifact'), 'Should mention BAR as artifact')
  assert.ok(system.includes('ACTUALLY wrote'), 'Should ground in player content')
  assert.ok(system.includes('2-5'), 'Should specify sentence count')
  console.log('✓ System prompt contains appropriate constraints')
}

// ─── User prompt contains player journey data ───────────────────────────
{
  const ctx = makeReflectionContext('Anger')
  const user = buildCompletionUserPrompt(ctx)
  assert.ok(user.includes('boundaries'), 'User prompt should include intake content')
  assert.ok(user.includes('Issue Challenge'), 'User prompt should include action move')
  assert.ok(user.includes('boundary'), 'User prompt should include action content')
  assert.ok(user.includes('Anger'), 'User prompt should include channel')
  assert.ok(user.includes('Fire'), 'User prompt should include element')
  console.log('✓ User prompt contains player journey data')
}

// ─── User prompt includes generation request with 3 channels ────────────
{
  const ctx = makeReflectionContext('Anger')
  const user = buildCompletionUserPrompt(ctx)
  assert.ok(user.includes('channel_aligned'), 'Should request channel_aligned')
  assert.ok(user.includes('adjacent'), 'Should request adjacent')
  assert.ok(user.includes('cross'), 'Should request cross')
  console.log('✓ User prompt includes 3-channel generation request')
}

// ─── User prompt includes reflection prompts when present ───────────────
{
  const ctx = makeReflectionContext('Anger')
  const user = buildCompletionUserPrompt(ctx)
  assert.ok(user.includes('naming_impact'), 'Should include reflection prompt keys')
  assert.ok(user.includes('epiphany'), 'Should include epiphany prompt')
  console.log('✓ User prompt includes reflection prompts')
}

// ─── Sadness channel produces Water-specific prompts ────────────────────
{
  const ctx = makeReflectionContext('Sadness')
  const system = buildCompletionSystemPrompt(ctx)
  assert.ok(system.includes('Water'), 'Sadness should map to Water')
  assert.ok(system.includes('Wood'), 'Sadness shēng neighbor should be Joy/Wood')
  assert.ok(system.includes('Fire'), 'Sadness kè neighbor should be Anger/Fire')
  console.log('✓ Sadness channel produces Water-specific prompts')
}

// ═══════════════════════════════════════════════════════════════════════════

console.log('\n✅ All reflection-generation tests passed')
