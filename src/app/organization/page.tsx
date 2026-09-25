import type { Metadata } from 'next'

import { OrganizationLanding } from '@/components/organization/OrganizationLanding'
import { MTGOA_ORGANIZATION_STATE } from '@/lib/mtgoa-course/organization-state'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'The Organization | Mastering the Game of Allyship',
  description: 'See the campaigns, current work, and practical ways to help Mastering the Game of Allyship travel.',
  alternates: { canonical: '/organization' },
  openGraph: { title: 'The Organization | Mastering the Game of Allyship', description: 'A campaign map for the work around Mastering the Game of Allyship.', url: '/organization', siteName: 'Mastering the Game of Allyship', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'The Organization | Mastering the Game of Allyship', description: 'See the current campaigns and ways into the work.' },
}

/**
 * @page /organization
 * @entity CAMPAIGN
 * @description Public MTGOA campaign map. Renders reviewed organization state and
 * links to existing action routes; it never exposes CampaignLead/contact data.
 * @permissions public
 * @relationships MTGOA_ORGANIZATION_STATE, /mastering-allyship/show-up, /mastering-allyship/book-tour/help
 * @agentDiscoverable true
 */
export default function OrganizationPage() {
  return <OrganizationLanding state={MTGOA_ORGANIZATION_STATE} />
}
