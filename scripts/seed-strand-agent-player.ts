#!/usr/bin/env npx tsx
/**
 * Upsert the canonical Player for strand/MCP-generated BARs (agent hand, not human admin).
 * Matches backend STRAND_AGENT_PLAYER_NAME in app/strand/creator.py
 *
 *   npx tsx scripts/with-env.ts "npx tsx scripts/seed-strand-agent-player.ts"
 *
 * Optional: set STRAND_CREATOR_PLAYER_ID to this id in backend env after first run (logged below).
 */
import './require-db-env'
import { db } from '../src/lib/db'

/** Stable id for operators / env STRAND_CREATOR_PLAYER_ID */
export const STRAND_AGENT_PLAYER_ID = 'bars-strand-agent'

const NAME = 'BARS Strand Agent'

async function main() {
    const publicInvite = await db.invite.upsert({
        where: { token: 'PUBLIC' },
        update: {},
        create: { token: 'PUBLIC', status: 'active', maxUses: 10000, uses: 0 },
    })

    const player = await db.player.upsert({
        where: { id: STRAND_AGENT_PLAYER_ID },
        update: {
            name: NAME,
            creatorType: 'agent',
        },
        create: {
            id: STRAND_AGENT_PLAYER_ID,
            name: NAME,
            creatorType: 'agent',
            contactType: 'email',
            contactValue: 'strand-agent@bars.local',
            inviteId: publicInvite.id,
            onboardingComplete: true,
        },
    })

    await db.starterPack.upsert({
        where: { playerId: player.id },
        update: {},
        create: { playerId: player.id, data: JSON.stringify({ completedBars: [], activeBars: [] }) },
    })

    console.log('✅ Strand agent player ready')
    console.log(`   id:   ${player.id}`)
    console.log(`   name: ${player.name}`)
    console.log(`   Optional: STRAND_CREATOR_PLAYER_ID=${player.id}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
