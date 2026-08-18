/**
 * Ally Campaign — the warm channel. The Girl Scout cookie model.
 *
 * The paid-ads arithmetic (see `economics.adEconomics`) says a cold book sale in
 * this category costs roughly what the book earns. That is not an argument for
 * spending more on ads; it is an argument for a different channel.
 *
 * The different channel is this intake. Every ally who finishes the CYOA is a
 * person with a network the campaign cannot otherwise reach, and a warm ask from
 * someone you trust converts several times better than any ad — referred buyers
 * convert about 4x standard traffic, and a warm referral gets a 40–60% response
 * where cold outreach gets 1–7%.
 *
 * The design commitments here, which are what separate this from "please tell
 * your friends":
 *
 *   0. THE DIGITAL EDITION IS WHAT ALLIES SELL. This is the load-bearing choice.
 *      An ally selling paper has to front money, hold stock, and get boxes to
 *      people — three ways for a willing yes to die quietly in someone's hallway.
 *      Selling digital, they send a link: no inventory, no cash risk, no
 *      shipping, instant delivery, and no ceiling on how many they can move. The
 *      paper run stops being the brigade's supply constraint and goes back to its
 *      real jobs — the copies already owed, and hand-selling at events.
 *   1. A NUMBER, not a vibe. Every channel states expected copies, and the
 *      expectation is built from published conversion rates, not optimism.
 *   2. TRACKABLE. Every channel defines the evidence that proves it happened.
 *      An ally's referral path is their existing lead id — no new identity, no
 *      account, and it already exists the moment they finish the funnel.
 *   3. SMALL AND FINITE. A case is five copies, not "as many as you can." Girl
 *      Scouts do not hand a child an open-ended sales target.
 *   4. HONEST ABOUT WEAK CHANNELS. A social post sells about two copies. It is
 *      listed at two copies rather than being talked up, because an ally who is
 *      told a post is powerful and then sees nothing happen stops trusting the
 *      whole board.
 *
 * ⚠️ The conversion rates below are PUBLISHED BENCHMARKS for other people's
 * campaigns, not measurements of this one. They are the best available prior and
 * they should be replaced with real numbers as the board produces them.
 */

import {
  INPUTS,
  digitalEconomics,
  printEconomics,
  usd,
  type CampaignInputs,
} from './economics'

/** Copies in one "case" — the unit an ally takes responsibility for. */
export const WARM_CASE_UNITS = 5

/**
 * The edition the warm channel sells.
 *
 * Digital, deliberately. See the header: an ally who has to front cash and carry
 * boxes converts a yes into a chore, and the paper run can only supply fifty
 * cases before it needs reprinting. Digital removes both problems at once and
 * costs about two dollars a copy in margin to do it — the cheapest constraint
 * this campaign ever bought its way out of.
 */
export const WARM_EDITION = 'book-digital' as const

export interface WarmChannel {
  key: string
  label: string
  /** What the ally actually does, in one line. */
  what: string
  /** The audience this reaches, in the ally's own terms. */
  reachLabel: string
  /** People reached in one run of this channel. */
  typicalReach: number
  /** Share of those reached who buy. Published benchmark — see `source`. */
  conversionRate: number
  /** Rough hours it costs the ally. */
  effortHours: number
  /**
   * How the campaign CHECKS it — the number that lands on the board. A channel
   * whose result cannot be observed is a hope, not a commitment.
   */
  evidence: string
  source: string
}

/**
 * Ordered weakest-to-strongest by copies, so nobody skims the top of the list and
 * concludes that posting is the high-leverage move. It is the lowest one here.
 */
export const WARM_CHANNELS: readonly WarmChannel[] = [
  {
    key: 'post',
    label: 'Post about it, in your own words',
    what: 'One public post saying why this matters to you — not a repost of my copy. Your reason is the whole asset.',
    reachLabel: 'your followers',
    typicalReach: 300,
    conversionRate: 0.006,
    effortHours: 0.5,
    evidence: 'Link clicks on your referral link, and any sales that follow it.',
    source:
      'Referral share click-through 10–25%, referral purchase conversion 3–5% (ReferralCandy / Rivo 2026 benchmarks)',
  },
  {
    key: 'circle',
    label: `Sell a case — ${WARM_CASE_UNITS} copies to people you'd actually text`,
    what: `Ask ${20} specific people, one at a time, in the way you'd ask them for anything else. Not a broadcast. You are sending a link, not delivering boxes — nothing to front, nothing to store, nothing to post. This is the Girl Scout move and it is the backbone of the whole channel.`,
    reachLabel: "people you'd text, not post at",
    typicalReach: 20,
    conversionRate: 0.25,
    effortHours: 2,
    evidence: `${WARM_CASE_UNITS} digital copies bought through your link. Delivery is instant, so "done" is unambiguous and you never handle a book or a payment.`,
    source:
      'Warm referral response 40–60% vs 1–7% cold; referred buyers convert ~8.2% vs 2.1% standard traffic (Shopify / GTM8020 2026)',
  },
  {
    key: 'org',
    label: 'Get one group to buy a case together',
    what: 'A book club, an ERG, a team, a congregation, a class. One decision-maker saying yes moves ten copies as easily as one — and digital means they can buy ten seats without anyone arranging a shipment.',
    reachLabel: 'a group you already belong to',
    typicalReach: 1,
    conversionRate: 10,
    effortHours: 3,
    evidence: 'A bulk digital order, or an invoice to the organisation.',
    source: 'Bulk institutional orders; modelled as a single decision, not a funnel',
  },
  {
    key: 'podcast',
    label: 'Put me on one podcast',
    what: "An introduction to a host you actually know. You are not booking a tour — you are making one warm introduction that I take from there.",
    reachLabel: 'a show with about 3,000 downloads an episode',
    typicalReach: 3000,
    conversionRate: 0.01,
    effortHours: 1,
    evidence: 'The episode airs, with the book link in the show notes.',
    source:
      'Podcast download-to-sale conversion 0.5–2%; promoting before, during and after roughly triples results (AuthorOnAir / Podcastcola 2026)',
  },
] as const

