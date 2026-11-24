/**
 * Records completed moves on a local player's sheet through the same store call the server action uses (T006), so a
 * look can photograph the belly glow at a real count. Local databases only (dev.sh run refuses a remote one).
 *   scripts/local/dev.sh run -- npx tsx scripts/local/record-moves.ts <playerId> <moves> [--repeat-first]
 * --repeat-first records the first attempt id twice, to show that the second record does not count.
 */
import { randomUUID } from 'crypto'
import { db } from '../../src/lib/db'
import { recordCompletedMoveFor } from '../../src/lib/passport/store'

async function main() {
  const [playerId, n, flag] = process.argv.slice(2)
  const player = await db.player.findUnique({ where: { id: playerId }, select: { id: true, name: true } })
  if (!player) throw new Error(`no player ${playerId}`)
  let counted = 0
  for (let i = 0; i < Number(n); i++) {
    const id = randomUUID()
    if ((await recordCompletedMoveFor(player, id)).counted) counted++
    if (i === 0 && flag === '--repeat-first' && (await recordCompletedMoveFor(player, id)).counted) counted++
  }
  const row = await db.passport.findUnique({ where: { playerId } })
  console.log(JSON.stringify({ counted, sheet: (row?.data as { sheet?: unknown })?.sheet && { gathered: (row!.data as { sheet: { gathered: number } }).sheet.gathered } }))
}
main().finally(() => db.$disconnect())
