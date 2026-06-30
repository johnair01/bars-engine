import { getLensDomain, type LensDomainKey } from './domains'

type PromptSeedInput = {
  domain: LensDomainKey
  superpower?: string | null
  orientation?: string | null
}

const BASE_SEEDS: Record<LensDomainKey, string[]> = {
  relationships: [
    'A weekly repair/check-in ritual with someone I want to grow with.',
    'A home and friendship rhythm that makes closeness easier to return to.',
    'A year of being more honest, reachable, and well-boundaried with my people.',
  ],
  career: [
    'A body of work that makes my central message easier to find and share.',
    'A practice rhythm that turns scattered ideas into visible offers.',
    'A year where my work is known by the people it is meant to serve.',
  ],
  money: [
    'A simple monthly income mix that feels stable, honest, and trackable.',
    'A sales/support rhythm that lets money arrive without betraying the work.',
    'A year of clearer receiving, cleaner asks, and less financial fog.',
  ],
  health: [
    'A daily body practice that gives the work a body to live in.',
    'A movement and rest rhythm ordinary enough to survive busy weeks.',
    'A year of feeling more grounded, alive, and able to recover.',
  ],
  allyship: [
    'A recurring practice container where people can learn by showing up together.',
    'A year where specific people are better off because I practiced in public.',
    'A repeatable campaign or dojo that turns values into real moves.',
  ],
}

const SUPERPOWER_TONES: Record<string, string> = {
  connector: 'through recurring contact, repair, and invitation',
  storyteller: 'by making the story vivid enough that people can enter it',
  strategist: 'through a simple structure that makes the next move obvious',
  disruptor: 'by naming the stuck pattern and creating a cleaner path',
  alchemist: 'by metabolizing the charge into something useful and beautiful',
  escape_artist: 'by finding the exit from the old pattern and leaving a trail',
  coach: 'through practice, reflection, and a container people can return to',
}

export function getPromptSeeds(input: PromptSeedInput): string[] {
  const domain = getLensDomain(input.domain)
  const seeds = BASE_SEEDS[domain.key]
  const superpower = input.superpower?.trim().toLowerCase()
  const tone = superpower ? SUPERPOWER_TONES[superpower] : null
  if (!tone) return seeds

  const orientation = input.orientation ? ` with ${input.orientation} focus` : ''
  return [
    `${seeds[0]} Shape it ${tone}${orientation}.`,
    seeds[1],
    seeds[2],
  ]
}
