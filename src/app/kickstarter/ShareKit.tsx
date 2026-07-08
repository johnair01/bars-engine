'use client'

import { useState } from 'react'
import { SHARE_SNIPPETS, type HubAudience } from '@/lib/kickstarter-hub/content'

/**
 * ShareKit — the concrete, low-friction "help sell the book" / "post on social"
 * action (§4). Not "spread the word" with nothing to click: ready-to-send copy
 * with a one-tap copy button. Anchored at #share-kit so both get-involved actions
 * point here.
 */
export function ShareKit({ audience }: { audience: HubAudience }) {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div id="share-kit" className="space-y-3 scroll-mt-20">
      {SHARE_SNIPPETS.map((s) => {
        const text = audience === 'warm' ? s.textWarm : s.textPublic
        return (
          <div key={s.key} className="ks-copy p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="ks-eyebrow">{s.label}</span>
              <button
                type="button"
                className="ks-cta ks-cta--ghost"
                style={{ minHeight: 36, fontSize: 13, padding: '0 14px' }}
                onClick={() => copy(s.key, text)}
                aria-label={`copy ${s.label} post`}
              >
                {copied === s.key ? 'copied ✓' : 'copy'}
              </button>
            </div>
            <p
              className="text-[13px]"
              style={{
                fontFamily: 'var(--bars-font-body)',
                lineHeight: 1.55,
                color: 'var(--bars-text-primary)',
              }}
            >
              {text}
            </p>
          </div>
        )
      })}
    </div>
  )
}
