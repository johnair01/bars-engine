import Link from 'next/link'
import { listCampaignSeeds, createCampaignSeed, promoteCampaignBarToInstance } from '@/actions/campaign-bar'
import { CampaignSeedCreateForm } from './CampaignSeedCreateForm'
import { CampaignSeedList } from './CampaignSeedList'

export default async function AdminCampaignSeedsPage() {
  const seeds = await listCampaignSeeds()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">Campaign Seeds</h1>
        <p className="text-zinc-500">
          Create and water BARs into playable campaigns. Six faces = six watering steps.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Create campaign seed</h2>
        <CampaignSeedCreateForm />
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Campaign seeds</h2>
        <CampaignSeedList seeds={seeds} />
      </section>
    </div>
  )
}
