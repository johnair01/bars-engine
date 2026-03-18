/**
 * Quality control for content/iching-canonical.json.
 *
 * Validates structure, uniqueness, and content quality before seeding Bars.
 * Run: npx tsx scripts/validate-iching-canonical.ts
 */

import fs from 'fs'
import path from 'path'

const CANONICAL_PATH = path.join(process.cwd(), 'content', 'iching-canonical.json')

// Wilhelm/Baynes standard names for cross-reference (informational only)
const WILHELM_NAMES: Record<number, string> = {
  1: 'The Creative', 2: 'The Receptive', 3: 'Difficulty at the Beginning', 4: 'Youthful Folly',
  5: 'Waiting', 6: 'Conflict', 7: 'The Army', 8: 'Holding Together',
  9: 'The Taming Power of the Small', 10: 'Treading', 11: 'Peace', 12: 'Standstill',
  13: 'Fellowship', 14: 'Possession in Great Measure', 15: 'Modesty', 16: 'Enthusiasm',
  17: 'Following', 18: 'Work on What Has Been Spoiled', 19: 'Approach', 20: 'Contemplation',
  21: 'Biting Through', 22: 'Grace', 23: 'Splitting Apart', 24: 'Return',
  25: 'Innocence', 26: 'The Taming Power of the Great', 27: 'The Corners of the Mouth', 28: 'Preponderance of the Great',
  29: 'The Abysmal', 30: 'The Clinging Fire', 31: 'Influence', 32: 'Duration',
  33: 'Retreat', 34: 'The Power of the Great', 35: 'Progress', 36: 'Darkening of the Light',
  37: 'The Family', 38: 'Opposition', 39: 'Obstruction', 40: 'Deliverance',
  41: 'Decrease', 42: 'Increase', 43: 'Break-through', 44: 'Coming to Meet',
  45: 'Gathering Together', 46: 'Pushing Upward', 47: 'Oppression', 48: 'The Well',
  49: 'Revolution', 50: 'The Caldron', 51: 'The Arousing', 52: 'Keeping Still',
  53: 'Development', 54: 'The Marrying Maiden', 55: 'Abundance', 56: 'The Wanderer',
  57: 'The Gentle', 58: 'The Joyous', 59: 'Dispersion', 60: 'Limitation',
  61: 'Inner Truth', 62: 'Preponderance of the Small', 63: 'After Completion', 64: 'Before Completion',
}

type Hexagram = { id: number; name: string; tone: string; text: string }

function loadCanonical(): Hexagram[] {
  if (!fs.existsSync(CANONICAL_PATH)) {
    throw new Error(`Canonical file not found: ${CANONICAL_PATH}`)
  }
  const raw = fs.readFileSync(CANONICAL_PATH, 'utf8')
  return JSON.parse(raw) as Hexagram[]
}

function validate(data: Hexagram[]): { ok: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = []
  const warnings: string[] = []

  // Structure
  if (data.length !== 64) {
    issues.push(`Expected 64 entries, got ${data.length}`)
  }

  const ids = new Set<number>()
  const names = new Map<string, number[]>()
  const tones = new Map<string, number[]>()

  for (let i = 0; i < data.length; i++) {
    const h = data[i]
    const idx = i + 1

    if (!h || typeof h !== 'object') {
      issues.push(`Entry ${idx}: invalid object`)
      continue
    }

    if (h.id < 1 || h.id > 64) {
      issues.push(`#${h.id}: id must be 1–64`)
    }
    if (ids.has(h.id)) {
      issues.push(`#${h.id}: duplicate id`)
    }
    ids.add(h.id)

    const name = (h.name ?? '').trim()
    if (!name) {
      issues.push(`#${h.id}: missing or empty name`)
    } else {
      const arr = names.get(name.toLowerCase()) ?? []
      arr.push(h.id)
      names.set(name.toLowerCase(), arr)
    }

    const tone = (h.tone ?? '').trim()
    if (!tone) {
      issues.push(`#${h.id}: missing or empty tone`)
    } else {
      const arr = tones.get(tone.toLowerCase()) ?? []
      arr.push(h.id)
      tones.set(tone.toLowerCase(), arr)
    }

    const text = (h.text ?? '').trim()
    if (!text) {
      issues.push(`#${h.id}: missing or empty text`)
    } else if (text.includes('[Model refused') || text.includes('[add manually]')) {
      issues.push(`#${h.id}: contains placeholder (model refused)`)
    } else if (text.length < 50) {
      issues.push(`#${h.id}: text very short (${text.length} chars) — may need expansion`)
    }
  }

  // Uniqueness: names must be unique; duplicate tones are a warning
  for (const [name, idList] of names) {
    if (idList.length > 1) {
      issues.push(`Duplicate name "${name}" at hexagrams: ${idList.join(', ')}`)
    }
  }
  for (const [tone, idList] of tones) {
    if (idList.length > 1) {
      warnings.push(`Duplicate tone "${tone}" at hexagrams: ${idList.join(', ')} — consider distinct tags for portal flavor`)
    }
  }

  // Missing ids 1–64
  for (let id = 1; id <= 64; id++) {
    if (!ids.has(id)) {
      issues.push(`Missing hexagram #${id}`)
    }
  }

  return { ok: issues.length === 0, issues, warnings }
}

function main() {
  console.log('🔍 I Ching canonical QC')
  console.log('   File:', CANONICAL_PATH)
  console.log('')

  const data = loadCanonical()
  const { ok, issues, warnings } = validate(data)

  if (issues.length > 0) {
    console.log('❌ Issues:\n')
    for (const i of issues) {
      console.log('   •', i)
    }
    console.log('')
  }
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n')
    for (const w of warnings) {
      console.log('   •', w)
    }
    console.log('')
  }

  // Cross-reference table (informational)
  console.log('📋 Name cross-reference (your deck vs Wilhelm/Baynes):\n')
  const sorted = [...data].sort((a, b) => a.id - b.id)
  for (const h of sorted) {
    const wilhelm = WILHELM_NAMES[h.id] ?? '—'
    const match = wilhelm.toLowerCase().includes(h.name.toLowerCase().split(' ')[0]) ||
      h.name.toLowerCase().includes(wilhelm.toLowerCase().split(' ')[1] ?? '')
    const tag = match ? '' : ' (diff)'
    console.log(`   #${String(h.id).padStart(2)}  ${h.name.padEnd(28)} | ${wilhelm}${tag}`)
  }

  console.log('')
  if (ok) {
    console.log('✅ All checks passed. Ready for seed integration.')
  } else {
    console.log(`⚠️  ${issues.length} issue(s) found. Fix before seeding.`)
    process.exit(1)
  }
}

main()
