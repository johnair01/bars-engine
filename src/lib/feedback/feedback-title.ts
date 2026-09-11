/**
 * Pulls the player's actual complaint out of a stored feedback block.
 *
 * The persisted `description` wraps the complaint in scaffolding — an `[admin]` tag,
 * a page snapshot, and a trailing metadata footer. Naively taking the first line
 * yields titles like `Site signal: [admin]`, which is what every site-signal row
 * in `backlog_items` looked like before this existed.
 */

/** Footer keys appended by `descriptionBlock` after the trailing `---`. */
const FOOTER_KEYS = new Set(['source', 'questId', 'passageName', 'playerName', 'playerId'])

/** Snapshot keys emitted by `formatSiteSignalFeedbackBlock` — never the complaint. */
const SNAPSHOT_KEYS = new Set([
  'pageUrl',
  'pathname',
  'search',
  'hash',
  'documentTitle',
  'imageUrl',
])

const FELT_WRONG_HEADER = '--- What felt wrong ---'
const TRANSMISSION_LABEL = 'Transmission:'
const SCREENSHOT_LABEL = 'Screenshot:'

function isSectionHeader(line: string): boolean {
  const t = line.trim()
  return t.startsWith('---') && t.endsWith('---') && t.length > 3
}

function keyOf(line: string): string | null {
  const m = /^([A-Za-z][A-Za-z0-9]*):\s/.exec(line.trim())
  return m ? m[1] : null
}

/**
 * Drops the `---` + `key: value` footer that `descriptionBlock` appends, so a
 * complaint is never contaminated with playerId/source lines.
 */
function stripFooter(raw: string): string {
  const lines = raw.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() !== '---') continue
    const rest = lines.slice(i + 1).filter((l) => l.trim().length > 0)
    if (rest.length > 0 && rest.every((l) => FOOTER_KEYS.has(keyOf(l) ?? ''))) {
      return lines.slice(0, i).join('\n')
    }
  }
  return raw
}

/** Everything after the "What felt wrong" header — the site-signal complaint. */
function afterFeltWrong(body: string): string {
  const lines = body.split('\n')
  const idx = lines.findIndex((l) => l.trim() === FELT_WRONG_HEADER)
  if (idx === -1) return ''
  return lines.slice(idx + 1).join('\n').trim()
}

/** The Share Your Signal free-text field, which may span lines up to `Screenshot:`. */
function afterTransmission(body: string): string {
  const lines = body.split('\n')
  const idx = lines.findIndex((l) => l.trim().startsWith(TRANSMISSION_LABEL))
  if (idx === -1) return ''
  const head = lines[idx].trim().slice(TRANSMISSION_LABEL.length).trim()
  const tail: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith(SCREENSHOT_LABEL)) break
    tail.push(lines[i])
  }
  return [head, ...tail].join('\n').trim()
}

/** First line that is neither scaffolding nor a snapshot field. */
function firstMeaningfulLine(body: string): string {
  for (const line of body.split('\n')) {
    const t = line.trim()
    if (!t) continue
    if (t === '[admin]') continue
    if (isSectionHeader(t)) continue
    if (SNAPSHOT_KEYS.has(keyOf(t) ?? '')) continue
    return t
  }
  return ''
}

/**
 * The player's own words, with scaffolding removed. Falls back through
 * site-signal → Share Your Signal → first meaningful line, so cert and manual
 * rows (which have no scaffolding) pass through unchanged.
 */
export function extractComplaintText(raw: string): string {
  if (!raw) return ''
  const body = stripFooter(raw)
  return afterFeltWrong(body) || afterTransmission(body) || firstMeaningfulLine(body) || body.trim()
}

const SOURCE_LABELS: Record<string, string> = {
  share_your_signal: 'Share Your Signal',
  site_signal_nav: 'Site signal',
  library_spawn: 'Library',
}

function labelFor(source: string, questId: string | undefined): string {
  if (source === 'certification') return `Cert: ${questId ?? 'quest'}`
  return SOURCE_LABELS[source] ?? 'Player feedback'
}

/** `Site signal: the buttons can't be pressed on iPhone` — not `Site signal: [admin]`. */
export function buildFeedbackTitle(
  source: string,
  questId: string | undefined,
  feedback: string
): string {
  const complaint = extractComplaintText(feedback)
  const first = complaint.split('\n').find((l) => l.trim().length > 0)?.trim() ?? ''
  const snippet = first.length > 100 ? `${first.slice(0, 97)}…` : first
  return `${labelFor(source, questId)}: ${snippet || '(no text)'}`.slice(0, 200)
}

/**
 * Title for display in triage. Rows written before the title fix have a useless
 * stored `title`, so derive from `description` at render time rather than
 * backfilling production data.
 */
export function displayTitleForRow(row: {
  title: string
  description: string
  source: string
  contextJson?: string | null
}): string {
  const derived = buildFeedbackTitle(row.source, undefined, row.description)
  const derivedBody = derived.split(': ').slice(1).join(': ')
  if (derivedBody && derivedBody !== '(no text)') return derived
  return row.title
}
