#!/usr/bin/env npx tsx
/**
 * Seed AdventureTemplate — encounter-9-passage and others.
 * Idempotent: upsert by key.
 * @see .specify/specs/template-library-draft-adventure/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'

const ENCOUNTER_9_PASSAGE_SLOTS = [
  { nodeId: 'context_1', label: 'Context 1', order: 0 },
  { nodeId: 'context_2', label: 'Context 2', order: 1 },
  { nodeId: 'context_3', label: 'Context 3', order: 2 },
  { nodeId: 'anomaly_1', label: 'Anomaly 1', order: 3 },
  { nodeId: 'anomaly_2', label: 'Anomaly 2', order: 4 },
  { nodeId: 'anomaly_3', label: 'Anomaly 3', order: 5 },
  { nodeId: 'choice', label: 'Choice', order: 6 },
  { nodeId: 'response', label: 'Response', order: 7 },
  { nodeId: 'artifact', label: 'Artifact', order: 8 },
]

async function main() {
  console.log('🌱 Seeding Adventure Templates...')

  await db.adventureTemplate.upsert({
    where: { key: 'encounter-9-passage' },
    create: {
      key: 'encounter-9-passage',
      name: 'Encounter (9-passage)',
      description: '9-passage structure: context (3), anomaly (3), choice, response, artifact.',
      passageSlots: JSON.stringify(ENCOUNTER_9_PASSAGE_SLOTS),
      startNodeId: 'context_1',
      ownership: 'system',
    },
    update: {
      name: 'Encounter (9-passage)',
      description: '9-passage structure: context (3), anomaly (3), choice, response, artifact.',
      passageSlots: JSON.stringify(ENCOUNTER_9_PASSAGE_SLOTS),
      startNodeId: 'context_1',
    },
  })
  console.log('  ✓ encounter-9-passage')

  console.log('✅ Adventure templates seeded.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
