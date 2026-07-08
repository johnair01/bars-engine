'use client'

import { useState, useTransition } from 'react'
import { SELF_REPORT_CATEGORIES, type HubAudience } from '@/lib/kickstarter-hub/content'
import { submitHubSelfReport } from '@/actions/hub-self-report'
import { readCachedSuperpowerResult } from '@/lib/superpowers/last-result'

/**
 * Self-report — identification, not solicitation (§4). Raising your hand lands
 * as a steward-triageable lead in the-crossing's Leads console (+ a holding-pen
 * bar the steward can forge into a quest) via `submitHubSelfReport`. Email is
 * optional. If the visitor took the superpower quiz this session, we carry that
 * result in to enrich the lead — best-effort, never required.
 */
export function SelfReport({ audience }: { audience: HubAudience }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [carried, setCarried] = useState<{ superpower: string; orientation: 'internal' | 'external' | null } | null>(
    null,
  )
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const category = SELF_REPORT_CATEGORIES.find((c) => c.key === picked)

  // Read the (best-effort) superpower result on first pick — client-only, so no
  // effect and no SSR/hydration mismatch. Idempotent: only reads until it hits.
  function pick(key: string) {
    setError(null)
    setPicked((prev) => (prev === key ? null : key))
    if (!carried) {
      const cached = readCachedSuperpowerResult()
      if (cached) setCarried({ superpower: cached.superpower, orientation: cached.orientation })
    }
  }

  function submit() {
    if (!category) return
    setError(null)
    start(async () => {
      const res = await submitHubSelfReport({
        category: category.key,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
        superpower: carried?.superpower,
        superpowerOrientation: carried?.orientation ?? null,
        audience,
      })
      if (res.ok) setDone(true)
      else setError(res.error)
    })
  }

  if (done) {
    return (
      <div
        className="ks-rise rounded-[10px] border p-4"
        style={{ borderColor: 'var(--bars-line-strong)', background: 'var(--bars-surface-inset)' }}
        role="status"
      >
        <p className="text-[14px] font-bold lowercase" style={{ color: 'var(--ks-teal-lite, #6fe6c2)' }}>
          got it — your hand is up.
        </p>
        <p
          className="mt-1 text-[13px]"
          style={{ fontFamily: 'var(--bars-font-body)', lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}
        >
          a steward will pick this up and reach out about where you fit
          {carried ? ` — and they'll see your ${carried.superpower} superpower` : ''}. no spam, ever.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p
        className="text-[13px]"
        style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-secondary)' }}
      >
        no ask attached — just tell me who you are, so a steward knows how to have you in this.
      </p>

      <div role="group" aria-label="who you are" className="grid gap-2 sm:grid-cols-2">
        {SELF_REPORT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className="ks-chip"
            aria-pressed={picked === c.key}
            onClick={() => pick(c.key)}
          >
            <span className="block text-[13px] font-bold lowercase" style={{ color: 'var(--bars-text-primary)' }}>
              {c.label}
            </span>
            <span
              className="block text-[12px]"
              style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
            >
              {c.blurb}
            </span>
          </button>
        ))}
      </div>

      {category && (
        <div className="ks-rise space-y-3 pt-1">
          {carried && (
            <p
              className="text-[12px]"
              style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
            >
              carrying your <span style={{ color: 'var(--ks-teal-lite, #6fe6c2)' }}>{carried.superpower}</span>{' '}
              superpower result in with this — so the steward sees it too.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email (optional)"
              aria-label="email (optional)"
              className="ks-chip"
              style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="a line about how (optional)"
              aria-label="a note (optional)"
              className="ks-chip"
              style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="ks-cta" onClick={submit} disabled={pending}>
              {pending ? 'raising your hand…' : 'raise your hand →'}
            </button>
            <span
              className="text-[12px]"
              style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
            >
              email optional — identification, not solicitation.
            </span>
          </div>

          {error && (
            <p role="alert" className="text-[13px]" style={{ color: 'var(--ks-coral-lite, #ff8a70)' }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
