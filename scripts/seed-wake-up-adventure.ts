/**
 * Seed Wake-Up Adventure from file-based content
 *
 * Creates/updates the Adventure "wake-up" and its Passages from content/campaigns/wake_up/.
 * After running, the campaign page will serve from DB when this Adventure is ACTIVE.
 *
 * Run: npm run seed:wake-up
 * Requires: DATABASE_URL (see docs/ENV_AND_VERCEL.md)
 */

import './require-db-env'
import { db } from '../src/lib/db'
import fs from 'fs'
import path from 'path'

const CAMPAIGN_DIR = path.join(process.cwd(), 'content', 'campaigns', 'wake_up')
const SLUG = 'wake-up'
const TITLE = 'Wake-Up Campaign'

async function seed() {
    console.log('--- Seeding Wake-Up Adventure ---')

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')

    const mapPath = path.join(CAMPAIGN_DIR, 'map.json')
    if (!fs.existsSync(mapPath)) {
        throw new Error(`map.json not found at ${mapPath}`)
    }

    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
    const startNodeId = mapData.startNodeId || 'Center_Witness'
    const nodeIds: string[] = mapData.nodes || []

    const adventure = await db.adventure.upsert({
        where: { slug: SLUG },
        update: {
            title: TITLE,
            status: 'ACTIVE',
            startNodeId,
            description: 'Pre-auth CYOA campaign. Editable in Admin → Adventures.'
        },
        create: {
            slug: SLUG,
            title: TITLE,
            status: 'ACTIVE',
            startNodeId,
            description: 'Pre-auth CYOA campaign. Editable in Admin → Adventures.',
            visibility: 'PUBLIC_ONBOARDING'
        }
    })

    console.log(`✅ Adventure: ${adventure.title} (${adventure.slug})`)

    let created = 0
    let updated = 0

    for (const nodeId of nodeIds) {
        const filePath = path.join(CAMPAIGN_DIR, `${nodeId}.json`)
        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠ Skipping ${nodeId}: file not found`)
            continue
        }

        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const text = raw.text || ''
        const choices = Array.isArray(raw.choices) ? raw.choices : []

        const existing = await db.passage.findUnique({
            where: {
                adventureId_nodeId: {
                    adventureId: adventure.id,
                    nodeId
                }
            }
        })

        const choicesJson = JSON.stringify(choices)

        if (existing) {
            await db.passage.update({
                where: { id: existing.id },
                data: { text, choices: choicesJson }
            })
            updated++
        } else {
            await db.passage.create({
                data: {
                    adventureId: adventure.id,
                    nodeId,
                    text,
                    choices: choicesJson
                }
            })
            created++
        }
    }

    console.log(`✅ Passages: ${created} created, ${updated} updated`)
    console.log('✅ Wake-Up Adventure seeded. Campaign will serve from DB at /campaign')
}

seed().catch(console.error)
