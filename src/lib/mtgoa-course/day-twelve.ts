/**
 * Day 12 — Open Up · Hold the Resource Question (pure content).
 *
 * Day 11 maps the Starting Hand. Day 12 is deliberately smaller: one resource
 * question becomes one plain sentence, then the reader has sixty seconds to
 * receive what the sentence brings up before choosing a card or a later move.
 * No answer leaves the browser.
 */

export type DayTwelveHand = 'offer' | 'ask_first' | 'need'

export type DayTwelveHandDef = {
  key: DayTwelveHand
  label: string
  prompt: string
  labelPlaceholder: string
  sentenceStart: string
  firstBlank: string
  sentenceEnd: string
  secondBlank: string
}

export const DAY_TWELVE_HANDS: readonly DayTwelveHandDef[] = [
  {
    key: 'offer',
    label: 'I might offer something.',
    prompt: 'What could you offer, if you chose to?',
    labelPlaceholder: 'A resource, not a person’s full name.',
    sentenceStart: 'I have',
    firstBlank: 'the resource',
    sentenceEnd: 'and I could offer it for',
    secondBlank: 'the use or need',
  },
  {
    key: 'ask_first',
    label: 'I need to ask first.',
    prompt: 'What permission, introduction, or factual answer comes before this can move?',
    labelPlaceholder: 'The resource or decision, not private contact details.',
    sentenceStart: 'Before this can move, I need to ask',
    firstBlank: 'who or what role',
    sentenceEnd: 'about',
    secondBlank: 'the resource question',
  },
  {
    key: 'need',
    label: 'There is something I need.',
    prompt: 'What support, access, time, or material resource is the real need?',
    labelPlaceholder: 'The need in one concrete phrase.',
    sentenceStart: 'I need',
    firstBlank: 'the resource',
    sentenceEnd: 'in order to',
    secondBlank: 'the next use or outcome',
  },
]

export const DAY_TWELVE_WEATHER = [
  'My body tightens or pulls away',
  'I speed up, plan, or start explaining',
  'I go blank or lose contact with the question',
  'I feel a little more room or curiosity',
  'I feel the weight of the need',
  'Something else is here',
] as const

export const DAY_TWELVE_PRIVACY =
  'Private by default · nothing you write is sent, saved, or used as a campaign commitment.'

export function dayTwelveHand(key: DayTwelveHand | null): DayTwelveHandDef | null {
  return DAY_TWELVE_HANDS.find((hand) => hand.key === key) ?? null
}

export function dayTwelveSentence(
  hand: DayTwelveHand | null,
  firstBlank: string,
  secondBlank: string,
): string {
  const definition = dayTwelveHand(hand)
  if (!definition) return ''
  return `${definition.sentenceStart} ${firstBlank.trim() || definition.firstBlank} ${definition.sentenceEnd} ${secondBlank.trim() || definition.secondBlank}.`
}

export function dayTwelveReceiptLines({
  hand,
  label,
  weather,
}: {
  hand: DayTwelveHand | null
  label: string
  weather: readonly string[]
}): { question: string | null; noticed: string | null } {
  const definition = dayTwelveHand(hand)
  return {
    question: definition ? (label.trim() || definition.label) : null,
    noticed: weather.length ? weather.join('; ') : null,
  }
}
