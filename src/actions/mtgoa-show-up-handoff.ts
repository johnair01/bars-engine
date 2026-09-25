'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import {
  SHOW_UP_SUBMISSION_STATUSES,
  SHOW_UP_TERMS,
  parseShowUpHandoff,
  showUpStewardRequest,
} from '@/lib/mtgoa-course/show-up-handoff'
import {
  handoffLinkPath,
  hashHandoffToken,
  looksLikeHandoffToken,
  mintHandoffToken,
} from '@/lib/mtgoa-course/handoff-token'

/**
 * Day 10's steward submission.
 *
 * The whole privacy story of Week 2 rests on this file staying narrow. It
 * accepts the artifact fields `parseShowUpHandoff` names and nothing else, it
 * stores contact only against explicit consent, and it revalidates the private
 * steward board alone — a submission never touches a public page.
 *
 * Persist-then-send, matching `sendEmail`'s contract: the row is committed
 * before the receipt goes out, so a flaky provider loses an email and never a
 * handoff.
 *
 * @see .specify/specs/mtgoa-day10-campaign-handoff/design_handoff/README.md
 */

const ADMIN_PATH = '/admin/mtgoa/show-up'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SubmitShowUpHandoffState =
  | { ok: true; link: string }
  | { ok: false; error: string }

export type SenderControlState = { ok: true; message: string } | { ok: false; error: string }

/**
 * Per-instance submission throttle.
 *
 * A serverless process holds this for its own lifetime, so it is a speed bump
 * rather than a wall. The duplicate guard below is what actually stops a
 * double-submit or a replayed payload, because it survives a cold start.
 */
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const recent = new Map<string, number[]>()

