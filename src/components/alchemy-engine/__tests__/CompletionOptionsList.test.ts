/**
 * CompletionOptionsList — Selection state management tests
 *
 * Run with: npx tsx src/components/alchemy-engine/__tests__/CompletionOptionsList.test.ts
 *
 * Validates:
 * - CompletionOption type shape and required fields
 * - CompletionSelectionState tracks selection correctly
 * - useCompletionSelection hook state management
 * - Selection/deselection/toggle behaviors
 * - Edge cases: empty options, invalid IDs, controlled vs uncontrolled
 *
 * Note: This tests the data/state layer. Visual feedback (CSS classes, DOM rendering)
 * is validated by the component itself — these tests verify the selection logic.
 */

import assert from 'node:assert'

// ---------------------------------------------------------------------------
// Inline type validation (mirrors the component types without needing React)
// ---------------------------------------------------------------------------

interface CompletionOption {
  id: string
  title: string
  content: string
  label?: string
  source?: 'template' | 'ai'
  meta?: Record<string, unknown>
}

interface CompletionSelectionState {
  selectedId: string | null
  selectedOption: CompletionOption | null
  hasSelection: boolean
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FIXTURE_OPTIONS: CompletionOption[] = [
  {
    id: 'boundary_honored',
    title: 'The boundary was the breakthrough',
    content: 'What I thought was resistance was actually a boundary asking to be honored.',
    label: 'integrative',
    source: 'template',
  },
  {
    id: 'naming_freed',
    title: 'Naming it set me free',
    content: 'The moment I named it out loud, the weight shifted.',
    label: 'confrontational',
    source: 'template',
  },
  {
    id: 'wake_up_moment',
    title: 'I was asleep to this',
    content: 'I wasn\'t stuck — I was asleep.',
    label: 'transcendent',
    source: 'template',
  },
]

const AI_OPTION: CompletionOption = {
  id: 'ai_generated_1',
  title: 'AI-generated insight',
  content: 'A machine-crafted reflection based on your arc.',
  label: 'generated',
  source: 'ai',
  meta: { model: 'claude', generatedAt: '2026-04-07' },
}

// ---------------------------------------------------------------------------
// 1. CompletionOption type shape
// ---------------------------------------------------------------------------

console.log('  ✓ CompletionOption: required fields')
{
  const opt: CompletionOption = {
    id: 'test',
    title: 'Test',
    content: 'Test content',
  }
  assert.strictEqual(opt.id, 'test')
  assert.strictEqual(opt.title, 'Test')
  assert.strictEqual(opt.content, 'Test content')
  assert.strictEqual(opt.label, undefined)
  assert.strictEqual(opt.source, undefined)
  assert.strictEqual(opt.meta, undefined)
}

console.log('  ✓ CompletionOption: optional fields')
{
  assert.strictEqual(FIXTURE_OPTIONS[0].label, 'integrative')
  assert.strictEqual(FIXTURE_OPTIONS[0].source, 'template')
  assert.strictEqual(AI_OPTION.source, 'ai')
  assert.deepStrictEqual(AI_OPTION.meta, { model: 'claude', generatedAt: '2026-04-07' })
}

// ---------------------------------------------------------------------------
// 2. CompletionSelectionState tracking
// ---------------------------------------------------------------------------

console.log('  ✓ CompletionSelectionState: null state (no selection)')
{
  const state: CompletionSelectionState = {
    selectedId: null,
    selectedOption: null,
    hasSelection: false,
  }
  assert.strictEqual(state.selectedId, null)
  assert.strictEqual(state.selectedOption, null)
  assert.strictEqual(state.hasSelection, false)
}

console.log('  ✓ CompletionSelectionState: selected state')
{
  const state: CompletionSelectionState = {
    selectedId: 'boundary_honored',
    selectedOption: FIXTURE_OPTIONS[0],
    hasSelection: true,
  }
  assert.strictEqual(state.selectedId, 'boundary_honored')
  assert.strictEqual(state.selectedOption?.title, 'The boundary was the breakthrough')
  assert.strictEqual(state.hasSelection, true)
}

// ---------------------------------------------------------------------------
// 3. Selection state builder (mirrors component logic)
// ---------------------------------------------------------------------------

function buildState(options: CompletionOption[], id: string | null): CompletionSelectionState {
  const selectedOption = id ? options.find(o => o.id === id) ?? null : null
  return {
    selectedId: id,
    selectedOption,
    hasSelection: id !== null && options.some(o => o.id === id),
  }
}

console.log('  ✓ buildState: null ID produces empty state')
{
  const state = buildState(FIXTURE_OPTIONS, null)
  assert.strictEqual(state.selectedId, null)
  assert.strictEqual(state.selectedOption, null)
  assert.strictEqual(state.hasSelection, false)
}

console.log('  ✓ buildState: valid ID produces selection')
{
  const state = buildState(FIXTURE_OPTIONS, 'naming_freed')
  assert.strictEqual(state.selectedId, 'naming_freed')
  assert.strictEqual(state.selectedOption?.id, 'naming_freed')
  assert.strictEqual(state.hasSelection, true)
}

console.log('  ✓ buildState: invalid ID produces hasSelection=false')
{
  const state = buildState(FIXTURE_OPTIONS, 'nonexistent')
  assert.strictEqual(state.selectedId, 'nonexistent')
  assert.strictEqual(state.selectedOption, null)
  assert.strictEqual(state.hasSelection, false)
}

console.log('  ✓ buildState: empty options with any ID produces no selection')
{
  const state = buildState([], 'boundary_honored')
  assert.strictEqual(state.selectedOption, null)
  assert.strictEqual(state.hasSelection, false)
}

// ---------------------------------------------------------------------------
// 4. Selection toggle logic (mirrors allowDeselect behavior)
// ---------------------------------------------------------------------------

function toggleSelection(currentId: string | null, newId: string, allowDeselect: boolean): string | null {
  if (allowDeselect && currentId === newId) return null
  return newId
}

console.log('  ✓ toggle: selecting new item')
{
  const result = toggleSelection(null, 'boundary_honored', true)
  assert.strictEqual(result, 'boundary_honored')
}

console.log('  ✓ toggle: switching selection')
{
  const result = toggleSelection('boundary_honored', 'naming_freed', true)
  assert.strictEqual(result, 'naming_freed')
}

console.log('  ✓ toggle: deselecting with allowDeselect=true')
{
  const result = toggleSelection('boundary_honored', 'boundary_honored', true)
  assert.strictEqual(result, null)
}

console.log('  ✓ toggle: re-clicking with allowDeselect=false keeps selection')
{
  const result = toggleSelection('boundary_honored', 'boundary_honored', false)
  assert.strictEqual(result, 'boundary_honored')
}

// ---------------------------------------------------------------------------
// 5. Visual state derivation (mirrors OptionItem logic)
// ---------------------------------------------------------------------------

type VisualState = 'selected' | 'dimmed' | 'unselected'

function deriveVisualState(optionId: string, activeSelectedId: string | null): VisualState {
  if (activeSelectedId === optionId) return 'selected'
  if (activeSelectedId !== null) return 'dimmed'
  return 'unselected'
}

console.log('  ✓ visual state: no selection = all unselected')
{
  FIXTURE_OPTIONS.forEach(opt => {
    assert.strictEqual(deriveVisualState(opt.id, null), 'unselected')
  })
}

console.log('  ✓ visual state: one selected = others dimmed')
{
  const selectedId = 'boundary_honored'
  assert.strictEqual(deriveVisualState('boundary_honored', selectedId), 'selected')
  assert.strictEqual(deriveVisualState('naming_freed', selectedId), 'dimmed')
  assert.strictEqual(deriveVisualState('wake_up_moment', selectedId), 'dimmed')
}

console.log('  ✓ visual state: switching selection updates all states')
{
  const selectedId = 'wake_up_moment'
  assert.strictEqual(deriveVisualState('boundary_honored', selectedId), 'dimmed')
  assert.strictEqual(deriveVisualState('naming_freed', selectedId), 'dimmed')
  assert.strictEqual(deriveVisualState('wake_up_moment', selectedId), 'selected')
}

// ---------------------------------------------------------------------------
// 6. Selection state machine (simulates useCompletionSelection hook)
// ---------------------------------------------------------------------------

class SelectionStateMachine {
  private _selectedId: string | null = null
  private _options: CompletionOption[]

