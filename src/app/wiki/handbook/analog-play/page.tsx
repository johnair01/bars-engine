import Link from 'next/link'
import { HandbookDeepPage } from '@/components/wiki/HandbookDeepPage'

/**
 * @page /wiki/handbook/analog-play
 * @entity WIKI
 * @description Analog play — table setup, prompts, and example flows for offline BARS
 * @permissions public
 * @agentDiscoverable true
 */
export default function HandbookAnalogPlayPage() {
  return (
    <HandbookDeepPage slug="handbook/analog-play" title="Analog play" breadcrumbLabel="Analog play">
      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          A session can move Wake Up → Clean Up → Grow Up → Show Up without opening the app. Keep
          the loop visible: write charges where everyone can see them, or pass a single notebook.
        </p>
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 pt-2">Example opening</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>One minute of silence or breath — mark transition into play.</li>
          <li>Each player names one <strong className="text-zinc-300">charge</strong> (Wake Up) on a card.</li>
          <li>Choose one charge for a <strong className="text-zinc-300">Clean Up</strong> pass (321 or paired listening).</li>
          <li>End with one <strong className="text-zinc-300">Show Up</strong> action someone will do before next meet.</li>
        </ol>
        <p>
          Pick a <Link href="/wiki/cultivation-sifu" className="text-violet-400 hover:text-violet-300">Cultivation Sifu</Link> tone
          as flavor for facilitation — the six faces match how you hold the table (precision, friction, law, beauty, myth, integration).
        </p>
      </div>
    </HandbookDeepPage>
  )
}
