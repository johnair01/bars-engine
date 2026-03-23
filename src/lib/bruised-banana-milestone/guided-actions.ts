import type { GuidedAction, GuidanceContext } from './types'

const MAX_ACTIONS = 3

function withRef(href: string, campaignRef: string): string {
  if (href.includes('?')) {
    return `${href}&ref=${encodeURIComponent(campaignRef)}`
  }
  return `${href}?ref=${encodeURIComponent(campaignRef)}`
}

/**
 * Deterministic guided actions for BBMT (pure).
 * Priority: onboarding → vault cap → gameboard participation → hub / event / market.
 */
export function computeGuidedActions(ctx: GuidanceContext): GuidedAction[] {
  const { campaignRef } = ctx
  const q = encodeURIComponent(campaignRef)
  const out: GuidedAction[] = []

  if (!ctx.onboardingComplete) {
    out.push({
      kind: 'onboarding',
      label: 'Continue campaign onboarding',
      hint: 'Finish welcome + first quests so your moves count toward the residency.',
      href: withRef('/campaign', campaignRef),
    })
  } else if (ctx.vaultDraftsAtCap || ctx.vaultUnplacedAtCap) {
    const hint = ctx.vaultDraftsAtCap && ctx.vaultUnplacedAtCap
      ? 'Drafts and unplaced quests are at capacity — compost frees space without shame.'
      : ctx.vaultDraftsAtCap
        ? 'Private drafts are at capacity — compost or archive to make room.'
        : 'Unplaced quests are at capacity — place one or compost to make room.'
    out.push({
      kind: 'vault',
      label: 'Vault compost — make room',
      hint,
      href: '/hand/compost',
    })
    out.push({
      kind: 'vault',
      label: 'Hand — drafts & quests',
      href: '/hand',
    })
  } else if (!ctx.hasGameboardParticipation) {
    out.push({
      kind: 'gameboard',
      label: 'Pick a slot on the gameboard',
      hint: 'Steward or bid on a quest slot so your work shows up in the collective field.',
      href: `/campaign/board?ref=${q}`,
    })
  } else {
    out.push({
      kind: 'hub',
      label: 'Campaign hub — 8 spokes',
      hint: 'One CYOA path per spoke; landings save for everyone (I Ching order).',
      href: `/campaign/hub?ref=${q}`,
    })
  }

  // Secondary links (fill to MAX_ACTIONS) — skip duplicates
  const seen = new Set(out.map((a) => a.href))

  const tryAdd = (a: GuidedAction) => {
    if (out.length >= MAX_ACTIONS) return
    if (seen.has(a.href)) return
    seen.add(a.href)
    out.push(a)
  }

  if (ctx.onboardingComplete) {
    tryAdd({
      kind: 'event',
      label: 'Event page',
      href: '/event',
    })
    tryAdd({
      kind: 'market',
      label: 'Market — stage quests',
      href: '/market',
    })
    tryAdd({
      kind: 'campaign',
      label: 'Campaign story',
      href: `/campaign/twine?ref=${q}`,
    })
    tryAdd({
      kind: 'gameboard',
      label: 'Gameboard',
      href: `/campaign/board?ref=${q}`,
    })
    tryAdd({
      kind: 'hub',
      label: 'Campaign hub',
      href: `/campaign/hub?ref=${q}`,
    })
  }

  return out.slice(0, MAX_ACTIONS)
}
