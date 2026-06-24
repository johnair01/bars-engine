'use client'

import Link from 'next/link'
import { submitTheCrossingSupport } from '@/actions/the-crossing-support'
import {
  THE_CROSSING_PARENT_CAMPAIGN_REF,
  THE_CROSSING_PARENT_LABEL,
  THE_CROSSING_SUPPORT_ROLES,
  getTheCrossingSupportRole,
} from '@/lib/the-crossing-support-moves'

function domainLabel(domain: string): string {
  const labels: Record<string, string> = {
    GATHERING_RESOURCES: 'Gather Resources',
    RAISE_AWARENESS: 'Raise Awareness',
    DIRECT_ACTION: 'Direct Action',
    SKILLFUL_ORGANIZING: 'Skillful Organizing',
  }
  return labels[domain] ?? domain
}

export function TheCrossingSupportSection({
  thanksRole,
  error,
}: {
  thanksRole?: string | null
  error?: string | null
}) {
  const thankedRole = getTheCrossingSupportRole(thanksRole)
  const errorCopy =
    error === 'missing'
      ? 'Add your name, contact, and a short summary so Wendell can follow up.'
      : error === 'steward'
        ? 'Support capture is not connected to a steward yet.'
        : error === 'role'
          ? 'Choose a support role before submitting.'
          : null

  return (
    <section
      className="space-y-8 border-t pt-8"
      style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
    >
      <div className="space-y-4">
        <Link
          href={`/campaign/${THE_CROSSING_PARENT_CAMPAIGN_REF}`}
          className="inline-flex text-xs font-semibold uppercase tracking-wide transition-colors"
          style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
        >
          Part of {THE_CROSSING_PARENT_LABEL}
        </Link>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold leading-tight text-[var(--cs-text-primary,#e8e6e0)]">
            Want to help but not sure what your move is?
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)]">
            Pick the kind of help that feels natural. Money helps, and so do car leads,
            introductions, signal boosts, judgment, and encouragement.
          </p>
        </div>

        {thankedRole && (
          <div
            className="rounded-lg p-4 text-sm"
            style={{
              background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid rgba(74, 222, 128, 0.28)',
              color: 'var(--cs-text-primary,#e8e6e0)',
            }}
          >
            Got it. Your {thankedRole.label} offer was captured for The Crossing.
          </div>
        )}

        {errorCopy && (
          <div
            className="rounded-lg p-4 text-sm"
            style={{
              background: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.28)',
              color: 'var(--cs-text-primary,#e8e6e0)',
            }}
          >
            {errorCopy}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {THE_CROSSING_SUPPORT_ROLES.map((role) => (
          <article
            key={role.id}
            className="flex min-h-[420px] flex-col justify-between rounded-lg p-5"
            style={{
              background: 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
              border: '1px solid var(--cs-border, rgba(200, 160, 255, 0.15))',
            }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded px-2 py-1 text-[11px] font-semibold uppercase"
                    style={{
                      color: 'var(--cs-accent-2, #00d4ff)',
                      background: 'rgba(0, 212, 255, 0.1)',
                    }}
                  >
                    {domainLabel(role.primaryDomain)}
                  </span>
                  {role.secondaryDomains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded px-2 py-1 text-[11px] font-semibold uppercase text-[var(--cs-text-muted,#6060a0)]"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      {domainLabel(domain)}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-[var(--cs-text-primary,#e8e6e0)]">
                  {role.label}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)]">
                  {role.description}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-[var(--cs-text-secondary,#9090c0)]">
                  <span className="font-semibold text-[var(--cs-text-primary,#e8e6e0)]">
                    Tiny move:
                  </span>{' '}
                  {role.tinyMove}
                </p>
                <p className="text-[var(--cs-text-secondary,#9090c0)]">
                  <span className="font-semibold text-[var(--cs-text-primary,#e8e6e0)]">
                    Impact:
                  </span>{' '}
                  {role.impact}
                </p>
                <p className="text-xs leading-relaxed text-[var(--cs-text-muted,#6060a0)]">
                  {role.boundary}
                </p>
              </div>
            </div>

            <form action={submitTheCrossingSupport} className="mt-5 space-y-3">
              <input type="hidden" name="role" value={role.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-[var(--cs-text-secondary,#9090c0)]">
                  Name
                  <input
                    name="name"
                    required
                    className="w-full rounded border bg-transparent px-3 py-2 text-sm text-[var(--cs-text-primary,#e8e6e0)] outline-none"
                    style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-[var(--cs-text-secondary,#9090c0)]">
                  Contact
                  <input
                    name="contact"
                    required
                    placeholder="text, email, IG"
                    className="w-full rounded border bg-transparent px-3 py-2 text-sm text-[var(--cs-text-primary,#e8e6e0)] outline-none"
                    style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
                  />
                </label>
              </div>
              <label className="block space-y-1 text-xs font-medium text-[var(--cs-text-secondary,#9090c0)]">
                What are you offering?
                <input
                  name="offerSummary"
                  required
                  placeholder={role.artifact}
                  className="w-full rounded border bg-transparent px-3 py-2 text-sm text-[var(--cs-text-primary,#e8e6e0)] outline-none"
                  style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
                />
              </label>
              <label className="block space-y-1 text-xs font-medium text-[var(--cs-text-secondary,#9090c0)]">
                Link or details
                <textarea
                  name="details"
                  rows={3}
                  placeholder="Add the listing, intro context, share plan, encouragement, or resource details."
                  className="w-full resize-y rounded border bg-transparent px-3 py-2 text-sm text-[var(--cs-text-primary,#e8e6e0)] outline-none"
                  style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
                />
              </label>
              <input name="url" type="url" className="hidden" tabIndex={-1} autoComplete="off" />
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'var(--cs-cta-bg, #f0d000)',
                  color: 'var(--cs-cta-text, #12124a)',
                }}
              >
                {role.ctaLabel}
              </button>
            </form>
          </article>
        ))}
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-[var(--cs-text-muted,#6060a0)]">
        <p>
          This is an early version of BARS Engine in the wild: care becomes a role, a role becomes
          a move, and a move becomes evidence the campaign can follow up on.
        </p>
      </div>
    </section>
  )
}

