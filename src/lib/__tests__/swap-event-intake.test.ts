/**
 * Run: npx tsx src/lib/__tests__/swap-event-intake.test.ts
 */
import { mergeSwapEventIntake, parseSwapEventIntakeJson, swapEventIntakePayloadSchema } from '@/lib/swap-event-intake'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

function run() {
  assert(Object.keys(swapEventIntakePayloadSchema.parse({})).length === 0, 'minimal payload')

  assert(swapEventIntakePayloadSchema.parse({ partifulUrl: '' }).partifulUrl === '', 'empty url')
  assert(
    swapEventIntakePayloadSchema.parse({ partifulUrl: 'https://partiful.com/e/x' }).partifulUrl ===
      'https://partiful.com/e/x',
    'partiful url'
  )

  const r = parseSwapEventIntakeJson(null)
  assert(r.ok && Object.keys(r.data).length === 0, 'null -> empty')

  const m = mergeSwapEventIntake({ narrativeTitle: 'A', minOpeningBidVibeulons: 2 }, { narrativeTitle: 'B' })
  assert(m.narrativeTitle === 'B' && m.minOpeningBidVibeulons === 2, 'merge')

  console.log('swap-event-intake tests ok')
}

run()
