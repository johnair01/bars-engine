/**
 * One-off script: Extract I Ching text from 64 images via GPT-4o vision.
 *
 * Usage:
 *   1. Place your 64 images in content/iching-images/
 *      - Name them by hexagram number: 1.png, 2.png, ... 64.png
 *      - Or: 01.png, 02.png, ... 64.png
 *   2. Ensure OPENAI_API_KEY is set in .env.local
 *   3. Run: npx tsx scripts/ingest-iching-images.ts
 *
 * Output: content/iching-canonical.json
 */

import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '../src/lib/openai'

const IMAGES_DIR = path.join(process.cwd(), 'content', 'iching-images')
const OUTPUT_FILE = path.join(process.cwd(), 'content', 'iching-canonical.json')
const PARTIAL_FILE = path.join(process.cwd(), 'content', 'iching-canonical.partial.json')
const DELAY_MS = 1500 // Rate limit cushion between API calls

// Standard I Ching names for placeholder when model refuses
const KNOWN_NAMES: Record<number, string> = {
  33: 'Retreat', 34: 'Great Power', 35: 'Progress', 36: 'Brightness Hidden',
  37: 'Family', 38: 'Opposition', 39: 'Obstruction', 40: 'Deliverance',
}

const hexagramSchema = z.object({
  id: z.number().min(1).max(64).describe('Hexagram number 1-64'),
  name: z.string().describe('Hexagram name (e.g. The Creative, The Receptive)'),
  tone: z.string().describe('Short thematic tag or tone (1-3 words)'),
  text: z.string().describe('Full advice/interpretation text from the image'),
})

type HexagramResult = z.infer<typeof hexagramSchema>

const PROMPTS = [
  (id: number) =>
    `Transcribe all text from this I Ching oracle card image. Hexagram #${id}. Return: id=${id}, name (e.g. The Creative), tone (1-3 words), text (full wording from the card).`,
  (id: number) =>
    `Extract the I Ching hexagram content from this image. The image shows hexagram #${id}. Return: id: ${id}, name: hexagram name, tone: short tag, text: full advice text. Preserve wording closely.`,
]

async function extractFromImage(
  imagePath: string,
  hexagramId: number,
  promptIndex = 0
): Promise<HexagramResult> {
  const imageBuffer = fs.readFileSync(imagePath)
  const base64 = imageBuffer.toString('base64')
  const ext = path.extname(imagePath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png'
  const dataUrl = `data:${mime};base64,${base64}`

  const { output } = await generateText({
    model: getOpenAI()('gpt-4o'),
    output: Output.object({ schema: hexagramSchema }),
    prompt: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPTS[promptIndex](hexagramId) },
          { type: 'image', image: dataUrl, mediaType: mime },
        ],
      },
    ],
  })

  return output
}

function findImagePaths(): { id: number; path: string }[] {
  if (!fs.existsSync(IMAGES_DIR)) {
    throw new Error(`Images directory not found: ${IMAGES_DIR}\nCreate it and add 64 images named 1.png, 2.png, ... 64.png`)
  }

  const entries: { id: number; path: string }[] = []
  const exts = ['.png', '.jpg', '.jpeg', '.webp']

  for (let id = 1; id <= 64; id++) {
    const name1 = `${id}`
    const name2 = id < 10 ? `0${id}` : `${id}`
    let found: string | null = null
    for (const ext of exts) {
      const p1 = path.join(IMAGES_DIR, `${name1}${ext}`)
      const p2 = path.join(IMAGES_DIR, `${name2}${ext}`)
      if (fs.existsSync(p1)) {
        found = p1
        break
      }
      if (fs.existsSync(p2)) {
        found = p2
        break
      }
    }
    if (!found) {
      throw new Error(`Missing image for hexagram ${id}. Expected: ${name1}.png or ${name2}.png in ${IMAGES_DIR}`)
    }
    entries.push({ id, path: found })
  }

  return entries
}

function loadPartialResults(): Map<number, HexagramResult> {
  const map = new Map<number, HexagramResult>()
  for (const f of [PARTIAL_FILE, OUTPUT_FILE]) {
    if (!fs.existsSync(f)) continue
    try {
      const raw = fs.readFileSync(f, 'utf8')
      const arr = JSON.parse(raw) as HexagramResult[]
      for (const r of arr) if (r?.id) map.set(r.id, r)
    } catch {
      // ignore
    }
  }
  return map
}

function savePartial(results: HexagramResult[]) {
  fs.mkdirSync(path.dirname(PARTIAL_FILE), { recursive: true })
  fs.writeFileSync(PARTIAL_FILE, JSON.stringify(results.map((r) => ({ ...r })).sort((a, b) => a.id - b.id), null, 2), 'utf8')
}

function isRefusal(err: unknown): boolean {
  const s = String(err)
  try {
    const cause = err instanceof Error && err.cause ? String(err.cause) : ''
    return /refusal|can't assist/i.test(s + cause)
  } catch {
    return /refusal|can't assist/i.test(s)
  }
}

async function main() {
  console.log('🔮 I Ching image ingestion')
  console.log('   Images dir:', IMAGES_DIR)
  console.log('   Output:', OUTPUT_FILE)

  const entries = findImagePaths()
  const partial = loadPartialResults()
  if (partial.size > 0) console.log(`   Resuming: ${partial.size} already done\n`)

  const results: HexagramResult[] = []

  for (let i = 0; i < entries.length; i++) {
    const { id, path: imagePath } = entries[i]
    const existing = partial.get(id)
    if (existing) {
      results.push(existing)
      process.stdout.write(`   [${i + 1}/64] Hexagram ${id}... ✓ (cached)\n`)
      continue
    }

    process.stdout.write(`   [${i + 1}/64] Hexagram ${id}... `)
    let lastErr: unknown
    for (let attempt = 0; attempt < PROMPTS.length; attempt++) {
      try {
        const extracted = await extractFromImage(imagePath, id, attempt)
        results.push(extracted)
        savePartial(results)
        console.log('✓')
        lastErr = undefined
        break
      } catch (err) {
        lastErr = err
        if (isRefusal(err) && attempt < PROMPTS.length - 1) {
          process.stdout.write(`retry ${attempt + 2}... `)
        } else {
          break
        }
      }
    }
    if (lastErr) {
      if (isRefusal(lastErr)) {
        const placeholder: HexagramResult = {
          id,
          name: KNOWN_NAMES[id] ?? `Hexagram ${id}`,
          tone: 'obscure',
          text: '[Model refused this image - add content manually from card]',
        }
        results.push(placeholder)
        savePartial(results)
        console.log('⚠ placeholder (refused)')
      } else {
        console.log('✗')
        console.error(`   Error:`, lastErr)
        throw lastErr
      }
    }
    if (i < entries.length - 1) await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  results.sort((a, b) => a.id - b.id)

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8')

  console.log(`\n✅ Wrote ${results.length} hexagrams to ${OUTPUT_FILE}`)
  console.log('   Next: Run `npm run db:seed` (after updating seed to use this file)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
