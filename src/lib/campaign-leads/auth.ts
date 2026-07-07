/**
 * Campaign Lead Forge — generalized steward/owner authorization.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * Generalizes The Crossing's `assertSteward` past a single hardcoded campaign:
 * a player may steward a campaign's lead board if they are a global admin, the
 * owner/steward of the backing Instance, the Campaign's creator, or hold
 * donation-edit rights on the Instance. Re-checked server-side on every action.
 */
import 'server-only'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { assertCanEditInstanceDonation } from '@/actions/donation-cta'

/** True when the player holds the global `admin` role. */
async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } } })
  return !!row
}

/**
 * Resolve the Instance id backing a `campaignRef`. Tries the Instance table
 * (by `campaignRef` column or `slug`), then falls back to a Campaign slug →
 * its `instanceId`. Returns null when nothing matches.
 */
export async function resolveCampaignInstanceId(campaignRef: string): Promise<string | null> {
  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { id: true },
  })
  if (inst) return inst.id

  const camp = await db.campaign.findFirst({
    where: { slug: campaignRef },
    select: { instanceId: true },
  })
  return camp?.instanceId ?? null
}

/**
 * True if `playerId` may steward the lead board for `campaignRef`.
 * Order: global admin → owner/steward membership on the instance → the
 * Campaign's creator → instance donation-edit rights.
 */
export async function assertCampaignSteward(
  playerId: string | null | undefined,
  campaignRef: string,
): Promise<boolean> {
  if (!playerId) return false
  if (await isGlobalAdmin(playerId)) return true

  const instanceId = await resolveCampaignInstanceId(campaignRef)

  if (instanceId) {
    const membership = await db.instanceMembership.findUnique({
      where: { instanceId_playerId: { instanceId, playerId } },
      select: { roleKey: true },
    })
    if (membership?.roleKey === 'owner' || membership?.roleKey === 'steward') return true
  }

  const campaign = await db.campaign.findFirst({
    where: { slug: campaignRef },
    select: { createdById: true },
  })
  if (campaign?.createdById && campaign.createdById === playerId) return true

  if (instanceId) return assertCanEditInstanceDonation(playerId, instanceId)

  return false
}

export type StewardGuard = { ok: true; playerId: string } | { ok: false; error: string }

/**
 * The single steward chokepoint for Lead Forge actions: resolve the signed-in
 * player and confirm they may steward `campaignRef`. Reused across every
 * steward-gated action so the check + error strings live in one place.
 */
export async function stewardGuard(campaignRef: string): Promise<StewardGuard> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not signed in.' }
  if (!(await assertCampaignSteward(player.id, campaignRef))) {
    return { ok: false, error: 'You do not have steward access to this campaign.' }
  }
  return { ok: true, playerId: player.id }
}

/** The campaign's current Kotter stage (1–8), defaulting to 1 when unresolved. */
export async function resolveCampaignKotterStage(campaignRef: string): Promise<number> {
  const instanceId = await resolveCampaignInstanceId(campaignRef)
  if (!instanceId) return 1
  const inst = await db.instance.findUnique({ where: { id: instanceId }, select: { kotterStage: true } })
  return inst?.kotterStage ?? 1
}
