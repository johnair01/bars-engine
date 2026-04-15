import assert from 'node:assert'
import { CreateQuestSchema } from '../generated-quest-registry/schema'

const minimal = {
  title: 'Parts Mapping Under Relational Trigger',
  status: 'draft' as const,
  chapter: 1,
  moveType: 'generated' as const,
  source: { kind: 'bar_forge', label: 'Parts work Metamours' },
  bar: {
    label: 'Parts work Metamours',
    type: 'relational' as const,
    polarity: 'internal vs external',
    emotionalChannel: 'fear' as const,
    emotionalState: 'anxiety',
    wavePhases: ['clean_up', 'grow_up'],
  },
  transformation: {
    stabilization: { from: 'a', to: 'b', move: 'm1' },
    translation: { path: 'generation_cycle', from: 'b', to: 'c', move: 'm2' },
    expression: { from: 'c', to: 'd', move: 'm3' },
  },
  steps: [
    { phase: 'stabilization' as const, instruction: 'Step one' },
    { phase: 'translation' as const, instruction: 'Step two' },
    { phase: 'expression' as const, instruction: 'Step three' },
  ],
  tags: ['polyamory'],
}

const ok = CreateQuestSchema.safeParse(minimal)
assert.strictEqual(ok.success, true)

const noTitle = CreateQuestSchema.safeParse({ ...minimal, title: '' })
assert.strictEqual(noTitle.success, false)

const badBarType = CreateQuestSchema.safeParse({
  ...minimal,
  bar: { ...minimal.bar, type: 'social' },
})
assert.strictEqual(badBarType.success, false)

const nullBook = CreateQuestSchema.safeParse({ ...minimal, bookId: null })
assert.strictEqual(nullBook.success, true)

console.log('generated-quest-registry schema tests OK')
