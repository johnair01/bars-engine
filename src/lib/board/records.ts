/**
 * The council's records, stored one document per file (six-faces-council .specify/specs/store-only, FR-001):
 * a callsheet, a pass, a ledger entry, a rows file, a research study or a resolved entry from the council repo, held whole in
 * the store instead of on main. `kind` names the file's sort, `path` is the main path it came from (council/...
 * or board/... — the resolved entries come out of board/board_data.json — kept so a record can be traced back
 * to where it used to live), and `body` is the file's exact text. The checks mirror
 * schema/board-save.schema.json's `record` rule, which board/records_write.py runs before it writes, so a
 * record this refuses never leaves the session.
 */
export const RECORD_TYPES = ['callsheet', 'pass', 'ledger', 'rows', 'research', 'resolved'] as const
/** One megabyte: a callsheet with its history fits; nothing legitimate is bigger. */
export const MAX_RECORD_BYTES = 1024 * 1024

export function recordErrors(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (!RECORD_TYPES.includes(data.kind as never)) errors.push(`a record's kind is one of ${RECORD_TYPES.join(', ')}`)
  const path = typeof data.path === 'string' ? data.path : ''
  const prefix = ['council/', 'board/'].filter(p => path.startsWith(p)).sort((a, b) => b.length - a.length)[0]
  if (!prefix || path.length <= prefix.length)
    errors.push("a record names the main path it came from (council/... or board/...)")
  if (typeof data.body !== 'string') errors.push('a record carries body, the file text it stores')
  else if (Buffer.byteLength(data.body, 'utf8') > MAX_RECORD_BYTES)
    errors.push(`a record's body is at most ${MAX_RECORD_BYTES} bytes (1 MB)`)
  return errors
}
