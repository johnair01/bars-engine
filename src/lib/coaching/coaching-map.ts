/**
 * The coaching map: the game on /coaching that a visitor plays through to reach
 * the service of Wendell's that fits (Wendell, 2026-10-09: "a game that people
 * play through to get to the services they are looking for from me").
 *
 * The map is Wendell's five moves. Each station holds one short step the
 * visitor plays, the sentence they keep, and the doors that fit it. The design
 * and its positions are in content/coaching-game/6FACE_PASS1_2026-10-09.md:
 * every station gives a sentence to keep before it shows a door (cg-kept-sentence),
 * and the game never picks a price (cg-money).
 *
 * Content is drawn from material the site already has: the body-scan places and
 * textures and the five feelings' jobs come from the ontology game
 * (content/ontology-game/game.jsx, TEXTURE_WORDS and CHANNEL_JOBS), the Clean Up
 * station runs the coaching 3-2-1, and the doors are live pages.
 *
 * Kept pure so the record can be tested without rendering anything.
 */

export type StationId = 'wake' | 'open' | 'clean' | 'grow' | 'show'

export type Door = { label: string; href: string; detail: string; external?: boolean }

export type Station = {
  id: StationId
  move: string
  /** One plain line under the move name, for a visitor who has never heard it (Diplomat). */
  plain: string
}

/** The order of Wendell's five moves, as council/daily.yaml gives them. */
export const STATIONS: ReadonlyArray<Station> = [
  { id: 'wake', move: 'Wake Up', plain: 'Notice what is here, in your body.' },
  { id: 'open', move: 'Open Up', plain: 'Let the feeling do its job.' },
  { id: 'clean', move: 'Clean Up', plain: 'Face what has charge on it.' },
  { id: 'grow', move: 'Grow Up', plain: 'Turn it into a practice.' },
  { id: 'show', move: 'Show Up', plain: 'Make the move that has to be yours.' },
]

/** The first screen sorts by situation, not by product (Architect). */
export const SITUATIONS: ReadonlyArray<{ station: StationId; text: string }> = [
  { station: 'wake', text: 'Something keeps stopping me, and I can’t see what it is.' },
  { station: 'open', text: 'I’m feeling a lot, and I want it to be useful.' },
  { station: 'clean', text: 'A person, or a part of me, has charge on it.' },
  { station: 'grow', text: 'I know what to do. I want to get better at doing it.' },
  { station: 'show', text: 'I’m building something, and the next move has to be mine.' },
]

/** Body places for the Wake Up scan. The ontology game's scan uses a body map; this is its short form. */
export const PLACES = ['head', 'throat', 'chest', 'belly', 'arms and hands', 'legs and feet'] as const

/** The ontology game's TEXTURE_WORDS, in its order. */
export const TEXTURES = ['tightness', 'numbness', 'tension', 'strength', 'something else'] as const

/** The ontology game's CHANNEL_JOBS, word for word. */
export const FEELINGS = [
  {
    name: 'Anger',
    job: 'Anger’s job is to find obstacles to be overcome, or boundaries to be created or destroyed.',
    question: 'What is the obstacle, or what obstacle is being created?',
  },
  {
    name: 'Sadness',
    job: 'Sadness’s job is to point you toward what you care about and how far away you are from it.',
    question: 'What do you care about, and how far away is it from you?',
  },
  {
    name: 'Fear',
    job: 'Fear’s job is to detect threat and risk.',
    question: 'What is the threat, and how far is it from you?',
  },
  {
    name: 'Joy',
    job: 'Joy’s job is to show you what’s aligned with your delight.',
    question: 'What is the source of aliveness?',
  },
  {
    name: 'Neutrality',
    job: 'Neutrality’s job is detachment and perspective, the view that lets you see the whole.',
    question: 'What are you stepping back from, and from there, what can you see of the whole?',
  },
] as const

export type FeelingName = (typeof FEELINGS)[number]['name']

/** Where every booking door goes: the tier list on the same page, with all four prices (cg-money). */
export const BOOK_HREF = '#book'

/** The free door at each station, and the larger paid door where one fits. Every station also offers a session. */
export const DOORS: Record<StationId, Door[]> = {
  wake: [
    {
      label: 'Breathe through it in the ontology game',
      href: '/ontology-game/wave',
      detail: 'Free. W.A.V.E. walks you through it one breath at a time, and helps when a step gets stuck.',
    },
  ],
  open: [
    {
      label: 'Work the feeling in the ontology game',
      href: '/ontology-game',
      detail: 'Free. It follows the feeling through its job, and keeps track of what you come to believe.',
    },
  ],
  clean: [],
  grow: [
    {
      label: 'Take the thirty-day challenge',
      href: '/mastering-allyship/course',
      detail: 'Free. One small practice a day for thirty days.',
    },
  ],
  show: [
    {
      label: 'Apply for the founder track',
      href: '/mastering-allyship/one-to-one',
      detail: 'For a project with your name on it, with me alongside for the whole campaign. Priced after a conversation.',
    },
  ],
}

/** What the visitor has written at each station. Everything stays in the browser (cg-browser-only). */
export type MapState = {
  wake: { place: string; texture: string }
  open: { feeling: FeelingName | ''; answer: string }
  clean: { quality: string; move: string }
  grow: { practice: string }
  show: { move: string; when: string }
}

export const EMPTY_MAP: MapState = {
  wake: { place: '', texture: '' },
  open: { feeling: '', answer: '' },
  clean: { quality: '', move: '' },
  grow: { practice: '' },
  show: { move: '', when: '' },
}

const t = (s: string) => s.trim()

/**
 * The sentence a station gives the visitor to keep, or null while they have
 * not played it. A station shows its doors only once this is non-null
 * (cg-kept-sentence).
 */
export function keptSentence(id: StationId, map: MapState): string | null {
  switch (id) {
    case 'wake': {
      const { place, texture } = map.wake
      if (!place || !texture) return null
      const what = texture === 'something else' ? 'something' : texture
      return `When it shows up, I feel ${what} in my ${place}.`
    }
    case 'open': {
      const { feeling, answer } = map.open
      const f = FEELINGS.find((x) => x.name === feeling)
      if (!f || !t(answer)) return null
      return `${f.name} is doing its job. ${t(answer)}`
    }
    case 'clean': {
      const quality = t(map.clean.quality)
      const move = t(map.clean.move)
      if (!quality && !move) return null
      return [quality && `I am taking back ${quality}.`, move && `This week: ${move}`].filter(Boolean).join(' ')
    }
    case 'grow': {
      const practice = t(map.grow.practice)
      return practice ? `For thirty days I will practise ${practice}.` : null
    }
    case 'show': {
      const move = t(map.show.move)
      if (!move) return null
      const when = t(map.show.when)
      return when ? `The move that has to be mine: ${move}, by ${when}.` : `The move that has to be mine: ${move}.`
    }
  }
}

/** The plain-text record the visitor copies, written to paste into Calendly's notes box. */
export function composeMap(map: MapState): string {
  const lines = ['My coaching map']
  for (const s of STATIONS) {
    const kept = keptSentence(s.id, map)
    if (kept) lines.push('', `${s.move}: ${kept}`)
  }
  return lines.join('\n')
}
