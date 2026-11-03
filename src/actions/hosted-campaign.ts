'use server'

/**
 * Hosted allyship campaigns (see `src/lib/hosted-campaigns/campaigns.ts`).
 *
 * - `joinHostedCampaign`: public and accountless. A supporter picks a domain and
 *   leaves a way to reach them; it becomes a `CampaignLead` on her list.
 * - `saveHostedCampaign` / `listHostedSupporters`: gated by the campaign's edit
 *   token, which only she and Wendell hold. No account needed.
 * - `rotateHostedEditLink`: admin only. Makes (or remakes) her edit link.
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
