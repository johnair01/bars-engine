#!/usr/bin/env npx tsx
/**
 * Seed GmFaceModifier — one row per Game Master face.
 * Idempotent: upsert by face.
 * @see .specify/specs/gm-face-modifiers/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { GAME_MASTER_FACES } from '../src/lib/quest-grammar/types'
import type { GameMasterFace } from '../src/lib/quest-grammar/types'

const SEED_DATA: Record<
  GameMasterFace,
  { anomalyStyle: string; contactVoice: string; interpretationPressure: string; responseStyle: string; artifactAffinity: string }
> = {
  shaman: {
    anomalyStyle: 'numinous',
    contactVoice: '{"tone":"mythic","style":"ritual"}',
    interpretationPressure: 'medium',
    responseStyle: '{"style":"initiation"}',
    artifactAffinity: 'memory_entry',
  },
  challenger: {
    anomalyStyle: 'provocative',
    contactVoice: '{"tone":"taunting","style":"daring"}',
    interpretationPressure: 'high',
    responseStyle: '{"style":"testing"}',
    artifactAffinity: 'quest_hook',
  },
  regent: {
    anomalyStyle: 'official',
    contactVoice: '{"tone":"authority","style":"jurisdiction"}',
    interpretationPressure: 'high',
    responseStyle: '{"style":"assertion"}',
    artifactAffinity: 'obligation',
  },
  architect: {
    anomalyStyle: 'patterned',
    contactVoice: '{"tone":"puzzle","style":"map"}',
    interpretationPressure: 'medium',
    responseStyle: '{"style":"orientation"}',
    artifactAffinity: 'orientation',
  },
  diplomat: {
    anomalyStyle: 'social',
    contactVoice: '{"tone":"empathic","style":"inviting"}',
    interpretationPressure: 'low',
    responseStyle: '{"style":"relational"}',
    artifactAffinity: 'relationship_update',
  },
  sage: {
    anomalyStyle: 'subtle',
    contactVoice: '{"tone":"quiet","style":"minimal"}',
    interpretationPressure: 'low',
    responseStyle: '{"style":"contemplation"}',
    artifactAffinity: 'contemplation',
  },
}

async function main() {
  console.log('🌱 Seeding GM Face Modifiers...')

  for (const face of GAME_MASTER_FACES) {
    const data = SEED_DATA[face]
    await db.gmFaceModifier.upsert({
      where: { face },
      create: { face, ...data },
      update: data,
    })
    console.log(`  ✓ ${face}`)
  }

  console.log('✅ 6 GM face modifiers seeded.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
