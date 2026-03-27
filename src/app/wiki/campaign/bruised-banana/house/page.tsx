import Link from 'next/link'

/**
 * @page /wiki/campaign/bruised-banana/house
 * @entity WIKI
 * @description Wiki page - Bruised Banana House coordination instance (operator-facing)
 * @permissions public
 * @relationships documents bruised-banana-house instance with seed command and coordinator memberships
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+campaign, ENERGY:N/A, PERSONAL_THROUGHPUT:organize
 * @example /wiki/campaign/bruised-banana/house
 * @agentDiscoverable true
 */
export default function BruisedBananaHouseWikiPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <Link href="/wiki/campaign/bruised-banana" className="hover:text-zinc-400">
            Bruised Banana
          </Link>
          {' / '}
          <span className="text-zinc-400">House instance</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Bruised Banana House (coordination instance)</h1>
        <p className="text-zinc-400 text-sm">
          Parallel to the fundraiser: skillful organizing for the physical/social house — Wendell, Eddy, JJ, and community.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm text-zinc-300">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">Identifiers</h2>
        <ul className="list-disc list-inside space-y-1 text-zinc-400">
          <li>
            <strong className="text-zinc-300">Slug:</strong>{' '}
            <code className="text-xs text-emerald-400/90">bruised-banana-house</code>
          </li>
          <li>
            <strong className="text-zinc-300">campaignRef:</strong>{' '}
            <code className="text-xs text-emerald-400/90">bruised-banana-house</code>
          </li>
          <li>
            <strong className="text-zinc-300">Linked to:</strong> main residency instance (bruised-banana / bb-bday-001) when present
          </li>
        </ul>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm text-zinc-300">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">Seed</h2>
        <pre className="text-xs bg-black/50 border border-zinc-800 rounded-lg p-3 text-zinc-400 overflow-x-auto">
          npm run seed:bb-house
        </pre>
        <p className="text-zinc-500 text-xs">
          Optional: <code className="text-zinc-400">BB_HOUSE_MEMBER_EMAILS=a@x.com,b@y.com</code> adds coordinator memberships.
        </p>
      </section>

      <p className="text-xs text-zinc-600">
        Full runbook (repo): <code className="text-zinc-500">docs/BRUISED_BANANA_HOUSE_INSTANCE.md</code> · Spec:{' '}
        <code className="text-zinc-500">.specify/specs/bruised-banana-house-instance/</code>
      </p>

      <Link href="/wiki/campaign/bruised-banana" className="inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Back to Bruised Banana campaign
      </Link>
    </div>
  )
}
