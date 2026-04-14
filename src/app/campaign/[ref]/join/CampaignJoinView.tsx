'use client'

import Link from 'next/link'
import { useEffect, useActionState } from 'react'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import {
  buildSkinVars,
  resolveFontClass,
  DEFAULT_BG_GRADIENT,
  type ThemeData,
} from '@/lib/ui/build-skin-vars'
import { joinCampaign, type JoinFormResult } from './actions'
import { usePostJoinRedirect } from '@/hooks/usePostJoinRedirect'

// ─── Types ──────────────────────────────────────────────────────────────────

type JoinableCampaign = {
  id: string
  slug: string
  name: string
  description: string | null
  instanceId: string
  instanceName: string
  theme: ThemeData | null
}

type CampaignJoinViewProps = {
  campaign: JoinableCampaign
  staticSkin: CampaignSkin | null
  isAuthenticated: boolean
  inviteToken?: string | null
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Campaign join view — two modes:
 *   1. Unauthenticated: show signup/login prompt with campaign branding
 *   2. Authenticated non-member: show one-click join button
 *
 * Theming: same two-layer system as CampaignLanding.
 *
 * Post-join routing uses NavigationContract (`campaign_join`) via
 * usePostJoinRedirect — the server action returns success data and
 * the client handles the redirect to the campaign dashboard.
 */
export function CampaignJoinView({
  campaign,
  staticSkin,
  isAuthenticated,
  inviteToken,
}: CampaignJoinViewProps) {
  const skinVars = buildSkinVars(campaign.theme, staticSkin)
  const fontClass = resolveFontClass(campaign.theme, staticSkin)

  return (
    <div
      className="min-h-screen text-[var(--cs-text-primary,#e8e6e0)] flex flex-col items-center justify-center"
      style={{
        background:
          (skinVars as Record<string, string>)['--cs-bg-gradient'] ?? DEFAULT_BG_GRADIENT,
        ...skinVars,
      }}
    >
      <div className="w-full max-w-md px-6 py-12">
        {/* Campaign identity */}
        <div className="text-center mb-8">
          {campaign.theme?.posterImageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden border border-[var(--cs-border,rgba(200,160,255,0.15))] shadow-lg mx-auto max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaign.theme.posterImageUrl}
                alt={`${campaign.name} poster`}
                className="w-full object-cover max-h-48"
              />
            </div>
          )}

          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${fontClass}`}
            style={{ color: 'var(--cs-title, #f0d000)' }}
          >
            {campaign.name}
          </h1>

          <p className="text-sm text-[var(--cs-text-secondary,#9090c0)]">
            {campaign.instanceName}
          </p>

          {campaign.description && (
            <p className="mt-4 text-sm text-[var(--cs-text-secondary,#9090c0)] leading-relaxed line-clamp-3">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Join form — depends on auth state */}
        {isAuthenticated ? (
          <AuthenticatedJoinForm
            campaignId={campaign.id}
            campaignSlug={campaign.slug}
            inviteToken={inviteToken}
          />
        ) : (
          <UnauthenticatedJoinPrompt
            campaignSlug={campaign.slug}
            inviteToken={inviteToken}
          />
        )}

        {/* Back link */}
        <p className="mt-6 text-center">
          <Link
            href={`/campaign/${encodeURIComponent(campaign.slug)}`}
            className="text-xs transition-colors"
            style={{ color: 'var(--cs-text-muted, #6060a0)' }}
          >
            &larr; Back to campaign
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Authenticated: one-click join ──────────────────────────────────────────

function AuthenticatedJoinForm({
  campaignId,
  campaignSlug,
  inviteToken,
}: {
  campaignId: string
  campaignSlug: string
  inviteToken?: string | null
}) {
  const [state, formAction, isPending] = useActionState(joinCampaign, null)
  const { redirectAfterJoin } = usePostJoinRedirect(campaignSlug)

  // When the server action returns success, redirect via NavigationContract
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      redirectAfterJoin(state)
    }
  }, [state, redirectAfterJoin])

  return (
    <form action={formAction}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="campaignSlug" value={campaignSlug} />
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}

      {state && 'error' in state && state.error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm text-center"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 px-6 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{
          background: 'var(--cs-cta-bg, #f0d000)',
          color: 'var(--cs-cta-text, #12124a)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {isPending ? 'Joining...' : 'Join Campaign'}
      </button>
    </form>
  )
}

// ─── Unauthenticated: redirect to login/signup ──────────────────────────────

function UnauthenticatedJoinPrompt({
  campaignSlug,
  inviteToken,
}: {
  campaignSlug: string
  inviteToken?: string | null
}) {
  // After login/signup, redirect back to the join page to complete membership
  const returnTo = inviteToken
    ? `/campaign/${encodeURIComponent(campaignSlug)}/join?invite=${encodeURIComponent(inviteToken)}`
    : `/campaign/${encodeURIComponent(campaignSlug)}/join`

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-[var(--cs-text-secondary,#9090c0)]">
        Create an account or log in to join this campaign.
      </p>

      <Link
        href={`/conclave/guided?returnTo=${encodeURIComponent(returnTo)}`}
        className="block w-full text-center py-3.5 px-6 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'var(--cs-cta-bg, #f0d000)',
          color: 'var(--cs-cta-text, #12124a)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        Sign Up to Join
      </Link>

      <Link
        href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        className="block w-full text-center py-3 px-6 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: 'var(--cs-cta-secondary-bg, rgba(200, 160, 255, 0.15))',
          color: 'var(--cs-cta-secondary-text, #c8a0ff)',
          border: '1px solid var(--cs-cta-secondary-border, rgba(200, 160, 255, 0.4))',
        }}
      >
        Already have an account? Log In
      </Link>
    </div>
  )
}
