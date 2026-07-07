'use server'

/**
 * Promise Move Forge (PMF) — persistence for the /forge flow.
 *
 * A published Promise Move is a `CustomBar` with `type='promise_move'`, planted
 * in the player's Garden (`gardenId`). First-class fields map to columns
 * (title/description/experienceIntent/satisfaction/dissatisfaction/hexagramId/
 * status/visibility); the forge-specific payload (scope, standard of care,
 * boundary, repair, consent ask, delivery, skill, examples, reservations,
 * availability, free-text unpacking) is stored as JSON in `promiseMove`.
 *
 * Sharing reuses `BarShareExternal` (public token link). Asking to receive a
 * move creates a consent-forward `PromiseRequest`.
 */

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { personalGardenId } from '@/lib/lenses/ensure'

// ── Types ───────────────────────────────────────────────────────────────────

export type Availability = 'draft' | 'practice' | 'available' | 'paused' | 'retired'

/** The forge-specific JSON payload persisted on `CustomBar.promiseMove`. */
export type PromiseMovePayload = {
  superpower: string
  cardTagline: string
  scope: string
  standard: string
  boundary: string
  repair: string
  consentAsk: string
  skill: string
  delivery: {
    proximity: string
    channelsByProx: Record<string, string[]>
    name: string
    handle: string
  }
  examples: string[]
  satisfaction: string[]
  dissatisfaction: string[]
  beliefs: string[]
  /** Free-text unpacking answers (q1…q6) — q1 also mirrors experienceIntent. */
  answers: Record<string, string>
  availability: Availability
}

export type PublishPromiseMoveInput = {
  title: string
  hexagramId?: number | null
  payload: PromiseMovePayload
}

export type PublishResult =
  | { success: true; id: string; shareToken: string; shareUrl: string }
  | { error: string }

/** Display shape for the public share card. */
export type PromiseMoveCard = {
  owner: string
  availability: Availability
  title: string
  promise: string
  helpsWith: string
  inScope: string
  standard: string
  boundary: string
  repair: string
  consentAsk: string
  requestPhrase: string
  deliveryNote: string
  examples: string[]
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateShareToken(): string {
  return randomBytes(24).toString('base64url')
}

function baseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === 'string') {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (typeof process.env.VERCEL_URL === 'string') {
    return `https://${process.env.VERCEL_URL}`
  }
  return ''
}

/** Map the 5 availability states onto CustomBar status/visibility columns. */
function statusColumns(a: Availability): { status: string; visibility: string } {
  switch (a) {
    case 'draft':
      return { status: 'active', visibility: 'private' }
    case 'paused':
      return { status: 'paused', visibility: 'public' }
    case 'retired':
      return { status: 'retired', visibility: 'public' }
    case 'practice':
    case 'available':
    default:
      return { status: 'active', visibility: 'public' }
  }
}

function deliveryNote(p: PromiseMovePayload): string {
  const chans = p.delivery.channelsByProx[p.delivery.proximity] || []
  if (p.delivery.proximity === 'in_person') {
    return chans.length ? `In person: ${chans.join(', ').toLowerCase()}.` : 'In person, shoulder to shoulder.'
  }
  return chans.length ? `At a distance: ${chans.join(', ').toLowerCase()}.` : 'At a distance, across time and space.'
}

// ── Actions ─────────────────────────────────────────────────────────────────

/**
 * Publish a forged Promise Move: create the CustomBar (planted in the Garden)
 * and mint a public share token so the shareable card link resolves.
 */
