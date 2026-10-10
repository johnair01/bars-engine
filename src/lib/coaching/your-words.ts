/**
 * The page's ask for testimonials (Wendell, board answer on cf-testimonial,
 * 2026-10-09: "I also need to make a part of the coaching page where I can reach
 * out to people to give testamonials about my work").
 *
 * Someone who has worked with him writes a few lines and picks how they may be
 * named, and the page opens an email to him with it written in. Nothing is sent
 * or stored by the page (cg-browser-only): the email goes from their own mail
 * app, so they see exactly what he receives.
 *
 * Kept pure so the email can be tested without rendering anything.
 */

/** The link Wendell sends to past clients. It opens the coaching page's centre with this section showing. */
export const YOUR_WORDS_HASH = '#your-words'

export const WENDELL_EMAIL = 'wendell@masteringallyship.com'

/** How the writer may be named if Wendell quotes them. They choose; the page never picks for them. */
export const NAMING = [
  { id: 'full', label: 'My full name' },
  { id: 'first', label: 'My first name and last initial' },
  { id: 'anon', label: 'Without my name' },
  { id: 'private', label: 'Don’t quote me. This is just for you.' },
] as const

export type NamingId = (typeof NAMING)[number]['id']

export type YourWords = {
  before: string
  changed: string
  name: string
  naming: NamingId | ''
}

export const EMPTY_WORDS: YourWords = { before: '', changed: '', name: '', naming: '' }

const t = (s: string) => s.trim()

/** Ready to send once they have written what changed and chosen how to be named. */
export function canSend(w: YourWords): boolean {
  return t(w.changed).length > 0 && w.naming !== ''
}

/** The email body, in the writer's words, with their naming choice stated plainly. */
export function composeWords(w: YourWords): string {
  const naming = NAMING.find((n) => n.id === w.naming)
  const lines = [
    'What I came in with:',
    t(w.before) || '(left blank)',
    '',
    'What changed:',
    t(w.changed) || '(left blank)',
    '',
    `If you quote this: ${naming ? naming.label : '(not chosen)'}`,
  ]
  if (t(w.name)) lines.push('', `Name: ${t(w.name)}`)
  return lines.join('\n')
}

export function wordsMailto(w: YourWords): string {
  const subject = 'What working with you was like'
  return `mailto:${WENDELL_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composeWords(w))}`
}
