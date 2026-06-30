export const LENS_DOMAINS = [
  {
    key: 'relationships',
    label: 'Relationships',
    glyph: '○',
    prompt: 'Who are you with? What is the quality of contact? Write toward what you actually want.',
  },
  {
    key: 'career',
    label: 'Career',
    glyph: '◇',
    prompt: 'What are you making, practicing, selling, serving, or becoming known for?',
  },
  {
    key: 'money',
    label: 'Money',
    glyph: '◈',
    prompt: 'What flow of income, stability, generosity, or receiving would change your life?',
  },
  {
    key: 'health',
    label: 'Health',
    glyph: '●',
    prompt: 'What body, energy, rhythm, and practice would carry you?',
  },
  {
    key: 'allyship',
    label: 'Allyship',
    glyph: '◆',
    prompt: 'Who is better off because you showed up?',
  },
] as const

export type LensDomainKey = (typeof LENS_DOMAINS)[number]['key']

export const LENS_DOMAIN_KEYS = LENS_DOMAINS.map((domain) => domain.key) as LensDomainKey[]

export function isLensDomainKey(value: string): value is LensDomainKey {
  return (LENS_DOMAIN_KEYS as readonly string[]).includes(value)
}

export function getLensDomain(key: LensDomainKey) {
  return LENS_DOMAINS.find((domain) => domain.key === key) ?? LENS_DOMAINS[0]
}

export const LENS_FEELINGS = ['alive', 'settled', 'connected', 'free', 'proud', 'clear', 'generous', 'relieved'] as const

