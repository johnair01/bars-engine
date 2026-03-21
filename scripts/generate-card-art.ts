/**
 * BARS ENGINE — Card Art Generation Script
 *
 * Admin CLI that generates card art images via DALL-E 3 for all 40 nation × playbook pairings.
 * Uses card-art-registry.ts as the static source of prompts and output paths.
 *
 * Usage:
 *   # Dry run — prints all prompts without calling the API
 *   npx tsx scripts/generate-card-art.ts --dry-run
 *
 *   # Live — generate all 40 images
 *   npx tsx scripts/generate-card-art.ts
 *
 *   # Live — filter by element (nation)
 *   npx tsx scripts/generate-card-art.ts --element=fire
 *
 *   # Live — filter by playbook archetype
 *   npx tsx scripts/generate-card-art.ts --playbook=bold-heart
 *
 *   # Live — regenerate even if file already exists
 *   npx tsx scripts/generate-card-art.ts --force
 *
 *   # Live — only one pairing
 *   npx tsx scripts/generate-card-art.ts --element=fire --playbook=bold-heart
 *
 * Prerequisites:
 *   OPENAI_API_KEY must be set in .env.local or environment.
 *
 * Output:
 *   Images written to public/card-art/{nationKey}-{playbookKey}.png
 *
 * Rate limiting:
 *   DALL-E 3 has a default limit of 5 images per minute (tier 1).
 *   This script inserts a 13-second delay between requests to stay safe.
 *   Pass --delay-ms=<n> to override (e.g. --delay-ms=0 for higher-tier accounts).
 */

import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { CARD_ART_REGISTRY } from '../src/lib/ui/card-art-registry'
import type { CardArtEntry } from '../src/lib/ui/card-art-registry'

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'card-art')
const DALLE_ENDPOINT = 'https://api.openai.com/v1/images/generations'
const DEFAULT_DELAY_MS = 13_000 // 13s between requests — safe for DALL-E 3 tier-1 (5 RPM)
const DALLE_MODEL = 'dall-e-3'
const DALLE_SIZE = '1024x1024'
const DALLE_QUALITY = 'standard' // 'hd' for production; 'standard' for cost control

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')
const elementFilter = args.find((a) => a.startsWith('--element='))?.split('=')[1]
const playbookFilter = args.find((a) => a.startsWith('--playbook='))?.split('=')[1]
const delayArg = args.find((a) => a.startsWith('--delay-ms='))?.split('=')[1]
const delayMs = delayArg !== undefined ? parseInt(delayArg, 10) : DEFAULT_DELAY_MS
const showHelp = args.includes('--help') || args.includes('-h')

// ─── Help ─────────────────────────────────────────────────────────────────────

if (showHelp) {
  console.log(`
BARS ENGINE — Card Art Generation Script

Usage:
  npx tsx scripts/generate-card-art.ts [flags]

Flags:
  --dry-run               Print prompts without calling the API
  --element=<key>         Filter by element (fire|water|wood|metal|earth)
  --playbook=<key>        Filter by playbook (bold-heart|devoted-guardian|...)
  --force                 Regenerate even if output file already exists
  --delay-ms=<n>          Override inter-request delay (default: ${DEFAULT_DELAY_MS}ms)
  --help, -h              Show this help

Examples:
  npx tsx scripts/generate-card-art.ts --dry-run
  npx tsx scripts/generate-card-art.ts --element=fire
  npx tsx scripts/generate-card-art.ts --element=fire --playbook=bold-heart --force
  npx tsx scripts/generate-card-art.ts --delay-ms=2000

Output:
  public/card-art/{nationKey}-{playbookKey}.png
`)
  process.exit(0)
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`  📁 Created directory: ${dir}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Download a URL to a Buffer using built-in http/https modules (no extra deps). */
function downloadUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http
    client
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          downloadUrl(res.headers.location).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode} for ${url}`))
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

// ─── DALL-E API ───────────────────────────────────────────────────────────────

interface DalleResponse {
  created: number
  data: Array<{ url: string; revised_prompt?: string }>
}