function throttled(key: string): boolean {
  const now = Date.now()
  const hits = (recent.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  hits.push(now)
  recent.set(key, hits)
  if (recent.size > 5_000) recent.clear()
  return hits.length > RATE_MAX
}

async function clientKey(): Promise<string> {
  try {
    const store = await headers()
    const forwarded = store.get('x-forwarded-for') ?? ''
    return forwarded.split(',')[0]?.trim() || store.get('x-real-ip') || 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function submitShowUpHandoff(input: unknown): Promise<SubmitShowUpHandoffState> {
  // Honeypot. A field no person sees and every naive bot fills. Answering with
  // the success shape keeps the bot from learning it was caught.
  const raw = (input ?? {}) as Record<string, unknown>
  if (typeof raw.website === 'string' && raw.website.trim().length > 0) {
    return { ok: true, link: '' }
  }

  const parsed = parseShowUpHandoff(input)
  if (!parsed.ok) return { ok: false, error: parsed.error }
  const value = parsed.value

  if (throttled(await clientKey())) {
    return { ok: false, error: 'That is a lot of handoffs at once. Try again in a minute.' }
  }

  try {
    // Duplicate guard: the same artifact from the same campaign inside ten
    // minutes is a double-submit or a replay, never two real handoffs.
    const since = new Date(Date.now() - 10 * 60_000)
    const duplicate = await db.showUpHandoffSubmission.findFirst({
      where: {
        campaignRef: value.campaignRef,
        title: value.title,
        purpose: value.purpose || null,
        nextAction: value.nextAction || null,
        createdAt: { gte: since },
      },
      select: { id: true },
    })
    if (duplicate) {
      return { ok: false, error: 'That handoff is already with the stewards.' }
    }

    const { token, hash } = mintHandoffToken()

    await db.$transaction(async (tx) => {
      // A lead exists only when the sender asked for a response and consented.
      // An anonymous submission creates no contact record at all.
      const lead = value.anonymous
        ? null
        : await tx.campaignLead.create({
            data: {
              campaignRef: value.campaignRef,
              parentCampaignRef: value.parentCampaignRef,
              source: 'automated',
              status: 'new',
              name: value.senderName || null,
              contact: value.senderContact,
              channel: EMAIL_RE.test(value.senderContact) ? 'email' : 'other',
              domain: value.domain,
            },
            select: { id: true },
          })

      await tx.showUpHandoffSubmission.create({
        data: {
          campaignRef: value.campaignRef,
          parentCampaignRef: value.parentCampaignRef,
          source: value.source,
          lane: value.lane,
          face: value.face,
          domain: value.domain,
          title: value.title,
          purpose: value.purpose || null,
          nextAction: value.nextAction || null,
          owner: value.owner || null,
          terms: value.terms || null,
          returnPlan: value.returnPlan || null,
          placementState: value.placementState,
          placementKind: value.placementKind,
          stewardRequest: value.stewardRequest,
          note: value.note || null,
          placementLearning: value.placementLearning || null,
          leadId: lead?.id ?? null,
          senderRegion: value.senderRegion || null,
          consentToContact: value.consentToContact,
          consentedAt: value.consentToContact ? new Date() : null,
          withdrawalTokenHash: hash,
        },
      })
    })

    revalidatePath(ADMIN_PATH)

    const link = handoffLinkPath(token)

    // The receipt carries the link, which is what makes withdrawal a real right
    // rather than something that depends on keeping a tab open. Anonymous
    // senders keep the on-screen link only, because there is nowhere to send it.
    if (value.consentToContact && EMAIL_RE.test(value.senderContact)) {
      await sendEmail({
        to: value.senderContact,
        subject: 'Your Day 10 handoff is with the Campaign Steward',
        text: [
          `Your handoff "${value.title}" is with the MTGOA Campaign Stewards.`,
          '',
          SHOW_UP_TERMS.response,
          '',
          SHOW_UP_TERMS.retention,
          '',
          'Your link:',
          `https://masteringallyship.com${link}`,
          '',
          SHOW_UP_TERMS.withdrawal,
        ].join('\n'),
        tags: [{ name: 'funnel', value: 'mtgoa-day-10' }],
      })
    }

    return { ok: true, link }
  } catch (error) {
    console.error('[show-up-handoff] failed to save submission', error)
    return { ok: false, error: 'Something went wrong sending that. Please try again.' }
  }
}

/**
 * Withdraw a submission.
 *
 * Honors the published retention rule literally: the lead row is deleted, which
 * nulls `leadId` through the FK, and the region is cleared. What survives is the
 * handoff with nothing identifying attached.
 */
export async function withdrawShowUpHandoff(token: unknown): Promise<SenderControlState> {
  if (!looksLikeHandoffToken(token)) return { ok: false, error: 'That link is not valid.' }

  try {
    const submission = await db.showUpHandoffSubmission.findUnique({
      where: { withdrawalTokenHash: hashHandoffToken(token) },
      select: { id: true, leadId: true, status: true },
    })
    if (!submission) return { ok: false, error: 'That link is not valid.' }
    if (submission.status === 'withdrawn') {
      return { ok: true, message: 'This handoff is already withdrawn.' }
    }

    await db.$transaction(async (tx) => {
      await tx.showUpHandoffSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'withdrawn',
          withdrawnAt: new Date(),
          senderRegion: null,
          consentToContact: false,
          consentedAt: null,
        },
      })
      if (submission.leadId) {
        await tx.campaignLead.delete({ where: { id: submission.leadId } })
      }
    })

    revalidatePath(ADMIN_PATH)
    return {
      ok: true,
      message: 'Withdrawn. Your name and contact details are deleted, and the handoff has left active review.',
    }
  } catch (error) {
    console.error('[show-up-handoff] failed to withdraw', error)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

/** Change how a sender wants to be reached, without touching the artifact snapshot. */
export async function updateShowUpHandoffContact(
  token: unknown,
  contact: unknown,
): Promise<SenderControlState> {
  if (!looksLikeHandoffToken(token)) return { ok: false, error: 'That link is not valid.' }
  const next = typeof contact === 'string' ? contact.trim().slice(0, 200) : ''

  try {
    const submission = await db.showUpHandoffSubmission.findUnique({
      where: { withdrawalTokenHash: hashHandoffToken(token) },
      select: { id: true, leadId: true, status: true },
    })
    if (!submission) return { ok: false, error: 'That link is not valid.' }
    if (submission.status === 'withdrawn') {
      return { ok: false, error: 'This handoff is withdrawn. There is nothing left to reach you about.' }
    }
    if (!submission.leadId) {
      return { ok: false, error: 'This handoff was sent anonymously, so the stewards hold the handoff alone.' }
    }

    if (!next) {
      // Clearing contact is a withdrawal of the reply route, and the design
      // treats it as one: the lead goes, the handoff stays.
      await db.$transaction(async (tx) => {
        await tx.showUpHandoffSubmission.update({
          where: { id: submission.id },
          data: { consentToContact: false, consentedAt: null, senderRegion: null },
        })
        await tx.campaignLead.delete({ where: { id: submission.leadId! } })
      })
      revalidatePath(ADMIN_PATH)
      return { ok: true, message: 'Your contact details are deleted. The handoff stays, with nothing identifying you.' }
    }

    await db.campaignLead.update({
      where: { id: submission.leadId },
      data: { contact: next, channel: EMAIL_RE.test(next) ? 'email' : 'other' },
    })
    revalidatePath(ADMIN_PATH)
    return { ok: true, message: 'Updated. A steward will use this route if they respond.' }
  } catch (error) {
    console.error('[show-up-handoff] failed to update contact', error)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

const STATUS_KEYS = new Set(SHOW_UP_SUBMISSION_STATUSES.map((s) => s.key))

/**
 * Steward review. Status and a private note are the only things a steward can
 * change — the artifact stays the snapshot the sender showed up with.
 *
 * Turning a submission into campaign work stays a separate, deliberate action
 * against `CollectiveOffer` or `MilestoneNeed`. Nothing here creates one.
 */
export async function reviewShowUpHandoff(input: {
  id: string
  status?: string
  stewardNote?: string
}): Promise<SenderControlState> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not authorized.' }

  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
    select: { id: true },
  })
  if (!adminRole) return { ok: false, error: 'Not authorized.' }

  const status = typeof input.status === 'string' ? input.status : undefined
  if (status && !STATUS_KEYS.has(status)) return { ok: false, error: 'Unknown status.' }
  // Only the sender withdraws. A steward closing a submission is a different act.
  if (status === 'withdrawn') return { ok: false, error: 'Only the sender can withdraw a handoff.' }

  try {
    await db.showUpHandoffSubmission.update({
      where: { id: input.id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof input.stewardNote === 'string'
          ? { stewardNote: input.stewardNote.trim().slice(0, 4000) || null }
          : {}),
        reviewedByPlayerId: player.id,
      },
    })
    revalidatePath(ADMIN_PATH)
    return { ok: true, message: 'Saved.' }
  } catch (error) {
    console.error('[show-up-handoff] failed to review', error)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

/** What a sender sees on their own handoff page. Steward notes are absent by construction. */
export async function readShowUpHandoffForSender(token: string) {
  if (!looksLikeHandoffToken(token)) return null
  const submission = await db.showUpHandoffSubmission.findUnique({
    where: { withdrawalTokenHash: hashHandoffToken(token) },
    select: {
      id: true,
      title: true,
      purpose: true,
      nextAction: true,
      owner: true,
      terms: true,
      returnPlan: true,
      lane: true,
      placementState: true,
      placementKind: true,
      stewardRequest: true,
      status: true,
      createdAt: true,
      withdrawnAt: true,
      consentToContact: true,
      lead: { select: { contact: true, name: true } },
    },
  })
  if (!submission) return null
  return {
    ...submission,
    requestLabel: showUpStewardRequest(submission.stewardRequest)?.label ?? '',
  }
}
