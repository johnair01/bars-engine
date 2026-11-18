/**
 * A card that cites work must show it. Wendell, 2026-11-17, the fourth waker brief he sent back (waker-brief-s3eq4rxy,
 * -0213dni1, -rlxug39g, -4opya7ly): "I need a clickable link if you are going to put a draft in front of me. This
 * points to files in the repo, but I can't read those from the council board." The same words went back on 2026-11-02
 * (cp-daemons-ready, cp-send-drafts: "If I need to read and review it it should be in the Your eyes pane").
 *
 * A question row names what it cites in one of three places the board page draws on the card:
 *   - `cites`   [{ title, path?, text | src }]  the cited text as the writer read it, or a stored picture;
 *   - `drafts`  [{ key, body, ... }]            a draft he edits (board/drafts.py);
 *   - an option's `then` (the brief that option pushes), which the page opens under the option.
 * A row whose words point at a repo file, a draft, or a GitHub page with none of those showing it is refused when it is
 * posted, so no writer (waker, a lane, a thread) can put a claim in front of him that he cannot open.
 */
type Obj = Record<string, unknown>

const MIN_TEXT = 40
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown) => (typeof v === 'string' ? v : '')

/** A path or file name in prose: `dir/file.ext`, `file.md`. Versions and decimals (`v1.2`) do not match. */
const FILE = /(?:[\w.-]+\/)*[\w.-]+\.(?:md|py|ts|tsx|js|mjs|json|jsonl|yaml|yml|sh|html|css|txt|sql|toml)\b/gi
const GITHUB = /https?:\/\/(?:www\.)?github\.com\/\S+/gi
const DRAFT_CLAIM = /\b(?:the|this|a|here is a|here's a)\s+draft\b[^.]{0,40}\b(?:below|here|attached|above)\b|\bdraft (?:below|above|attached)\b|\bhere is (?:a|the) draft\b/i

export type Cite = { title: string; path?: string; text?: string; src?: string }

/** The cites that show something: a title, and text or a picture. */
export function showingCites(data: Obj): Cite[] {
  const raw = Array.isArray(data.cites) ? data.cites : []
  return raw.filter(isObj).filter((c) => str(c.title).trim() && (str(c.text).trim().length >= MIN_TEXT || str(c.src).trim())) as unknown as Cite[]
}

function visibleDraft(data: Obj): boolean {
  if (showingCites(data).length > 0) return true
  if (Array.isArray(data.drafts) && data.drafts.some((d) => isObj(d) && str(d.body).trim().length >= MIN_TEXT)) return true
  const options = Array.isArray(data.options) ? data.options : []
  return options.some((o) => isObj(o) && str(o.then).trim().length >= MIN_TEXT)
}

/** The words a reader meets on the card: question, why lines, and each option's label and cost. */
function cardWords(data: Obj): string {
  const options = Array.isArray(data.options) ? data.options : []
  return [data.q, data.why_you, data.not_before, data.recommended_why, ...options.flatMap((o) => (isObj(o) ? [o.label, o.c] : []))]
    .map(str).join('\n')
}

const norm = (p: string) => p.trim().toLowerCase().replace(/^`|`$/g, '')

/** Reasons a question row cites what he cannot open; [] when it may be posted. */
export function citeErrors(data: Obj): string[] {
  if (data.backfill === true) return []
  const words = cardWords(data)
  const errors: string[] = []
  const shown = showingCites(data)
  const shownKeys = new Set(shown.flatMap((c) => [c.path, c.title]).filter(Boolean).map((p) => norm(String(p))))
  const files = [...new Set((words.match(FILE) ?? []).map(norm))]
  const missing = files.filter((f) => ![...shownKeys].some((k) => k === f || k.endsWith('/' + f) || f.endsWith('/' + k)))
  if (missing.length)
    errors.push(`it points at ${missing.slice(0, 3).map((f) => '`' + f + '`').join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}, which he cannot open from the board. `
      + 'Put each in `cites` as {title, path, text} with the text you read (at least a paragraph), or a stored picture as `src`, so the card shows it')
  if (GITHUB.test(words))
    errors.push('it links a GitHub page, which he cannot open from the board (closing-rail-look-1: "We can\'t use GitHub for testing look links"). Put what the page says in `cites`')
  if (DRAFT_CLAIM.test(words) && !visibleDraft(data))
    errors.push('it says a draft is below, but the row carries no draft he can read: put it in `drafts` (he can edit it), in the option\'s `then`, or in `cites`')
  return errors
}

/** A look that asks him to read cited material rather than judge a picture: `review: true` with cites that show. It is
 *  not game design work, so it needs no sealed design pass and no picture (his 2026-11-17 ask: review-this-file items
 *  belong on Your eyes). */
export function isReviewLook(data: Obj): boolean {
  return data.review === true && showingCites(data).length > 0
}
