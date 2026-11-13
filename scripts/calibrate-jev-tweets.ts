/**
 * calibrate-jev-tweets.ts — Phase 2 calibration for a Jev score gate on tweet→BAR candidates.
 *
 * Corpus (already in the vault, no new collection):
 *   - 4 tweet batch JSONLs (50 candidates each, heuristic + engagement pre-scored)
 *   - bar-registry.jsonl — 170 twitter-sourced entries with decision "accept"
 *
 * Labels:
 *   POSITIVE — the 170 registry-accepted tweet BARs (decision "accept"), read from the
 *   registry's own text field. Join by text_fingerprint is unreliable: the registry and
 *   batch files tokenize fingerprints differently, and only 5 of 170 accepts came from
 *   these four batches.
 *   NEGATIVE — batch candidates (top heuristic scores, still never accepted). Hard
 *   negatives, but "never accepted" includes never-reviewed. Read the agreement table
 *   with that.
 *
 * Run: npx tsx scripts/calibrate-jev-tweets.ts [--live]
 *   default (dry): label join + stats only, no network, no key needed
 *   --live: one Jev score question per candidate, then the agreement table
 *
 * Criteria mirror the tweet pipeline's own heuristic signals (contrast, precision, soma)
 * plus durable-lesson. Length is excluded — mechanical, not a judgment.
 */
import { readFileSync } from 'node:fs'
import { decide, JEV_MAX_STATE_CHARS } from '@/lib/jev/client'

const BATCH_DIR =
  process.env.CALIBRATION_BATCHES_DIR ??
  '/home/workspace/The Library/The Library/08 Source Library/POCKET-RECORDINGS/batches'
const REGISTRY_PATH =
  process.env.BAR_REGISTRY_PATH ?? '/home/workspace/The Library/03 BARs/METADATA/bar-registry.jsonl'
const BATCH_DATES = ['2026-05-06', '2026-05-11', '2026-05-12', '2026-05-13']

export const TWEET_QUESTION = 'bar-worthiness'
export const TWEET_CRITERIA = [
  'durable-lesson: the tweet carries a reusable allyship lesson or teaching, not a personal status update, request, or reaction',
  'contrast: it names a concrete shift or contrast (from X to Y, myth vs reality, rookie vs master)',
  'precision: specific and concrete rather than vague inspiration',
  'soma: felt-sense or body language is present',
]

interface BatchCandidate {
  id: string
  tweetId: string | null
  text: string
  heuristic: number
  favs: number
  batch: string
}

interface CandidateLabel extends BatchCandidate {
  positive: boolean
}

