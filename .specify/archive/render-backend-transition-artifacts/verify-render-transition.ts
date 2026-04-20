/**
 * Render transition verifier (T1-T9) for backend cutover.
 *
 * Usage:
 *   npm run verify:render-transition -- --render-url https://bars-backend-xxxx.onrender.com --frontend-url https://bars-engine.vercel.app
 */

import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type TestResult = {
  id: string
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  details: string
}

type ParsedArgs = {
  renderUrl: string
  frontendUrl: string
  outputDir: string
  skipVercelEnvCheck: boolean
}

function parseArgs(argv: string[]): ParsedArgs {
  const get = (flag: string) => {
    const idx = argv.indexOf(flag)
    if (idx < 0) return ''
    return argv[idx + 1] ?? ''
  }

  const renderUrl = get('--render-url')
  const frontendUrl = get('--frontend-url') || 'https://bars-engine.vercel.app'
  const outputDir = get('--output-dir') || 'reports/deploy'
  const skipVercelEnvCheck = argv.includes('--skip-vercel-env-check')

  if (!renderUrl) {
    throw new Error('Missing required flag: --render-url')
  }

  return { renderUrl: normalizeBaseUrl(renderUrl), frontendUrl: normalizeBaseUrl(frontendUrl), outputDir, skipVercelEnvCheck }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function nowUtcIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function http(
  url: string,
  opts?: {
    method?: string
    headers?: Record<string, string>
    body?: string
    timeoutMs?: number
  },
): Promise<{ ok: boolean; status: number; text: string; headers: Headers }> {
  const timeoutMs = opts?.timeoutMs ?? 10000
  const res = await fetch(url, {
    method: opts?.method ?? 'GET',
    headers: opts?.headers,
    body: opts?.body,
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text, headers: res.headers }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function testT1(renderUrl: string): Promise<TestResult> {
  const res = await http(`${renderUrl}/healthz`)
  const body = safeJson(res.text) as Record<string, unknown> | null
  const pass = res.status === 200 && body?.status === 'ok'
  return {
    id: 'T1',
    name: 'Liveness /healthz',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} body=${res.text.slice(0, 240)}`,
  }
}

async function testT2(renderUrl: string): Promise<TestResult> {
  const res = await http(`${renderUrl}/api/health`)
  const body = safeJson(res.text) as Record<string, unknown> | null
  const pass = res.status === 200 && body?.status === 'ok' && 'environment' in (body ?? {}) && 'openai_configured' in (body ?? {})
  return {
    id: 'T2',
    name: 'App health /api/health',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} body=${res.text.slice(0, 320)}`,
  }
}

async function testT3(renderUrl: string): Promise<TestResult> {
  const attempts: string[] = []
  let pass = false

  for (let i = 1; i <= 5; i += 1) {
    const res = await http(`${renderUrl}/api/health/db`)
    attempts.push(`#${i}: status=${res.status} body=${res.text.slice(0, 200)}`)
    const body = safeJson(res.text) as Record<string, unknown> | null
    if (res.status === 200 && body?.status === 'ok' && body?.database === 'connected') {
      pass = true
      break
    }
  }

  return {
    id: 'T3',
    name: 'DB connectivity /api/health/db',
    status: pass ? 'PASS' : 'FAIL',
    details: attempts.join(' | '),
  }
}

async function testT4(renderUrl: string): Promise<TestResult> {
  const res = await http(`${renderUrl}/api/health/startup`, { timeoutMs: 15000 })
  const body = safeJson(res.text) as Record<string, unknown> | null
  const results = body?.results as Record<string, unknown> | undefined
  const pass = res.status === 200 && body?.status === 'ok' && results?.database === 'connected'
  return {
    id: 'T4',
    name: 'Startup diagnostics /api/health/startup',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} body=${res.text.slice(0, 480)}`,
  }
}

async function testT5(renderUrl: string): Promise<TestResult> {
  const payload = {
    unpacking_answers: {
      q1: 'I feel stuck in planning',
      q2: 'I avoid shipping',
      q3: 'fear of being wrong',
      q4: 'small public commit',
      q5: 'daily 30 min ship block',
      q6: 'publish one artifact today',
    },
    quest_grammar: 'epiphany_bridge',
  }

  const res = await http(`${renderUrl}/api/agents/architect/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  })

  const body = safeJson(res.text) as Record<string, unknown> | null
  const output = body?.output as Record<string, unknown> | undefined
  const nodeTexts = Array.isArray(output?.node_texts) ? output?.node_texts : []
  const pass = res.status === 200 && body?.agent === 'architect' && nodeTexts.length > 0

  return {
    id: 'T5',
    name: 'Agent functional /api/agents/architect/compile',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} node_text_count=${nodeTexts.length} deterministic=${String(body?.deterministic)}`,
  }
}

async function testT6(renderUrl: string, frontendUrl: string): Promise<TestResult> {
  const res = await http(`${renderUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: frontendUrl,
      'Access-Control-Request-Method': 'GET',
    },
  })

  const allowedOrigin = res.headers.get('access-control-allow-origin')
  const pass = res.status < 400 && allowedOrigin === frontendUrl
  return {
    id: 'T6',
    name: 'CORS positive (frontend origin)',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} allow-origin=${allowedOrigin ?? '<none>'} body=${res.text.slice(0, 160)}`,
  }
}

async function testT7(renderUrl: string): Promise<TestResult> {
  const badOrigin = 'https://unauthorized.example'
  const res = await http(`${renderUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: badOrigin,
      'Access-Control-Request-Method': 'GET',
    },
  })

  const allowedOrigin = res.headers.get('access-control-allow-origin')
  const pass = res.status >= 400 || allowedOrigin !== badOrigin
  return {
    id: 'T7',
    name: 'CORS negative (unauthorized origin)',
    status: pass ? 'PASS' : 'FAIL',
    details: `status=${res.status} allow-origin=${allowedOrigin ?? '<none>'} body=${res.text.slice(0, 160)}`,
  }
}