interface DalleError {
  error: { message: string; type: string; code: string }
}

/**
 * Call DALL-E 3 API with the given prompt.
 * Returns the temporary image URL (valid for ~1 hour).
 * Throws on API error with descriptive message.
 */
async function callDalleApi(
  prompt: string,
  apiKey: string
): Promise<{ url: string; revisedPrompt: string }> {
  const body = JSON.stringify({
    model: DALLE_MODEL,
    prompt,
    n: 1,
    size: DALLE_SIZE,
    quality: DALLE_QUALITY,
    response_format: 'url',
  })

  const response = await fetch(DALLE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  const json = (await response.json()) as DalleResponse | DalleError

  if (!response.ok) {
    const errData = json as DalleError
    const msg = errData?.error?.message ?? `HTTP ${response.status}`
    throw new Error(`DALL-E API error: ${msg}`)
  }

  const data = json as DalleResponse
  const item = data.data?.[0]
  if (!item?.url) {
    throw new Error(`DALL-E API returned no image URL. Response: ${JSON.stringify(data)}`)
  }

  return {
    url: item.url,
    revisedPrompt: item.revised_prompt ?? prompt,
  }
}

// ─── Filter Logic ─────────────────────────────────────────────────────────────

function filterEntries(entries: ReadonlyArray<CardArtEntry>): CardArtEntry[] {
  let filtered = [...entries]

  if (elementFilter) {
    const validElements = ['fire', 'water', 'wood', 'metal', 'earth']
    if (!validElements.includes(elementFilter)) {
      console.error(`❌ Invalid element filter: "${elementFilter}"`)
      console.error(`   Valid elements: ${validElements.join(', ')}`)
      process.exit(1)
    }
    filtered = filtered.filter((e) => e.element === elementFilter)
  }

  if (playbookFilter) {
    filtered = filtered.filter((e) => e.playbookKey === playbookFilter)
    if (filtered.length === 0) {
      console.error(`❌ No entries found for playbook: "${playbookFilter}"`)
      console.error(
        `   Valid playbooks: bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector`
      )
      process.exit(1)
    }
  }

  return filtered
}

// ─── Dry Run Mode ─────────────────────────────────────────────────────────────

function runDryRun(entries: CardArtEntry[]): void {
  console.log('\n🔍 DRY RUN — Card Art Generation')
  console.log(`   ${entries.length} pairing(s) selected from ${CARD_ART_REGISTRY.length} total\n`)
  console.log('═'.repeat(72))

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const idx = `[${String(i + 1).padStart(2, '0')}/${String(entries.length).padStart(2, '0')}]`
    const outputPath = path.join(process.cwd(), entry.outputPath)
    const exists = fs.existsSync(outputPath)

    console.log(`\n${idx} ${entry.key}`)
    console.log(`     Nation:   ${entry.nationLabel} (${entry.element})`)
    console.log(`     Playbook: ${entry.playbookLabel}`)
    console.log(`     Output:   ${entry.outputPath}${exists ? ' ✓ EXISTS' : ' (pending)'}`)
    console.log(`     Prompt:`)

    // Word-wrap the prompt for readability
    const words = entry.dallePrompt.split(' ')
    let line = '       '
    for (const word of words) {
      if (line.length + word.length + 1 > 80) {
        console.log(line)
        line = '       ' + word + ' '
      } else {
        line += word + ' '
      }
    }
    if (line.trim()) console.log(line)
    console.log()
  }

  console.log('═'.repeat(72))
  console.log(`\n✅ Dry run complete. ${entries.length} prompt(s) printed.`)
  console.log('   Run without --dry-run to generate images.\n')
}

// ─── Live Generation Mode ─────────────────────────────────────────────────────

