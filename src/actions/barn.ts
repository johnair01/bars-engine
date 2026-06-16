import { db } from '@/lib/db'
import {
  BARN_CAMPAIGN_REF,
  WALL_KEYS,
  buildRaisedCents,
  type WallKey,
} from '@/lib/event/barn-raising'

/**
 * Live read for the three-wall Milestone BAR. Reads the wall `CampaignMilestone` rows
 * (one per wall, by `wallKey`) and the in-kind "hands & beams" counts, returning a shape
 * the presentational `BarnRaisingBar` consumes directly (it is `BarnState`-compatible).
 *
 * Money note: `currentValue` is stored in **dollars** (see `donate.ts`); `buildRaisedCents`
 * converts to cents. Public read — callers must tolerate a thrown error (DB-down).
 *
 * Spec: .specify/specs/barn-raising-live-data/spec.md
 */
export interface BarnSnapshot {
  raisedCents: Record<WallKey, number>
  hands: number
  beams: number
  milestoneIds: Record<WallKey, string | null>
}

export async function getBarnSnapshot(
  campaignRef: string = BARN_CAMPAIGN_REF,
): Promise<BarnSnapshot> {
  const milestones = await db.campaignMilestone.findMany({
    where: { campaignRef, wallKey: { in: [...WALL_KEYS] }, status: 'active' },
    select: { id: true, wallKey: true, currentValue: true },
  })

  const raisedCents = buildRaisedCents(milestones)

  const milestoneIds: Record<WallKey, string | null> = {
    car: null,
    presale: null,
    runway: null,
  }
  for (const m of milestones) {
    if (m.wallKey === 'car' || m.wallKey === 'presale' || m.wallKey === 'runway') {
      milestoneIds[m.wallKey] = m.id
    }
  }

  // In-kind "hands & beams": contributions linked to a BAR (barId set) across the barn
  // walls. MVP counts them all as hands; splitting out beams (space offers) needs an
  // offer-BAR type signal (TODO once OBT exposes one).
  const ids = milestones.map((m) => m.id)
  const hands = ids.length
    ? await db.milestoneContribution.count({
        where: { milestoneId: { in: ids }, barId: { not: null } },
      })
    : 0
  const beams = 0

  return { raisedCents, hands, beams, milestoneIds }
}

/**
 * Anonymously credit a barn wall by `dollars` at sale time — used by the Gumroad webhook
 * bridge (`/api/webhooks/gumroad`). Increments the active wall milestone's `currentValue`
 * (stored in **dollars**). No `MilestoneContribution` is written: `playerId` is required
 * there, and a Gumroad sale has no player until the buyer later redeems at `/redeem`.
 *
 * Returns the credited milestone id, or `null` when there is no active wall for the key
 * (e.g. the barn hasn't been seeded). Callers own idempotency (credit once per sale).
 */
export async function creditBarnWallAnon(
  wallKey: WallKey,
  dollars: number,
  campaignRef: string = BARN_CAMPAIGN_REF,
): Promise<string | null> {
  if (!(dollars > 0)) return null
  const wall = await db.campaignMilestone.findFirst({
    where: { campaignRef, wallKey, status: 'active' },
    select: { id: true },
  })
  if (!wall) return null
  await db.campaignMilestone.update({
    where: { id: wall.id },
    data: { currentValue: { increment: dollars } },
  })
  return wall.id
}
