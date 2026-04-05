import Link from 'next/link'

export default function DonationGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Donation</span>
        </div>
        <h1 className="text-3xl font-bold text-white">How to Donate to the Campaign</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Support the residency and the collective. Your donation moves the needle.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">Why Donate?</h2>
        <p className="text-zinc-300 text-sm">
          The Bruised Banana Residency is a creative space and community. Donations support the house, the artists, and the collective. Your contribution—whether money or play—helps the residency thrive.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How to Donate</h2>
        <p className="text-zinc-300 text-sm">
          <strong>Event page</strong> — Go to <Link href="/event" className="text-green-400 hover:text-green-300 underline">Support the Residency</Link> and click Donate. <strong>Donate page</strong> — Visit <Link href="/event/donate" className="text-green-400 hover:text-green-300 underline">/event/donate</Link> directly. Payment methods: Venmo, Cash App, PayPal, or Stripe—whichever the instance has configured.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">After Donating</h2>
        <p className="text-zinc-300 text-sm">
          Self-report your donation on the donate page. Vibeulons are minted to your wallet based on the amount
          (per the instance rate). Sign in to complete self-report.
        </p>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/event/donate" className="hover:text-green-400">Donate →</Link>
        <Link href="/event" className="hover:text-zinc-300">Event page</Link>
      </div>
    </div>
  )
}
