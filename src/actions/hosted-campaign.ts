'use server'

/**
 * Hosted allyship campaigns (see `src/lib/hosted-campaigns/campaigns.ts`).
 *
 * - `joinHostedCampaign`: public and accountless. A supporter picks a domain and
 *   leaves a way to reach them; it becomes a `CampaignLead` on her list.
 * - `saveHostedCampaign` / `listHostedSupporters`: gated by the campaign's edit
 *   token, which only she and Wendell hold. No account needed.
 * - `rotateHostedEditLink`: admin only. Makes (or remakes) her edit link.
 * - `saveHostedIntake` / `pressStuck` / `shareStuckReflection`: her GoFundMe and
 *   Patreon intake (`src/lib/hosted-campaigns/intake.ts`), gated by the same edit
 *   token. A STUCK? press is saved first, then emails Wendell.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { isCurrentPlayerAdmin } from '@/lib/ally-campaign/content-server'
import {
  DOMAIN_KEYS,
  cleanFields,
  getHostedDefault,
  tokenMatches,
  type HostedCampaignFields,
} from '@/lib/hosted-campaigns/campaigns'
import { getHostedStore, newEditToken, writeHostedEntry } from '@/lib/hosted-campaigns/server'
import {
  BOOK_WENDELL_URL,
  STUCK_CHOICES,
  appendStuck,
  cleanAnswers,
  emptyIntake,
  getStep,
  type StuckChoice,
} from '@/lib/hosted-campaigns/intake'
import { isIntakePreview } from '@/lib/hosted-campaigns/preview'
import { sendEmail } from '@/lib/email/send'

const slugSchema = z.string().trim().toLowerCase().min(1).max(60)

async function tokenOk(slug: string, token: string): Promise<boolean> {
  const store = await getHostedStore()
  return tokenMatches(store[slug]?.editToken, token)
}

// ── join (public) ───────────────────────────────────────────────────────────

const joinSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, 'Add your name.').max(120),
  contact: z.string().trim().min(3, 'Add a way to reach you.').max(200),
  domain: z.enum(DOMAIN_KEYS as [string, ...string[]]),
  note: z.string().trim().max(2000).optional(),
})

export type JoinResult = { ok: true } | { ok: false; error: string }

export async function joinHostedCampaign(raw: unknown): Promise<JoinResult> {
  const parsed = joinSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' }
  const input = parsed.data
  const campaign = getHostedDefault(input.slug)
  if (!campaign) return { ok: false, error: 'This campaign does not exist.' }

  const player = await getCurrentPlayer().catch(() => null)
  await db.campaignLead.create({
    data: {
      campaignRef: campaign.campaignRef,
      source: 'automated',
      status: 'new',
      name: input.name,
      contact: input.contact,
      channel: `hosted:${campaign.slug}`,
      domain: input.domain,
      notes: input.note || undefined,
      claimedByPlayerId: player?.id ?? undefined,
    },
  })
  return { ok: true }
}

// ── save (edit token) ───────────────────────────────────────────────────────

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string }

export async function saveHostedCampaign(
  slugRaw: string,
  token: string,
  fields: Partial<HostedCampaignFields>,
): Promise<SaveResult> {
  const slug = slugSchema.parse(slugRaw)
  if (!getHostedDefault(slug)) return { ok: false, error: 'This campaign does not exist.' }
  if (!(await tokenOk(slug, token))) {
    return { ok: false, error: 'This edit link no longer works. Ask Wendell for a new one.' }
  }
  const clean = cleanFields(fields)
  const entry = await writeHostedEntry(slug, (cur) => ({ ...cur, fields: { ...cur.fields, ...clean } }))
  revalidatePath(`/campaigns/${slug}`)
  return { ok: true, savedAt: entry.updatedAt ?? new Date().toISOString() }
}

// ── supporters (edit token) ─────────────────────────────────────────────────

export interface HostedSupporter {
  id: string
  name: string | null
  contact: string | null
  domain: string | null
  note: string | null
  createdAt: string
}

export async function listHostedSupporters(slugRaw: string, token: string): Promise<HostedSupporter[] | null> {
  const slug = slugSchema.parse(slugRaw)
  const campaign = getHostedDefault(slug)
  if (!campaign || !(await tokenOk(slug, token))) return null
  const rows = await db.campaignLead.findMany({
    where: { campaignRef: campaign.campaignRef },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: { id: true, name: true, contact: true, domain: true, notes: true, createdAt: true },
  })
  return rows.map((r) => ({ ...r, note: r.notes, createdAt: r.createdAt.toISOString() }))
}

// ── edit link (admin) ───────────────────────────────────────────────────────

export async function rotateHostedEditLink(slugRaw: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const slug = slugSchema.parse(slugRaw)
  if (!getHostedDefault(slug)) return { ok: false, error: 'This campaign does not exist.' }
  if (!(await isCurrentPlayerAdmin())) return { ok: false, error: 'Only an admin can make an edit link.' }
  const player = await getCurrentPlayer()
  const token = newEditToken()
  await writeHostedEntry(slug, (cur) => ({ ...cur, editToken: token }), player?.id)
  revalidatePath(`/campaigns/${slug}`)
  return { ok: true, token }
}

// ── page-building intake (edit token) ───────────────────────────────────────

const WENDELL = 'wendell@masteringallyship.com'

function siteBase(): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://bars-engine.vercel.app'
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

/** Her token, or the preview-only demo token, which saves nothing. */
async function intakeAccess(slugRaw: string, token: string): Promise<{ slug: string; demo: boolean } | null> {
  const slug = slugSchema.parse(slugRaw)
  if (!getHostedDefault(slug)) return null
  if (isIntakePreview(token)) return { slug, demo: true }
  return (await tokenOk(slug, token)) ? { slug, demo: false } : null
}

