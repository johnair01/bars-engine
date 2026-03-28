import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'

type Props = {
  /** Passed to wizard `?ref=` (DSW / COC Phase G). */
  campaignRef?: string
  /** Instance `donationButtonLabel` when set. */
  donateLabel?: string | null
  /** Link to `/wiki/donation-guide` (secondary control). */
  showGivingGuide?: boolean
  className?: string
}

/**
 * Persistent **support** strip: primary **Donate** (wizard) + optional **How giving works**.
 * COC Phase F / G — reuse on campaign surfaces to avoid one-off styling drift.
 */
export function CampaignDonateCta({
  campaignRef,
  donateLabel,
  showGivingGuide = true,
  className = '',
}: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <CampaignDonateButton campaignRef={campaignRef}>
        {donateLabel?.trim() ? donateLabel.trim() : 'Donate'}
      </CampaignDonateButton>
      {showGivingGuide ? (
        <CampaignOutlineNavButton href="/wiki/donation-guide">How giving works</CampaignOutlineNavButton>
      ) : null}
    </div>
  )
}