export async function publishPromiseMove(input: PublishPromiseMoveInput): Promise<PublishResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Log in to publish your promise move.' }

  const p = input.payload
  const { status, visibility } = statusColumns(p.availability)

  try {
    const shareToken = generateShareToken()
    const expiresAt = new Date()
    // Published moves are durable, not a 72h invite — keep the link alive long.
    expiresAt.setFullYear(expiresAt.getFullYear() + 5)

    const result = await db.$transaction(async (tx) => {
      const bar = await tx.customBar.create({
        data: {
          creatorId: player.id,
          type: 'promise_move',
          title: input.title,
          description: p.cardTagline,
          experienceIntent: p.answers.q1 || null,
          satisfaction: p.satisfaction.length ? p.satisfaction.join(' | ') : null,
          dissatisfaction: p.dissatisfaction.length ? p.dissatisfaction.join(' | ') : null,
          hexagramId: input.hexagramId ?? null,
          gardenId: personalGardenId(player.id),
          moveType: 'promise',
          moveAspect: 'outer',
          allyshipTarget: 'individual',
          status,
          visibility,
          promiseMove: JSON.stringify(p),
        },
        select: { id: true },
      })

      await tx.barShareExternal.create({
        data: {
          barId: bar.id,
          fromUserId: player.id,
          shareToken,
          status: 'pending',
          expiresAt,
        },
      })

      return bar
    })

    revalidatePath('/garden')
    const root = baseUrl()
    const path = `/forge/share?token=${shareToken}`
    return { success: true, id: result.id, shareToken, shareUrl: root ? `${root}${path}` : path }
  } catch (e) {
    console.error('[promise-move:publish]', e)
    return { error: 'Failed to publish the promise move.' }
  }
}

/** Resolve a share token to the public card data. */
export async function getPromiseMoveByToken(token: string): Promise<{ card: PromiseMoveCard } | { error: string }> {
  try {
    const share = await db.barShareExternal.findUnique({
      where: { shareToken: token },
      select: { barId: true },
    })
    if (!share) return { error: 'This promise move could not be found.' }

    const bar = await db.customBar.findUnique({
      where: { id: share.barId },
      select: { type: true, title: true, description: true, promiseMove: true },
    })
    if (!bar || bar.type !== 'promise_move' || !bar.promiseMove) {
      return { error: 'This promise move could not be found.' }
    }

    const p = JSON.parse(bar.promiseMove) as PromiseMovePayload
    const card: PromiseMoveCard = {
      owner: p.delivery?.name || 'Someone',
      availability: p.availability || 'available',
      title: bar.title,
      promise: bar.description || p.cardTagline,
      helpsWith: p.answers?.q1 || bar.description || '',
      inScope: p.scope,
      standard: p.standard,
      boundary: p.boundary,
      repair: p.repair,
      consentAsk: p.consentAsk,
      requestPhrase: p.consentAsk,
      deliveryNote: deliveryNote(p),
      examples: Array.isArray(p.examples) ? p.examples : [],
    }
    return { card }
  } catch (e) {
    console.error('[promise-move:getByToken]', e)
    return { error: 'Failed to load this promise move.' }
  }
}

/** Record a consent-forward request to receive a published move. */
export async function requestPromiseMove(
  token: string,
  opts: { name?: string; note?: string } = {},
): Promise<{ success: true } | { error: string }> {
  try {
    const share = await db.barShareExternal.findUnique({
      where: { shareToken: token },
      select: { barId: true },
    })
    if (!share) return { error: 'This promise move could not be found.' }

    const player = await getCurrentPlayer()
    await db.promiseRequest.create({
      data: {
        barId: share.barId,
        requesterId: player?.id ?? null,
        requesterName: opts.name?.trim() || null,
        note: opts.note?.trim() || null,
        shareToken: token,
        status: 'pending',
        consentState: 'awaiting',
      },
    })
    return { success: true }
  } catch (e) {
    console.error('[promise-move:request]', e)
    return { error: 'Failed to send your request.' }
  }
}

/** Change a move's availability (pause / retire / reopen) from the Garden. */
export async function setPromiseMoveAvailability(
  id: string,
  availability: Availability,
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const bar = await db.customBar.findUnique({
      where: { id },
      select: { creatorId: true, type: true, promiseMove: true },
    })
    if (!bar || bar.type !== 'promise_move') return { error: 'Promise move not found' }
    if (bar.creatorId !== player.id) return { error: "You don't own this move" }

    const { status, visibility } = statusColumns(availability)
    let payload = bar.promiseMove
    try {
      const parsed = JSON.parse(bar.promiseMove || '{}') as PromiseMovePayload
      parsed.availability = availability
      payload = JSON.stringify(parsed)
    } catch {
      /* leave payload as-is if it can't be parsed */
    }

    await db.customBar.update({
      where: { id },
      data: { status, visibility, promiseMove: payload },
    })
    revalidatePath('/garden')
    return { success: true }
  } catch (e) {
    console.error('[promise-move:setAvailability]', e)
    return { error: 'Failed to update availability.' }
  }
}
