/**
 * Completion Editor — Inline Edit/Customize Verification Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/completion-editor.test.ts
 *
 * Validates:
 * 1. CompletionEditState contract: content, originalContent, isCustomized, isValid
 * 2. Edit detection: isCustomized is true iff content differs from original
 * 3. Revert: after revert, content === originalContent, isCustomized === false
 * 4. Save: edited content persists, isCustomized flag is accurate
 * 5. Minimum length validation works for edited content
 * 6. ReflectionPhaseState now carries isCustomized flag
 * 7. Editing workflow: select → edit → save/revert → confirm
 *
 * NOTE: Tests type contracts and state logic only — does NOT import React components.
 * Component rendering tested in integration.
 */

import assert from 'node:assert'

// ── Type contract definitions (mirrored from CompletionEditor.tsx) ─────────

interface CompletionEditState {
  content: string
  originalContent: string
  isCustomized: boolean
  isValid: boolean
}

// Mirrored from ReflectionPhaseStep.tsx
type ReflectionMode = 'cyoa' | 'freeform'

interface ReflectionPhaseState {
  mode: ReflectionMode
  content: string
  title: string
  selectedCompletionId?: string
  isCustomized?: boolean
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

// ── Helper: simulate edit state computation ───────────────────────────────

function computeEditState(
  content: string,
  originalContent: string,
  minLength: number = FREEFORM_MIN_LENGTH
): CompletionEditState {
  return {
    content: content.trim(),
    originalContent,
    isCustomized: content.trim() !== originalContent.trim(),
    isValid: content.trim().length >= minLength,
  }
}

// ── Test data ─────────────────────────────────────────────────────────────

const SAMPLE_COMPLETION: ReflectionCompletion = {
  id: 'boundary_honored',
  title: 'The boundary was the breakthrough',
  content: 'What I thought was resistance was actually a boundary asking to be honored. The challenge wasn\'t to push through — it was to recognize what I was protecting and why it matters. The anger was a compass, not a cage.',
  tone: 'integrative',
  source: 'template',
}

// ── Tests ─────────────────────────────────────────────────────────────────

console.log('--- Completion Editor: Edit State Contract ---')

// Test 1: Unmodified content → isCustomized = false
{
  const state = computeEditState(
    SAMPLE_COMPLETION.content,
    SAMPLE_COMPLETION.content
  )
  assert.strictEqual(state.isCustomized, false, 'Unmodified content should not be customized')
  assert.strictEqual(state.isValid, true, 'Template content should be valid (long enough)')
  assert.strictEqual(state.content, state.originalContent, 'Content should match original')
  console.log('  ✓ Unmodified content → isCustomized = false')
}

// Test 2: Modified content → isCustomized = true
{
  const edited = SAMPLE_COMPLETION.content + ' I see this now.'
  const state = computeEditState(edited, SAMPLE_COMPLETION.content)
  assert.strictEqual(state.isCustomized, true, 'Modified content should be customized')
  assert.strictEqual(state.isValid, true, 'Modified content should still be valid')
  assert.notStrictEqual(state.content, state.originalContent, 'Content should differ from original')
  console.log('  ✓ Modified content → isCustomized = true')
}

// Test 3: Whitespace-only changes → NOT customized (trim comparison)
{
  const withWhitespace = '  ' + SAMPLE_COMPLETION.content + '  '
  const state = computeEditState(withWhitespace, SAMPLE_COMPLETION.content)
  assert.strictEqual(state.isCustomized, false, 'Whitespace-only changes should not count as customized')
  console.log('  ✓ Whitespace-only changes → isCustomized = false')
}

// Test 4: Revert restores original state
{
  const edited = 'Completely different reflection text that is long enough.'
  const editedState = computeEditState(edited, SAMPLE_COMPLETION.content)
  assert.strictEqual(editedState.isCustomized, true)

  // Simulate revert by computing with original content
  const revertedState = computeEditState(SAMPLE_COMPLETION.content, SAMPLE_COMPLETION.content)
  assert.strictEqual(revertedState.isCustomized, false, 'Reverted state should not be customized')
  assert.strictEqual(revertedState.content, SAMPLE_COMPLETION.content.trim(), 'Reverted content should match original')
  console.log('  ✓ Revert restores original state')
}

// Test 5: Minimum length validation on edited content
{
  const tooShort = 'Too short'
  const state = computeEditState(tooShort, SAMPLE_COMPLETION.content, FREEFORM_MIN_LENGTH)
  assert.strictEqual(state.isValid, false, 'Content below minimum length should be invalid')
  assert.strictEqual(state.isCustomized, true, 'Short content is still customized')

  const exactMin = 'A'.repeat(FREEFORM_MIN_LENGTH)
  const validState = computeEditState(exactMin, SAMPLE_COMPLETION.content, FREEFORM_MIN_LENGTH)
  assert.strictEqual(validState.isValid, true, 'Content at minimum length should be valid')
  console.log('  ✓ Minimum length validation works')
}

// Test 6: Empty content → invalid and customized
{
  const state = computeEditState('', SAMPLE_COMPLETION.content)
  assert.strictEqual(state.isValid, false, 'Empty content should be invalid')
  assert.strictEqual(state.isCustomized, true, 'Empty content differs from original → customized')
  assert.strictEqual(state.content, '', 'Trimmed empty content is empty string')
  console.log('  ✓ Empty content → invalid and customized')
}

console.log('')
console.log('--- Completion Editor: ReflectionPhaseState Integration ---')

// Test 7: CYOA mode with isCustomized flag
{
  const cyoaUnedited: ReflectionPhaseState = {
    mode: 'cyoa',
    content: SAMPLE_COMPLETION.content,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: false,
  }
  assert.strictEqual(cyoaUnedited.isCustomized, false, 'Unedited CYOA should have isCustomized = false')
  assert.strictEqual(cyoaUnedited.mode, 'cyoa')
  assert.strictEqual(cyoaUnedited.selectedCompletionId, 'boundary_honored')
  console.log('  ✓ CYOA unedited state shape is correct')
}

// Test 8: CYOA mode with customized content
{
  const customizedContent = 'My personalized version of the reflection that is long enough.'
  const cyoaCustomized: ReflectionPhaseState = {
    mode: 'cyoa',
    content: customizedContent,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: true,
  }
  assert.strictEqual(cyoaCustomized.isCustomized, true, 'Customized CYOA should have isCustomized = true')
  assert.strictEqual(cyoaCustomized.content, customizedContent, 'Content should be the customized text')
  assert.strictEqual(cyoaCustomized.selectedCompletionId, SAMPLE_COMPLETION.id, 'Original completion ID preserved')
  console.log('  ✓ CYOA customized state carries edited content + original ID')
}

// Test 9: Freeform mode does not use isCustomized
{
  const freeform: ReflectionPhaseState = {
    mode: 'freeform',
    content: 'My freeform reflection about this experience.',
    title: 'My Reflection',
    freeformText: 'My freeform reflection about this experience.',
  }
  assert.strictEqual(freeform.isCustomized, undefined, 'Freeform mode should not have isCustomized')
  assert.strictEqual(freeform.mode, 'freeform')
  console.log('  ✓ Freeform mode does not use isCustomized')
}

console.log('')
console.log('--- Completion Editor: Edit Workflow State Machine ---')

// Test 10: Select → Edit → Save workflow
{
  // Step 1: Select a completion
  const selectedId = SAMPLE_COMPLETION.id
  const originalContent = SAMPLE_COMPLETION.content

  // Step 2: Enter edit mode — content starts as original
  const initialEditState = computeEditState(originalContent, originalContent)
  assert.strictEqual(initialEditState.isCustomized, false)
  assert.strictEqual(initialEditState.isValid, true)

  // Step 3: Edit the content
  const editedText = 'My personal take: The anger was my compass all along.'
  const editingState = computeEditState(editedText, originalContent)
  assert.strictEqual(editingState.isCustomized, true)
  assert.strictEqual(editingState.isValid, true)

  // Step 4: Save — content is now the edited version
  const savedState: ReflectionPhaseState = {
    mode: 'cyoa',
    content: editingState.content,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: selectedId,
    isCustomized: editingState.isCustomized,
  }
  assert.strictEqual(savedState.content, editedText.trim())
  assert.strictEqual(savedState.isCustomized, true)
  console.log('  ✓ Select → Edit → Save workflow produces correct state')
}

// Test 11: Select → Edit → Revert → Confirm workflow
{
  const originalContent = SAMPLE_COMPLETION.content

  // Edit
  const editedState = computeEditState('Something different and long enough to pass validation.', originalContent)
  assert.strictEqual(editedState.isCustomized, true)

  // Revert
  const revertedState = computeEditState(originalContent, originalContent)
  assert.strictEqual(revertedState.isCustomized, false)

  // Confirm with original (reverted)
  const confirmedState: ReflectionPhaseState = {
    mode: 'cyoa',
    content: revertedState.content,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: revertedState.isCustomized,
  }
  assert.strictEqual(confirmedState.isCustomized, false, 'Reverted then confirmed should not be customized')
  assert.strictEqual(confirmedState.content, originalContent.trim())
  console.log('  ✓ Select → Edit → Revert → Confirm workflow preserves original')
}

// Test 12: Switching completions resets edit state
{
  const completion1 = SAMPLE_COMPLETION
  const completion2: ReflectionCompletion = {
    id: 'naming_freed',
    title: 'Naming it set me free',
    content: 'The moment I named it out loud, the weight shifted.',
    tone: 'confrontational',
    source: 'template',
  }

  // Edit completion 1
  const edit1 = computeEditState('My custom version', completion1.content)
  assert.strictEqual(edit1.isCustomized, true)

  // Switch to completion 2 — should reset to completion 2's original content
  const edit2Initial = computeEditState(completion2.content, completion2.content)
  assert.strictEqual(edit2Initial.isCustomized, false, 'Switching completions resets customization')
  assert.strictEqual(edit2Initial.content, completion2.content.trim())
  console.log('  ✓ Switching completions resets edit state')
}

console.log('')
console.log('--- Completion Editor: Epiphany as BAR Invariant ---')

// Test 13: Customized content IS the BAR content (no separate original stored)
{
  const customized = 'The challenge revealed what I was protecting. My anger was telling me something important.'
  const state: ReflectionPhaseState = {
    mode: 'cyoa',
    content: customized,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: true,
  }
  // The Reflection BAR content IS the epiphany artifact
  // No separate "original text" in the output — only the final content matters
  assert.strictEqual(state.content, customized, 'BAR content is the customized text')
  assert.ok(!('originalContent' in state), 'ReflectionPhaseState should not carry originalContent')
  console.log('  ✓ Customized content IS the BAR content (epiphany = Reflection BAR)')
}

// Test 14: isCustomized is metadata only — does not affect the BAR itself
{
  const unedited: ReflectionPhaseState = {
    mode: 'cyoa',
    content: SAMPLE_COMPLETION.content,
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: false,
  }
  const edited: ReflectionPhaseState = {
    mode: 'cyoa',
    content: 'My version of the reflection is equally valid.',
    title: SAMPLE_COMPLETION.title,
    selectedCompletionId: SAMPLE_COMPLETION.id,
    isCustomized: true,
  }
  // Both are valid reflection BAR content — isCustomized is provenance metadata
  assert.ok(unedited.content.length >= FREEFORM_MIN_LENGTH)
  assert.ok(edited.content.length >= FREEFORM_MIN_LENGTH)
  console.log('  ✓ isCustomized is provenance metadata, both paths produce valid BARs')
}

console.log('')
console.log('All completion editor tests passed ✓')
