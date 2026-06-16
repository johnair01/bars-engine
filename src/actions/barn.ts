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