const LINK_GONE = 'This link no longer works. Ask Wendell for a new one.'

export async function saveHostedIntake(
  slugRaw: string,
  token: string,
  answers: Record<string, string>,
): Promise<SaveResult> {
  const access = await intakeAccess(slugRaw, token)
  if (!access) return { ok: false, error: LINK_GONE }
  if (access.demo) return { ok: true, savedAt: new Date().toISOString() }
  const clean = cleanAnswers(answers)
  const entry = await writeHostedEntry(access.slug, (cur) => {
    const intake = cur.intake ?? emptyIntake()
    return { ...cur, intake: { ...intake, answers: { ...intake.answers, ...clean } } }
  })
  return { ok: true, savedAt: entry.updatedAt ?? new Date().toISOString() }
}

export type StuckResult =
  | { ok: true; eventId: string; emailed: boolean; bookUrl?: string }
  | { ok: false; error: string }

function pacific(at: Date): string {
  return at.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * She pressed STUCK? on a step and picked a way through. Saved first, then one
 * email to Wendell naming the step, her choice, the time, and what she has
 * written on that step so far, so he can reach out before she stalls.
 */
export async function pressStuck(
  slugRaw: string,
  token: string,
  stepId: string,
  choiceRaw: string,
): Promise<StuckResult> {
  const access = await intakeAccess(slugRaw, token)
  if (!access) return { ok: false, error: LINK_GONE }
  const step = getStep(stepId)
  const choice = STUCK_CHOICES.find((c) => c.key === choiceRaw)
  if (!step || !choice) return { ok: false, error: 'That step is not on the list.' }

  const now = new Date()
  const eventId = `stuck-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  let answers: Record<string, string> = {}
  if (!access.demo) {
    const entry = await writeHostedEntry(access.slug, (cur) => ({
      ...cur,
      intake: appendStuck(cur.intake ?? emptyIntake(), { id: eventId, stepId: step.id, choice: choice.key as StuckChoice, at: now.toISOString() }),
    }))
    answers = entry.intake?.answers ?? {}
  }

  const name = getHostedDefault(access.slug)?.fields.name ?? access.slug
  const platform = step.platform === 'gofundme' ? 'GoFundMe' : 'Patreon'
  const link = `${siteBase()}/campaigns/${access.slug}/edit/${token}/intake?platform=${step.platform}&step=${step.id}`
  const written = step.questions
    .map((x) => `- ${x.ask}\n  ${answers[x.key]?.trim() || '(blank)'}`)
    .join('\n')
  const result = await sendEmail({
    to: WENDELL,
    subject: `${access.demo ? '[Preview test] ' : ''}${name} pressed STUCK on ${platform}: ${step.title} (${choice.label})`,
    text: [
      `${name} pressed STUCK? on the ${platform} step "${step.title}" at ${pacific(now)} Pacific.`,
      `She chose: ${choice.label}.`,
      choice.key === 'book' ? `She was sent to book time: ${BOOK_WENDELL_URL}` : 'If she sends what she writes in it, a second email follows.',
      '',
      'What she has written on this step so far:',
      written,
      '',
      `Open the step: ${link}`,
    ].join('\n'),
    tags: [{ name: 'form', value: 'campaign-stuck' }],
  })
  if (!result.ok) console.error('[pressStuck] email to Wendell failed', result)

  return { ok: true, eventId, emailed: result.ok && !result.skipped, ...(choice.key === 'book' ? { bookUrl: BOOK_WENDELL_URL } : {}) }
}

/** She chose to send Wendell what she wrote in the WAVE or 3-2-1. */
export async function shareStuckReflection(
  slugRaw: string,
  token: string,
  eventId: string,
  stepId: string,
  text: string,
): Promise<{ ok: true; emailed: boolean } | { ok: false; error: string }> {
  const access = await intakeAccess(slugRaw, token)
  if (!access) return { ok: false, error: LINK_GONE }
  const step = getStep(stepId)
  const shared = text.replace(/\r\n/g, '\n').trim().slice(0, 4000)
  if (!step || !shared) return { ok: false, error: 'Write something first.' }
  if (!access.demo) {
    await writeHostedEntry(access.slug, (cur) => {
      const intake = cur.intake ?? emptyIntake()
      return { ...cur, intake: { ...intake, stuck: intake.stuck.map((e) => (e.id === eventId ? { ...e, shared } : e)) } }
    })
  }
  const name = getHostedDefault(access.slug)?.fields.name ?? access.slug
  const platform = step.platform === 'gofundme' ? 'GoFundMe' : 'Patreon'
  const result = await sendEmail({
    to: WENDELL,
    subject: `${access.demo ? '[Preview test] ' : ''}${name}'s note from STUCK on ${platform}: ${step.title}`,
    text: [`${name} sent you what she wrote while stuck on "${step.title}":`, '', shared].join('\n'),
    tags: [{ name: 'form', value: 'campaign-stuck' }],
  })
  if (!result.ok) console.error('[shareStuckReflection] email to Wendell failed', result)
  return { ok: true, emailed: result.ok && !result.skipped }
}
