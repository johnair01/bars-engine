/**
 * The two ways into the forest, and what the visitor carries to the centre
 * (coaching pass 3, content/coaching-game/6FACE_PASS3_2026-10-09.md).
 *
 * Wendell's board answer on cf-forest, 2026-10-09: "People need to identify their
 * problem OR given a path to understanding their problem". A visitor who knows
 * what they are working on names it and takes a short tour of his approach. One
 * who does not walks in, or plays the ontology game and brings its result back.
 * Either way they reach the centre knowing as much as they can of four things,
 * "what emotional block what self sabotaging belief is at play at which level in
 * what domain", and the centre offers a strategy and the call.
 *
 * Kept pure so the record can be tested without rendering anything. Everything
 * stays in the browser (cg-browser-only).
 */

import { FEELINGS } from './coaching-map'
import type { FeelingName } from './coaching-map'

/**
 * Life domains, the placeholder list the council already uses for the Lenses
 * domains (sprout position ya-life-domains; Wendell on ya-domains, 2026-10-05:
 * "really it's about life domains, Relationships, Career, Money, Creativity etc.").
 * Replace it when the Lenses domains are formalized.
 */
export const LIFE_DOMAINS = ['relationships', 'career', 'money', 'creativity', 'health', 'home', 'community'] as const
export type LifeDomain = (typeof LIFE_DOMAINS)[number]

/**
 * The six faces as levels of help a visitor can choose (Wendell on cf-paths:
 * "chcoosing a face is essentially the grow up move"). The colour keys match the
 * ontology game's faces, so its result maps straight across; the plain names are
 * the game's FACE_PLAIN. The lines are Claude's drafts from council/faces.yaml in
 * six-faces-council (position cf-face-words); Wendell can rewrite any of them.
 */
export const FACES = [
  {
    colour: 'Magenta',
    face: 'Shaman',
    plain: 'Presence',
    sounds: 'I need to feel what is going on before I can do anything about it.',
    approach: 'We start in your body, with what the feeling is protecting, before we make any plan.',
  },
  {
    colour: 'Red',
    face: 'Challenger',
    plain: 'Power',
    sounds: 'I know what to do, and I keep not doing it.',
    approach: 'We find where your energy leaks and point it at one move you make this week.',
  },
  {
    colour: 'Amber',
    face: 'Regent',
    plain: 'Order',
    sounds: 'I need a structure I can keep.',
    approach: 'We build a rhythm you can keep, and sort what you owe from what is only habit.',
  },
  {
    colour: 'Orange',
    face: 'Architect',
    plain: 'Understanding',
    sounds: 'I want to understand how this works and test what helps.',
    approach: 'We treat it as an experiment: one small test, look at what happened, adjust.',
  },
  {
    colour: 'Green',
    face: 'Diplomat',
    plain: 'Perspectives',
    sounds: 'It is about the people around me.',
    approach: 'We look at the relationships it lives in and what each person needs, you included.',
  },
  {
    colour: 'Teal',
    face: 'Sage',
    plain: 'Systems',
    sounds: 'Too many things pull at once, and I need to see the whole.',
    approach: 'We map the whole of it so you can see which one move changes the most.',
  },
] as const
export type FaceColour = (typeof FACES)[number]['colour']

/** What the visitor has found on the way in. Every field is optional: each step can be passed without answering. */
export type Found = {
  /** Their own words, from the "I know what I'm working on" way in (cf-fast-lane). */
  need: string
  domain: LifeDomain | ''
  /** The emotional block, as the loudest feeling. */
  feeling: FeelingName | ''
  /** What the feeling is pointing at, in their words. */
  answer: string
  /** The self-sabotaging belief, in their words. */
  belief: string
  face: FaceColour | ''
  /** True when the feeling and face came from the ontology game. */
  fromGame: boolean
}

export const EMPTY_FOUND: Found = {
  need: '',
  domain: '',
  feeling: '',
  answer: '',
  belief: '',
  face: '',
  fromGame: false,
}

/** The hash the ontology game's "Take this to coaching" link opens: #from-game?channel=Anger&face=Amber. */
export const FROM_GAME_HASH = '#from-game'

/**
 * Reads the game's hand-off. Only the channel and the face cross over; the belief
 * stays in the game, which never stores belief text (oag-map-private), and the
 * visitor writes it again here in their own words (position cf-game-belief).
 * Anything that is not a known channel or face is dropped.
 */
export function readFromGame(hash: string): Pick<Found, 'feeling' | 'face' | 'fromGame'> | null {
  if (!hash.startsWith(FROM_GAME_HASH)) return null
  const params = new URLSearchParams(hash.slice(FROM_GAME_HASH.length).replace(/^\?/, ''))
  const channel = params.get('channel') ?? ''
  const colour = params.get('face') ?? ''
  const feeling = FEELINGS.find((f) => f.name === channel)?.name ?? ''
  const face = FACES.find((f) => f.colour === colour)?.colour ?? ''
  return { feeling, face, fromGame: true }
}

const t = (s: string) => s.trim()

/** The four things the visitor came to find, each as a short line, in the order of the walk. Unfound ones are left out. */
export function foundLines(found: Found): { label: string; text: string }[] {
  const lines: { label: string; text: string }[] = []
  if (t(found.need)) lines.push({ label: 'What I want help with', text: t(found.need) })
  if (found.domain) lines.push({ label: 'Where in my life', text: found.domain })
  const feeling = FEELINGS.find((f) => f.name === found.feeling)
  if (feeling) {
    const answer = t(found.answer)
    lines.push({ label: 'What is in the way', text: answer ? `${feeling.name}: ${answer}` : feeling.name })
  }
  if (t(found.belief)) lines.push({ label: 'The belief at play', text: t(found.belief) })
  const face = FACES.find((f) => f.colour === found.face)
  if (face) lines.push({ label: 'The help I need', text: `${face.plain} (the ${face.face})` })
  return lines
}

/**
 * The strategy the centre offers: how a session with Wendell would work on what
 * they found. The face sets the approach, Emotional Alchemy is always part of it
 * (Wendell on cf-forest: "most roads will lead to emotinoal alchemy training to
 * some degree"), and the domain and belief say where and on what.
 */
export function strategy(found: Found): string[] {
  const face = FACES.find((f) => f.colour === found.face)
  const feeling = FEELINGS.find((f) => f.name === found.feeling)
  const first = face ? face.approach : 'We find the level this sits at, and start there.'
  const lines: string[] = []
  lines.push(found.domain ? `When it comes to your ${found.domain}, ${first[0].toLowerCase()}${first.slice(1)}` : first)
  lines.push(
    feeling
      ? `Underneath, we work your ${feeling.name.toLowerCase()} with Emotional Alchemy. ${feeling.job}`
      : 'Underneath, we use Emotional Alchemy to find which feeling is doing the blocking, and what its job is.',
  )
  if (t(found.belief)) lines.push(`We meet the part of you that believes “${t(found.belief)}” and find out what it is protecting.`)
  return lines
}

/** The plain-text record the visitor copies into Calendly's notes box. */
export function composeFound(found: Found): string {
  const lines = foundLines(found)
  if (lines.length === 0) return 'What I found'
  return ['What I found', '', ...lines.map((l) => `${l.label}: ${l.text}`)].join('\n')
}