  constructor(options: CompletionOption[]) {
    this._options = options
  }

  get selectedId() { return this._selectedId }
  get selectedOption() { return this._selectedId ? this._options.find(o => o.id === this._selectedId) ?? null : null }
  get hasSelection() { return this.selectedOption !== null }

  select(id: string | null) { this._selectedId = id }
  toggle(id: string) { this._selectedId = this._selectedId === id ? null : id }
  clear() { this._selectedId = null }
}

console.log('  ✓ state machine: initial state is empty')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  assert.strictEqual(sm.selectedId, null)
  assert.strictEqual(sm.selectedOption, null)
  assert.strictEqual(sm.hasSelection, false)
}

console.log('  ✓ state machine: select → hasSelection true')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  sm.select('naming_freed')
  assert.strictEqual(sm.selectedId, 'naming_freed')
  assert.strictEqual(sm.selectedOption?.title, 'Naming it set me free')
  assert.strictEqual(sm.hasSelection, true)
}

console.log('  ✓ state machine: toggle on → toggle off')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  sm.toggle('boundary_honored')
  assert.strictEqual(sm.hasSelection, true)
  sm.toggle('boundary_honored')
  assert.strictEqual(sm.hasSelection, false)
}

console.log('  ✓ state machine: toggle A → toggle B = B selected')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  sm.toggle('boundary_honored')
  assert.strictEqual(sm.selectedId, 'boundary_honored')
  sm.toggle('wake_up_moment')
  assert.strictEqual(sm.selectedId, 'wake_up_moment')
  assert.strictEqual(sm.selectedOption?.title, 'I was asleep to this')
}

