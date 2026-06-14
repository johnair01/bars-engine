/**
 * Book paywall gating — does the current player have access to a book?
 *
 * The /handbook reader is otherwise public; these helpers gate everything
 * except the free chapters (the marketing funnel). See book-launch-paywall spec.
 */

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'

export const DEFAULT_BOOK_KEY = 'mtgoa'

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
 * Whether the given player holds an active entitlement for the book.
 * Fails closed: any unexpected error denies access (callers still allow free
 * chapters explicitly via isFreeChapter).
 */
export async function hasBookAccess(
  player: { id: string } | null,
  bookKey: string = DEFAULT_BOOK_KEY
): Promise<boolean> {
  if (!player) return false
  try {
    const entitlement = await db.bookEntitlement.findUnique({
      where: { playerId_bookKey: { playerId: player.id, bookKey } },
      select: { status: true },
    })
    return entitlement?.status === 'active'
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
