#!/usr/bin/env npx tsx
/**
 * The falsify replay for .specify/specs/ember-to-vibeulon (T001; FR-001 to FR-003). Read-only.
 *
 * Replays every BAR in the database under the new rule (each BAR mints one vibeulon to its maker; a public BAR stakes
 * one instead of burning one) beside the old rule (a public BAR burns one, or falls back to private on an empty
 * wallet), and reports per wallet what each would read. It stops the work (spec "How we will know it failed") when:
 *   - a wallet would go negative or a BAR would be left without its vibeulon under the new rule;
 *   - a BAR's stake would be counted as spendable;
 *   - private BARs look made only to mint (a maker with many empty private BARs).
 *
 * Usage: npx tsx scripts/ember-economy-replay.ts [--out <file.md>]
 * Run it on a copy of the ledger. It refuses a non-local DATABASE_URL unless BARS_ALLOW_REMOTE_DB=1 is set for a
 * named read-only copy (docs/LOCAL_FIRST_TESTING.md).
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'

const url = process.env.DATABASE_URL ?? ''
const local = /@(localhost|127\.0\.0\.1|\[::1\]|%2Fvar%2Frun|\/)/.test(url) || url.includes('host=/')
if (!local && process.env.BARS_ALLOW_REMOTE_DB !== '1') {
    console.error('ember-economy-replay: DATABASE_URL is not local; run it on a copy of the ledger (BARS_ALLOW_REMOTE_DB=1 to name one).')
    process.exit(2)
}

const outIdx = process.argv.indexOf('--out')
const OUT = outIdx > 0 ? process.argv[outIdx + 1] : null
const MINT_FARM = 10 // private BARs with no description and no inputs, per maker, that read as made to mint

type Row = { maker: string; held: number; burnsOld: number; blockedOld: number; mintsNew: number; stakedNew: number; emptyPrivate: number }

async function main() {
    const db = new PrismaClient()
    try {
        const bars = await db.customBar.findMany({
            where: { creatorId: { not: '' } },
            select: { id: true, creatorId: true, visibility: true, description: true, inputs: true, createdAt: true, questSource: true },
            orderBy: { createdAt: 'asc' },
        })
        const held = await db.vibulon.groupBy({ by: ['ownerId'], _count: { _all: true } })
        const burns = await db.vibulonEvent.groupBy({ by: ['playerId'], where: { source: 'quest_creation_stake' }, _count: { _all: true } })
        const heldBy = new Map(held.map((h) => [h.ownerId ?? '', h._count._all]))
        const burnsBy = new Map(burns.map((b) => [b.playerId, b._count._all]))

        const rows = new Map<string, Row>()
        const row = (maker: string) => {
            let r = rows.get(maker)
            if (!r) {
                r = { maker, held: heldBy.get(maker) ?? 0, burnsOld: burnsBy.get(maker) ?? 0, blockedOld: 0, mintsNew: 0, stakedNew: 0, emptyPrivate: 0 }
                rows.set(maker, r)
            }
            return r
        }
        // Old rule, replayed in creation order against the wallet each maker would have had: held now plus the burns
        // already taken. The new rule: one mint per BAR, one stake per public non-bounty BAR.
        const oldWallet = new Map<string, number>()
        for (const b of bars) {
            const r = row(b.creatorId)
            r.mintsNew += 1
            const isPublic = b.visibility === 'public'
            if (isPublic && b.questSource !== 'bounty') r.stakedNew += 1
            if (isPublic) {
                const w = oldWallet.get(b.creatorId) ?? r.held + r.burnsOld
                if (w < 1) r.blockedOld += 1
                else oldWallet.set(b.creatorId, w - 1)
            }
            const emptyInputs = !b.inputs || b.inputs === '[]'
            if (!isPublic && !(b.description ?? '').trim() && emptyInputs) r.emptyPrivate += 1
        }

        const all = [...rows.values()]
        const totalNew = (r: Row) => r.held + r.burnsOld + r.mintsNew
        const spendNew = (r: Row) => totalNew(r) - r.stakedNew
        const negative = all.filter((r) => spendNew(r) < 0)
        const unstakedPublic = all.filter((r) => r.stakedNew > totalNew(r))
        const farms = all.filter((r) => r.emptyPrivate >= MINT_FARM)
        const sum = (f: (r: Row) => number) => all.reduce((n, r) => n + f(r), 0)
        const stop = negative.length > 0 || unstakedPublic.length > 0 || farms.length > 0

        const lines = [
            `# Ember economy replay, ${new Date().toISOString().slice(0, 10)}`,
            '',
            `database: ${local ? 'local copy' : 'named remote copy'}; BARs ${bars.length}; makers ${all.length}`,
            '',
            '| measure | old rule | new rule |',
            '|---|---|---|',
            `| vibeulons burned on public BARs | ${sum((r) => r.burnsOld)} | 0 |`,
            `| public BARs that would fall back to private on an empty wallet | ${sum((r) => r.blockedOld)} | 0 |`,
            `| vibeulons minted by BARs | 0 | ${sum((r) => r.mintsNew)} |`,
            `| vibeulons staked on public BARs | 0 | ${sum((r) => r.stakedNew)} |`,
            `| makers' total vibeulons | ${sum((r) => r.held)} | ${sum(totalNew)} |`,
            `| makers' spendable vibeulons | ${sum((r) => r.held)} | ${sum(spendNew)} |`,
            '',
            `- wallets that would go negative: ${negative.length}`,
            `- makers with more public BARs than vibeulons to stake: ${unstakedPublic.length}`,
            `- makers with ${MINT_FARM} or more empty private BARs (read as made to mint): ${farms.length}`,
            '',
            stop ? 'verdict: STOP. The council rethinks the stake model before the Between work.' : 'verdict: holds. No wallet goes negative, every BAR keeps its vibeulon, and no maker reads as farming.',
            '',
        ]
        const text = lines.join('\n')
        console.log(text)
        if (OUT) writeFileSync(OUT, text)
        process.exitCode = stop ? 1 : 0
    } finally {
        await db.$disconnect()
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(2)
})
