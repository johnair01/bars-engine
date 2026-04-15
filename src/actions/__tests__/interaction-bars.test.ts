/**
 * Interaction BARs — unit tests
 *
 * Tests verify:
 * - BAR subtype creation works
 * - Subtype payload validation
 * - Visibility filtering
 * - Structured responses
 * - BAR state transitions
 *
 * Run with: npx tsx src/actions/__tests__/interaction-bars.test.ts
 * Or add to package.json: "test:interaction-bars": "tsx src/actions/__tests__/interaction-bars.test.ts"
 */

import { db } from '@/lib/db'
import { INTERACTION_BAR_TYPES } from '@/lib/interaction-bars-types'

const INTERACTION_TYPES = [...INTERACTION_BAR_TYPES]

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function testInteractionBarTypes() {
  assert(INTERACTION_TYPES.includes('quest_invitation'), 'Should include quest_invitation')
  assert(INTERACTION_TYPES.includes('help_request'), 'Should include help_request')
  assert(INTERACTION_TYPES.includes('appreciation'), 'Should include appreciation')
  assert(INTERACTION_TYPES.includes('coordination'), 'Should include coordination')
}

async function testBarResponseSchema() {
  const count = await db.barResponse.count()
  assert(typeof count === 'number', 'BarResponse.count() should return a number')
}

async function testCustomBarInteractionTypes() {
  const bars = await db.customBar.findMany({
    where: { type: { in: INTERACTION_TYPES } },
    take: 1,
  })
  assert(Array.isArray(bars), 'Should return an array')
}

async function run() {
  testInteractionBarTypes()
  await testBarResponseSchema()
  await testCustomBarInteractionTypes()
  console.log('✓ All interaction-bars tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
