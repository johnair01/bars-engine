/**
 * BARS ENGINE — Card Art Generation Script
 *
 * Implements the council-approved three-phase card art pipeline.
 * See docs/CARD_ART_RUNBOOK.md for the full admin guide.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 *
 * DEFAULT FORK PATH (no API required):
 *   Images are committed to public/card-art/ — fork admins inherit them.
 *   Run --dry-run to verify your local copy is complete.
 *
 * MAINTAINER PATH (canonical image generation, 3 phases):
 *   Phase 1 — Generate reference images for LoRA training:
 *     npx tsx scripts/generate-card-art.ts --generate-references
 *     Uses: gpt-image-1 (OPENAI_API_KEY)
 *     Output: docs/card-art-references/ (commit these to the repo)
 *
 *   Phase 2 — Train style LoRA on fal.ai:
 *     npx tsx scripts/generate-card-art.ts --train-lora
 *     Uses: fal.ai (FAL_KEY), reads docs/card-art-references/
 *     Output: prints FAL_LORA_URL — add to .env.local
 *
 *   Phase 3 — Generate canonical 40 images (seeded, LoRA-locked):
 *     npx tsx scripts/generate-card-art.ts --generate
 *     Uses: fal.ai (FAL_KEY + FAL_LORA_URL from env)
 *     Output: public/card-art/ (commit these to the repo)
 *
 * CUSTOM AESTHETIC PATH (fork admins who want their own imagery):
 *   npx tsx scripts/generate-card-art.ts --custom
 *   Uses: Ideogram API (IDEOGRAM_API_KEY)
 *   Palette is locked to card-tokens.ts element hex values — no LoRA needed.
 *   Output: public/card-art/
 *
 * ─── Common Flags ────────────────────────────────────────────────────────────
 *
 *   --dry-run               Preview without calling any API
 *   --element=<key>         Filter by element (fire|water|wood|metal|earth)
 *   --playbook=<key>        Filter by playbook slug
 *   --force                 Regenerate even if output file exists
 *   --delay-ms=<n>          Override inter-request delay
 *   --help, -h              Show this help
 */

import 'dotenv/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import {
  CARD_ART_REGISTRY,
  CARD_ART_NEGATIVE_PROMPT,
  PLAYBOOK_NEGATIVE_OVERRIDES,
  ELEMENT_PALETTE_HINTS,
  QUARANTINED_CARD_KEYS,
} from '../src/lib/ui/card-art-registry'
import type { CardArtEntry } from '../src/lib/ui/card-art-registry'

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'card-art')
const REFERENCES_DIR = path.join(process.cwd(), 'docs', 'card-art-references')

// Deterministic seeds: index × 1000 + base. Same seed = same Flux output.
const SEED_BASE = 42_000

// fal.ai Flux model
const FAL_MODEL = 'fal-ai/flux/dev'
const FAL_IMAGE_SIZE = { width: 1024, height: 1024 }
const FAL_STEPS = 28
const FAL_GUIDANCE = 3.5
const FAL_LORA_SCALE = 0.85
const DEFAULT_FAL_DELAY_MS = 2_000

// gpt-image-1 reference generation
const GPT_IMAGE_MODEL = 'gpt-image-1'
const GPT_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations'
// 10 pairings for reference images — one per element (5) + 5 more varied archetypes
const REFERENCE_COUNT = 10
const DEFAULT_GPT_DELAY_MS = 12_000 // gpt-image-1 rate limits

// Ideogram
const IDEOGRAM_ENDPOINT = 'https://api.ideogram.ai/generate'
const DEFAULT_IDEOGRAM_DELAY_MS = 3_000

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isDryRun      = args.includes('--dry-run')
const isForce       = args.includes('--force')
const doGenRefs     = args.includes('--generate-references')
const doTrainLora   = args.includes('--train-lora')
const doGenerate    = args.includes('--generate')
const doCustom      = args.includes('--custom')
const showHelp      = args.includes('--help') || args.includes('-h')

