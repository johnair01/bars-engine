/**
 * Choice targetIds handled in CampaignReader without a Passage row fetch.
 * @see src/app/campaign/components/CampaignReader.tsx handleChoice
 */
export const CAMPAIGN_READER_SPECIAL_TARGETS = new Set(['signup', 'Game_Login'])

export function isCampaignReaderSpecialTarget(targetId: string): boolean {
  return CAMPAIGN_READER_SPECIAL_TARGETS.has(targetId.trim())
}
