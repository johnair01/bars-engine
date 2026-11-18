/**
 * Teaching Desk export (spec .specify/specs/voice-desk, FR-005).
 *
 *   npx tsx scripts/voice-export.ts [--from <events.json>] [--check]
 *
 * Reads store events (from a fixture file, or from GET /api/board/voice with COUNCIL_MENU_TOKEN), folds them onto
 * content/voice/, and writes the four files. --check writes nothing and exits 1 when the files would change.
 * No AI. The only network call is the one events route.
 */
import fs from 'node:fs'
import path from 'node:path'
import { foldVoice, parse, serialize, VoiceExportError, type VoiceEvent } from '../src/lib/voice/export'

const DIR = path.join(process.cwd(), 'content', 'voice')
const FILES = { lexicon: 'lexicon.yaml', bank: 'bank.jsonl', chart: 'chart.yaml', screens: 'screens.yaml' } as const

async function readEvents(from: string | null): Promise<VoiceEvent[]> {
  if (from) {
    const j = JSON.parse(fs.readFileSync(from, 'utf8'))
    return Array.isArray(j) ? j : j.events
  }
  const base = process.env.VOICE_EVENTS_URL || 'https://bars-engine.vercel.app/api/board/voice'
  const token = process.env.COUNCIL_MENU_TOKEN
  if (!token) throw new Error('COUNCIL_MENU_TOKEN is not set; pass --from <events.json> to fold a fixture instead.')
  const all: VoiceEvent[] = []
  let after = 0
  for (;;) {
    const res = await fetch(`${base}?after=${after}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`GET ${base}?after=${after} answered ${res.status}`)
    const page = (await res.json()) as { events: VoiceEvent[]; last: number }
    all.push(...page.events)
    if (page.events.length < 500 || page.last <= after) break
    after = page.last
  }
  return all
}

async function main() {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const fi = args.indexOf('--from')
  const from = fi >= 0 ? args[fi + 1] : null
  if (fi >= 0 && !from) throw new Error('--from needs a file')

  const current = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, fs.readFileSync(path.join(DIR, f), 'utf8')])) as Record<keyof typeof FILES, string>
  const next = serialize(foldVoice(parse(current), await readEvents(from)))
  const changed = (Object.keys(FILES) as (keyof typeof FILES)[]).filter((k) => next[k] !== current[k])

  if (check) {
    if (changed.length) {
      console.error(`voice-export --check: would change ${changed.map((k) => FILES[k]).join(', ')}`)
      process.exit(1)
    }
    console.log('voice-export --check: content/voice is up to date')
    return
  }
  for (const k of changed) fs.writeFileSync(path.join(DIR, FILES[k]), next[k])
  console.log(changed.length ? `voice-export: wrote ${changed.map((k) => FILES[k]).join(', ')}` : 'voice-export: nothing to change')
}

main().catch((e) => {
  console.error(e instanceof VoiceExportError ? `voice-export refused: ${e.message}` : e)
  process.exit(1)
})
