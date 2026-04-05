'use client'

import { useCallback } from 'react'
import { usePostActionRouter } from './usePostActionRouter'
import { NAV } from '@/lib/navigation-contract'
import type { JoinCampaignResult } from '@/actions/campaign-join'

/**
 * usePostJoinRedirect — handles post-join navigation for campaign membership.
 *
 * Wraps the NavigationContract `campaign_join` contract so that callers
 * (both form-based and token-based join flows) get consistent routing
 * into the campaign dashboard with the correct campaign context.
 *
 * Usage:
 *   const { redirectAfterJoin, cancel } = usePostJoinRedirect(campaignSlug)
 *
 *   // After server action succeeds:
 *   redirectAfterJoin(result)
 */
export function usePostJoinRedirect(fallbackCampaignSlug?: string) {
  const { navigate, cancel } = usePostActionRouter(
    NAV['campaign_join'],
    fallbackCampaignSlug
      ? `/campaign/${encodeURIComponent(fallbackCampaignSlug)}`
      : '/',
  )

  /**
   * Redirect after a successful join.
   * Accepts the result from either join action variant:
   *   - Token-based: JoinCampaignResult from src/actions/campaign-join.ts
   *   - Form-based: { campaignSlug: string }
   */
  const redirectAfterJoin = useCallback(
    (result: JoinCampaignResult | { campaignSlug: string }) => {
      if ('error' in result) return // Don't redirect on error

      const slug =
        'campaignSlug' in result
          ? result.campaignSlug
          : fallbackCampaignSlug

      navigate({ campaignSlug: slug })
    },
    [navigate, fallbackCampaignSlug],
  )

  return { redirectAfterJoin, cancel }
}
