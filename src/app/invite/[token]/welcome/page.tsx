import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { InviteSignupForm } from '../InviteSignupForm'
import { LeadWelcomeCYOA } from './LeadWelcomeCYOA'
import { parseJsonStringArray } from '@/lib/campaign-leads/types'
import { getDomainLabel } from '@/lib/allyship-domains'

/**
 * @page /invite/[token]/welcome
 * @entity PLAYER
 * @description Warm invitee onboarding — the personalized orientation CYOA for a
 *   forged Campaign Lead. Welcomes the named invitee, orients them to the system,
 *   shows the tasks the owner matched to them, then hands into character creation
 *   (which assigns those starter quests). Falls back to /invite/[token] when the
 *   invite has no linked lead.
 * @permissions public (invite token required)
 * @relationships Invite, CampaignLead (matched tasks), CustomBar (starter quests) → PLAYER
 * @dimensions WHO:forger→invitee, WHAT:orientation, WHERE:invitation, ENERGY:invite, PERSONAL_THROUGHPUT:wake_up
 */
export const metadata: Metadata = {
  title: 'Your invitation | BARs',
  description: 'A personal invitation — see how you’re helping and claim your character.',
}

export default async function InviteWelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      forger: { select: { id: true, name: true, nationId: true, archetypeId: true } },
      invitationBar: { select: { id: true, title: true, description: true } },
    },
  })

  // No invite, inactive, or not a forged-lead invite → let the generic landing handle it.
  if (!invite || invite.status !== 'active') redirect(`/invite/${token}`)

  const lead = await db.campaignLead.findFirst({
    where: { inviteId: invite.id },
    select: { name: true, domain: true, actionsJson: true, starterQuestIdsJson: true },
  })
  if (!lead) redirect(`/invite/${token}`)

  const questIds = parseJsonStringArray(lead.starterQuestIdsJson)
  const [nations, archetypes, questBars, campaignName] = await Promise.all([
    db.nation.findMany({
      where: { archived: false },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    }),
    db.archetype.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    }),
    questIds.length > 0
      ? db.customBar.findMany({ where: { id: { in: questIds } }, select: { id: true, title: true } })
      : Promise.resolve([] as { id: string; title: string }[]),
    invite.campaignId
      ? db.campaign.findUnique({ where: { id: invite.campaignId }, select: { name: true } }).then((c) => c?.name ?? 'the campaign')
      : Promise.resolve('the campaign'),
  ])

  // Preserve the owner's chosen order for quest titles.
  const titleById = new Map(questBars.map((b) => [b.id, b.title]))
  const questTitles = questIds.map((id) => titleById.get(id)).filter((t): t is string => Boolean(t))

  // Prefill nation/archetype from the invitation target or the forger (mirrors /invite/[token]).
  let prefillNationId = ''
  let prefillArchetypeId = ''
  if (invite.invitationTargetType === 'nation' && invite.invitationTargetId) {
    prefillNationId = invite.invitationTargetId
  } else if (invite.forger && invite.invitationTargetType !== 'nation') {
    prefillNationId = invite.forger.nationId || ''
    prefillArchetypeId = invite.forger.archetypeId || ''
  } else if (invite.forger && invite.invitationTargetType === 'nation') {
    prefillArchetypeId = invite.forger.archetypeId || ''
  }

  const signupSlot = (
    <InviteSignupForm
      token={token}
      nations={nations}
      archetypes={archetypes}
      prefillNationId={prefillNationId}
      prefillArchetypeId={prefillArchetypeId}
      forgerName={invite.forger?.name ?? null}
      pendingBar={invite.invitationBar ?? null}
      invitationMessage={invite.invitationMessage ?? null}
    />
  )

  return (
    <LeadWelcomeCYOA
      campaignName={campaignName}
      forgerName={invite.forger?.name ?? null}
      inviteeName={lead.name}
      message={invite.invitationMessage ?? null}
      help={{
        domainLabel: lead.domain ? getDomainLabel(lead.domain) : null,
        actions: parseJsonStringArray(lead.actionsJson),
        questTitles,
      }}
      signupSlot={signupSlot}
    />
  )
}
