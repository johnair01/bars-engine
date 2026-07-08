'use client'

import { useState } from 'react'
import { SELF_REPORT_CATEGORIES } from '@/lib/kickstarter-hub/content'

/**
 * Self-report — identification, not solicitation (§4). The visitor tells us who
 * they are; we capture intent only. Where this data ultimately routes is
 * Wendell's open decision (§9), so this component deliberately does NOT commit to
 * a backend: on submit it composes a plain mailto to the configured address,
 * which needs no infrastructure and prejudges nothing. Swap the mailto for a
 * server action once the routing decision lands.
 */
export function SelfReport({ audience }: { audience: 'warm' | 'public' }) {
  const [picked, setPicked] = useState<string | null>(null)

  const to =
    process.env.NEXT_PUBLIC_HUB_SELFREPORT_EMAIL?.trim() || 'wendell@masteringallyship.com'
  const category = SELF_REPORT_CATEGORIES.find((c) => c.key === picked)

  const mailtoHref = category
    ? `mailto:${to}?subject=${encodeURIComponent(
        `[hub] ${category.label}`,
      )}&body=${encodeURIComponent(
        `${category.blurb}\n\n(sent from the ${audience} kickstarter hub — self-report: ${category.key})\n\n`,
      )}`
    : undefined

  return (
    <div className="space-y-3">
      <p
        className="text-[13px]"
        style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-secondary)' }}
      >
        no ask attached — just tell me who you are, so i know how to have you in this.
      </p>
      <div role="group" aria-label="who you are" className="grid gap-2 sm:grid-cols-2">
        {SELF_REPORT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className="ks-chip"
            aria-pressed={picked === c.key}
            onClick={() => setPicked((prev) => (prev === c.key ? null : c.key))}
          >
            <span
              className="block text-[13px] font-bold lowercase"
              style={{ color: 'var(--bars-text-primary)' }}
            >
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

      {category && mailtoHref && (
        <div className="ks-rise flex flex-wrap items-center gap-3 pt-1">
          <a className="ks-cta" href={mailtoHref}>
            send this to wendell →
          </a>
          <span
            className="text-[12px]"
            style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
          >
            opens your mail app — nothing sent until you hit send.
          </span>
        </div>
      )}
    </div>
  )
}
