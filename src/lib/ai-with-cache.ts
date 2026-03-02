/**
 * AI response cache and rate-limit retry.
 * Reduces token usage by caching identical inputs; handles rate limits with retry.
 */
import { createHash } from 'crypto'
import { generateObject } from 'ai'
import { db } from '@/lib/db'

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashInput(inputKey: string): string {
  return createHash('sha256').update(inputKey).digest('hex')
}

async function getCached(
  inputHash: string,
  feature: string
): Promise<string | null> {
  const row = await db.aiResponseCache.findUnique({
    where: {
      inputHash_feature: { inputHash, feature },
    },
  })
  if (!row || row.expiresAt < new Date()) return null
  return row.outputJson
}

async function setCached(
  inputHash: string,
  feature: string,
  model: string,
  outputJson: string,
  ttlMs: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs)
  await db.aiResponseCache.upsert({
    where: {
      inputHash_feature: { inputHash, feature },
    },
    create: {
      inputHash,
      feature,
      model,
      outputJson,
      expiresAt,
    },
    update: {
      outputJson,
      expiresAt,
    },
  })
}

async function generateWithRetry<T>(
  fn: () => Promise<{ object: T }>,
  maxRetries = 3
): Promise<{ object: T }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const msg = String(e instanceof Error ? e.message : e)
      const isRateLimit = /rate limit|429|TPM|tokens per min/i.test(msg)
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = 15000
        console.warn(
          `[AI] Rate limit, waiting ${waitMs / 1000}s (attempt ${attempt}/${maxRetries})`
        )
        await new Promise((r) => setTimeout(r, waitMs))
      } else {
        throw e
      }
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * Call generateObject with cache lookup. On cache hit, returns cached result without API call.
 */
export async function generateObjectWithCache<T>(opts: {
  feature: string
  inputKey: string
  model: string
  schema: object
  system: string
  prompt: string
  getModel: () => unknown
  ttlMs?: number
}): Promise<{ object: T; fromCache: boolean }> {
  const inputHash = hashInput(opts.inputKey)
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS

  const cached = await getCached(inputHash, opts.feature)
  if (cached) {
    return { object: JSON.parse(cached) as T, fromCache: true }
  }

  const result = await generateWithRetry<T>(async () => {
    const res = await generateObject({
      model: opts.getModel(),
      schema: opts.schema,
      system: opts.system,
      prompt: opts.prompt,
    } as any)
    return { object: res.object as T }
  })

  await setCached(
    inputHash,
    opts.feature,
    opts.model,
    JSON.stringify(result.object),
    ttlMs
  )

  return { object: result.object as T, fromCache: false }
}

/**
 * Call generateObject with retry on rate limit (no cache).
 * Use when caching is not needed.
 */
export async function generateObjectWithRetry<T>(
  fn: () => Promise<{ object: T }>,
  maxRetries = 3
): Promise<{ object: T }> {
  return generateWithRetry(fn, maxRetries)
}
