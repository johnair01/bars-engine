'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { SELF_REPORT_CATEGORIES } from '@/lib/kickstarter-hub/content'

/**
 * Kickstarter hub self-report → a steward-triageable lead (+ holding-pen bar).
 *
 * "Raising your hand" on the hub lands as a `CampaignLead` in the-crossing's
 * steward Leads console (/campaign/the-crossing/steward/leads), where a steward
 * can triage it (status, notes, role) and forge quests from it. Alongside the
 * lead we mint a holding-pen `CustomBar` — the compostable seed of the eventual
 * quest — and attach it to the lead as a proposed starter quest, so "turn this
 * hand-raise into a quest" is one click for the steward.
 *
 * Public action: works logged-out (most hub visitors are). A signed-in backer
 * becomes the lead (`claimedByPlayerId`) and owns their own seed bar; anonymous
 * hand-raises attribute the seed bar to a system admin so it still lands in the
 * campaign. Email is OPTIONAL, per the "identification, not solicitation"
 * register — a hand-raise with just a category is valid.
 *
 * Routing decision (spec §9) resolved: leads → the-crossing steward console.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HUB_CAMPAIGN_REF = 'the-crossing'
const HUB_SOURCE = 'kickstarter-hub-selfreport'

/** category → the steward-facing signals we can derive from it. `domain` is an
 *  AllyshipDomainKey (or null for the no-ask observer); `roleHint` is a
 *  suggestion the steward can accept when assigning a role. */
const CATEGORY_ROUTING: Record<string, { domain: string | null; roleHint: string }> = {
  'org-budget-connector': { domain: 'SKILLFUL_ORGANIZING', roleHint: 'org-connector' },
  'donor-connector': { domain: 'GATHERING_RESOURCES', roleHint: 'donor-connector' },
  'hype-builder': { domain: 'RAISE_AWARENESS', roleHint: 'hype-builder' },
  'here-for-july-17': { domain: null, roleHint: 'observer' },
}

const CATEGORY_BY_KEY = new Map(SELF_REPORT_CATEGORIES.map((c) => [c.key, c]))

export type SubmitHubSelfReportResult =
  | { ok: true; leadId: string; barId: string | null }
  | { ok: false; error: string }

export async function submitHubSelfReport(input: {
  category: string
  email?: string
  note?: string
  superpower?: string
  superpowerOrientation?: 'internal' | 'external' | null
  audience?: 'warm' | 'public'
}): Promise<SubmitHubSelfReportResult> {
  const category = CATEGORY_BY_KEY.get(input.category)
  const routing = CATEGORY_ROUTING[input.category]
  if (!category || !routing) {
    return { ok: false, error: 'Pick a category first.' }
  }

  const email = input.email?.trim().toLowerCase() || null
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email.' }
  }

  const note = input.note?.trim().slice(0, 600) || null
  const audience = input.audience === 'public' ? 'public' : 'warm'
  const superpower = input.superpower?.trim().slice(0, 60) || null
  const orientation =
    input.superpowerOrientation === 'internal' || input.superpowerOrientation === 'external'
      ? input.superpowerOrientation
      : null

  const player = await getCurrentPlayer()

  // Steward-private context: what they raised their hand for, in plain terms.
  const notes = [
    `Kickstarter hub self-report (${audience}).`,
    `Category: ${category.label} — ${category.blurb}`,
    `Suggested role: ${routing.roleHint}.`,
    superpower ? `Carried superpower: ${superpower}${orientation ? ` (${orientation})` : ''}.` : null,
    note ? `\nTheir note: "${note}"` : null,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const created = await db.$transaction(async (tx) => {
      // Resolve an owner for the seed bar: the signed-in backer, else a system
      // admin so anonymous hand-raises still land a bar in the campaign.
      let ownerId = player?.id ?? null
      if (!ownerId) {
        const admin = await tx.playerRole.findFirst({
          where: { role: { key: 'admin' } },
          select: { playerId: true },
        })
        ownerId = admin?.playerId ?? null
      }

      let barId: string | null = null
      if (ownerId) {
        const description = [
          `A hand raised on the Kickstarter hub — raw material for a quest.`,
          '',
          `${category.label}: ${category.blurb}`,
          superpower ? `Superpower carried in: ${superpower}${orientation ? ` (${orientation})` : ''}.` : null,
          email ? `Contact: ${email}` : 'No contact left — identification, not solicitation.',
          note ? `\n"${note}"` : null,
          '',
          `Steward move: triage in the leads console and forge this into a quest.`,
        ]
          .filter((line) => line !== null)
          .join('\n')

        const bar = await tx.customBar.create({
          data: {
            creatorId: ownerId,
            title: `Hand raised: ${category.label}`.slice(0, 80),
            description,
            type: 'self_report',
            reward: 0,
            visibility: 'private',
            status: 'active',
            isSystem: true,
            questSource: 'kickstarter_hub_selfreport',
            campaignRef: HUB_CAMPAIGN_REF,
            allyshipDomain: routing.domain ?? undefined,
            superpowerAffinity: superpower ?? undefined,
            emotionalAlchemyTag: routing.roleHint,
            rootId: 'temp',
            inputs: JSON.stringify({
              source: HUB_SOURCE,
              category: input.category,
              roleHint: routing.roleHint,
              audience,
              superpower,
              orientation,
              email,
            }),
            seedMetabolization: mergeSeedMetabolization(null, {
              maturity: 'captured',
              soilKind: 'holding_pen',
              contextNote: `${category.label} · hub self-report`,
            }),
            agentMetadata: JSON.stringify({
              schemaVersion: 'hub-self-report.v1',
              source: HUB_SOURCE,
              category: input.category,
              roleHint: routing.roleHint,
              audience,
            }),
          },
          select: { id: true },
        })
        barId = bar.id
        await tx.customBar.update({ where: { id: barId }, data: { rootId: barId } })
      }

      const lead = await tx.campaignLead.create({
        data: {
          campaignRef: HUB_CAMPAIGN_REF,
          source: 'automated',
          status: 'new',
          contact: email ?? undefined,
          channel: email ? 'email' : undefined,
          domain: routing.domain ?? undefined,
          superpower: superpower ?? undefined,
          superpowerOrientation: orientation ?? undefined,
          notes,
          claimedByPlayerId: player?.id ?? undefined,
          starterQuestIdsJson: barId ? JSON.stringify([barId]) : undefined,
        },
        select: { id: true },
      })

      return { leadId: lead.id, barId }
    })

    revalidatePath(`/campaign/${HUB_CAMPAIGN_REF}/leads`)
    revalidatePath(`/campaign/${HUB_CAMPAIGN_REF}/steward/leads`)

    return { ok: true, leadId: created.leadId, barId: created.barId }
  } catch (err) {
    console.error('[hub-self-report] failed to record hand-raise', err)
    return { ok: false, error: 'Something went wrong saving that. Please try again.' }
  }
}
