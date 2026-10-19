'use client'

import { useState, useSyncExternalStore, useTransition } from 'react'
import { rotateHostedEditLink } from '@/actions/hosted-campaign'

const noop = () => () => {}

/** Admin only: the owner's private edit link, and a way to make a new one. */
export function EditLinkBox({ slug, token }: { slug: string; token: string | null }) {
  const [current, setCurrent] = useState(token)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => '')
  const url = current ? `${origin}/campaigns/${slug}/edit/${current}` : null

  return (
    <div className="flex flex-col gap-2 rounded-lg p-4 text-sm" style={{ background: 'var(--bars-surface-elevated)', border: '1px dashed var(--bars-line-dashed)' }}>
      <p className="font-semibold">Only admins see this box.</p>
      {url ? (
        <>
          <p style={{ color: 'var(--bars-text-secondary)' }}>Her edit link. Anyone holding it can change the page and see who joined, so send it only to her.</p>
          <code className="break-all rounded p-2" style={{ background: 'var(--bars-surface-inset)' }}>{url}</code>
        </>
      ) : (
        <p style={{ color: 'var(--bars-text-secondary)' }}>No edit link yet. Make one and send it to her.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {url && (
          <button
            type="button"
            className="rounded-md px-3 py-1"
            style={{ border: '1px solid var(--bars-line)' }}
            onClick={() => navigator.clipboard.writeText(url).then(() => setCopied(true), () => setCopied(false))}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          className="rounded-md px-3 py-1"
          style={{ border: '1px solid var(--bars-line)' }}
          onClick={() =>
            start(async () => {
              const res = await rotateHostedEditLink(slug)
              if (res.ok) {
                setCurrent(res.token)
                setCopied(false)
                setError(null)
              } else setError(res.error)
            })
          }
        >
          {current ? 'Make a new link (the old one stops working)' : 'Make her edit link'}
        </button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--bars-fire-gem)' }}>{error}</p>}
    </div>
  )
}