const elementFilter  = args.find((a) => a.startsWith('--element='))?.split('=')[1]
const playbookFilter = args.find((a) => a.startsWith('--playbook='))?.split('=')[1]
const delayArg       = args.find((a) => a.startsWith('--delay-ms='))?.split('=')[1]

// Default mode: if no explicit mode flag, default to --generate
const mode: 'generate-references' | 'train-lora' | 'generate' | 'custom' =
  doGenRefs   ? 'generate-references' :
  doTrainLora ? 'train-lora'          :
  doCustom    ? 'custom'              :
                'generate'

const defaultDelayMs =
  mode === 'generate-references' ? DEFAULT_GPT_DELAY_MS :
  mode === 'custom'              ? DEFAULT_IDEOGRAM_DELAY_MS :
                                   DEFAULT_FAL_DELAY_MS

const delayMs = delayArg !== undefined ? parseInt(delayArg, 10) : defaultDelayMs

// ─── Help ─────────────────────────────────────────────────────────────────────

if (showHelp) {
  console.log(`
BARS ENGINE — Card Art Generation Script
See docs/CARD_ART_RUNBOOK.md for the full admin guide.

MODES:
  (default / --generate)      Phase 3: fal.ai Flux + LoRA (canonical)
  --generate-references       Phase 1: gpt-image-1 reference images for LoRA training
  --train-lora                Phase 2: train style LoRA on fal.ai from references
  --custom                    Custom path: Ideogram with palette enforcement

FLAGS:
  --dry-run               Preview prompts/plan without calling any API
  --element=<key>         Filter by element (fire|water|wood|metal|earth)
  --playbook=<key>        Filter by playbook (bold-heart|devoted-guardian|...)
  --force                 Regenerate even if output file already exists
  --delay-ms=<n>          Override inter-request delay
  --help, -h              Show this help

ENV VARS REQUIRED BY MODE:
  --generate              FAL_KEY, FAL_LORA_URL
  --generate-references   OPENAI_API_KEY
  --train-lora            FAL_KEY
  --custom                IDEOGRAM_API_KEY

EXAMPLES:
  # Verify committed images are complete (no API key needed)
  npx tsx scripts/generate-card-art.ts --dry-run

  # Phase 1: generate LoRA training references (maintainer only)
  npx tsx scripts/generate-card-art.ts --generate-references --dry-run
  npx tsx scripts/generate-card-art.ts --generate-references

  # Phase 2: train style LoRA (maintainer only)
  npx tsx scripts/generate-card-art.ts --train-lora --dry-run
  npx tsx scripts/generate-card-art.ts --train-lora

  # Phase 3: generate canonical 40 images (maintainer only)
  npx tsx scripts/generate-card-art.ts --generate --dry-run
  npx tsx scripts/generate-card-art.ts --generate
  npx tsx scripts/generate-card-art.ts --generate --element=fire

  # Custom aesthetic (fork admins)
  npx tsx scripts/generate-card-art.ts --custom --dry-run
  npx tsx scripts/generate-card-art.ts --custom
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

function downloadUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http
    client
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
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

/**
 * Validates that a PNG buffer meets the minimum dimension requirement.
 * PNG header: bytes 16-23 contain width and height as big-endian uint32.
 * Throws if the image is below 512×512 — catches undersized outputs like lamenth-still-point.
 */
function validateImageDimensions(buf: Buffer, key: string): void {
  const MIN_DIM = 512
  if (buf.length < 24) return // not a valid PNG — will fail at write time
  const sig = buf.slice(0, 8)
  const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47
  if (!isPng) return // not a PNG — skip dimension check
  const width  = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  if (width < MIN_DIM || height < MIN_DIM) {
    throw new Error(`Image too small: ${width}×${height}px (minimum ${MIN_DIM}×${MIN_DIM}) for ${key}`)
  }
}

function filterEntries(entries: ReadonlyArray<CardArtEntry>): CardArtEntry[] {
  let filtered = [...entries]
  if (elementFilter) {
    const valid = ['fire', 'water', 'wood', 'metal', 'earth']
    if (!valid.includes(elementFilter)) {
      console.error(`❌ Invalid --element="${elementFilter}". Valid: ${valid.join(', ')}`)
      process.exit(1)
    }
    filtered = filtered.filter((e) => e.element === elementFilter)
  }
  if (playbookFilter) {
    filtered = filtered.filter((e) => e.playbookKey === playbookFilter)
    if (filtered.length === 0) {
      console.error(`❌ No entries for --playbook="${playbookFilter}"`)
      process.exit(1)
    }
  }
  return filtered
}

function cardSeed(index: number): number {
  return SEED_BASE + index * 1000
}

// ─── Dry Run ──────────────────────────────────────────────────────────────────

function runDryRun(entries: CardArtEntry[]): void {
  const modeLabel = {
    'generate-references': 'Phase 1 — gpt-image-1 reference generation',
    'train-lora':          'Phase 2 — fal.ai LoRA training',
    'generate':            'Phase 3 — fal.ai Flux + LoRA (canonical)',
    'custom':              'Custom — Ideogram with palette enforcement',
  }[mode]

  console.log(`\n🔍 DRY RUN — ${modeLabel}`)

  if (mode === 'train-lora') {
    const refFiles = fs.existsSync(REFERENCES_DIR)
      ? fs.readdirSync(REFERENCES_DIR).filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
      : []
    console.log(`\n   References dir: ${REFERENCES_DIR}`)
    console.log(`   Reference images found: ${refFiles.length}`)
    if (refFiles.length < 4) {
      console.log(`   ⚠️  fal.ai needs ≥4 reference images. Run --generate-references first.`)
    }
    console.log(`\n   Would train a Flux style LoRA with:`)
    console.log(`     is_style: true`)
    console.log(`     trigger_word: "bars_engine_card"`)
    console.log(`     steps: 1000`)
    console.log(`     learning_rate: 0.0001`)
    console.log(`\n   Output: FAL_LORA_URL printed to console → add to .env.local`)
    return
  }

  console.log(`   ${entries.length} pairing(s) selected\n`)
  console.log('═'.repeat(72))

  entries.forEach((entry, i) => {
    const idx = `[${String(i + 1).padStart(2, '0')}/${String(entries.length).padStart(2, '0')}]`
    const outPath = mode === 'generate-references'
      ? path.join(REFERENCES_DIR, `ref-${String(i + 1).padStart(2, '0')}-${entry.key}.png`)
      : path.join(process.cwd(), entry.outputPath)
    const exists = fs.existsSync(outPath)

    console.log(`\n${idx} ${entry.key}`)
    console.log(`     Nation:   ${entry.nationLabel} (${entry.element})`)
    console.log(`     Playbook: ${entry.playbookLabel}`)
    console.log(`     Output:   ${outPath.replace(process.cwd(), '.')}${exists ? ' ✓ EXISTS' : ' (pending)'}`)

    if (mode === 'generate') {
      console.log(`     Seed:     ${cardSeed(i)}`)
      const loraUrl = process.env.FAL_LORA_URL
      console.log(`     LoRA:     ${loraUrl ? loraUrl.slice(0, 60) + '…' : '⚠️  FAL_LORA_URL not set'}`)
    }

    if (mode === 'custom') {
      const hints = ELEMENT_PALETTE_HINTS[entry.element as keyof typeof ELEMENT_PALETTE_HINTS]
      console.log(`     Palette:  ${hints?.map(h => h.color_hex).join(', ') ?? '(not found)'}`)
      console.log(`     Seed:     ${cardSeed(i)}`)
    }

    console.log(`     Prompt:`)
    const words = entry.dallePrompt.split(' ')
    let line = '       '
    for (const word of words) {
      if (line.length + word.length + 1 > 80) { console.log(line); line = '       ' + word + ' ' }
      else line += word + ' '
    }
    if (line.trim()) console.log(line)
  })

  console.log('\n' + '═'.repeat(72))
  console.log(`\n✅ Dry run complete. Run without --dry-run to generate.\n`)
}

// ─── Phase 1: gpt-image-1 Reference Generation ────────────────────────────────

async function runGenerateReferences(apiKey: string): Promise<void> {
  ensureDir(REFERENCES_DIR)

  // Pick a representative spread: one per element + 5 varied archetypes
  const allEntries = filterEntries(CARD_ART_REGISTRY)
  const elementSample = ['fire', 'water', 'wood', 'metal', 'earth'].map(
    (el) => allEntries.find((e) => e.element === el)!
  )
  const remaining = allEntries.filter((e) => !elementSample.includes(e))
  const extraSample = remaining.slice(0, Math.max(0, REFERENCE_COUNT - elementSample.length))
  const sampleEntries = [...elementSample, ...extraSample].slice(0, REFERENCE_COUNT)

  console.log(`\n📸 Phase 1 — Reference Image Generation`)
  console.log(`   Model:   ${GPT_IMAGE_MODEL}`)
  console.log(`   Count:   ${sampleEntries.length} references`)
  console.log(`   Output:  ${REFERENCES_DIR}\n`)
  console.log('─'.repeat(72))

  let generated = 0; let failed = 0
  const failures: { key: string; error: string }[] = []

  for (let i = 0; i < sampleEntries.length; i++) {
    const entry = sampleEntries[i]
    const outFile = path.join(REFERENCES_DIR, `ref-${String(i + 1).padStart(2, '0')}-${entry.key}.png`)
    const idx = `[${String(i + 1).padStart(2, '0')}/${sampleEntries.length}]`

    process.stdout.write(`\n${idx} ${entry.key}\n`)
    process.stdout.write(`     Nation: ${entry.nationLabel} (${entry.element})\n`)

    if (fs.existsSync(outFile) && !isForce) {
      process.stdout.write(`     ⏭  Skipping — exists (use --force to regenerate)\n`)
      generated++; continue
    }

    process.stdout.write(`     ⏳ Calling ${GPT_IMAGE_MODEL}...\n`)
    const t0 = Date.now()

    try {
      const resp = await fetch(GPT_IMAGE_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: GPT_IMAGE_MODEL, prompt: entry.dallePrompt, n: 1, size: '1024x1024', quality: 'medium', output_format: 'png' }),
      })
      const json = await resp.json() as { data?: { url?: string; b64_json?: string }[]; error?: { message: string } }
      if (!resp.ok) throw new Error(json.error?.message ?? `HTTP ${resp.status}`)

      const item = json.data?.[0]
      if (item?.b64_json) {
        fs.writeFileSync(outFile, Buffer.from(item.b64_json, 'base64'))
      } else if (item?.url) {
        const buf = await downloadUrl(item.url)
        fs.writeFileSync(outFile, buf)
      } else {
        throw new Error('No image data in response')
      }

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      process.stdout.write(`     ✅ Saved in ${elapsed}s → ${path.relative(process.cwd(), outFile)}\n`)
      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`     ❌ Failed: ${msg}\n`)
      failed++; failures.push({ key: entry.key, error: msg })
    }

    if (i < sampleEntries.length - 1 && delayMs > 0) {
      process.stdout.write(`     ⏸  Waiting ${delayMs}ms...\n`)
      await sleep(delayMs)
    }
  }

  console.log('\n' + '─'.repeat(72))
  console.log(`\n📊 Summary: ${generated} generated, ${failed} failed`)
  if (failures.length > 0) {
    failures.forEach((f) => console.log(`   • ${f.key}: ${f.error}`))
    process.exit(1)
  }
  console.log(`\n✅ References at ${REFERENCES_DIR}`)
  console.log(`   Commit these files, then run --train-lora\n`)
}

// ─── Phase 2: fal.ai LoRA Training ────────────────────────────────────────────

async function runTrainLora(falKey: string): Promise<void> {
  const refFiles = fs.existsSync(REFERENCES_DIR)
    ? fs.readdirSync(REFERENCES_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    : []

  if (refFiles.length < 4) {
    console.error(`\n❌ fal.ai LoRA training requires ≥4 reference images.`)
    console.error(`   Found ${refFiles.length} in ${REFERENCES_DIR}`)
    console.error(`   Run --generate-references first.\n`)
    process.exit(1)
  }

  console.log(`\n🧠 Phase 2 — Style LoRA Training`)
  console.log(`   References: ${refFiles.length} images from ${REFERENCES_DIR}`)
  console.log(`   Model: fal-ai/flux-lora-fast-training`)
  console.log(`   This takes ~3-5 minutes and costs ~$2\n`)

  // Upload reference images as a ZIP to fal.ai storage, then train
  // fal.ai fast training accepts a ZIP of images at images_data_url
  console.log(`   Step 1: Uploading references to fal.ai storage...`)

  // Dynamic import to avoid hard dep if fal isn't installed
  let fal: typeof import('@fal-ai/client').fal
  try {
    const falModule = await import('@fal-ai/client')
    fal = falModule.fal
  } catch {
    console.error(`\n❌ @fal-ai/client not installed.`)
    console.error(`   Run: npm install --save-dev @fal-ai/client\n`)
    process.exit(1)
  }

  fal.config({ credentials: falKey })

  // Create a zip of the reference images
  // Using archiver if available, otherwise instruct user
  let zipBuffer: Buffer
  try {
    const archiver = (await import('archiver')).default
    zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []
      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)
      for (const file of refFiles) {
        archive.file(path.join(REFERENCES_DIR, file), { name: file })
      }
      archive.finalize()
    })
  } catch {
    console.error(`\n❌ archiver not installed. Run: npm install --save-dev archiver @types/archiver`)
    console.error(`   Then retry --train-lora\n`)
    process.exit(1)
  }

  const zipFile = await fal.storage.upload(new File([zipBuffer], 'references.zip', { type: 'application/zip' }))
  console.log(`   Uploaded: ${zipFile}`)

  console.log(`   Step 2: Starting LoRA training...`)
  const result = await fal.subscribe('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: zipFile,
      trigger_word: 'bars_engine_card',
      is_style: true,
      steps: 1000,
      learning_rate: 0.0001,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS' && 'logs' in update && Array.isArray(update.logs)) {
        const lastLog = update.logs[update.logs.length - 1]
        if (lastLog) process.stdout.write(`   [${update.status}] ${lastLog.message}\n`)
      }
    },
  }) as { data?: { diffusers_lora_file?: { url: string } }; diffusers_lora_file?: { url: string } }

  const loraUrl = result?.data?.diffusers_lora_file?.url ?? result?.diffusers_lora_file?.url
  if (!loraUrl) {
    console.error(`\n❌ Training completed but no LoRA URL returned. Result:`, result)
    process.exit(1)
  }

  console.log(`\n✅ LoRA trained successfully!`)
  console.log(`\n   FAL_LORA_URL=${loraUrl}`)
  console.log(`\n   Add this to your .env.local, then run --generate\n`)
}

// ─── Phase 3: fal.ai Flux + LoRA Generation ───────────────────────────────────

async function runGenerate(falKey: string, loraUrl: string, entries: CardArtEntry[]): Promise<void> {
  ensureDir(OUTPUT_DIR)

  console.log(`\n🎨 Phase 3 — Canonical Generation (fal.ai Flux + LoRA)`)
  console.log(`   Model:   ${FAL_MODEL}`)
  console.log(`   LoRA:    ${loraUrl.slice(0, 60)}…`)
  console.log(`   Scale:   ${FAL_LORA_SCALE}`)
  console.log(`   Total:   ${entries.length} pairing(s)`)
  console.log(`   Delay:   ${delayMs}ms between requests\n`)
  console.log('─'.repeat(72))

  let fal: typeof import('@fal-ai/client').fal
  try {
    const falModule = await import('@fal-ai/client')
    fal = falModule.fal
  } catch {
    console.error(`\n❌ @fal-ai/client not installed. Run: npm install --save-dev @fal-ai/client\n`)
    process.exit(1)
  }

  fal.config({ credentials: falKey })

  let generated = 0; let skipped = 0; let failed = 0
  const failures: { key: string; error: string }[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const outPath = path.join(process.cwd(), entry.outputPath)
    const idx = `[${String(i + 1).padStart(2, '0')}/${String(entries.length).padStart(2, '0')}]`
    const seed = cardSeed(i)

    process.stdout.write(`\n${idx} ${entry.key} (seed=${seed})\n`)
    process.stdout.write(`     Nation: ${entry.nationLabel} (${entry.element})\n`)
    process.stdout.write(`     Playbook: ${entry.playbookLabel}\n`)
    process.stdout.write(`     Output: ${entry.outputPath}\n`)

    if (QUARANTINED_CARD_KEYS.has(entry.key)) {
      process.stdout.write(`     🚫 QUARANTINED — watermark detected in previous generation. Regenerating with fixed prompts...\n`)
      // Fall through to regenerate — quarantined cards always regenerate regardless of --force
    } else if (fs.existsSync(outPath) && !isForce) {
      process.stdout.write(`     ⏭  Skipping — exists (use --force to regenerate)\n`)
      skipped++; continue
    }

    process.stdout.write(`     ⏳ Generating with Flux + LoRA...\n`)
    const t0 = Date.now()

    try {
      const result = await fal.subscribe(FAL_MODEL, {
        input: {
          prompt: `bars_engine_card ${entry.dallePrompt}`,
          negative_prompt: [
            CARD_ART_NEGATIVE_PROMPT,
            PLAYBOOK_NEGATIVE_OVERRIDES[entry.playbookKey] ?? '',
          ].filter(Boolean).join(', '),
          seed,
          loras: [{ path: loraUrl, scale: FAL_LORA_SCALE }],
          num_inference_steps: FAL_STEPS,
          guidance_scale: FAL_GUIDANCE,
          image_size: FAL_IMAGE_SIZE,
          output_format: 'png',
        },
      }) as { data?: { images?: { url: string }[] }; images?: { url: string }[] }

      const imageUrl = result?.data?.images?.[0]?.url ?? result?.images?.[0]?.url
      if (!imageUrl) throw new Error('No image URL in fal.ai response')

      const buf = await downloadUrl(imageUrl)
      validateImageDimensions(buf, entry.key)
      fs.writeFileSync(outPath, buf)

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      const sizeKb = (buf.byteLength / 1024).toFixed(0)
      process.stdout.write(`     ✅ Saved in ${elapsed}s (${sizeKb} KB)\n`)
      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`     ❌ Failed: ${msg}\n`)
      failed++; failures.push({ key: entry.key, error: msg })
    }

    if (i < entries.length - 1 && delayMs > 0) {
      process.stdout.write(`     ⏸  Waiting ${delayMs}ms...\n`)
      await sleep(delayMs)
    }
  }

  console.log('\n' + '─'.repeat(72))
  console.log(`\n📊 Summary: ${generated} generated, ${skipped} skipped, ${failed} failed`)
  if (failures.length > 0) {
    failures.forEach((f) => console.log(`   • ${f.key}: ${f.error}`))
    console.log(`\n   Tip: Run again with same flags to retry failed items.\n`)
    process.exit(1)
  }
  console.log(`\n✅ Done. Commit public/card-art/ to the repo.\n`)
}

// ─── Custom Path: Ideogram ────────────────────────────────────────────────────

async function runCustomIdeogram(ideogramKey: string, entries: CardArtEntry[]): Promise<void> {
  ensureDir(OUTPUT_DIR)

  console.log(`\n🎨 Custom Path — Ideogram (palette-enforced)`)
  console.log(`   Total:   ${entries.length} pairing(s)`)
  console.log(`   Style:   ANIME (closest to game card aesthetic)`)
  console.log(`   Palette: locked to card-tokens.ts element hex values`)
  console.log(`   Delay:   ${delayMs}ms between requests\n`)
  console.log('─'.repeat(72))

  let generated = 0; let skipped = 0; let failed = 0
  const failures: { key: string; error: string }[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const outPath = path.join(process.cwd(), entry.outputPath)
    const idx = `[${String(i + 1).padStart(2, '0')}/${String(entries.length).padStart(2, '00')}]`
    const seed = cardSeed(i)
    const palette = ELEMENT_PALETTE_HINTS[entry.element as keyof typeof ELEMENT_PALETTE_HINTS] ?? []

    process.stdout.write(`\n${idx} ${entry.key} (seed=${seed})\n`)
    process.stdout.write(`     Nation: ${entry.nationLabel} (${entry.element})\n`)
    process.stdout.write(`     Playbook: ${entry.playbookLabel}\n`)

    if (fs.existsSync(outPath) && !isForce) {
      process.stdout.write(`     ⏭  Skipping — exists\n`)
      skipped++; continue
    }

    process.stdout.write(`     ⏳ Calling Ideogram...\n`)
    const t0 = Date.now()

    try {
      const resp = await fetch(IDEOGRAM_ENDPOINT, {
        method: 'POST',
        headers: { 'Api-Key': ideogramKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_request: {
            prompt: entry.dallePrompt,
            seed,
            style_type: 'ANIME',
            color_palette: palette.length > 0 ? { members: palette } : undefined,
            model: 'V_2',
            aspect_ratio: 'ASPECT_1_1',
          },
        }),
      })

      const json = await resp.json() as { data?: { url?: string }[]; error?: string }
      if (!resp.ok) throw new Error(json.error ?? `HTTP ${resp.status}`)

      const imageUrl = json.data?.[0]?.url
      if (!imageUrl) throw new Error('No image URL in Ideogram response')

      const buf = await downloadUrl(imageUrl)
      fs.writeFileSync(outPath, buf)

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      const sizeKb = (buf.byteLength / 1024).toFixed(0)
      process.stdout.write(`     ✅ Saved in ${elapsed}s (${sizeKb} KB)\n`)
      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`     ❌ Failed: ${msg}\n`)
      failed++; failures.push({ key: entry.key, error: msg })
    }

    if (i < entries.length - 1 && delayMs > 0) {
      process.stdout.write(`     ⏸  Waiting ${delayMs}ms...\n`)
      await sleep(delayMs)
    }
  }

  console.log('\n' + '─'.repeat(72))
  console.log(`\n📊 Summary: ${generated} generated, ${skipped} skipped, ${failed} failed`)
  if (failures.length > 0) {
    failures.forEach((f) => console.log(`   • ${f.key}: ${f.error}`))
    process.exit(1)
  }
  console.log(`\n✅ Done. Commit public/card-art/ to the repo.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🎴 BARS Engine — Card Art Generator')
  console.log(`   Registry: ${CARD_ART_REGISTRY.length} total pairings (5 nations × 8 playbooks)`)
  console.log(`   Mode: ${mode}`)

  const entries = mode === 'train-lora' ? [] : filterEntries(CARD_ART_REGISTRY)

  if (mode !== 'train-lora' && entries.length === 0) {
    console.error('\n❌ No entries matched the given filters.\n')
    process.exit(1)
  }

  if (isDryRun) {
    runDryRun(entries)
    return
  }

  if (mode === 'generate-references') {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      console.error('\n❌ OPENAI_API_KEY is not set. Add to .env.local\n')
      process.exit(1)
    }
    await runGenerateReferences(apiKey)
    return
  }

  if (mode === 'train-lora') {
    const falKey = process.env.FAL_KEY?.trim()
    if (!falKey) {
      console.error('\n❌ FAL_KEY is not set. Add to .env.local\n')
      process.exit(1)
    }
    await runTrainLora(falKey)
    return
  }

  if (mode === 'generate') {
    const falKey = process.env.FAL_KEY?.trim()
    if (!falKey) {
      console.error('\n❌ FAL_KEY is not set. Add to .env.local\n')
      process.exit(1)
    }
    const loraUrl = process.env.FAL_LORA_URL?.trim()
    if (!loraUrl) {
      console.error('\n❌ FAL_LORA_URL is not set.')
      console.error('   Run --train-lora first, then add the URL to .env.local\n')
      process.exit(1)
    }
    await runGenerate(falKey, loraUrl, entries)
    return
  }

  if (mode === 'custom') {
    const ideogramKey = process.env.IDEOGRAM_API_KEY?.trim()
    if (!ideogramKey) {
      console.error('\n❌ IDEOGRAM_API_KEY is not set. Add to .env.local')
      console.error('   Get a key at https://ideogram.ai/manage-api\n')
      process.exit(1)
    }
    await runCustomIdeogram(ideogramKey, entries)
    return
  }
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