/** Copies one run of a channel is expected to produce. */
export function copiesPerRun(channel: WarmChannel): number {
  return Math.round(channel.typicalReach * channel.conversionRate)
}

/** Hours an ally spends per copy sold — the honest effort price of warm selling. */
export function hoursPerCopy(channel: WarmChannel): number {
  const copies = copiesPerRun(channel)
  return copies > 0 ? Math.round((channel.effortHours / copies) * 100) / 100 : Infinity
}

export interface WarmPlan {
  allyCount: number
  /** Copies a month the warm channel produces at this many allies. */
  copiesPerMonth: number
  /** Share of the monthly book target this covers, 0–1. */
  shareOfTarget: number
  /** Copies still needing a paid or organic-inbound source. */
  gapCopies: number
  /**
   * Paid acquisition share implied by this warm volume. The point of the whole
   * channel: warm sales cost nothing to acquire, so every one of them lowers the
   * fraction of the plan exposed to ad costs.
   */
  impliedPaidShare: number
  /** Allies needed to cover the target outright. */
  alliesForFullCoverage: number
  /**
   * How many allies the brigade could support IF it sold paper instead.
   *
   * Kept as the counterfactual rather than as a constraint: the brigade sells
   * digital, so nothing here caps it. This number exists to show what that
   * choice bought — past this many allies, a paper brigade would be out of stock
   * and waiting on a reprint, and the digital one simply carries on.
   */
  physicalCapacityAllies: number
  /** True while the brigade's supply is genuinely unbounded. */
  supplyUnlimited: boolean
  /** Margin given up per copy by selling digital instead of paper. */
  marginTradedPerCopyCents: number
}

/**
 * What a brigade of N allies is actually worth, per month.
 *
 * `perAllyCopies` defaults to one case — the intended commitment. Deliberately
 * conservative: it assumes each ally runs the circle channel once a month and
 * nothing else, which is the floor of what someone who said yes might do.
 */
export function warmPlan(
  allyCount: number,
  monthlyTargetCopies: number,
  perAllyCopies: number = WARM_CASE_UNITS,
  i: CampaignInputs = INPUTS,
): WarmPlan {
  const copiesPerMonth = Math.max(0, Math.round(allyCount * perAllyCopies))
  const target = Math.max(1, monthlyTargetCopies)
  const shareOfTarget = Math.min(1, copiesPerMonth / target)
  const gapCopies = Math.max(0, target - copiesPerMonth)

  const print = printEconomics(i)

  return {
    allyCount,
    copiesPerMonth,
    shareOfTarget,
    gapCopies,
    // Whatever the warm channel doesn't cover is what paid acquisition is exposed
    // to — capped by the plan's own assumption, since warm selling can only ever
    // reduce paid dependence, never increase it.
    impliedPaidShare: Math.min(i.paidAcquisitionShare, Math.round((gapCopies / target) * 100) / 100),
    alliesForFullCoverage: perAllyCopies > 0 ? Math.ceil(target / perAllyCopies) : 0,
    physicalCapacityAllies:
      perAllyCopies > 0 ? Math.floor(print.sellableUnits / perAllyCopies) : 0,
    supplyUnlimited: WARM_EDITION === 'book-digital',
    marginTradedPerCopyCents: Math.max(
      0,
      i.bookRetailPriceCents - print.landedUnitCostCents - digitalEconomics(i).marginCents,
    ),
  }
}

/**
 * The ally's trackable link.
 *
 * Their `CampaignLead` id is already an unguessable capability token (see the
 * ally-campaign spec) and it already exists by the time they have anything to
 * sell — so it doubles as a referral code with no new schema, no account, and no
 * second identity to reconcile.
 *
 * ⚠️ This produces the LINK. Attributing a completed purchase back to it needs
 * the storefront to read and persist the parameter, which is not built yet — see
 * the campaign guide. Until it is, the honest tracking is the ally reporting a
 * number and the steward confirming it.
 */
export function allyReferralPath(leadId: string, target = WARM_LINK_TARGET): string {
  const [path, hash] = target.split('#')
  const query = `?ally=${encodeURIComponent(leadId)}`
  // Query before fragment — a hash placed first would swallow the parameter.
  return hash ? `${path}${query}#${hash}` : `${path}${query}`
}

/**
 * Where an ally's link sends people: our own launch page, anchored at the
 * digital edition.
 *
 * Two deliberate choices. It anchors rather than landing on the menu, because a
 * link that opens a list asks the buyer to redo a decision the ally already made
 * for them, and every extra decision is somewhere to drop out. And it points at
 * our page rather than straight at Gumroad, because the `ally` parameter has to
 * be readable by something we control for the attribution to ever exist.
 */
export const WARM_LINK_TARGET = `/launch#${WARM_EDITION}`

/** One line summarising what the warm channel is worth, for prose. */
export function warmSummary(plan: WarmPlan): string {
  return `${plan.allyCount} allies selling a case a month is ${plan.copiesPerMonth} copies — ${Math.round(
    plan.shareOfTarget * 100,
  )}% of the monthly target, at ${usd(0)} of acquisition cost.`
}

/** Digital margin, exposed for surfaces that price warm sales without re-deriving. */
export function warmSaleMarginCents(i: CampaignInputs = INPUTS): number {
  return digitalEconomics(i).marginCents
}