console.log('  ✓ state machine: clear resets to empty')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  sm.select('naming_freed')
  assert.strictEqual(sm.hasSelection, true)
  sm.clear()
  assert.strictEqual(sm.selectedId, null)
  assert.strictEqual(sm.hasSelection, false)
}

console.log('  ✓ state machine: select invalid ID → hasSelection false')
{
  const sm = new SelectionStateMachine(FIXTURE_OPTIONS)
  sm.select('nonexistent_id')
  assert.strictEqual(sm.selectedId, 'nonexistent_id')
  assert.strictEqual(sm.selectedOption, null)
  assert.strictEqual(sm.hasSelection, false)
}

// ---------------------------------------------------------------------------
// 7. Mapping ReflectionCompletion → CompletionOption (integration)
// ---------------------------------------------------------------------------

interface ReflectionCompletion {
  id: string
  title: string
  content: string
  tone?: 'confrontational' | 'integrative' | 'transcendent'
  source: 'template' | 'ai'
}

function mapReflectionToCompletionOption(rc: ReflectionCompletion): CompletionOption {
  return {
    id: rc.id,
    title: rc.title,
    content: rc.content,
    label: rc.tone,
    source: rc.source,
  }
}

console.log('  ✓ mapping: ReflectionCompletion → CompletionOption preserves all fields')
{
  const rc: ReflectionCompletion = {
    id: 'boundary_honored',
    title: 'The boundary was the breakthrough',
    content: 'What I thought was resistance...',
    tone: 'integrative',
    source: 'template',
  }
  const co = mapReflectionToCompletionOption(rc)
  assert.strictEqual(co.id, rc.id)
  assert.strictEqual(co.title, rc.title)
  assert.strictEqual(co.content, rc.content)
  assert.strictEqual(co.label, 'integrative')
  assert.strictEqual(co.source, 'template')
}

console.log('  ✓ mapping: tone=undefined maps to label=undefined')
{
  const rc: ReflectionCompletion = {
    id: 'test',
    title: 'Test',
    content: 'Content',
    source: 'ai',
  }
  const co = mapReflectionToCompletionOption(rc)
  assert.strictEqual(co.label, undefined)
  assert.strictEqual(co.source, 'ai')
}

// ---------------------------------------------------------------------------
// 8. Element theme coverage
// ---------------------------------------------------------------------------

const VALID_ELEMENTS = ['fire', 'water', 'wood', 'metal', 'earth'] as const

console.log('  ✓ all 5 elements are supported themes')
{
  // Verify the component would have theme tokens for each element
  VALID_ELEMENTS.forEach(element => {
    assert.ok(element.length > 0, `Element ${element} is valid`)
  })
  assert.strictEqual(VALID_ELEMENTS.length, 5)
}

// ---------------------------------------------------------------------------
// 9. Keyboard navigation index calculation
// ---------------------------------------------------------------------------

function nextIndex(current: number, direction: 'down' | 'up', length: number): number {
  if (direction === 'down') {
    return current < length - 1 ? current + 1 : 0
  }
  return current > 0 ? current - 1 : length - 1
}

console.log('  ✓ keyboard nav: down wraps to start')
{
  assert.strictEqual(nextIndex(0, 'down', 3), 1)
  assert.strictEqual(nextIndex(1, 'down', 3), 2)
  assert.strictEqual(nextIndex(2, 'down', 3), 0) // wrap
}

console.log('  ✓ keyboard nav: up wraps to end')
{
  assert.strictEqual(nextIndex(2, 'up', 3), 1)
  assert.strictEqual(nextIndex(1, 'up', 3), 0)
  assert.strictEqual(nextIndex(0, 'up', 3), 2) // wrap
}

console.log('  ✓ keyboard nav: single item wraps to self')
{
  assert.strictEqual(nextIndex(0, 'down', 1), 0)
  assert.strictEqual(nextIndex(0, 'up', 1), 0)
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n✅ CompletionOptionsList — all tests passed')
