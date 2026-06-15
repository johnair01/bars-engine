/**
 * Book paywall gating — does the current player have access to a book?
 *
 * The /handbook reader is otherwise public; these helpers gate everything
 * except the free chapters (the marketing funnel). See book-launch-paywall spec.
 */

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { hasCapability } from '@/lib/entitlements/service'

export const DEFAULT_BOOK_KEY = 'mtgoa'

/** The launch entitlement SKU that grants the MtGoA book. */
const BOOK_SKU = 'book-digital'

/** Chapters readable without an entitlement — the free sample / funnel. */
export const FREE_CHAPTER_IDS = ['front-of-book'] as const

export function isFreeChapter(chapterId: string): boolean {
  return (FREE_CHAPTER_IDS as readonly string[]).includes(chapterId)
}

/**
 * Non-free chapters that actually have in-app content authored (a JSON in
 * public/handbook/). Empty at launch — the paid product ships as a Gumroad PDF
 * and the in-app reader gains chapters over time (content pipeline, 1.79 HCP).
 * Add ids here as chapters are published so the gate renders the reader instead
 * of the "unlocked, coming soon" panel.
 */
export const PUBLISHED_CHAPTER_IDS: string[] = []

export function isPublishedChapter(chapterId: string): boolean {
  return PUBLISHED_CHAPTER_IDS.includes(chapterId)
}

/**
 * Whether the given player holds book access — resolved entirely through the
 * unified launch `Entitlement` model (the standalone `BookEntitlement` is
 * retired; see launch-paywall-integration spec).
 *
 * Two ways to hold it:
 *   1. Ownership — a direct digital-book purchase grants the `book-digital`
 *      entitlement perpetually. Its bundled 30-day app-access window may have
 *      lapsed (`expiresAt` in the past); you still own the book, so the
 *      ownership check ignores expiry on purpose.
 *   2. Bundle / subscription — Founding Ally, the game subscription, or the
 *      physical book confer the `book-digital` capability while that grant is
 *      live (expiry respected via the capability check).
 *
 * Fails closed: any unexpected error denies access (callers still allow free
 * chapters explicitly via isFreeChapter).
 */
export async function hasBookAccess(
  player: { id: string } | null,
  bookKey: string = DEFAULT_BOOK_KEY
): Promise<boolean> {
  if (!player) return false
  if (bookKey !== DEFAULT_BOOK_KEY) return false // only the MtGoA book exists today
  try {
    const owned = await db.entitlement.findFirst({
      where: { playerId: player.id, sku: BOOK_SKU, status: 'active' },
      select: { id: true },
    })
    if (owned) return true
    return await hasCapability(player.id, BOOK_SKU)
  } catch {
    return false
  }
}

/**
 * Require an active entitlement for the current player, else redirect to the
 * unlock page. Returns the entitled player. Use in server components/loaders
 * for gated chapters (after an isFreeChapter() short-circuit).
 */
export async function requireBookAccess(
  bookKey: string = DEFAULT_BOOK_KEY
): Promise<{ id: string }> {
  const player = await getCurrentPlayer()
  if (!(await hasBookAccess(player, bookKey))) {
    redirect('/handbook/unlock')
  }
  return player as { id: string }
}
