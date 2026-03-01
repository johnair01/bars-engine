import Link from 'next/link'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'

const DOMAIN_DEFINITIONS: Record<string, { problem: string; when: string }> = {
  GATHERING_RESOURCES: {
    problem: 'Need external (or inner) resources',
    when: 'Preference for external; can be inner (capacity) or outer (money, materials).',
  },
  DIRECT_ACTION: {
    problem: "Action needs doing but people aren't doing it",
    when: 'Remove obstacles toward taking direct action, OR increase capacity via skill development or gathering resources as capacity.',
  },
  RAISE_AWARENESS: {
    problem: "People aren't aware of resources, organization, or actions available",
    when: '"People need to know"; visibility, messaging, discovery.',
  },
  SKILLFUL_ORGANIZING: {
    problem: 'No systems exist to solve the problem; the problem is lack of organization',
    when: '"We need capacity"; creating structures, processes, interfaces.',
  },
}

export default function DomainsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Domains</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Allyship Domains (WHERE)</h1>
        <p className="text-zinc-400 text-sm">
          WHERE the work happens. Each domain maps to an emergent problem.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        {ALLYSHIP_DOMAINS.map((d) => {
          const def = DOMAIN_DEFINITIONS[d.key]
          return (
            <div key={d.key} className="border-b border-zinc-800 last:border-0 pb-4 last:pb-0">
              <h2 id={d.key.toLowerCase()} className="text-lg font-bold text-white mb-1">
                {d.label}
              </h2>
              {def && (
                <>
                  <p className="text-zinc-300 text-sm mb-1">
                    <span className="text-zinc-500">Emergent problem:</span> {def.problem}
                  </p>
                  <p className="text-zinc-500 text-xs">{def.when}</p>
                </>
              )}
            </div>
          )
        })}
      </section>

      <div className="text-xs text-zinc-500">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
      </div>
    </div>
  )
}
