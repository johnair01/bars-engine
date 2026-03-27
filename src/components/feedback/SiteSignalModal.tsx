'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { elementCssVars, altitudeCssVars, SURFACE_TOKENS } from '@/lib/ui/card-tokens'

type Snapshot = {
  pageUrl: string
  pathname: string
  search: string
  hash: string
  documentTitle: string
}

function captureSnapshot(): Snapshot {
  if (typeof window === 'undefined') {
    return {
      pageUrl: '',
      pathname: '',
      search: '',
      hash: '',
      documentTitle: '',
    }
  }
  return {
    pageUrl: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    documentTitle: typeof document !== 'undefined' ? document.title : '',
  }
}

export function SiteSignalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const titleId = useId()
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSnapshot(captureSnapshot())
    setMessage('')
    setError(null)
    setDone(false)
    const t = requestAnimationFrame(() => messageRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const submit = useCallback(async () => {
    if (!snapshot || pending) return
    const trimmed = message.trim()
    if (!trimmed) {
      setError('Please describe what felt wrong (even a few words).')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback/site-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: snapshot.pageUrl,
          pathname: snapshot.pathname,
          search: snapshot.search || undefined,
          hash: snapshot.hash || undefined,
          documentTitle: snapshot.documentTitle.trim() || undefined,
          message: trimmed,
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error || `Could not send (${res.status})`)
        return
      }
      setDone(true)
    } catch {
      setError('Network error — try again when you are online.')
    } finally {
      setPending(false)
    }
  }, [message, pending, snapshot])

  if (!isOpen) return null

  const displayUrl =
    snapshot && snapshot.pageUrl.length > 160
      ? `${snapshot.pageUrl.slice(0, 120)}…${snapshot.pageUrl.slice(-32)}`
      : snapshot?.pageUrl ?? ''

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg cultivation-card rounded-xl p-0 overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          ...elementCssVars('metal'),
          ...altitudeCssVars('dissatisfied'),
          backgroundColor: SURFACE_TOKENS.surfaceElevated,
        }}
      >
        <div className="px-5 py-4 border-b border-zinc-800/80 shrink-0">
          <h2 id={titleId} className="text-lg font-bold text-zinc-100">
            Share your signal
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Name what felt wrong — we capture where you are so we can trace it (same path as Share
            Your Signal).
          </p>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {done ? (
            <p className="text-zinc-300 text-sm">Thanks — your signal was recorded.</p>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Page snapshot</p>
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-all bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {snapshot ? displayUrl : '…'}
                </pre>
              </div>
              <div>
                <label htmlFor="site-signal-message" className="block text-sm text-zinc-400 mb-2">
                  What felt wrong?
                </label>
                <textarea
                  ref={messageRef}
                  id="site-signal-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm p-3 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-slate-500/50 min-h-[44px]"
                  placeholder="Broken link, confusing text, something didn’t save…"
                  disabled={pending}
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-zinc-800/80 flex flex-wrap gap-2 justify-end shrink-0">
          {done ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] px-4 rounded-lg border border-slate-600/50 text-slate-200 hover:bg-zinc-800/80 text-sm"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="min-h-[44px] px-4 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={pending}
                className="min-h-[44px] px-4 rounded-lg border border-slate-500/60 text-slate-100 bg-zinc-900/80 hover:bg-zinc-800 text-sm disabled:opacity-50"
              >
                {pending ? 'Sending…' : 'Send signal'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SiteSignalNavTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Report an issue with this page"
        aria-label="Report an issue with this page"
        className="text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-slate-700/60 hover:border-slate-500/60 px-3 sm:px-3 py-3 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.577 4.5-2.598 4.5H4.645c-2.021 0-3.752-2.5-2.598-4.5L9.401 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <SiteSignalModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
