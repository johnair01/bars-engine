#!/usr/bin/env tsx
/**
 * Seed AlchemySceneTemplate records from seed-alchemy-scenes.json.
 *
 * Run:
 *   npm run seed:alchemy-scenes
 *
 * Upsert key: channel + altitudeFrom + title (findFirst + create).
 * Safe to re-run — existing records are left unchanged, new ones are created.
 *
 * @see .specify/specs/emotional-alchemy-scene-library/spec.md
 */

import './require-db-env'
import * as fs from 'fs'
import * as path from 'path'
import { db } from '../src/lib/db'

interface RawChoice {
  key: string
  label: string
  isGrowth: boolean
}

interface RawTemplate {
  channel: string
  altitudeFrom: string
  altitudeTo: string
  title: string
  situation: string
  friction: string
  invitation: string
  choices: RawChoice[]
  advice?: string
  archetypeBias?: string[]
  nationBias?: string[]
}

interface SeedFile {
  templates: RawTemplate[]
}

async function main() {
  console.log('--- [Seed] Alchemy Scene Templates ---')

  const seedPath = path.join(process.cwd(), 'seed-alchemy-scenes.json')
  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found: ${seedPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(seedPath, 'utf-8')
  const data: SeedFile = JSON.parse(raw)
  const templates = data.templates

  console.log(`Found ${templates.length} templates to seed.`)

  let created = 0
  let skipped = 0

  for (const t of templates) {
    const existing = await db.alchemySceneTemplate.findFirst({
      where: {
        channel: t.channel,
        altitudeFrom: t.altitudeFrom,
        title: t.title,
      },
      select: { id: true },
    })

    if (existing) {
      skipped++
      continue
    }

    await db.alchemySceneTemplate.create({
      data: {
        channel: t.channel,
        altitudeFrom: t.altitudeFrom,
        altitudeTo: t.altitudeTo,
        title: t.title,
        situation: t.situation,
        friction: t.friction,
        invitation: t.invitation,
        choices: JSON.stringify(t.choices),
        advice: t.advice ?? null,
        archetypeBias: t.archetypeBias ? JSON.stringify(t.archetypeBias) : null,
        nationBias: t.nationBias ? JSON.stringify(t.nationBias) : null,
      },
    })

    created++
  }

  console.log(`Created: ${created}  Skipped (already exists): ${skipped}`)
  console.log('--- [Seed] Complete ---')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
