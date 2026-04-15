/**
 * Campaign Playbook — Synthesizer
 *
 * Clusters artifacts by playbook section and produces narrative updates.
 * Rule-based v0; no AI. Spec: docs/architecture/campaign-playbook-system.md
 */

import type { CollectedArtifacts } from './artifact-collector'
import { KOTTER_STAGES } from '@/lib/kotter'
import type { AllyshipDomain } from '@/lib/kotter'

const DOMAINS: AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
  'SKILLFUL_ORGANIZING',
]

const MAX_SNIPPET_LEN = 200
const MAX_ORIGIN_BARS = 5
const MAX_TIMELINE_ITEMS = 10

export interface SynthesizedPlaybook {
  origin: string
  vision: string
  people: string
  invitations: string
  timeline: string
  kotterStages: Record<number, string>
  domainStrategy: Record<string, string>
  raciRoles: string
  generatedSummary: string
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return t.slice(0, max).trimEnd() + '…'
}

/**
 * Synthesize playbook sections from collected artifacts.
 */
export function synthesizePlaybook(
  artifacts: CollectedArtifacts,
  existingPlaybook?: Partial<SynthesizedPlaybook>
): SynthesizedPlaybook {
  const { instance, bars, completedQuests, events, memberships, stewards, barResponders, invitations } =
    artifacts

  // Origin: early BARs (charge_capture, insight) and founding context
  const originBars = bars
    .filter((b) => ['charge_capture', 'insight'].includes(b.type) || !b.type)
    .slice(0, MAX_ORIGIN_BARS)
  const originParts = originBars.map((b) => {
    const snip = truncate(b.description || b.title, MAX_SNIPPET_LEN)
    return `• ${b.title}: ${snip}`
  })
  const origin =
    originParts.length > 0
      ? originParts.join('\n')
      : existingPlaybook?.origin ?? ''

  // Vision: instance targetDescription
  const vision =
    (instance.targetDescription?.trim() || existingPlaybook?.vision) ?? ''

  // People: memberships
  const peopleList = memberships.map((m) => {
    const role = m.roleKey ? ` (${m.roleKey})` : ''
    return `• ${m.playerName}${role}`
  })
  const people =
    peopleList.length > 0 ? peopleList.join('\n') : existingPlaybook?.people ?? ''

  // Invitations: from CampaignInvitation
  const invitationParts = invitations.map((i) => {
    const role = i.acceptedRole ? `Role: ${i.acceptedRole}` : `RACI: Informed`
    return `• ${i.targetActorName} — ${i.invitedRole}\n  Status: ${i.status}${i.sentAt ? `, sent ${i.sentAt.toISOString().slice(0, 10)}` : ''}\n  ${role}`
  })
  const invitationsSection =
    invitationParts.length > 0
      ? invitationParts.join('\n\n')
      : (existingPlaybook?.invitations ?? '')

  // Timeline: events + completed quests, ordered by date
  const timelineItems: Array<{ date: Date; label: string }> = []
  for (const e of events) {
    if (e.startTime)
      timelineItems.push({
        date: e.startTime,
        label: `${e.title} (${e.eventType}) — ${e.status}`,
      })
  }
  for (const q of completedQuests.slice(0, 5)) {
    timelineItems.push({
      date: q.completedAt,
      label: `Completed: ${q.title}`,
    })
  }
  timelineItems.sort((a, b) => a.date.getTime() - b.date.getTime())
  const timelineParts = timelineItems.slice(-MAX_TIMELINE_ITEMS).map((t) => {
    const d = t.date.toISOString().slice(0, 10)
    return `• ${d}: ${t.label}`
  })
  const timeline =
    timelineParts.length > 0
      ? timelineParts.join('\n')
      : existingPlaybook?.timeline ?? ''

  // Kotter stages: map artifacts to stages
  const kotterStages: Record<number, string> = { ...existingPlaybook?.kotterStages }
  for (let s = 1; s <= 8; s++) {
    if (kotterStages[s]) continue
    const stageName = KOTTER_STAGES[s as keyof typeof KOTTER_STAGES]?.name ?? `Stage ${s}`
    const parts: string[] = []
    if (s === 1) {
      const urgencyBars = bars.filter((b) => b.type === 'charge_capture')
      if (urgencyBars.length > 0)
        parts.push(
          ...urgencyBars.slice(0, 3).map((b) => truncate(b.title + ': ' + (b.description || ''), 120))
        )
    }
    if (s === 2 && memberships.length > 0) {
      parts.push(`Coalition: ${memberships.map((m) => m.playerName).join(', ')}`)
    }
    if (s === 3 && instance.targetDescription) {
      parts.push(truncate(instance.targetDescription, 300))
    }
    if (s === 5 && bars.length > 0) {
      const questBars = bars.filter((b) => b.status === 'active').slice(0, 3)
      parts.push(...questBars.map((b) => `• ${b.title}`))
    }
    if (s === 6 && completedQuests.length > 0) {
      parts.push(
        ...completedQuests.slice(0, 3).map((q) => `• ${q.title} (${q.completedAt.toISOString().slice(0, 10)})`)
      )
    }
    if (s === 7 && events.length > 0) {
      parts.push(...events.slice(0, 3).map((e) => `• ${e.title} — ${e.status}`))
    }
    if (parts.length > 0) kotterStages[s] = parts.join('\n')
  }

  // Domain strategy: group by allyshipDomain
  const domainStrategy: Record<string, string> = { ...existingPlaybook?.domainStrategy }
  for (const domain of DOMAINS) {
    if (domainStrategy[domain]) continue
    const domainBars = bars.filter((b) => b.allyshipDomain === domain)
    if (domainBars.length > 0) {
      domainStrategy[domain] =
        'Active: ' + domainBars.slice(0, 3).map((b) => b.title).join(', ')
    }
  }

  // RACI: stewards = Responsible, members with roleKey = Accountable/Consulted, responders = Consulted
  const responsible = [...new Set(stewards.map((s) => `${s.playerName} → ${s.questTitle}`))]
  const offerHelpResponders = barResponders.filter((r) => r.responseType === 'offer_help')
  const consulted = [...new Set(offerHelpResponders.map((r) => r.responderName))]
  const accountable = memberships
    .filter((m) => m.roleKey === 'owner' || m.roleKey === 'admin')
    .map((m) => m.playerName)
  const informed = memberships
    .filter((m) => !['owner', 'admin'].includes(m.roleKey ?? ''))
    .map((m) => m.playerName)

  const raciParts: string[] = []
  if (accountable.length > 0) raciParts.push(`Accountable: ${accountable.join(', ')}`)
  if (responsible.length > 0) raciParts.push(`Responsible: ${responsible.join('; ')}`)
  if (consulted.length > 0) raciParts.push(`Consulted: ${consulted.join(', ')}`)
  if (informed.length > 0) raciParts.push(`Informed: ${informed.join(', ')}`)
  const raciRoles =
    raciParts.length > 0 ? raciParts.join('\n') : existingPlaybook?.raciRoles ?? ''

  // Generated summary
  const summaryParts: string[] = []
  summaryParts.push(`Campaign at Kotter Stage ${instance.kotterStage}.`)
  if (memberships.length > 0) summaryParts.push(`${memberships.length} members.`)
  if (bars.length > 0) summaryParts.push(`${bars.length} active BARs/quests.`)
  if (completedQuests.length > 0)
    summaryParts.push(`${completedQuests.length} quests completed.`)
  if (events.length > 0) summaryParts.push(`${events.length} events.`)
  const generatedSummary = summaryParts.join(' ')

  return {
    origin: (origin || existingPlaybook?.origin) ?? '',
    vision: (vision || existingPlaybook?.vision) ?? '',
    people: (people || existingPlaybook?.people) ?? '',
    invitations: (invitationsSection || existingPlaybook?.invitations) ?? '',
    timeline: (timeline || existingPlaybook?.timeline) ?? '',
    kotterStages,
    domainStrategy,
    raciRoles: (raciRoles || existingPlaybook?.raciRoles) ?? '',
    generatedSummary: (generatedSummary || existingPlaybook?.generatedSummary) ?? '',
  }
}
