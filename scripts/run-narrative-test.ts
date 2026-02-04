/**
 * Narrative Test Runner
 * 
 * Executes test scenarios as quests, making testing entertaining.
 * 
 * Usage: npx tsx scripts/run-narrative-test.ts [scenario]
 * Example: npx tsx scripts/run-narrative-test.ts new_arrival
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface Character {
    id: string
    name: string
    description: string
    email: string
    password: string
}

interface Step {
    action: string
    target?: string
    field?: string
    value?: string
    index?: number
    description: string
}

interface Quest {
    id: string
    name: string
    hero: string
    goal: string
    steps: Step[]
    victory: { url?: string; check: string }
    defeat: { check: string }
}

const SCENARIOS_DIR = path.join(process.cwd(), 'content/test_scenarios')

function loadCharacters(): Character[] {
    const file = path.join(SCENARIOS_DIR, 'characters.json')
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    return data.characters
}

function loadQuest(name: string): Quest {
    const file = path.join(SCENARIOS_DIR, `${name}.json`)
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function interpolate(value: string, hero: Character): string {
    return value
        .replace('${hero.email}', hero.email)
        .replace('${hero.password}', hero.password)
        .replace('${hero.name}', hero.name)
}

async function runQuest(questName: string) {
    console.log('\n🎮 ═══════════════════════════════════════════')
    console.log('   N A R R A T I V E   T E S T   R U N N E R')
    console.log('═══════════════════════════════════════════════\n')

    const characters = loadCharacters()
    const quest = loadQuest(questName)
    const hero = characters.find(c => c.id === quest.hero)!

    console.log(`📖 Quest: "${quest.name}"`)
    console.log(`🦸 Hero: ${hero.name} (${hero.description})`)
    console.log(`🎯 Goal: ${quest.goal}\n`)

    console.log('📜 The Story Unfolds...\n')

    // Simulate the database-level actions
    const timestamp = Date.now()
    const testEmail = `${questName}_${timestamp}@test.local`

    try {
        // Step 1: Create invite (gate opens)
        console.log('  ⚔️  The gates of the Conclave open...')
        const invite = await prisma.invite.create({
            data: {
                token: `test_${timestamp}`,
                status: 'active'
            }
        })

        // Step 2: Create account (identity spoken)
        console.log('  📧 The Wanderer speaks their name...')
        const account = await prisma.account.create({
            data: {
                email: testEmail,
                passwordHash: 'test_hash_' + timestamp
            }
        })

        // Step 3: Fetch nation and playbook
        const nation = await prisma.nation.findFirst()
        const playbook = await prisma.playbook.findFirst()

        if (!nation || !playbook) {
            throw new Error('No nations or playbooks found. Run seed first.')
        }

        // Step 4: Create player (character born)
        console.log('  🌟 A new character emerges...')
        const player = await prisma.player.create({
            data: {
                accountId: account.id,
                name: `Test_${hero.name}_${timestamp}`,
                contactType: 'email',
                contactValue: testEmail,
                inviteId: invite.id,
                nationId: nation.id,
                playbookId: playbook.id
            }
        })

        // Step 5: Mark invite used
        await prisma.invite.update({
            where: { id: invite.id },
            data: { status: 'used', usedAt: new Date() }
        })

        // Victory!
        console.log('\n✅ ═══════════════════════════════════════════')
        console.log('   V I C T O R Y !')
        console.log('═══════════════════════════════════════════════')
        console.log(`\n  🎉 ${quest.victory.check}`)
        console.log(`  👤 Player Created: ${player.name}`)
        console.log(`  📍 Nation: ${nation.name}`)
        console.log(`  📘 Playbook: ${playbook.name}\n`)

        // Cleanup
        console.log('🧹 Cleaning up test data...')
        await prisma.player.delete({ where: { id: player.id } })
        await prisma.account.delete({ where: { id: account.id } })
        await prisma.invite.delete({ where: { id: invite.id } })
        console.log('  ✓ Test data removed.\n')

    } catch (error: any) {
        console.log('\n❌ ═══════════════════════════════════════════')
        console.log('   D E F E A T')
        console.log('═══════════════════════════════════════════════')
        console.log(`\n  💀 ${quest.defeat.check}`)
        console.log(`  🐛 Error: ${error.message}\n`)
        process.exit(1)
    }
}

const questName = process.argv[2] || 'new_arrival'
runQuest(questName)
    .catch(console.error)
    .finally(() => prisma.$disconnect())
