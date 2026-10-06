/**
 * The 3-2-1 demo on the coaching page: its copy and the one pure function that
 * turns a finished pass into text the client can keep.
 *
 * The method follows `tech-3-2-1` in `src/lib/technique-library/canonical.ts`
 * (third person, then second, then first). The prompts follow Wendell's
 * prompt spec in `wendell-britt-fear-to-joy-manuscript/SPEC_321_PROMPTS.md`:
 * point at a specific person or part, ask for what you can see rather than a
 * named feeling, and trust the three movements to raise the charge.
 *
 * The talk-to-it questions are the six interview questions from
 * "Daemons from Big Mind — Findings and Proposal v0" §1, which the Meet Your
 * Daemons email series also uses, so a client meets one set of questions
 * across the practice. Using them here is a design choice (Claude, 2026-10-06).
 *
 * Kept pure so the summary can be tested without rendering anything.
 */

export type Subject = 'person' | 'part'

export type ThreadLine = { from: 'me' | 'it'; text: string }

export type ThreeTwoOnePass = {
  subject: Subject | null
  /** Phase 3: the description, in third person. */
  faceIt: string
  /** Phase 2: the conversation, alternating voices. */
  thread: ThreadLine[]
  /** Phase 1: speaking as it. */
  beIt: { iAm: string; iWant: string; iGive: string }
  /** The landing: what comes back, and one move. */
  ownIt: { quality: string; move: string }
}

export const EMPTY_PASS: ThreeTwoOnePass = {
  subject: null,
  faceIt: '',
  thread: [],
  beIt: { iAm: '', iWant: '', iGive: '' },
  ownIt: { quality: '', move: '' },
}

export const SUBJECTS: ReadonlyArray<{ key: Subject; label: string; detail: string }> = [
  {
    key: 'person',
    label: 'Someone who gets under my skin',
    detail: 'A boss, a relative, a stranger online. The more charge, the better the material.',
  },
  {
    key: 'part',
    label: 'A part of me that keeps getting in the way',
    detail: 'The one who stalls, criticizes, or takes over right when you want to move.',
  },
]

export const FACE_IT = {
  number: '3',
  title: 'Face it',
  instruction:
    'Describe it in the third person, as he, she, they or it. Make it specific enough to picture: what it looks like, how it moves, where it lives, what it says. Details beat feelings here.',
  placeholder: {
    person:
      'He is the manager who reads his phone while I talk. Mid-fifties, pressed shirt, says "circle back" twice a meeting. He decides fast and keeps the reasons to himself…',
    part:
      'There is a part of me who is sure I will be found out. He is short and tired, wears a cardigan, sits by the door so he can leave first…',
  },
} as const

export const TALK_TO_IT = {
  number: '2',
  title: 'Talk to it',
  instruction:
    'Now speak to it directly, as "you", and let it answer. Write a line as yourself, then switch seats and write its reply. A few rounds is enough.',
  /** The interview. Each opens a "me" line the client can edit. */
  questions: [
    'What is your job?',
    'How do you do it?',
    'How are the hours?',
    'How is the pay?',
    'What would happen if you were not here?',
    'Who do you work for?',
  ],
  mePlaceholder: 'You always show up when I…',
  itPlaceholder: 'Its answer, in its own words…',
} as const

export const BE_IT = {
  number: '1',
  title: 'Be it',
  instruction:
    'Become it. Speak as "I", from inside it, and let it say what it has been holding. Stay with it until something in the voice changes.',
  fields: [
    { key: 'iAm' as const, label: 'I am…', placeholder: 'I am the one who keeps watch so nobody gets surprised…' },
    { key: 'iWant' as const, label: 'What I want is…', placeholder: 'What I want is for someone else to hold the plan for once…' },
    { key: 'iGive' as const, label: 'What I give you is…', placeholder: 'What I give you is a nose for trouble before it arrives…' },
  ],
} as const

export const OWN_IT = {
  title: 'Take it back',
  instruction:
    'You just spoke as the thing you were pushing away. Name one quality of it you can use, and one small move this week that puts it to work.',
  quality: { label: 'The quality I am taking back', placeholder: 'Deciding fast, and letting that be enough' },
  move: { label: 'My move this week', placeholder: 'Make the call on the venue by Thursday without asking anyone' },
} as const

export function threadHasBothVoices(thread: ThreadLine[]): boolean {
  const filled = thread.filter((line) => line.text.trim().length > 0)
  return filled.some((line) => line.from === 'me') && filled.some((line) => line.from === 'it')
}

/** The plain-text record a client copies at the end. Empty answers are left out. */
export function composeSummary(pass: ThreeTwoOnePass): string {
  const lines: string[] = ['My 3-2-1']
  const section = (heading: string, body: string[]) => {
    const kept = body.map((b) => b.trim()).filter(Boolean)
    if (kept.length === 0) return
    lines.push('', heading, ...kept)
  }

  section('3 · Face it', [pass.faceIt])
  section(
    '2 · Talk to it',
    pass.thread
      .filter((line) => line.text.trim())
      .map((line) => `${line.from === 'me' ? 'Me' : 'It'}: ${line.text.trim()}`),
  )
  section('1 · Be it', [
    pass.beIt.iAm.trim() && `I am ${stripLead(pass.beIt.iAm, 'I am')}`,
    pass.beIt.iWant.trim() && `What I want is ${stripLead(pass.beIt.iWant, 'What I want is')}`,
    pass.beIt.iGive.trim() && `What I give you is ${stripLead(pass.beIt.iGive, 'What I give you is')}`,
  ])
  section('Taking back', [
    pass.ownIt.quality.trim() && `Quality: ${pass.ownIt.quality.trim()}`,
    pass.ownIt.move.trim() && `This week: ${pass.ownIt.move.trim()}`,
  ])

  return lines.join('\n')
}

/** Clients often retype the stem the label already shows; keep one copy. */
function stripLead(text: string, lead: string): string {
  const trimmed = text.trim()
  const pattern = new RegExp(`^${lead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s.…:,-]*`, 'i')
  return trimmed.replace(pattern, '').trim()
}
