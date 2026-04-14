import Link from 'next/link'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import { listStewardInstances } from '@/actions/campaign-crud'
import { CampaignCreateWizard } from './CampaignCreateWizard'

export const metadata = {
  title: 'Create Campaign — Admin',
}

export default async function CampaignCreatePage() {
  const instances = await listStewardInstances()

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Create Campaign"
        description="Launch a new campaign under an existing instance"
        action={
          <Link
            href="/admin/campaigns/review"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
          >
            Review queue
          </Link>
        }
      />

      <CampaignCreateWizard instances={instances} />
    </div>
  )
}
