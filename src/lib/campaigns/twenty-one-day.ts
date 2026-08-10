/**
 * The four 21-day campaigns from Appendix B.
 *
 * One module, two surfaces: the `/campaigns` index renders these as the four
 * doors, and the book-tour help confirmation names whichever one a person just
 * entered. Keeping them in one place is what stops the index and the
 * confirmation from describing the same campaign differently.
 *
 * Keyed by `AllyshipDomainKey` so a campaign and a domain are the same object
 * rather than two lists somebody has to keep aligned.
 *
 * NOTE for the voice lint. Appendix B names the Skillful Organizing campaign
 * after the space it builds, and that noun is on the house ban list. A canon
 * name is the one place the ban does not apply: renaming a campaign the book
 * already named, to satisfy a regex pointed at it afterwards, is the same
 * evasion as swapping a banned word for a near-synonym. Expect one banned
 * finding on the name below, and one on any surface that prints it. Confirm the
 * name with Wendell before launch; if it changes, it changes here and both
 * surfaces follow.
 */
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export interface CampaignWeek {
  /** 1, 2 or 3. */
  n: 1 | 2 | 3
  /** The week's move, in the imperative. */
  move: string
}

export interface TwentyOneDayCampaign {
  domain: AllyshipDomainKey
  /** Appendix B's name for the campaign. */
  name: string
  label: string
  /** One line: what the campaign is for. */
  blurb: string
  weeks: [CampaignWeek, CampaignWeek, CampaignWeek]
  /**
   * The object the campaign runs against.
   *
   * Three campaigns carry a pre-named one. **Direct Action carries an open
   * object** — naming it is what Week 1 is for — so its menu is a list rather
   * than a single line, and the non-launch options come first and outnumber the
   * launch ones. A menu of one teaches nothing.
   */
  object:
    | { kind: 'named'; object: string }
    | { kind: 'open'; prompt: string; menu: { label: string; launch: boolean }[] }
}

export const TWENTY_ONE_DAY_CAMPAIGNS: readonly TwentyOneDayCampaign[] = [
  {
    domain: 'SKILLFUL_ORGANIZING',
    name: 'The Room',
    label: 'Skillful Organizing',
    blurb:
      'Build a gathering that keeps working after you stop carrying it. Three weeks, one structure, and the terms said out loud rather than assumed.',
    weeks: [
      { n: 1, move: 'Inventory the conditions you are actually working with.' },
      { n: 2, move: 'Set the terms out loud, to the people they bind.' },
      { n: 3, move: 'Build one that outlasts you.' },
    ],
    object: { kind: 'named', object: 'A tour stop, hosted or produced end to end.' },
  },
  {
    domain: 'GATHERING_RESOURCES',
    name: 'The Introduction',
    label: 'Gather Resources',
    blurb:
      'Move a resource that costs you something to move. Money is the obvious one and rarely the scarce one — access, a name, and an hour of standing are the harder gifts.',
    weeks: [
      { n: 1, move: 'Name what is depleted, precisely enough to fill it.' },
      { n: 2, move: 'Move a resource that costs you.' },
      { n: 3, move: 'Track what it freed.' },
    ],
    object: {
      kind: 'named',
      object: 'An introduction, a venue, or a resource moved toward the press run.',
    },
  },
  {
    domain: 'RAISE_AWARENESS',
    name: 'The Telling',
    label: 'Raise Awareness',
    blurb:
      'Tell it in a form that suits the telling, then check what moved. Reach is the number that flatters; a changed decision is the number that counts.',
    weeks: [
      { n: 1, move: 'Choose the form the telling wants.' },
      { n: 2, move: 'Tell it.' },
      { n: 3, move: 'Track what actually shifted.' },
    ],
    object: { kind: 'named', object: 'The tour, told to the people who would want it.' },
  },
  {
    domain: 'DIRECT_ACTION',
    name: 'The Cost',
    label: 'Direct Action',
    blurb:
      'A rep that costs you something you chose. Week 1 is where the object gets named, and the naming is most of the work.',
    weeks: [
      { n: 1, move: 'Name the object, and name what it will cost you.' },
      { n: 2, move: 'Take the action, at the cost you named.' },
      { n: 3, move: 'Report what it cost and what it changed.' },
    ],
    object: {
      kind: 'open',
      prompt: 'Week 1 names it. Most of these have nothing to do with this book:',
      menu: [
        { label: 'A boundary held with somebody who outranks you', launch: false },
        { label: 'A correction made in the moment rather than afterward', launch: false },
        { label: 'A shift covered so somebody else makes the hearing, or the funeral', launch: false },
        { label: 'A standing commitment to a body already doing the work', launch: false },
        { label: 'A refusal that costs you a relationship you value', launch: false },
        { label: 'Standing up a tour stop nobody asked you to run', launch: true },
      ],
    },
  },
] as const

export const CAMPAIGN_BY_DOMAIN: Record<AllyshipDomainKey, TwentyOneDayCampaign> =
  Object.fromEntries(TWENTY_ONE_DAY_CAMPAIGNS.map((c) => [c.domain, c])) as Record<
    AllyshipDomainKey,
    TwentyOneDayCampaign
  >

/**
 * Appendix B's instruction for choosing, quoted rather than paraphrased.
 */
export const CAMPAIGN_CHOOSING_QUOTE =
  "Pick the one that's pulling at you. Not the one you should do. The one that's already calling."

/**
 * The two rules the product enforces, pinned before anyone enters.
 *
 * The first is a safety rule and applies hardest to Direct Action, where a
 * detailed capture can identify a person who never agreed to be identified.
 * The second is a category correction the book makes explicitly: buying a book
 * is a resource moving, which is a real rep in a different campaign.
 */
export const CAMPAIGN_HOUSE_RULES = [
  {
    title: 'The capture is posted. The person is not.',
    detail:
      'Report what you did and what it cost you. Never who they were, and never enough detail for a reader to work out who they were.',
  },
  {
    title: 'Buying the book is a Gather Resources rep.',
    detail:
      'It moves a resource, which is a real rep in a real campaign. A Direct Action rep costs you something you chose, and money you were going to spend anyway is not that.',
  },
] as const

/**
 * Book-tour help option → the campaign it enters.
 *
 * `attend` maps to nothing on purpose: attending is not a 21-day campaign, and
 * the confirmation routes those people to the index to pick one.
 */
export const HELP_OPTION_TO_DOMAIN: Record<string, AllyshipDomainKey | null> = {
  host: 'SKILLFUL_ORGANIZING',
  produce: 'SKILLFUL_ORGANIZING',
  connect: 'GATHERING_RESOURCES',
  resource: 'GATHERING_RESOURCES',
  promote: 'RAISE_AWARENESS',
  attend: null,
}

/** The campaign a set of chosen help options enters, or null for the index. */
export function campaignForHelpOptions(
  keys: readonly string[],
): TwentyOneDayCampaign | null {
  for (const key of keys) {
    const domain = HELP_OPTION_TO_DOMAIN[key]
    if (domain) return CAMPAIGN_BY_DOMAIN[domain]
  }
  return null
}

/**
 * What running a campaign unlocks, stated on the signup screen before anybody
 * picks — never revealed at the end.
 */
export const CAMPAIGN_UNLOCK =
  'Sign up, pick a domain, run week one, post the capture, and the ebook unlocks.'
