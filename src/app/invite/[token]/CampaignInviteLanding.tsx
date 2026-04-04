'use client'

import { useState } from 'react'
import type { CampaignInviteData } from '@/actions/campaign-invite'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import { buildSkinVars, resolveFontClass, DEFAULT_BG_GRADIENT } from '@/lib/ui/build-skin-vars'
import { InviteSignupForm } from './InviteSignupForm'

type Nation = { id: string; name: string; description?: string }
type Archetype = { id: string; name: string; description?: string }

/**
 * Campaign-branded invite landing page.
 * Displays campaign info (poster, story, contribution) above a join CTA
 * that expands into the signup form. Uses the campaign skin system for theming.
 *
 * @permissions public (no auth required — invite token is the gate)
 */
export function CampaignInviteLanding({
  data,
  staticSkin,
  token,
  nations,
  archetypes,
  prefillNationId,
  prefillArchetypeId,
}: {
  data: CampaignInviteData
  staticSkin: CampaignSkin | null
  token: string
  nations: Nation[]
  archetypes: Archetype[]
  prefillNationId: string
  prefillArchetypeId: string
}) {
  const [showForm, setShowForm] = useState(false)

  const { campaign, theme, invite } = data
  const skinVars = buildSkinVars(theme, staticSkin)
  const fontClass = resolveFontClass(theme, staticSkin)

  const hasDateRange = campaign.startDate || campaign.endDate

  return (
    <div
      className="min-h-screen text-[var(--cs-text-primary,#e8e6e0)]"
      style={{
        background:
          (skinVars as Record<string, string>)['--cs-bg-gradient'] ?? DEFAULT_BG_GRADIENT,
        ...skinVars,
      }}
    >
      {/* Poster / Hero */}
      <header className="relative px-6 pt-12 pb-6 sm:px-10 sm:pt-16 max-w-3xl mx-auto">
        {theme?.posterImageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden border border-[var(--cs-border,rgba(200,160,255,0.15))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.posterImageUrl}
              alt={`${campaign.name} poster`}
              className="w-full object-cover max-h-64 sm:max-h-80"
            />
          </div>
        )}

        <p className="text-xs uppercase tracking-widest text-[var(--cs-text-muted,#6060a0)] mb-2">
          You&apos;re invited to join
        </p>

        <h1
          className={`text-3xl sm:text-4xl font-bold ${fontClass}`}
          style={{ color: 'var(--cs-title, #f0d000)' }}
        >
          {campaign.name}
        </h1>

        <p className="mt-2 text-sm text-[var(--cs-text-secondary,#9090c0)]">
          {campaign.instanceName}
          {campaign.createdByName && <> &middot; by {campaign.createdByName}</>}
        </p>

        {hasDateRange && (
          <p className="mt-1 text-xs text-[var(--cs-text-muted,#6060a0)]">
            {campaign.startDate && formatDate(campaign.startDate)}
            {campaign.startDate && campaign.endDate && ' — '}
            {campaign.endDate && formatDate(campaign.endDate)}
          </p>
        )}
      </header>

      {/* Invitation context (forger message) */}
      {invite.forgerName && (
        <div className="px-6 sm:px-10 max-w-3xl mx-auto mb-6">
          <div
            className="rounded-xl p-5 space-y-3 border"
            style={{
              background: 'var(--cs-surface, rgba(10,10,40,0.6))',
              borderColor: 'var(--cs-border, rgba(200,160,255,0.15))',
            }}
          >
            <p className="text-sm text-[var(--cs-text-secondary,#9090c0)]">
              <span
                className="font-medium"
                style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
              >
                {invite.forgerName}
              </span>
              {invite.invitationMessage ? ' called you here because...' : ' invited you to join.'}
            </p>
            {invite.invitationMessage && (
              <blockquote
                className="pl-4 text-sm italic text-[var(--cs-text-primary,#e8e6e0)]"
                style={{
                  borderLeft: '2px solid var(--cs-accent-1, #c8a0ff)',
                }}
              >
                {invite.invitationMessage}
              </blockquote>
            )}
          </div>
        </div>
      )}

      {/* Campaign body content */}
      <main className="px-6 sm:px-10 pb-16 max-w-3xl mx-auto space-y-8">
        {campaign.description && (
          <section className="text-base leading-relaxed whitespace-pre-line">
            {campaign.description}
          </section>
        )}

        {campaign.wakeUpContent && (
          <section>
            <h2
              className={`text-lg font-semibold mb-2 ${fontClass}`}
              style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
            >
              The Story
            </h2>
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {campaign.wakeUpContent}
            </div>
          </section>
        )}

        {campaign.showUpContent && (
          <section>
            <h2
              className={`text-lg font-semibold mb-2 ${fontClass}`}
              style={{ color: 'var(--cs-accent-2, #00d4ff)' }}
            >
              How to Contribute
            </h2>
            <div className="whitespace-pre-line text-sm leading-relaxed">
              {campaign.showUpContent}
            </div>
          </section>
        )}

        {campaign.storyBridgeCopy && (
          <section
            className="border-t pt-6"
            style={{ borderColor: 'var(--cs-border, rgba(200,160,255,0.15))' }}
          >
            <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)] italic">
              {campaign.storyBridgeCopy}
            </div>
          </section>
        )}

        {/* Join CTA / Signup Form */}
        <section className="pt-4">
          {!showForm ? (
            <div className="text-center space-y-4">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg min-h-[48px]"
                style={{
                  background: 'var(--cs-cta-bg, #f0d000)',
                  color: 'var(--cs-cta-text, #12124a)',
                }}
              >
                Join This Campaign
              </button>
              <p className="text-xs text-[var(--cs-text-muted,#6060a0)]">
                Create your character and start playing
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={`text-lg font-semibold ${fontClass}`}
                  style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
                >
                  Create Your Character
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-xs text-[var(--cs-text-muted,#6060a0)] hover:text-[var(--cs-text-secondary,#9090c0)] transition"
                >
                  Back to info
                </button>
              </div>
              <InviteSignupForm
                token={token}
                nations={nations}
                archetypes={archetypes}
                prefillNationId={prefillNationId}
                prefillArchetypeId={prefillArchetypeId}
                forgerName={invite.forgerName}
                invitationMessage={invite.invitationMessage}
              />
            </div>
          )}
        </section>

        {/* Footer link */}
        <div className="text-center pt-4">
          <a
            href="/conclave/guided"
            className="text-xs transition"
            style={{ color: 'var(--cs-text-muted, #6060a0)' }}
          >
            Already have an account? Log In
          </a>
        </div>
      </main>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