async function runLive(entries: CardArtEntry[], apiKey: string): Promise<void> {
  ensureDir(OUTPUT_DIR)

  const total = entries.length
  let generated = 0
  let skipped = 0
  let failed = 0
  const failures: Array<{ key: string; error: string }> = []

  console.log('\n🎨 Card Art Generation — LIVE MODE')
  console.log(`   Model:   ${DALLE_MODEL} (${DALLE_SIZE}, quality=${DALLE_QUALITY})`)
  console.log(`   Total:   ${total} pairing(s)`)
  console.log(`   Force:   ${isForce ? 'yes (overwrite existing)' : 'no (skip existing)'}`)
  console.log(`   Delay:   ${delayMs}ms between requests`)
  console.log(`   Output:  ${OUTPUT_DIR}\n`)
  console.log('─'.repeat(72))

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const idx = `[${String(i + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}]`
    const outputPath = path.join(process.cwd(), entry.outputPath)
    const exists = fs.existsSync(outputPath)

    process.stdout.write(`\n${idx} ${entry.key}\n`)
    process.stdout.write(`     Nation:   ${entry.nationLabel} (${entry.element})\n`)
    process.stdout.write(`     Playbook: ${entry.playbookLabel}\n`)
    process.stdout.write(`     Output:   ${entry.outputPath}\n`)

    // Skip if exists and not forcing
    if (exists && !isForce) {
      process.stdout.write(`     ⏭  Skipping — file exists (use --force to regenerate)\n`)
      skipped++
      continue
    }

    // Call DALL-E
    process.stdout.write(`     ⏳ Calling DALL-E 3...\n`)
    const startMs = Date.now()

    try {
      const { url, revisedPrompt } = await callDalleApi(entry.dallePrompt, apiKey)
      const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
      process.stdout.write(`     ✓  Generated in ${elapsed}s\n`)

      if (revisedPrompt !== entry.dallePrompt) {
        process.stdout.write(`     ℹ  Prompt revised by DALL-E (see output)\n`)
      }

      // Download image
      process.stdout.write(`     ⬇  Downloading image...\n`)
      const imageBuffer = await downloadUrl(url)
      fs.writeFileSync(outputPath, imageBuffer)

      const sizeKb = (imageBuffer.byteLength / 1024).toFixed(0)
      process.stdout.write(`     ✅ Saved (${sizeKb} KB) → ${entry.outputPath}\n`)
      generated++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      process.stdout.write(`     ❌ Failed: ${message}\n`)
      failed++
      failures.push({ key: entry.key, error: message })
    }

    // Rate limit delay — only between requests, not after the last one
    if (i < entries.length - 1 && delayMs > 0) {
      process.stdout.write(`     ⏸  Waiting ${delayMs}ms (rate limit)...\n`)
      await sleep(delayMs)
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(72))
  console.log('\n📊 Generation Summary')
  console.log(`   Total:     ${total}`)
  console.log(`   Generated: ${generated} ✅`)
  console.log(`   Skipped:   ${skipped} ⏭`)
  console.log(`   Failed:    ${failed} ${failed > 0 ? '❌' : ''}`)

  if (failures.length > 0) {
    console.log('\n⚠️  Failures:')
    for (const f of failures) {
      console.log(`   • ${f.key}: ${f.error}`)
    }
    console.log('\n   Tip: Run with the same flags to retry failed items.')
    console.log('   Use --force if you need to regenerate specific pairings.\n')
    process.exit(1)
  } else {
    console.log(`\n✅ Done. Images at public/card-art/\n`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🎴 BARS Engine — Card Art Generator')
  console.log(`   Registry: ${CARD_ART_REGISTRY.length} total pairings (5 nations × 8 playbooks)`)

  // Apply filters
  const entries = filterEntries(CARD_ART_REGISTRY)

  if (entries.length === 0) {
    console.error('\n❌ No entries matched the given filters.\n')
    process.exit(1)
  }

  // Dry run — no API key needed
  if (isDryRun) {
    runDryRun(entries)
    return
  }

  // Live mode — validate API key
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error('\n❌ OPENAI_API_KEY is not set.')
    console.error('   Add it to .env.local or set it in your environment.')
    console.error('   Use --dry-run to preview prompts without an API key.\n')
    process.exit(1)
  }

  await runLive(entries, apiKey)
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
