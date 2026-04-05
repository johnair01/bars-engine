import Link from 'next/link'

/**
 * @page /wiki/hidden/grill-master
 * @entity WIKI
 * @description Easter egg - The Grill Master - a role that emerged at the last party
 * @permissions public (hidden, no nav link)
 * @agentDiscoverable false
 */
export default function GrillMasterPage() {
  return (
    <div className="max-w-xl mx-auto py-16 space-y-10 text-zinc-400">
      <header className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-mono">
          unlisted role
        </p>
        <h1 className="text-2xl font-bold text-zinc-300">The Grill Master</h1>
        <p className="text-xs text-zinc-600 italic">
          &quot;Not listed in the handbook. Not elected. Simply... emerged.&quot;
        </p>
      </header>

      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          At the last gathering, someone stood at the grill and did not move.
          They did not facilitate. They did not quest. They held the spatula
          and they <em>held the space</em>.
        </p>
        <p className="text-zinc-500">
          People came to the grill not for food but for proximity to someone
          who was fully committed to one thing. The Grill Master asked no
          questions and gave no advice. They flipped burgers at the exact
          right moment. They knew when the coals were ready before anyone
          checked the thermometer.
        </p>
        <p className="text-zinc-500">
          This is a Show Up move of the highest order. No quest card needed.
          No BAR captured. Just a person, a fire, and absolute presence.
        </p>

        <div className="border border-amber-900/30 bg-amber-950/10 rounded-lg p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-mono">
            Field notes
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            The Grill Master role cannot be assigned. It is recognized after the fact.
            If you think you are the Grill Master, you are not the Grill Master.
            The Grill Master does not know they are the Grill Master until someone
            brings them a drink without being asked.
          </p>
        </div>
      </div>

      <div className="text-xs text-zinc-600 flex gap-4 flex-wrap pt-4 border-t border-zinc-800/40">
        <Link href="/wiki/domains" className="hover:text-zinc-400 transition">
          Domains
        </Link>
        <Link href="/campaign" className="hover:text-zinc-400 transition">
          Campaign
        </Link>
        <Link href="/wiki/handbook" className="hover:text-zinc-400 transition">
          Player Handbook
        </Link>
      </div>
    </div>
  )
}