function normalizeFingerprint(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : ''
  if (!s) return ''
  try {
    const parsed = JSON.parse(s)
    if (Array.isArray(parsed)) return parsed.map((w) => String(w).toLowerCase()).join(' ')
  } catch {
    // plain space-joined form
  }
  return s
    .replace(/[\[\]",]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join(' ')
}

function loadAcceptedFingerprints(): Map<string, { barId: string; batchId: string }> {
  const lines = readFileSync(REGISTRY_PATH, 'utf8').split('\n').filter(Boolean)
  const map = new Map<string, { barId: string; batchId: string }>()
  for (const line of lines) {
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.decision !== 'accept') continue
    if (!String(entry.face_owner ?? entry.source ?? '').includes('twitter')) continue
    const fp = normalizeFingerprint(entry.text_fingerprint)
    if (fp && !map.has(fp)) map.set(fp, { barId: String(entry.bar_id ?? ''), batchId: String(entry.batch_id ?? '') })
  }
  return map
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

interface Example extends CandidateLabel {
  key: string
}

function loadExamples(): Example[] {
  const registryLines = readFileSync(REGISTRY_PATH, 'utf8').split('\n').filter(Boolean)
  const positives = new Map<string, Example>()
  for (const line of registryLines) {
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.decision !== 'accept') continue
    if (!String(entry.face_owner ?? entry.source ?? '').includes('twitter')) continue
    const text = String(entry.text ?? '')
    const key = normalizeText(text)
    if (key && !positives.has(key)) {
      positives.set(key, {
        id: String(entry.bar_id ?? entry.id ?? ''),
        tweetId: null,
        text,
        heuristic: Number(entry.score ?? 0),
        favs: 0,
        batch: String(entry.batch_id ?? 'registry'),
        positive: true,
        key,
      })
    }
  }

  const out = [...positives.values()]
  for (const date of BATCH_DATES) {
    const path = `${BATCH_DIR}/batch-twitter-${date}.jsonl`
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean)
    for (const line of lines) {
      let raw: Record<string, unknown>
      try {
        raw = JSON.parse(line)
      } catch {
        continue
      }
      const key = normalizeText(String(raw.text ?? ''))
      if (!key || positives.has(key)) continue
      out.push({
        id: String(raw.id ?? ''),
        tweetId: raw.tweet_id ? String(raw.tweet_id) : null,
        text: String(raw.text ?? ''),
        heuristic: Number(raw.score ?? 0),
        favs: Number(raw.favorite_count ?? 0),
        batch: `batch-twitter-${date}`,
        positive: false,
        key,
      })
    }
  }
  return out
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

async function main() {
  const live = process.argv.includes('--live')
  const candidates = loadExamples()
  const positives = candidates.filter((c) => c.positive)
  const negatives = candidates.filter((c) => !c.positive)

  console.log(`examples: ${candidates.length}  positive (registry accept): ${positives.length}  negative (high-heuristic, never accepted): ${negatives.length}`)
  console.log(`heuristic score mean — positive: ${mean(positives.map((c) => c.heuristic)).toFixed(1)}  negative: ${mean(negatives.map((c) => c.heuristic)).toFixed(1)}`)
  console.log(`favs mean — positive: ${mean(positives.map((c) => c.favs)).toFixed(1)}  negative: ${mean(negatives.map((c) => c.favs)).toFixed(1)}`)

  if (!live) {
    console.log('\ndry run complete. Re-run with --live to add the Jev score column and the agreement table.')
    return
  }

  const scored: { label: CandidateLabel; jev: number | null; bypassed?: string }[] = []
  for (const c of candidates) {
    const state = c.text.length > JEV_MAX_STATE_CHARS ? c.text.slice(0, JEV_MAX_STATE_CHARS) : c.text
    const result = await decide(
      state,
      {
        [TWEET_QUESTION]: {
          type: 'score',
          instructions: 'Score this tweet for BAR-worthiness: how likely it should become an allyship deck card.',
          criteria: TWEET_CRITERIA,
        },
      },
      { timeoutMs: 15000 },
    )
    if (!result.ok) {
      scored.push({ label: c, jev: null, bypassed: result.error })
      console.error(`bypassed ${c.id}: ${result.error}`)
      continue
    }
    const score = result.answers[TWEET_QUESTION]?.score ?? null
    scored.push({ label: c, jev: typeof score === 'number' ? score : null })
  }

  const valid = scored.filter((s) => s.jev !== null)
  console.log(`\njev scored: ${valid.length}/${scored.length} (bypassed: ${scored.length - valid.length})`)
  if (!valid.length) return

  console.log('jev mean — positive: ' + mean(valid.filter((s) => s.label.positive).map((s) => s.jev as number)).toFixed(3)
    + '  negative: ' + mean(valid.filter((s) => !s.label.positive).map((s) => s.jev as number)).toFixed(3))

  console.log('\nthresh  tp  fp  fn  tn  precision  recall  accuracy')
  for (let t = 0.3; t <= 0.9; t += 0.1) {
    let tp = 0, fp = 0, fn = 0, tn = 0
    for (const s of valid) {
      const predicted = (s.jev as number) >= t - 1e-9
      if (predicted && s.label.positive) tp++
      else if (predicted && !s.label.positive) fp++
      else if (!predicted && s.label.positive) fn++
      else tn++
    }
    const precision = tp + fp ? tp / (tp + fp) : 0
    const recall = tp + fn ? tp / (tp + fn) : 0
    const accuracy = (tp + tn) / valid.length
    console.log(`${t.toFixed(1)}    ${String(tp).padStart(3)} ${String(fp).padStart(3)} ${String(fn).padStart(3)} ${String(tn).padStart(3)}  ${precision.toFixed(2)}      ${recall.toFixed(2)}    ${accuracy.toFixed(2)}`)
  }
  console.log('\nnegatives are "never accepted", not confirmed rejects — treat precision as the soft number.')
}

main()
