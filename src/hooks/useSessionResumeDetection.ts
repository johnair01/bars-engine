'use client'

/**
 * useSessionResumeDetection — React hook for distinguishing fresh navigation
 * from resumed sessions.
 *
 * Design:
 *   - Uses sessionStorage to track an active session heartbeat
 *   - On mount, checks whether a prior session marker exists and whether it
 *     has gone stale (exceeded the heartbeat threshold)
 *   - Fresh navigation: no marker exists, or marker was set within the current
 *     page lifecycle (same-session navigation via Next.js router)
 *   - Resumed session: marker exists but heartbeat is stale (tab was closed,
 *     browser was backgrounded beyond threshold, etc.)
 *
 * The heartbeat fires at a configurable interval (default 30s) and writes
 * the current timestamp to sessionStorage. When the hook mounts and finds
 * a heartbeat older than the staleness threshold (default 60s), it classifies
 * the navigation as a "resume" — meaning the player left and came back.
 *
 * Session-resume is the ONLY trigger for revalidation (Diplomat emotional
 * safety constraint). Mid-session navigation (clicking links, router.push)
 * keeps the heartbeat fresh and never triggers revalidation.
 *
 * Integration:
 *   - Checkpoint system reads `isResumedSession` to decide whether to call
 *     `shouldRevalidateOnResume()` from branch-point-detection.ts
 *   - The `sessionAge` value tells the revalidation UI how long the player
 *     was away (for messaging: "Welcome back! You were away for 2 hours...")
 *
 * @see src/lib/cyoa-composer/branch-point-detection.ts — shouldRevalidateOnResume
 * @see src/lib/cyoa-composer/checkpoint-persistence.ts — restoreCheckpoint
 * @see src/hooks/useComposerGating.ts — pattern reference
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Constants ──────────────────────────────────────────────────────────────

/** sessionStorage key for the heartbeat timestamp */
const SESSION_HEARTBEAT_KEY = 'bars:composer:heartbeat'

/** sessionStorage key for the session ID (to distinguish tab instances) */
const SESSION_ID_KEY = 'bars:composer:sessionId'

/**
 * Default heartbeat interval in milliseconds.
 * The heartbeat writes the current timestamp to sessionStorage at this rate.
 */
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Default staleness threshold in milliseconds.
 * If the heartbeat is older than this on mount, the session is "resumed".
 * Must be > heartbeat interval to avoid false positives.
 */
const DEFAULT_STALENESS_THRESHOLD_MS = 60_000 // 60 seconds

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SessionResumeDetectionOptions {
  /**
   * Heartbeat interval in ms. The hook writes a timestamp to sessionStorage
   * at this frequency while the component is mounted.
   * @default 30000 (30s)
   */
  heartbeatIntervalMs?: number

  /**
   * Staleness threshold in ms. If the last heartbeat is older than this
   * on mount, the session is classified as "resumed".
   * @default 60000 (60s)
   */
  stalenessThresholdMs?: number

  /**
   * Scope key appended to the sessionStorage keys.
   * Allows multiple independent composers on different pages.
   * @default '' (no scope — uses global key)
   */
  scope?: string

  /**
   * Whether the detection is enabled. When false, the hook is inert
   * (always returns fresh navigation). Useful for conditional activation.
   * @default true
   */
  enabled?: boolean
}

export interface SessionResumeState {
  /**
   * Whether this mount represents a resumed session (vs. fresh navigation).
   * - `true`: Player returned after the heartbeat went stale (session resume)
   * - `false`: Fresh page load or same-session navigation
   * - `null`: Detection still initializing (first render)
   */
  isResumedSession: boolean | null

  /**
   * Milliseconds since the last heartbeat was recorded.
   * Null if no previous heartbeat exists (completely fresh session).
   * Useful for messaging: "You were away for X minutes".
   */
  sessionAge: number | null

  /**
   * ISO timestamp of when the previous session's last heartbeat was recorded.
   * Null if no prior session data found.
   */
  lastHeartbeat: string | null

  /**
   * Unique session identifier for this tab lifecycle.
   * Changes on every fresh mount (page reload, new tab).
   * Stays the same across same-session navigations.
   */
  sessionId: string

  /**
   * Manually acknowledge that a resume has been handled
   * (e.g., after revalidation completes). Clears `isResumedSession` to false.
   */
  acknowledgeResume: () => void

  /**
   * Force a heartbeat write (e.g., after a significant user interaction).
   * Normally the heartbeat fires automatically at the configured interval.
   */
  touchHeartbeat: () => void
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/** Generate a short random session ID (not crypto-grade, just for dedup). */
function generateSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Safe sessionStorage read (returns null if unavailable). */
function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem(key)
  } catch {
    // sessionStorage may be blocked (incognito, iframe, etc.)
    return null
  }
}

