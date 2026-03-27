import Link from 'next/link'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { DOMAIN_ESSENCE, STAGE_PHRASINGS_WARM } from '@/lib/domain-context'
import { KOTTER_STAGES } from '@/lib/kotter'
import type { AllyshipDomain } from '@/lib/kotter'

/**
 * @page /wiki/domains
 * @entity WIKI
 * @description Wiki page - Allyship Domains (WHERE) - four domains with Kotter stage invitation phrasings
 * @permissions public
 * @relationships documents GATHERING_RESOURCES, SKILLFUL_ORGANIZING, RAISE_AWARENESS, DIRECT_ACTION domains with Kotter stage mappings
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+domains, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /wiki/domains
 * @agentDiscoverable true
 */
const DOMAIN_DEFINITIONS: Record<string, { problem: string; when: string }> = {
  GATHERING_RESOURCES: {
    problem: 'Time, attention, skills, and presence—that which allows life to unfold',
    when:
      'Gathering is relational: inviting participation, weaving community support, fostering belonging. Resources can be money, materials, time, attention, skills, presence.',
  },
  SKILLFUL_ORGANIZING: {
    problem: 'Building capacity for the whole',
    when:
      'Creating systems, processes, interfaces that solve what is emergent. The work is relational—inviting co-design, sharing ownership, making the invisible visible.',
  },
  RAISE_AWARENESS: {
    problem: 'Helping people see what is possible',
    when:
      'Visibility, messaging, discovery. People are not yet aware of resources, organization, or actions available. The work is relational—making the invisible visible, inviting people to discover.',
  },
  DIRECT_ACTION: {
    problem: 'Doing—and enabling others to do',
    when:
      'Removing obstacles, increasing capacity, taking the next step. The work is relational—acting together, aligning efforts, moving as one.',
  },
}

export default function DomainsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Domains</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Allyship Domains (WHERE)</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          WHERE the work happens. Each domain maps to an emergent problem. The more context a domain
          has, the more paths to effective action are inside of it.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-6">
        {ALLYSHIP_DOMAINS.map((d) => {
          const def = DOMAIN_DEFINITIONS[d.key]
          const essence = DOMAIN_ESSENCE[d.key as AllyshipDomain]
          const stages = STAGE_PHRASINGS_WARM[d.key as AllyshipDomain]
          return (
            <div key={d.key} className="border-b border-zinc-800 last:border-0 pb-6 last:pb-0">
              <h2 id={d.key.toLowerCase()} className="text-lg font-bold text-white mb-2">
                {d.label}
              </h2>
              {def && (
                <div className="text-zinc-300 text-sm mb-3">
                  <p className="mb-1">
                    <span className="text-zinc-500">Essence:</span> {def.problem}
                  </p>
                  <p className="text-zinc-500 text-xs">{def.when}</p>
                </div>
              )}
              {essence && (
                <p className="text-zinc-400 text-xs italic mb-3">{essence}</p>
              )}
              {stages && (
                <div className="mt-3">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
                    Kotter stages (invitation style)
                  </h3>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((stage) => {
                      const stageInfo = KOTTER_STAGES[stage]
                      const phrase = stages[stage]
                      if (!phrase) return null
                      return (
                        <li key={stage}>
                          <span className="text-zinc-500">
                            {stageInfo?.emoji} Stage {stage}:
                          </span>{' '}
                          {phrase}
                        </li>
                      )
                    })}
                  </ul>
                </div>
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
