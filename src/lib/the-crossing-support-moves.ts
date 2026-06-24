export const THE_CROSSING_CAMPAIGN_REF = 'the-crossing'
export const THE_CROSSING_PARENT_CAMPAIGN_REF = 'mtgoa-barn-raising'
export const THE_CROSSING_PARENT_LABEL = 'Mastering the Game of Allyship Launch + Barn Raising'

export type TheCrossingSupportRoleId =
  | 'car_scout'
  | 'car_person'
  | 'connector'
  | 'signal_booster'
  | 'encourager'
  | 'donor'

export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'
  | 'SKILLFUL_ORGANIZING'

export type TheCrossingSupportRole = {
  id: TheCrossingSupportRoleId
  label: string
  primaryDomain: AllyshipDomain
  secondaryDomains: AllyshipDomain[]
  description: string
  boundary: string
  tinyMove: string
  impact: string
  artifact: string
  ctaLabel: string
  starterCardIds: string[]
}

export const THE_CROSSING_SUPPORT_ROLES: readonly TheCrossingSupportRole[] = [
  {
    id: 'car_scout',
    label: 'Car Scout',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: ['SKILLFUL_ORGANIZING'],
    description: 'Find viable cars, listings, and vehicle paths.',
    boundary: 'Use this when you found a car or vehicle lead.',
    tinyMove: 'Send one promising car listing.',
    impact: 'Turns the open field into concrete options.',
    artifact: 'Listing lead',
    ctaLabel: 'Send a car lead',
    starterCardIds: ['OPEN-GR-ARCHITECT', 'WAKE-SO-ARCHITECT'],
  },
  {
    id: 'car_person',
    label: 'Car Person',
    primaryDomain: 'SKILLFUL_ORGANIZING',
    secondaryDomains: ['DIRECT_ACTION'],
    description: 'Evaluate listings, repairs, title risk, scams, and buying strategy.',
    boundary: 'Use this when you know cars or can sanity-check a specific option.',
    tinyMove: 'Sanity-check one listing.',
    impact: 'Reduces risk and helps a good decision happen faster.',
    artifact: 'Listing review',
    ctaLabel: 'Offer car judgment',
    starterCardIds: ['SHOW-SO-ARCHITECT', 'WAKE-DA-CHALLENGER'],
  },
  {
    id: 'connector',
    label: 'Connector',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: ['SKILLFUL_ORGANIZING'],
    description: 'Make warm human introductions that unlock resources.',
    boundary: 'Use this when you know a person who should talk to Wendell.',
    tinyMove: 'Make one warm introduction.',
    impact: 'Creates a person-to-person bridge that would not exist otherwise.',
    artifact: 'Warm intro',
    ctaLabel: 'Make an intro',
    starterCardIds: ['WAKE-GR-DIPLOMAT', 'SHOW-GR-DIPLOMAT'],
  },
  {
    id: 'signal_booster',
    label: 'Signal Booster',
    primaryDomain: 'RAISE_AWARENESS',
    secondaryDomains: [],
    description: 'Share the ask strategically with context.',
    boundary: 'Use this when your useful move is reaching your people.',
    tinyMove: 'Share the post with one sentence about why it matters.',
    impact: 'Extends the campaign beyond Wendell’s immediate reach.',
    artifact: 'Signal boost',
    ctaLabel: 'Share the ask',
    starterCardIds: ['SHOW-RA-DIPLOMAT', 'SHOW-RA-SAGE'],
  },
  {
    id: 'encourager',
    label: 'Encourager',
    primaryDomain: 'DIRECT_ACTION',
    secondaryDomains: ['GATHERING_RESOURCES'],
    description: 'Reach out, reflect momentum, and encourage aligned action.',
    boundary: 'Use this when your gift is helping the person stay in motion.',
    tinyMove: 'Send one check-in or encouragement message.',
    impact: 'Reduces isolation and keeps the next move alive.',
    artifact: 'Encouragement note',
    ctaLabel: 'Send encouragement',
    starterCardIds: ['SHOW-DA-REGENT', 'OPEN-GR-DIPLOMAT'],
  },
  {
    id: 'donor',
    label: 'Donor',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: [],
    description: 'Contribute money, time, expertise, space, temporary transportation, or resources.',
    boundary: 'Use this when you can materially support the campaign.',
    tinyMove: 'Donate, offer time, or share the donation link.',
    impact: 'Adds real fuel to the car replacement effort.',
    artifact: 'Contribution',
    ctaLabel: 'Offer support',
    starterCardIds: ['WAKE-GR-DIPLOMAT', 'SHOW-GR-ARCHITECT'],
  },
] as const

export function getTheCrossingSupportRole(
  roleId: string | null | undefined,
): TheCrossingSupportRole | null {
  if (!roleId) return null
  return THE_CROSSING_SUPPORT_ROLES.find((role) => role.id === roleId) ?? null
}

