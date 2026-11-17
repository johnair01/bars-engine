'use server'

/**
 * The four gate acts, sealed on the harvest card's back (design pass gate-acts-2026-11-17).
 *
 * A visitor with no account is one CampaignLead tied to their browser id. A seal appends one entry to the lead, files one
 * private quest in the founder's garden and writes one Your steps card for him. A seal is 'sealed', never 'done': nothing
 * here writes a Donation, a MilestoneNeed, a milestone total or vibeulons. Those move only through his steward paths.
 * Friends' names and the visitor's own words never reach this file: the input schema has no field for them.
 */

import { db } from '@/lib/db'
import { sessionWrite } from '@/lib/board/session-write'
import {
  ACT_DOMAIN, CAMPAIGN_REF, GATE_BAR_ID, LIMITS, PASS_ID, QUEST_COPY, STORY_ID, WITHDRAWN_LINE,
  parseEntries, parseFounderId, sealSchema, stepLine, takeBackSchema, utcDay, type ActEntry,
} from '@/lib/founder-gate/acts'

export type SealResult =
  | { ok: true; kept: 'sealed'; index: number }
  | { ok: true; kept: 'device' }
  | { ok: false; error: string }

const stepId = (leadId: string, n: number) => `gate-act-${leadId}-${n}`

async function writeStep(docId: string, text: string, at: string) {
  try {
    await sessionWrite(db, [{ collection: 'steps', docId, data: { do: text, due: at.slice(0, 10), gate: true } }])
  } catch {
    /* the seal stands without its step; a steward reads the lead */
  }
}

export async function sealGateAct(raw: unknown): Promise<SealResult> {
  const parsed = sealSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'That card could not be sealed. Try again.' }
  const v = parsed.data
  if (v.act === 'work' && !v.agenda) return { ok: false, error: 'Answer the three questions first.' }
  if (v.act === 'intro' && !v.kind) return { ok: false, error: 'Pick work or a podcast guest first.' }

  const at = new Date().toISOString()
  const config = await db.appConfig.findUnique({ where: { id: 'singleton' }, select: { theme: true } })
  const founderId = parseFounderId(config?.theme)

  // The gate-wide limit counts the quests filed in the last hour; with no founder set there are none, so count leads.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = founderId
    ? await db.customBar.count({ where: { campaignRef: CAMPAIGN_REF, type: 'quest', createdAt: { gte: hourAgo } } })
    : await db.campaignLead.count({ where: { campaignRef: CAMPAIGN_REF, updatedAt: { gte: hourAgo } } })
  if (recent >= LIMITS.perHour) return { ok: true, kept: 'device' }

  const entryBase: ActEntry = { act: v.act, at, status: 'sealed', ...(v.kind ? { kind: v.kind } : {}), ...(v.band ? { band: v.band } : {}) }

  const made = await db.$transaction(async (tx) => {
    const lead = await tx.campaignLead.findFirst({ where: { campaignRef: CAMPAIGN_REF, clientSessionId: v.allyId } })
    const entries = parseEntries(lead?.actionsJson)
    if (entries.filter((e) => utcDay(e.at) === utcDay(at)).length >= LIMITS.perLeadPerDay) return null

    let intakeId = lead?.latentIntakeId ?? null
    if (founderId) {
      await tx.customBar.upsert({
        where: { id: GATE_BAR_ID },
        create: {
          id: GATE_BAR_ID, creatorId: founderId, title: 'The founder’s gate', campaignRef: CAMPAIGN_REF, visibility: 'private', status: 'active',
          description: 'The seed the gate walk’s visitors plant. Each visitor’s six seed-packet answers hang on it as an intake.',
        },
        update: {},
      })
      if (!intakeId) {
        const intake = await tx.latentAllyshipIntake.create({
          data: { customBarId: GATE_BAR_ID, storyId: STORY_ID, endingPassageId: 'harvest', pathJson: JSON.stringify(v.packet), clientSessionId: v.allyId },
        })
        intakeId = intake.id
      }
    }

    const index = entries.length
    const goals = v.act === 'work' && v.agenda ? JSON.stringify({ agenda: v.agenda, at }) : undefined
    const base = lead
      ? await tx.campaignLead.update({ where: { id: lead.id }, data: { actionsJson: JSON.stringify([...entries, { ...entryBase }]), ...(goals ? { goals } : {}), ...(intakeId && !lead.latentIntakeId ? { latentIntakeId: intakeId } : {}) } })
      : await tx.campaignLead.create({
        data: {
          campaignRef: CAMPAIGN_REF, source: 'automated', collective: false, clientSessionId: v.allyId, domain: ACT_DOMAIN[v.act],
          actionsJson: JSON.stringify([{ ...entryBase }]), ...(goals ? { goals } : {}), ...(intakeId ? { latentIntakeId: intakeId } : {}),
        },
      })

    if (founderId) {
      const bar = await tx.customBar.create({
        data: {
          creatorId: founderId, title: QUEST_COPY[v.act].title, description: QUEST_COPY[v.act].description, type: 'quest', visibility: 'private',
          status: 'active', campaignRef: CAMPAIGN_REF, allyshipDomain: ACT_DOMAIN[v.act],
          inputs: JSON.stringify({ leadId: base.id, act: v.act, kind: v.kind ?? null, band: v.band ?? null, pass: PASS_ID }),
        },
      })
      const withBar = [...entries, { ...entryBase, barId: bar.id }]
      await tx.campaignLead.update({ where: { id: base.id }, data: { actionsJson: JSON.stringify(withBar) } })
    }
    return { leadId: base.id, index }
  })

  if (!made) return { ok: true, kept: 'device' }
  await writeStep(stepId(made.leadId, made.index), stepLine(v.act, v.kind, v.band), at)
  return { ok: true, kept: 'sealed', index: made.index }
}

export async function takeBackGateAct(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = takeBackSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'That card could not be taken back.' }
  const { allyId, index } = parsed.data
  const at = new Date().toISOString()

  const done = await db.$transaction(async (tx) => {
    const lead = await tx.campaignLead.findFirst({ where: { campaignRef: CAMPAIGN_REF, clientSessionId: allyId } })
    if (!lead) return null
    const entries = parseEntries(lead.actionsJson)
    const entry = entries[index]
    if (!entry) return null
    if (entry.status !== 'withdrawn') {
      entries[index] = { ...entry, status: 'withdrawn' }
      await tx.campaignLead.update({ where: { id: lead.id }, data: { actionsJson: JSON.stringify(entries) } })
      if (entry.barId) await tx.customBar.updateMany({ where: { id: entry.barId, campaignRef: CAMPAIGN_REF }, data: { status: 'archived', archivedAt: new Date() } })
    }
    return { leadId: lead.id }
  })
  if (!done) return { ok: false, error: 'That card was not found.' }
  await writeStep(stepId(done.leadId, index), WITHDRAWN_LINE, at)
  return { ok: true }
}
