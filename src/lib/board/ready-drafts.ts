import 'server-only'
import { after } from 'next/server'
import { latestDoc } from '@/lib/board/store'
import { answerOf, type AnswerDoc, type RowDoc } from '@/lib/work/ticket'

/**
 * His plain yes on a look readies the drafts that waited on it, as he saves it (six-faces-council writers-api FR-004).
 * This was `board/gates.py --ready` in the board-pull Action, which billing has refused since 2026-11-02; Wendell asked
 * the same day for the writers to go "through API". The rule is gates.py's: a draft is ready when its title, body or
 * branch names the look and every look it names has a plain yes (an answer, no steer, nothing negative in what he
 * chose). It never throws: the save is already stored, and gates.py --ready still works as the fallback.
 *
 * Token: BOARD_GITHUB_TOKEN, else BOARD_DISPATCH_TOKEN (the token that already dispatches board-pull). Marking a pull
 * request ready needs pull-requests: write; a 403 is logged as `ready-drafts refused` and nothing else happens.
 */
const REPO = 'wendell-britt/Six-faces-council'
const API = 'https://api.github.com'
export const LOOK = /(?<![\w-])([a-z0-9]+(?:-[a-z0-9]+)*-look-\d+)(?![\w-])/g
const NEGATIVE = /\b(?:not yet|rethink|redo|redraw|steer|no)\b/i

export const isLook = (id: string) => new RegExp(`^${LOOK.source}$`).test(id)

/** A plain yes: an answer, no steer, and nothing negative in the answer or the label of the option it picked. */
export function plainYes(doc: AnswerDoc | null, row: RowDoc | null): boolean {
  if (!doc || (doc.steer ?? '').trim()) return false
  const answer = answerOf(doc)
  if (!answer) return false
  const labels = answer.split(',').map(a => a.trim())
    .map(a => (row?.options ?? []).find(o => o.v === a)?.label ?? a)
  return !NEGATIVE.test(`${labels.join(' ')} ${answer}`)
}

export interface Draft { number: number; node_id: string; title?: string | null; body?: string | null; head: { ref: string }; draft?: boolean }
export const looksNamed = (pr: Draft) =>
  [...new Set([...`${pr.title ?? ''} ${pr.body ?? ''} ${pr.head.ref}`.matchAll(LOOK)].map(m => m[1]))]

type Answered = (lookId: string) => Promise<boolean>
type Outcome = { number: number; looks: string[]; status: 'ready' | 'refused' | 'failed' }

async function gh(token: string, path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, { ...init, signal: AbortSignal.timeout(8000), headers: {
    Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json', 'User-Agent': 'bars-engine ready-drafts' } })
}

const storeAnswered: Answered = async (id) =>
  plainYes(await latestDoc('council', 'questions', id) as AnswerDoc | null, await latestDoc('council', 'rows', id) as RowDoc | null)

/** Ready every open draft that waited on `lookId` and has a plain yes on every look it names. */
export async function readyDraftsFor(lookId: string, answered: Answered = storeAnswered): Promise<Outcome[] | 'no-token' | 'failed'> {
  const token = process.env.BOARD_GITHUB_TOKEN || process.env.BOARD_DISPATCH_TOKEN
  if (!token) return 'no-token'
  try {
    const res = await gh(token, `/repos/${REPO}/pulls?state=open&per_page=100`)
    if (!res.ok) { console.error(`ready-drafts refused: listing pulls answered ${res.status}`); return 'failed' }
    const drafts = ((await res.json()) as Draft[]).filter(p => p.draft && looksNamed(p).includes(lookId))
    const out: Outcome[] = []
    for (const pr of drafts) {
      const looks = looksNamed(pr)
      if (!(await Promise.all(looks.map(l => (l === lookId ? Promise.resolve(true) : answered(l))))).every(Boolean)) continue
      const r = await gh(token, '/graphql', { method: 'POST', body: JSON.stringify({
        query: 'mutation($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { number } } }',
        variables: { id: pr.node_id } }) })
      const body = r.ok ? await r.json().catch(() => ({})) as { errors?: unknown[] } : {}
      const status = r.ok && !body.errors?.length ? 'ready' : r.status === 403 || body.errors?.length ? 'refused' : 'failed'
      console.log(`ready-drafts ${status}: #${pr.number} on ${looks.join(', ')}` + (body.errors ? ` ${JSON.stringify(body.errors).slice(0, 200)}` : ''))
      out.push({ number: pr.number, looks, status })
    }
    return out
  } catch (e) {
    console.error('ready-drafts failed', e)
    return 'failed'
  }
}

/** After the save answers: his tap never waits on GitHub. Outside a request (tests, scripts) it runs at once. */
export function readyDraftsAfterSave(board: string, collection: string, docId: string, doc: AnswerDoc, row: RowDoc | null = null) {
  if (board !== 'council' || collection !== 'questions' || !isLook(docId)) return false
  const run = async () => {
    if (!plainYes(doc, row ?? await latestDoc('council', 'rows', docId) as RowDoc | null)) return
    await readyDraftsFor(docId)
  }
  try { after(run) } catch { void run().catch(() => undefined) }
  return true
}
