/**
 * The 3-2-1 on the coaching page: the coaching-only copy around it, and the one
 * pure function that turns a finished pass into text the client can keep.
 *
 * The three passes themselves are the Clean Up check's interface,
 * `src/components/clean-up/ThreeTwoOnePasses.tsx`, with its own prompts and
 * openers (Wendell, 2026-10-06: use the interactive 321 inside bars-engine).
 * This file adds only what the coaching page puts before and after them.
 *
 * Kept pure so the summary can be tested without rendering anything.
 */

export type Subject = 'person' | 'part'

export type ThreadLine = { from: 'me' | 'it'; text: string }

export type ThreeTwoOnePass = {
  subject: Subject | null
  /** Pass 3: the description, in third person. */
  faceCharge: string
  /** Pass 2: the name, then the conversation in alternating voices. */
  maskName: string
  thread: ThreadLine[]
  /** Pass 1: speaking as it, then what shifted. */
  beVoice: string
  beShift: string
  /** The landing: what comes back, and one move. */
  ownIt: { quality: string; move: string }
}

export const EMPTY_PASS: ThreeTwoOnePass = {
  subject: null,
  faceCharge: '',
  maskName: '',
  thread: [],
  beVoice: '',
  beShift: '',
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

/** The check's placeholder names "The Good Ally"; this one fits a coaching client. */
export const NAME_PLACEHOLDER = 'e.g. The Cynic, The Protector, The Lookout'

export const OWN_IT = {
  title: 'Take it back',
  instruction:
    'You just spoke as the thing you were pushing away. Name one quality of it you can use, and one small move this week that puts it to work.',
  quality: { label: 'The quality I am taking back', placeholder: 'Deciding fast, and letting that be enough' },
  move: { label: 'My move this week', placeholder: 'Make the call on the venue by Thursday without asking anyone' },
} as const

/** The plain-text record a client copies at the end. Empty answers are left out. */
export function composeSummary(pass: ThreeTwoOnePass): string {
  const name = pass.maskName.trim() || 'It'
  const lines: string[] = ['My 3-2-1']
  const section = (heading: string, body: string[]) => {
    const kept = body.map((b) => b.trim()).filter(Boolean)
    if (kept.length === 0) return
    lines.push('', heading, ...kept)
  }

  section('3 · Face it', [pass.faceCharge])
  section(
    pass.maskName.trim() ? `2 · Talk to it: ${name}` : '2 · Talk to it',
    pass.thread
      .filter((line) => line.text.trim())
      .map((line) => `${line.from === 'me' ? 'Me' : name}: ${line.text.trim()}`),
  )
  section('1 · Be it', [pass.beVoice, pass.beShift.trim() && `What shifted: ${pass.beShift.trim()}`])
  section('Taking back', [
    pass.ownIt.quality.trim() && `Quality: ${pass.ownIt.quality.trim()}`,
    pass.ownIt.move.trim() && `This week: ${pass.ownIt.move.trim()}`,
  ])

  return lines.join('\n')
}
