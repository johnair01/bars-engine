/**
 * Create and delete throwaway accounts for automated WorkAdventure tests.
 *
 * Auth is the same Admin API token WorkAdventure already uses (`Authorization: <token>` or `Bearer <token>`).
 * POST   -> { email, password, playerId }  (the password is shown once)
 * DELETE -> body { email } deletes one test account; body { olderThanHours: n } sweeps every test account that old.
 * Only emails shaped `wa-test-<hex>@test.invalid` are ever touched (src/lib/wa/test-accounts.ts).
 */
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { adminApiAuthorized, adminApiErrorResponse } from '@/lib/wa/admin-auth'
import { isTestAccountEmail, newTestAccount, TEST_EMAIL_DOMAIN, TEST_EMAIL_PREFIX } from '@/lib/wa/test-accounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) return adminApiErrorResponse()

  const account = newTestAccount()
  const passwordHash = await hashPassword(account.password)

  const player = await db.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: { token: account.inviteToken, status: 'used', maxUses: 1, uses: 1, usedAt: new Date() },
    })
    const created = await tx.account.create({ data: { email: account.email, passwordHash } })
    const p = await tx.player.create({
      data: {
        accountId: created.id,
        name: account.name,
        contactType: 'email',
        contactValue: account.email,
        inviteId: invite.id,
      },
    })
    await tx.starterPack.create({
      data: { playerId: p.id, data: JSON.stringify({ completedBars: [] }), initialVibeulons: 0 },
    })
    return p
  })

  return Response.json({ email: account.email, password: account.password, playerId: player.id }, { status: 201 })
}

async function deleteTestAccount(email: string): Promise<'deleted' | 'not found'> {
  const account = await db.account.findUnique({ where: { email }, include: { players: { select: { id: true } } } })
  if (!account) return 'not found'
  const playerIds = account.players.map((p) => p.id)
  await db.$transaction(async (tx) => {
    const players = await tx.player.findMany({ where: { id: { in: playerIds } }, select: { inviteId: true } })
    await tx.starterPack.deleteMany({ where: { playerId: { in: playerIds } } })
    await tx.playerRole.deleteMany({ where: { playerId: { in: playerIds } } })
    await tx.player.deleteMany({ where: { id: { in: playerIds } } })
    await tx.account.delete({ where: { id: account.id } })
    const tokens = players.map((p) => p.inviteId)
    await tx.invite.deleteMany({ where: { id: { in: tokens }, token: { startsWith: TEST_EMAIL_PREFIX } } })
  })
  return 'deleted'
}

export async function DELETE(request: NextRequest) {
  if (!adminApiAuthorized(request.headers.get('authorization'))) return adminApiErrorResponse()

  let body: { email?: string; olderThanHours?: number }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'expected a JSON body' }, { status: 400 })
  }

  if (typeof body.olderThanHours === 'number') {
    const cutoff = new Date(Date.now() - Math.max(0, body.olderThanHours) * 3_600_000)
    const old = await db.account.findMany({
      where: { email: { startsWith: TEST_EMAIL_PREFIX, endsWith: TEST_EMAIL_DOMAIN }, createdAt: { lt: cutoff } },
      select: { email: true },
    })
    const deleted: string[] = []
    const failed: string[] = []
    for (const { email } of old.filter((a) => isTestAccountEmail(a.email))) {
      try {
        if ((await deleteTestAccount(email)) === 'deleted') deleted.push(email)
      } catch {
        failed.push(email)
      }
    }
    return Response.json({ deleted, failed })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!isTestAccountEmail(email)) {
    return Response.json({ error: `only ${TEST_EMAIL_PREFIX}<hex>${TEST_EMAIL_DOMAIN} accounts can be deleted` }, { status: 400 })
  }
  try {
    const result = await deleteTestAccount(email)
    return result === 'deleted' ? new Response(null, { status: 204 }) : Response.json({ error: 'not found' }, { status: 404 })
  } catch (error) {
    return Response.json(
      { error: 'could not delete: the account owns rows this route does not clear', detail: String(error) },
      { status: 409 },
    )
  }
}
