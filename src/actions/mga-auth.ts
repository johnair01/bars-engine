'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { hashPassword, verifyPassword } from '@/lib/auth-utils'
import { claimPendingDeckBarForPlayer } from '@/lib/deck-bar'
import { isSafeAppPath } from '@/lib/safe-return-to'
import { createRequestId, logActionError } from '@/lib/mvp-observability'

/**
 * Plain MGA auth — signup + login for *Mastering the Game of Allyship*.
 *
 * Purpose-built email/password auth that does NOT route through the Conclave
 * nation/archetype story. New accounts are game-ready immediately (so they reach
 * the Vault), and any pending deck-card BAR captured while logged out is claimed
 * into the account on success. Conclave onboarding remains reachable as an
 * optional path — it is no longer the gate.
 *
 * Reuses the existing Account + password infra (auth-utils) and the
 * `bars_player_id` session cookie shared with conclave-auth.
 *
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slice 2)
 */

export type MgaAuthResult =
  | { success: true; redirectTo: string }
  | { error: string }

const SESSION_COOKIE = 'bars_player_id'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setSession(playerId: string, cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(SESSION_COOKIE, playerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/** Where to land after auth: a safe returnTo, else NOW home. Never Conclave. */
function resolveRedirect(returnTo?: string): string {
  return returnTo && isSafeAppPath(returnTo) ? returnTo : '/'
}

function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() || ''
  return local.length >= 2 ? local.slice(0, 50) : 'Traveler'
}

export async function signupMga(input: {
  email: string
  password: string
  returnTo?: string
  pending?: string
}): Promise<MgaAuthResult> {
  const requestId = createRequestId()
  const email = input.email?.trim().toLowerCase()
  const password = input.password ?? ''

  if (!email || !password) return { error: 'Email and password required' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }

  try {
    const [existingAccount, existingPlayer] = await Promise.all([
      db.account.findUnique({ where: { email } }),
      db.player.findUnique({
        where: { contactType_contactValue: { contactType: 'email', contactValue: email } },
      }),
    ])
    if (existingAccount) return { error: 'Account already exists. Please log in.' }
    if (existingPlayer) return { error: 'A character already exists with this email. Please log in.' }

    const passwordHash = await hashPassword(password)
    const name = deriveNameFromEmail(email)

    const player = await db.$transaction(async (tx) => {
      const account = await tx.account.create({ data: { email, passwordHash } })

      // Player.inviteId is required; mint a record-keeping invite like the
      // guided path does, and link the player to it via nested create.
      const autoInvite = await tx.invite.create({
        data: {
          token: `mga_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          status: 'used',
          usedAt: new Date(),
          players: {
            create: {
              accountId: account.id,
              name,
              contactType: 'email',
              contactValue: email,
              onboardingMode: 'mga',
              // Game-ready immediately: no Conclave gate for MGA accounts.
              onboardingComplete: true,
              onboardingCompletedAt: new Date(),
            },
          },
        },
        include: { players: true },
      })

      const newPlayer = autoInvite.players[0]

      await tx.starterPack.create({
        data: {
          playerId: newPlayer.id,
          data: JSON.stringify({ completedBars: [] }),
          initialVibeulons: 0,
        },
      })

      return newPlayer
    })

    // Orientation threads + starter vibeulons (mirrors the guided open-signup path).
    const { assignOrientationThreads } = await import('./quest-thread')
    await assignOrientationThreads(player.id)

    const seedAmount = parseInt(process.env.MVP_SEED_VIBEULONS || '3', 10)
    if (seedAmount > 0) {
      const { mintVibulon } = await import('./economy')
      await mintVibulon(
        player.id,
        seedAmount,
        { source: 'signup_seed', id: 'mvp_starter', title: 'Welcome Starter Pack' },
        { skipRevalidate: true },
      )
    }

    const cookieStore = await cookies()
    setSession(player.id, cookieStore)

    // Claim the deck card the visitor tapped before signing up (no-op otherwise).
    // A captured card pulls the player home to their Hand, overriding returnTo.
    const claimed = await claimPendingDeckBarForPlayer(player.id)
    const redirectTo = 'success' in claimed ? '/' : resolveRedirect(input.returnTo)

    return { success: true, redirectTo }
  } catch (e) {
    logActionError({ action: 'signupMga', requestId, userId: null, extra: { email } }, e)
    return { error: `Signup failed. Please retry. (req: ${requestId})` }
  }
}

export async function loginMga(input: {
  email: string
  password: string
  returnTo?: string
  pending?: string
}): Promise<MgaAuthResult> {
  const requestId = createRequestId()
  const email = input.email?.trim().toLowerCase()
  const password = input.password ?? ''

  if (!email || !password) return { error: 'Email and password required' }

  try {
    const account = await db.account.findUnique({
      where: { email },
      include: { players: true },
    })
    if (!account || !account.passwordHash) return { error: 'Invalid credentials' }

    const isValid = await verifyPassword(password, account.passwordHash)
    if (!isValid) return { error: 'Invalid credentials' }

    const player = account.players[0]
    if (!player) return { error: 'No character found for this account.' }

    const cookieStore = await cookies()
    setSession(player.id, cookieStore)

    // Claim any pending deck card captured before login; a captured card pulls
    // the player home to their Hand, overriding returnTo.
    const claimed = await claimPendingDeckBarForPlayer(player.id)
    const redirectTo = 'success' in claimed ? '/' : resolveRedirect(input.returnTo)

    return { success: true, redirectTo }
  } catch (e) {
    logActionError({ action: 'loginMga', requestId, userId: null, extra: { email } }, e)
    return { error: `Login failed. Please retry. (req: ${requestId})` }
  }
}
