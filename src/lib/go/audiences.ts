/**
 * `/go/<audience>` — one page, one audience, one ask.
 *
 * The site handoff's T8 skeleton, kept as a type so the shape cannot rot:
 *
 *   their problem in their words → the one thing this gives them →
 *   the proof that lands for them specifically → one ask → one button
 *
 * **No page serves two audiences, and no page carries a second offer.** That is
 * the whole discipline of the format: a link tree converts nobody because it
 * asks the reader to do the sorting. `ask` is a single object rather than an
 * array, so a second call to action is a type error rather than a judgment call
 * somebody makes at 1am.
 *
 * These pages also render with no navigation and no footer — see
 * `src/lib/ui/footer-surfaces.ts` and `Chrome`.
 *
 * **Named Dream 100 contacts:** a page for a specific person is a new entry
 * here, and its copy is public the moment it deploys. The *list* of who is
 * being approached and why does NOT belong in this repo, which is public. Keep
 * that in Drive.
 */

export interface GoAsk {
  /** The button. One per page. */
  label: string
  href: string
  /** What actually happens when they press it, in a half-sentence. */
  afterward: string
}

export interface GoAudience {
  slug: string
  /** Internal label. Not rendered. */
  name: string
  /** Their problem, in words they would use about themselves. */
  problem: string
  /** The single thing this gives them. Not a feature list. */
  oneThing: string
  /**
   * Proof that lands for THIS audience. Must survive the Disappearance Test:
   * would it still convince a stranger with the founder gone?
   */
  proof: string
  ask: GoAsk
  /** Optional honest caveat. Disclosure before persuasion. */
  caveat?: string
}

export const GO_AUDIENCES: readonly GoAudience[] = [
  {
    slug: 'backers',
    name: 'Kickstarter backers',
    problem:
      'You paid for a book in 2024, the ebook turned up, and the printed copy you actually backed still has not.',
    oneThing:
      'The real state of the print run, in numbers, without having to ask for it.',
    proof:
      'Three hundred and seventy-one people are in the same position as you, the manuscript finished at 383 pages, and the ebook shipped rather than slipping again. The press is the last step, and it is a bill rather than a mystery.',
    ask: {
      label: 'Tell me where the tour should stop',
      href: '/mastering-allyship/book-tour/help',
      afterward:
        'You name a city, a venue, or a person worth knowing, and I follow it up myself.',
    },
    caveat:
      'You are not on a mailing sequence and you will not be put on one. That was the deal, and it is enforced in the code rather than remembered.',
  },
  {
    slug: 'podcast',
    name: 'Podcast hosts and producers',
    problem:
      'Your audience has heard the standard allyship conversation and can predict every beat of it before the first ad break.',
    oneThing:
      'An argument that most allyship training is unwinnable by design, from somebody who will say so on air and take the pushback.',
    proof:
      'The claim is a 383-page book with nine chapters of mechanism behind it, not a hot take. He ran DEI at an animation studio, built the curriculum, and put the story of doing it badly in the book rather than leaving it out.',
    ask: {
      label: 'See topics, formats and the headshot',
      href: '/podcasts',
      afterward: 'One page with five topics on it, and one address that a person answers.',
    },
  },
  {
    slug: 'bookstore',
    name: 'Booksellers and event bookers',
    problem:
      'Author events cost you an evening and a staff member, and most of them draw the author’s own six friends.',
    oneThing:
      'An event with a practice in it rather than a reading, so people leave having done something and buy the book because of it.',
    proof:
      'Three hundred and seventy-one people bought this book before it existed, on the strength of the argument alone. The deck of a hundred and twenty cards makes the event participatory rather than a talk with questions afterward.',
    ask: {
      label: 'Put a stop on the tour',
      href: '/mastering-allyship/book-tour/help',
      afterward: 'You say the city and the date range, and I bring the format and the stock.',
    },
  },
  {
    slug: 'org',
    name: 'Organizations and L&D buyers',
    problem:
      'Your last training was well received, changed nothing measurable, and nobody has run a single move from it since.',
    oneThing:
      'A set of named moves people practice out loud in the session, so what leaves with them is a skill rather than a slide deck.',
    proof:
      'The method comes from running DEI and inclusivity inside a working animation studio, where the job was making the place work for the artists in it. The fees are published rather than quoted after a discovery call.',
    ask: {
      label: 'See the formats and what they cost',
      href: '/speaking',
      afterward:
        'A page with three numbers on it. If the budget is the obstacle, say the figure you have.',
    },
  },
  {
    slug: 'facilitator',
    name: 'Facilitators and practitioners',
    problem:
      'You have been running this work for years without a framework that holds when a group turns on it, and without anything to hand people once you leave.',
    oneThing:
      'The six Faces as a teachable structure, and a deck people can keep using once you leave.',
    proof:
      'A hundred and twenty cards built from five moves across four domains and six operations, so the structure holds whether you are teaching one person or forty. The book names every move rather than gesturing at them.',
    ask: {
      label: 'Get on the certification list',
      href: '/succession',
      afterward:
        'A list, and one update when there is something real to say. Nothing is for sale on it.',
    },
    caveat:
      'There is no certification program yet. The page says so before it asks for anything.',
  },
] as const

export const GO_AUDIENCE_BY_SLUG: Record<string, GoAudience> = Object.fromEntries(
  GO_AUDIENCES.map((a) => [a.slug, a]),
)

export function getGoAudience(slug: string): GoAudience | null {
  return GO_AUDIENCE_BY_SLUG[slug] ?? null
}