async function testT8(renderUrl: string, skip: boolean): Promise<TestResult> {
  if (skip) {
    return {
      id: 'T8',
      name: 'Vercel env pointer check',
      status: 'WARN',
      details: 'Skipped by --skip-vercel-env-check',
    }
  }

  const tmpFile = '/tmp/bars-engine.env.production'
  try {
    execSync(`npx vercel env pull ${tmpFile} --environment production --yes`, { stdio: 'pipe', cwd: process.cwd() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      id: 'T8',
      name: 'Vercel env pointer check',
      status: 'WARN',
      details: `Unable to pull Vercel env: ${msg.slice(0, 240)}`,
    }
  }

  const raw = await readFile(tmpFile, 'utf8')
  const line = raw
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.startsWith('NEXT_PUBLIC_BACKEND_URL='))
  const value = line?.split('=')[1]?.trim().replace(/^"|"$/g, '') ?? ''
  const normalized = normalizeBaseUrl(value)
  const pass = normalized === renderUrl
  return {
    id: 'T8',
    name: 'Vercel env pointer check',
    status: pass ? 'PASS' : 'FAIL',
    details: `NEXT_PUBLIC_BACKEND_URL=${value || '<missing>'}`,
  }
}

async function testT9(frontendUrl: string): Promise<TestResult> {
  const paths = ['/', '/login', '/campaign?ref=bruised-banana']
  const rows: string[] = []
  let pass = true

  for (const path of paths) {
    const res = await http(`${frontendUrl}${path}`, { timeoutMs: 15000 })
    rows.push(`${path}: status=${res.status} bytes=${res.text.length}`)
    if (path === '/campaign?ref=bruised-banana') {
      if (!(res.status >= 200 && res.status < 400)) {
        pass = false
      }
    } else if (res.status !== 200) {
      pass = false
    }
  }

  return {
    id: 'T9',
    name: 'Frontend regression spot check',
    status: pass ? 'PASS' : 'FAIL',
    details: rows.join(' | '),
  }
}

function isGo(results: TestResult[]): boolean {
  const hardFailIds = new Set(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T8', 'T9'])
  return !results.some((r) => hardFailIds.has(r.id) && r.status === 'FAIL')
}

function buildMarkdown(params: ParsedArgs, results: TestResult[], go: boolean, startedAt: string): string {
  const lines: string[] = []
  lines.push(`# Render Backend Transition Evidence — ${startedAt.slice(0, 10)}`)
  lines.push('')
  lines.push('## Execution Metadata')
  lines.push(`- Executed at (UTC): ${startedAt}`)
  lines.push(`- Render URL tested: \`${params.renderUrl}\``)
  lines.push(`- Frontend URL tested: \`${params.frontendUrl}\``)
  lines.push('')
  lines.push('## Results')
  lines.push('')
  for (const result of results) {
    lines.push(`### ${result.id} — ${result.name}`)
    lines.push(`- Status: ${result.status}`)
    lines.push(`- Evidence: ${result.details}`)
    lines.push('')
  }
  lines.push('## Gate Decision')
  lines.push(`- Current decision: **${go ? 'GO' : 'NO-GO'}**`)
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const params = parseArgs(process.argv.slice(2))
  const startedAt = nowUtcIso()

  const results: TestResult[] = []
  results.push(await testT1(params.renderUrl))
  results.push(await testT2(params.renderUrl))
  results.push(await testT3(params.renderUrl))
  results.push(await testT4(params.renderUrl))
  results.push(await testT5(params.renderUrl))
  results.push(await testT6(params.renderUrl, params.frontendUrl))
  results.push(await testT7(params.renderUrl))
  results.push(await testT8(params.renderUrl, params.skipVercelEnvCheck))
  results.push(await testT9(params.frontendUrl))

  const go = isGo(results)

  const outDir = resolve(process.cwd(), params.outputDir)
  await mkdir(outDir, { recursive: true })
  const stamp = startedAt.replace(/[-:]/g, '').replace('T', '_').replace('Z', '')
  const mdPath = resolve(outDir, `render-transition-evidence-${stamp}.md`)
  const jsonPath = resolve(outDir, `render-transition-evidence-${stamp}.json`)

  await writeFile(mdPath, buildMarkdown(params, results, go, startedAt), 'utf8')
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        startedAt,
        renderUrl: params.renderUrl,
        frontendUrl: params.frontendUrl,
        go,
        results,
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(JSON.stringify({ go, markdownReport: mdPath, jsonReport: jsonPath, results }, null, 2))
  process.exit(go ? 0 : 1)
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`verify-render-transition failed: ${message}`)
  process.exit(1)
})
