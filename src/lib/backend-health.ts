/**
 * Backend health check and auto-start for agent workflows.
 *
 * Enables scripts to run from Cursor without a separate terminal:
 * when backend is down, ensureBackendReady() can start it in background.
 */

import { spawn } from 'child_process'

const DEFAULT_URL = 'http://localhost:8000'
const HEALTH_PATH = '/api/health'
const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 30_000
const FETCH_TIMEOUT_MS = 2000

export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_URL
}

export interface CheckResult {
  ok: boolean
  url: string
  error?: string
}

export async function checkBackendHealth(url?: string): Promise<CheckResult> {
  const base = url ?? getBackendUrl()
  const healthUrl = base.replace(/\/$/, '') + HEALTH_PATH

  try {
    const res = await fetch(healthUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    return {
      ok: res.ok,
      url: base,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, url: base, error: msg }
  }
}

export function startBackendInBackground(): void {
  spawn('npm', ['run', 'dev:backend'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: process.env,
    shell: true,
  })
}

export interface EnsureOptions {
  url?: string
  autoStart?: boolean
  /** When true, do not warn if /api/health reports openai_configured: false (e.g. CI). Default: warn. */
  skipOpenAIWarning?: boolean
  /**
   * When true, never write to stdout (only stderr for real errors).
   * Required for MCP stdio: anything on stdout before the real MCP server speaks breaks JSON-RPC.
   */
  quiet?: boolean
}

const NO_AUTO_START_MSG = (url: string) =>
  `Backend not reachable at ${url}. Start it with: npm run dev:backend. Or omit --no-auto-start to have the script start it automatically.`

const AGENT_OPENAI_DOC =
  'docs/AGENT_WORKFLOWS.md (section "OPENAI_API_KEY and backend")'

/**
 * After /api/health returns OK: warn if the Python backend has no OPENAI_API_KEY
 * (agents will use deterministic fallbacks). No-op on fetch/parse errors.
 */
export async function warnIfOpenAINotConfigured(baseUrl: string): Promise<void> {
  const healthUrl = baseUrl.replace(/\/$/, '') + HEALTH_PATH
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return
    const data = (await res.json()) as { openai_configured?: boolean }
    if (data.openai_configured === true) return
    console.warn(
      [
        '\n⚠ Agent backend: openai_configured is false — OPENAI_API_KEY is not loaded in Python settings.',
        '  Sage / strand / GM tools will use deterministic fallbacks until this is fixed.',
        '  Fix: add OPENAI_API_KEY to repo .env.local or .env (or backend/.env); restart: npm run dev:backend',
        '  Verify: curl -s ' + baseUrl.replace(/\/$/, '') + HEALTH_PATH,
        '  Doc: ' + AGENT_OPENAI_DOC,
      ].join('\n')
    )
  } catch {
    /* ignore */
  }
}

/**
 * Ensure backend is ready. If down and autoStart is true, starts it and polls.
 * Returns the backend URL when ready. Throws if not ready after timeout or when autoStart is false.
 * When healthy, logs a one-time warning if OpenAI is not configured (unless skipOpenAIWarning).
 */
export async function ensureBackendReady(options?: EnsureOptions): Promise<string> {
  const url = options?.url ?? getBackendUrl()
  const autoStart = options?.autoStart !== false
  const skipOpenAIWarning = options?.skipOpenAIWarning === true
  const quiet = options?.quiet === true

  const logInfo = (...args: unknown[]) => {
    if (!quiet) console.log(...args)
  }

  const finish = async (u: string): Promise<string> => {
    if (!skipOpenAIWarning) await warnIfOpenAINotConfigured(u)
    return u
  }

  const initial = await checkBackendHealth(url)
  if (initial.ok) return finish(url)

  if (!autoStart) {
    throw new Error(NO_AUTO_START_MSG(url))
  }

  logInfo('Backend not running. Starting it in background...')
  startBackendInBackground()

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const check = await checkBackendHealth(url)
    if (check.ok) {
      logInfo('Backend ready.')
      return finish(url)
    }
  }

  throw new Error(NO_AUTO_START_MSG(url))
}
