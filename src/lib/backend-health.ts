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
}

const NO_AUTO_START_MSG = (url: string) =>
  `Backend not reachable at ${url}. Start it with: npm run dev:backend. Or omit --no-auto-start to have the script start it automatically.`

/**
 * Ensure backend is ready. If down and autoStart is true, starts it and polls.
 * Returns the backend URL when ready. Throws if not ready after timeout or when autoStart is false.
 */
export async function ensureBackendReady(options?: EnsureOptions): Promise<string> {
  const url = options?.url ?? getBackendUrl()
  const autoStart = options?.autoStart !== false

  const initial = await checkBackendHealth(url)
  if (initial.ok) return url

  if (!autoStart) {
    throw new Error(NO_AUTO_START_MSG(url))
  }

  console.log('Backend not running. Starting it in background...')
  startBackendInBackground()

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const check = await checkBackendHealth(url)
    if (check.ok) {
      console.log('Backend ready.')
      return url
    }
  }

  throw new Error(NO_AUTO_START_MSG(url))
}
