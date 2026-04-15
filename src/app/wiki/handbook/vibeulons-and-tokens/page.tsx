import Link from 'next/link'
import { HandbookDeepPage } from '@/components/wiki/HandbookDeepPage'

/**
 * @page /wiki/handbook/vibeulons-and-tokens
 * @entity WIKI
 * @description Vibeulons and physical tokens at the table
 * @permissions public
 * @agentDiscoverable true
 */
export default function HandbookVibeulonsPage() {
  return (
    <HandbookDeepPage
      slug="handbook/vibeulons-and-tokens"
      title="Vibeulons and tokens"
      breadcrumbLabel="Vibeulons and tokens"
    >
      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          <strong className="text-zinc-300">Vibeulons</strong> are the game&apos;s energy currency — see the{' '}
          <Link href="/wiki/glossary" className="text-emerald-400 hover:text-emerald-300">glossary</Link>.
          At a physical table, use poker chips, glass stones, or printed counters so players can see
          surplus and spend without opening a phone.
        </p>
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 pt-2">House rules</h2>
        <p>
          Your table decides when vibeulons are earned (completing a BAR, showing up, supporting
          another player&apos;s quest). Write the rule on an index card and keep it in the center of
          the table — same spirit as instance + campaign lore merging in the long-term product.
        </p>
      </div>
    </HandbookDeepPage>
  )
}
