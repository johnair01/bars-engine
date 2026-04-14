import Link from 'next/link'
import { BbDonationDemoWizard } from '@/components/demo/BbDonationDemoWizard'

/**
 * @page /demo/bruised-banana
 * @entity CAMPAIGN
 * @description Public **donation demo ritual** — charge + 3→2→1 (browser session only, not server-persisted) + links to donate & wiki.
 * @permissions public
 * @relationships WIKI (campaign), EVENT (donation wizard handoff)
 * @agentDiscoverable false
 */
export default function BruisedBananaDonationDemoPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link href="/wiki/campaign/bruised-banana" className="text-sm text-zinc-500 hover:text-white transition">
            ← Bruised Banana (wiki)
          </Link>
          <Link
            href="/event/donate/wizard?ref=bruised-banana"
            className="text-sm text-emerald-500/90 hover:text-emerald-400 transition"
          >
            Donate →
          </Link>
        </div>
        <BbDonationDemoWizard />
      </div>
    </div>
  )
}
