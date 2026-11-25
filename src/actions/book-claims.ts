'use server'

/**
 * Proof-of-purchase claims (see src/lib/book-claims.ts for the ruling and the rules).
 *
 *   submitBookClaim  — a signed-in reader sends a receipt or a photo of the book.
 *   decideBookClaim  — an admin approves (grants `book-digital`) or declines, and the reader gets an email.
 *
 * The picture is stored in the database row, never at a public URL, and is served only through the admin-only
 * route /api/admin/book-claims/[id]/image. It is erased when the claim is decided.
 */

import { createHash } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { grantEntitlement } from '@/lib/entitlements/service'
import { hasBookAccess } from '@/lib/book-access'
import { sendEmail } from '@/lib/email'
import { canSubmitClaim, checkClaimUpload, storeLabel } from '@/lib/book-claims'

const BOOK_SKU = 'book-digital'

type Submitted = { ok: true; message: string } | { ok: false; message: string; needsAuth?: boolean }

export async function submitBookClaim(formData: FormData): Promise<Submitted> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, message: 'Sign in first, so the claim attaches to your account.', needsAuth: true }

  if (await hasBookAccess(player)) {
    return { ok: false, message: 'You already have the book on this account.' }
  }

  const earlier = await db.bookPurchaseClaim.findMany({
    where: { playerId: player.id },
    select: { status: true },
  })
  const allowed = canSubmitClaim(earlier)
  if (!allowed.ok) return allowed

  const store = String(formData.get('store') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, message: 'Add a picture of your receipt or of the book.' }

  const check = checkClaimUpload({ store, size: file.size, type: file.type, note })
  if (!check.ok) return check

  const bytes = new Uint8Array(await file.arrayBuffer())
  // Kept after the picture is erased, so the same picture sent again is caught.
  const imageHash = createHash('sha256').update(bytes).digest('hex')

  // The same picture already sent by another account is held for the admin, not refused: the admin sees the repeat
  // flagged in the queue and decides.
  await db.bookPurchaseClaim.create({
    data: {
      playerId: player.id,
      store,
      note: note || null,
      imageData: Buffer.from(bytes),
      imageType: file.type,
      imageHash,
    },
  })

  revalidatePath('/admin/book-claims')
  return {
    ok: true,
    message: "Thanks. Wendell looks at each picture himself, and you'll get an email when he does.",
  }
}

type Decided = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Authentication required')
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  if (!isAdmin) throw new Error('Unauthorized: Admin access required.')
  return player.id
}

async function readerEmail(playerId: string): Promise<string | null> {
  const p = await db.player.findUnique({
    where: { id: playerId },
    select: { contactType: true, contactValue: true, account: { select: { email: true } } },
  })
  if (!p) return null
  if (p.account?.email) return p.account.email
  return p.contactType === 'email' ? p.contactValue : null
}

function patreonLine(): string {
  const url = process.env.PATREON_INVITE_URL?.trim()
  return url ? `\n\nIf you'd like to go further with the Heaven sect, the Patreon is here: ${url}` : ''
}

export async function decideBookClaim(input: {
  claimId: string
  decision: 'approve' | 'decline'
  reason?: string
}): Promise<Decided> {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unauthorized' }
  }

  const claim = await db.bookPurchaseClaim.findUnique({ where: { id: input.claimId } })
  if (!claim) return { ok: false, error: 'Claim not found.' }
  if (claim.status !== 'pending') return { ok: false, error: `This claim was already ${claim.status}.` }

  const reason = (input.reason ?? '').trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://bars-engine.vercel.app').replace(/\/$/, '')

  if (input.decision === 'approve') {
    const ent = await grantEntitlement({
      playerId: claim.playerId,
      sku: BOOK_SKU,
      source: 'proof',
      externalOrderId: `proof:${claim.id}`,
    })
    await db.bookPurchaseClaim.update({
      where: { id: claim.id },
      data: {
        status: 'approved',
        entitlementId: ent.id,
        decidedById: adminId,
        decidedAt: new Date(),
        imageData: null,
        imageType: null,
      },
    })
    const to = await readerEmail(claim.playerId)
    if (to) {
      await sendEmail({
        to,
        subject: 'Your book is confirmed',
        text:
          `Thanks for sending your proof of purchase. Your copy of Mastering the Game of Allyship is confirmed, ` +
          `and your 30 days in the app start now.\n\nOpen the app: ${appUrl}/handbook` +
          patreonLine() +
          `\n\nWendell`,
        tags: [{ name: 'funnel', value: 'book-claim-approved' }],
        idempotencyKey: `book-claim-approved-${claim.id}`,
      })
    }
  } else {
    await db.bookPurchaseClaim.update({
      where: { id: claim.id },
      data: {
        status: 'declined',
        declineReason: reason || null,
        decidedById: adminId,
        decidedAt: new Date(),
        imageData: null,
        imageType: null,
      },
    })
    const to = await readerEmail(claim.playerId)
    if (to) {
      await sendEmail({
        to,
        subject: "I couldn't confirm your book yet",
        text:
          `Thanks for sending a picture. I couldn't confirm your copy of Mastering the Game of Allyship from it` +
          (reason ? `: ${reason}` : '.') +
          `\n\nYou can send another one here: ${appUrl}/redeem/proof` +
          patreonLine() +
          `\n\nWendell`,
        tags: [{ name: 'funnel', value: 'book-claim-declined' }],
        idempotencyKey: `book-claim-declined-${claim.id}`,
      })
    }
  }

  revalidatePath('/admin/book-claims')
  return { ok: true }
}

/** Admin queue rows. The picture itself is fetched by the image route, not carried in the page. */
export async function listBookClaims(status: 'pending' | 'decided') {
  await requireAdmin()
  const claims = await db.bookPurchaseClaim.findMany({
    where: status === 'pending' ? { status: 'pending' } : { status: { in: ['approved', 'declined'] } },
    orderBy: status === 'pending' ? { createdAt: 'asc' } : { decidedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      playerId: true,
      store: true,
      note: true,
      imageHash: true,
      imageType: true,
      status: true,
      declineReason: true,
      decidedAt: true,
      createdAt: true,
    },
  })

  const playerIds = [...new Set(claims.map((c) => c.playerId))]
  const players = await db.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, name: true, account: { select: { email: true } } },
  })
  const byId = new Map(players.map((p) => [p.id, p]))

  // A picture whose hash appears on another claim is flagged for the admin.
  const hashes = [...new Set(claims.map((c) => c.imageHash))]
  const repeats = await db.bookPurchaseClaim.groupBy({
    by: ['imageHash'],
    where: { imageHash: { in: hashes } },
    _count: { _all: true },
  })
  const repeatCount = new Map(repeats.map((r) => [r.imageHash, r._count._all]))

  return claims.map((c) => ({
    id: c.id,
    readerName: byId.get(c.playerId)?.name ?? 'Unknown reader',
    readerEmail: byId.get(c.playerId)?.account?.email ?? null,
    store: storeLabel(c.store),
    note: c.note,
    imageType: c.imageType,
    seenBefore: (repeatCount.get(c.imageHash) ?? 1) > 1,
    status: c.status,
    declineReason: c.declineReason,
    decidedAt: c.decidedAt,
    createdAt: c.createdAt,
  }))
}
