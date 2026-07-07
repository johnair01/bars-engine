/**
 * Campaign Lead Forge — shared invite-forging helpers.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * One place to resolve an invite's instance/campaign targets and mint its token,
 * so quickAddLead / adoptCollectiveLead can't drift (divergent invite defaults).
 */
import 'server-only'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { resolveCampaignInstanceId } from './auth'

export interface InviteTargets {
  instanceId?: string
  campaignId?: string
}

/** Resolve the Instance + Campaign a campaignRef's invite should link to. */
export async function resolveInviteTargets(campaignRef: string): Promise<InviteTargets> {
  const instanceId = await resolveCampaignInstanceId(campaignRef)
  const campaign = await db.campaign.findFirst({ where: { slug: campaignRef }, select: { id: true } })
  return { instanceId: instanceId ?? undefined, campaignId: campaign?.id ?? undefined }
}

/** A fresh, URL-safe invite token. */
export function newInviteToken(): string {
  return randomBytes(24).toString('base64url')
}

/** The `data` for a lead Invite.create — one authoritative shape. */
export function leadInviteData(opts: {
  token: string
  playerId: string
  targets: InviteTargets
  roleKey?: string | null
  message?: string | null
}) {
  return {
    token: opts.token,
    status: 'active',
    maxUses: 1,
    forgerId: opts.playerId,
    instanceId: opts.targets.instanceId,
    campaignId: opts.targets.campaignId,
    preassignedRoleKey: opts.roleKey || undefined,
    invitationMessage: opts.message || undefined,
  }
}