/** Safe sessionStorage write (no-op if unavailable). */
function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(key, value)
  } catch {
    // sessionStorage may be blocked
  }
}

// ─── Hook Implementation ────────────────────────────────────────────────────

/**
 * Detect whether the current page mount is a fresh navigation or a resumed
 * session, using a sessionStorage heartbeat mechanism.
 *
 * Returns a stable state object that updates only once (on initial detection)
 * and when `acknowledgeResume()` is called.
 */
export function useSessionResumeDetection(
  options: SessionResumeDetectionOptions = {},
): SessionResumeState {
  const {
    heartbeatIntervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
    stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
    scope = '',
    enabled = true,
  } = options

  // Scoped storage keys
  const heartbeatKey = scope
    ? `${SESSION_HEARTBEAT_KEY}:${scope}`
    : SESSION_HEARTBEAT_KEY
  const sessionIdKey = scope
    ? `${SESSION_ID_KEY}:${scope}`
    : SESSION_ID_KEY

  // ── State ─────────────────────────────────────────────────────────────────

  const [resumeState, setResumeState] = useState<{
    isResumedSession: boolean | null
    sessionAge: number | null
    lastHeartbeat: string | null
  }>({
    isResumedSession: null,
    sessionAge: null,
    lastHeartbeat: null,
  })

  const [sessionId] = useState(() => generateSessionId())
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Heartbeat writer ──────────────────────────────────────────────────────

  const touchHeartbeat = useCallback(() => {
    if (!enabled) return
    const now = new Date().toISOString()
    safeSetItem(heartbeatKey, now)
    safeSetItem(sessionIdKey, sessionId)
  }, [enabled, heartbeatKey, sessionIdKey, sessionId])

  // ── Resume acknowledgment ─────────────────────────────────────────────────

  const acknowledgeResume = useCallback(() => {
    setResumeState((prev) => ({
      ...prev,
      isResumedSession: false,
    }))
    // Write a fresh heartbeat to reset the staleness clock
    touchHeartbeat()
  }, [touchHeartbeat])

  // ── Detection on mount ────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) {
      setResumeState({
        isResumedSession: false,
        sessionAge: null,
        lastHeartbeat: null,
      })
      return
    }

    // Read the previous heartbeat (if any)
    const prevHeartbeatStr = safeGetItem(heartbeatKey)
    const prevSessionId = safeGetItem(sessionIdKey)
    const now = Date.now()

    if (!prevHeartbeatStr) {
      // No prior heartbeat — completely fresh session (first visit or cleared storage)
      setResumeState({
        isResumedSession: false,
        sessionAge: null,
        lastHeartbeat: null,
      })
    } else {
      const prevTimestamp = new Date(prevHeartbeatStr).getTime()
      const age = now - prevTimestamp

      if (isNaN(prevTimestamp)) {
        // Corrupted data — treat as fresh
        setResumeState({
          isResumedSession: false,
          sessionAge: null,
          lastHeartbeat: prevHeartbeatStr,
        })
      } else if (prevSessionId === sessionId) {
        // Same session ID — this is a re-render, not a resume
        // (React StrictMode double-mount, or hot reload)
        setResumeState({
          isResumedSession: false,
          sessionAge: age,
          lastHeartbeat: prevHeartbeatStr,
        })
      } else if (age > stalenessThresholdMs) {
        // Heartbeat is stale — this is a resumed session
        setResumeState({
          isResumedSession: true,
          sessionAge: age,
          lastHeartbeat: prevHeartbeatStr,
        })
      } else {
        // Heartbeat is fresh — same-session navigation (e.g., router.push)
        // This handles Next.js client-side navigation where the component
        // unmounts and remounts but the tab was never actually closed.
        setResumeState({
          isResumedSession: false,
          sessionAge: age,
          lastHeartbeat: prevHeartbeatStr,
        })
      }
    }

    // Write initial heartbeat for this session
    touchHeartbeat()

    // Start the heartbeat interval
    heartbeatTimerRef.current = setInterval(touchHeartbeat, heartbeatIntervalMs)

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }
    // Only run on mount — dependencies are stable refs/primitives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, heartbeatKey, sessionIdKey, stalenessThresholdMs, heartbeatIntervalMs])

  return {
    ...resumeState,
    sessionId,
    acknowledgeResume,
    touchHeartbeat,
  }
}

// ─── Utility: format session age for display ─────────────────────────────────

/**
 * Format a session age (in ms) into a human-readable string.
 * Used for "Welcome back! You were away for X" messaging.
 *
 * @param ageMs — session age in milliseconds
 * @returns Human-readable duration (e.g., "2 hours", "15 minutes", "a few seconds")
 */
export function formatSessionAge(ageMs: number | null): string {
  if (ageMs === null || ageMs < 0) return 'unknown'

  const seconds = Math.floor(ageMs / 1000)
  if (seconds < 60) return 'a few seconds'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'}`
}
