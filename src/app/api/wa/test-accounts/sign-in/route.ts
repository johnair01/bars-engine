/**
 * Signs a test account in from the link `POST /api/wa/test-accounts` returned, so an automated test never types a
 * password. The link is signed, expires in five minutes, works once (it rotates the password hash) and only ever
 * signs in `wa-test-<hex>@test.invalid` accounts. See src/lib/wa/test-signin.ts.
 */
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { WA_ADMIN_API_TOKEN } from '@/lib/wa/config'
import { checkSignInToken, safeReturnPath } from '@/lib/wa/test-signin'
import { randomBytes } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  if (!WA_ADMIN_API_TOKEN || !token) return Response.json({ error: 'not available' }, { status: 404 })

  // The token names an email; look the account up once and check the link against the hash it holds now.
  const [body] = token.split('.')
  let email = ''
  try {
    email = String((JSON.parse(Buffer.from(body ?? '', 'base64url').toString('utf8')) as { email?: string }).email ?? '')
  } catch {
    return Response.json({ error: 'not available' }, { status: 404 })
  }
  const account = await db.account.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, players: { select: { id: true }, take: 1 } },
  })
  const check = checkSignInToken(token, WA_ADMIN_API_TOKEN, () => account?.passwordHash ?? null)
  if (!check.ok || !account || !account.players[0]) return Response.json({ error: 'not available' }, { status: 404 })

  // One use: replace the password hash, so this link's fingerprint no longer matches.
  await db.account.update({ where: { id: account.id }, data: { passwordHash: await hashPassword(randomBytes(18).toString('base64url')) } })

  const cookieStore = await cookies()
  cookieStore.set('bars_player_id', account.players[0].id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 2,
  })
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get('returnTo'))
  return Response.redirect(new URL(returnTo, request.nextUrl.origin), 303)
}
