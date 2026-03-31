/**
 * Lists cert-feedback JSON blobs and appends lines to a local JSONL file for triage
 * (cert-feedback-triage skill, tail, grep).
 *
 * Usage:
 *   npx tsx scripts/export-cert-feedback-blob.ts
 *   npx tsx scripts/export-cert-feedback-blob.ts --out=.feedback/cert_feedback.imported.jsonl
 *   npx tsx scripts/export-cert-feedback-blob.ts --since=2026-03-01
 *
 * Requires BLOB_READ_WRITE_TOKEN (same as uploads).
 */
import { config } from 'dotenv'
import { dirname, resolve } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { get, list } from '@vercel/blob'

config({ path: resolve('.env.local') })
config({ path: resolve('.env') })

const PREFIX = 'cert-feedback/events/'

function parseArgs() {
  const argv = process.argv.slice(2)
  let out = '.feedback/cert_feedback.imported.jsonl'
  let since: Date | null = null
  for (const a of argv) {
    if (a.startsWith('--out=')) out = a.slice('--out='.length)
    if (a.startsWith('--since=')) {
      const d = new Date(a.slice('--since='.length))
      if (!Number.isNaN(d.getTime())) since = d
    }
  }
  return { out, since }
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const res = new Response(stream)
  return res.text()
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set. Run with env from Vercel or .env.local.')
    process.exit(1)
  }

  const { out, since } = parseArgs()
  let cursor: string | undefined
  let total = 0
  const lines: string[] = []

  do {
    const page = await list({
      prefix: PREFIX,
      cursor,
      limit: 500,
    })

    for (const b of page.blobs) {
      if (since && b.uploadedAt < since) continue
      const got = await get(b.pathname, { access: 'private', useCache: false })
      if (!got || got.statusCode !== 200 || !got.stream) continue
      const text = await streamToText(got.stream)
      const trimmed = text.trim()
      if (!trimmed) continue
      try {
        JSON.parse(trimmed)
      } catch {
        console.warn('Skip non-JSON:', b.pathname)
        continue
      }
      lines.push(trimmed)
      total++
    }

    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  await mkdir(dirname(resolve(out)), { recursive: true })
  await writeFile(resolve(out), lines.map((l) => `${l}\n`).join(''), 'utf8')
  console.log(`✅ Wrote ${total} JSONL lines to ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
