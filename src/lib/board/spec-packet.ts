/** Immutable Council spec review packet, stored under its SHA by /api/board/content.
 * Git remains the authored source. This parser keeps the read route bounded and rejects unrelated JSON objects. */
import { readObject } from './content-store'

export type SpecPacket = {
  version: 1
  title: string
  stage: string
  createdAt: string
  source: { repository: string; commit: string; branch: string; path: string }
  documents: { request: string; spec: string; plan: string; tasks: string; reviews: string }
  checks: string[]
  limits: string[]
  lookUrls: string[]
}

const SHA = /^[0-9a-f]{64}$/
const STAGES = new Set(['intake', 'spec', 'clarify', 'falsify', 'assets', 'plan', 'analyze', 'build', 'verify', 'ship', 'close'])
const DOCS = ['request', 'spec', 'plan', 'tasks', 'reviews'] as const
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max
const isTexts = (v: unknown, maxItems: number, maxLength: number): v is string[] =>
  Array.isArray(v) && v.length <= maxItems && v.every(x => isText(x, maxLength))

export function parseSpecPacket(raw: string): SpecPacket | null {
  if (raw.length > 300_000) return null
  let p: unknown
  try { p = JSON.parse(raw) } catch { return null }
  if (!p || typeof p !== 'object') return null
  const x = p as Record<string, unknown>
  if (x.version !== 1 || !isText(x.title, 160) || !x.title.trim() ||
      !isText(x.stage, 20) || !STAGES.has(x.stage) ||
      !isText(x.createdAt, 40) || Number.isNaN(Date.parse(x.createdAt)) ||
      !x.source || typeof x.source !== 'object' ||
      !x.documents || typeof x.documents !== 'object' ||
      !isTexts(x.checks, 40, 500) || !isTexts(x.limits, 40, 500) || !isTexts(x.lookUrls, 24, 500)) return null
  const source = x.source as Record<string, unknown>, docs = x.documents as Record<string, unknown>
  if (source.repository !== 'wendell-britt/Six-faces-council' ||
      !isText(source.commit, 40) || !/^[0-9a-f]{40}$/.test(source.commit) ||
      !isText(source.branch, 120) || !/^[A-Za-z0-9._/-]+$/.test(source.branch) || source.branch.includes('..') ||
      !isText(source.path, 120) || !/^\.specify\/specs\/[a-z0-9-]+$/.test(source.path) ||
      !DOCS.every(k => isText(docs[k], 150_000)) ||
      !x.lookUrls.every((u: string) => /^https:\/\/(bars-engine\.vercel\.app|masteringallyship\.com)\/board\/(look|stills)([/?]|$)/.test(u))) return null
  return x as SpecPacket
}

export async function loadSpecPacket(sha: string): Promise<SpecPacket | null> {
  if (!SHA.test(sha)) return null
  const got = await readObject(sha)
  if (!got || got.type !== 'application/json') return null
  const raw = await new Response(got.body).text()
  return parseSpecPacket(raw)
}
