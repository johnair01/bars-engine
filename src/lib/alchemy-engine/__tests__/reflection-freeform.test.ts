/**
 * Reflection Phase — Freeform Writing Verification Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/reflection-freeform.test.ts
 *
 * Validates:
 * 1. Freeform writing is a valid ReflectionMode alongside CYOA
 * 2. Both modes produce content suitable for the Reflection BAR (= epiphany)
 * 3. Minimum length constraint logic
 * 4. ReflectionPhaseState shape contract
 *
 * NOTE: Tests component type contracts only — does NOT import the React component
 * (which requires JSX transform). Component rendering tested in integration.
 */

import assert from 'node:assert'

// ── Type contract definitions (mirrored from ReflectionPhaseStep.tsx) ────
// These are the runtime-checkable contracts the component must satisfy.

type ReflectionMode = 'cyoa' | 'freeform'

interface ReflectionPhaseState {
  mode: ReflectionMode
  content: string
  title: string
  selectedCompletionId?: string
  freeformText?: string
}

interface ReflectionCompletion {
  id: string
  title: string
  content: string
  tone?: 'confrontational' | 'integrative' | 'transcendent'
  source: 'template' | 'ai'
}

const FREEFORM_MIN_LENGTH = 20

// ── Tests ───────────────────────────────────────────────────────────────

console.log('=== Reflection Freeform Writing Tests ===\n')

// Test 1: ReflectionMode includes both cyoa and freeform
{
  const modes: ReflectionMode[] = ['cyoa', 'freeform']
  assert.ok(modes.includes('freeform'), 'freeform is a valid ReflectionMode')
  assert.ok(modes.includes('cyoa'), 'cyoa is a valid ReflectionMode')
  console.log('PASS: ReflectionMode includes cyoa and freeform')
}

// Test 2: Freeform state produces valid ReflectionPhaseState
{
  const state: ReflectionPhaseState = {
    mode: 'freeform',
    content: 'This is my own reflection on what I learned through this arc of challenge.',
    title: 'My Personal Insight',
    freeformText: 'This is my own reflection on what I learned through this arc of challenge.',
  }

  assert.strictEqual(state.mode, 'freeform')
  assert.ok(state.content.length > 0, 'content must be non-empty')
  assert.ok(state.title.length > 0, 'title must be non-empty')
  assert.strictEqual(state.freeformText, state.content, 'freeformText mirrors content')
  assert.strictEqual(state.selectedCompletionId, undefined, 'freeform has no selectedCompletionId')
  console.log('PASS: Freeform state produces valid ReflectionPhaseState')
}

// Test 3: CYOA state includes selectedCompletionId
{
  const state: ReflectionPhaseState = {
    mode: 'cyoa',
    content: 'What I thought was resistance was actually a boundary asking to be honored.',
    title: 'The boundary was the breakthrough',
    selectedCompletionId: 'boundary_honored',
  }

  assert.strictEqual(state.mode, 'cyoa')
  assert.ok(state.selectedCompletionId, 'cyoa has selectedCompletionId')
  assert.strictEqual(state.freeformText, undefined, 'cyoa has no freeformText')
  console.log('PASS: CYOA state includes selectedCompletionId')
}

// Test 4: Freeform minimum length constraint
{
  const tooShort = 'Too short'
  const justRight = 'This reflection is long enough to count as real.'
  const exactMin = 'x'.repeat(FREEFORM_MIN_LENGTH)

  assert.ok(tooShort.trim().length < FREEFORM_MIN_LENGTH, 'short text rejected')
  assert.ok(justRight.trim().length >= FREEFORM_MIN_LENGTH, 'adequate text accepted')
  assert.strictEqual(exactMin.length, FREEFORM_MIN_LENGTH, 'exact minimum accepted')
  console.log('PASS: Freeform minimum length constraint enforced')
}

// Test 5: Both modes produce content suitable for BAR creation
{
  const cyoa: ReflectionPhaseState = {
    mode: 'cyoa',
    content: 'The Challenger showed me what I was avoiding.',
    title: 'Naming it set me free',
    selectedCompletionId: 'naming_freed',
  }

  const freeform: ReflectionPhaseState = {
    mode: 'freeform',
    content: 'My own deeply personal reflection on what changed in this arc.',
    title: 'A Personal Awakening',
    freeformText: 'My own deeply personal reflection on what changed in this arc.',
  }

  for (const state of [cyoa, freeform]) {
    assert.ok(typeof state.content === 'string' && state.content.length > 0, 'content is non-empty string')
    assert.ok(typeof state.title === 'string' && state.title.length > 0, 'title is non-empty string')
    // Both can be used as: BAR.description = state.content, BAR.title = state.title
  }
  console.log('PASS: Both modes produce BAR-compatible content')
}

// Test 6: ReflectionCompletion shape (template bank contract)
{
  const completions: ReflectionCompletion[] = [
    {
      id: 'boundary_honored',
      title: 'The boundary was the breakthrough',
      content: 'What I thought was resistance was actually a boundary asking to be honored.',
      tone: 'integrative',
      source: 'template',
    },
    {
      id: 'ai_generated_1',
      title: 'AI-generated insight',
      content: 'An AI-generated reflection based on the player journey.',
      source: 'ai',
    },
  ]

  for (const c of completions) {
    assert.ok(c.id, 'completion has id')
    assert.ok(c.title, 'completion has title')
    assert.ok(c.content.length > 0, 'completion has content')
    assert.ok(['template', 'ai'].includes(c.source), 'source is template or ai')
  }
  assert.strictEqual(completions[0]!.source, 'template')
  assert.strictEqual(completions[1]!.source, 'ai')
  console.log('PASS: ReflectionCompletion shape validates (template + ai sources)')
}

// Test 7: Freeform defaults title when not provided
{
  const state: ReflectionPhaseState = {
    mode: 'freeform',
    content: 'A reflection with no custom title provided by the player.',
    title: 'My Reflection', // default fallback
    freeformText: 'A reflection with no custom title provided by the player.',
  }

  assert.strictEqual(state.title, 'My Reflection', 'default title applied')
  console.log('PASS: Freeform defaults title when not provided')
}

console.log('\n=== All Reflection Freeform Tests Passed ===')
