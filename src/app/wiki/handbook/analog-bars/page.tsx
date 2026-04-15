import Link from 'next/link'
import { HandbookDeepPage } from '@/components/wiki/HandbookDeepPage'

/**
 * @page /wiki/handbook/analog-bars
 * @entity WIKI
 * @description Analog BARs — capturing and tracking Brave Acts of Resistance without the app
 * @permissions public
 * @agentDiscoverable true
 */
export default function HandbookAnalogBarsPage() {
  return (
    <HandbookDeepPage slug="handbook/analog-bars" title="Analog BARs" breadcrumbLabel="Analog BARs">
      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          A <strong className="text-zinc-300">BAR</strong> (Brave Act of Resistance) is the unit of
          charge and completion in BARS Engine. Away from the app, you can still play honestly: one
          card (or slip of paper) per open loop — front: what is alive; back: next physical step.
        </p>
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 pt-2">Minimal kit</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Blank index cards or a poker deck (see also <Link href="/wiki/grid-deck" className="text-amber-400 hover:text-amber-300">Scene Atlas</Link>).</li>
          <li>A pen, a single die when you want randomness without phones.</li>
          <li>Physical tokens for <Link href="/wiki/glossary#vibeulon" className="text-emerald-400 hover:text-emerald-300">vibeulons</Link> if you use them.</li>
        </ul>
        <p>
          The four moves still apply: Wake Up (name the charge), Clean Up (metabolize — e.g.{' '}
          <Link href="/wiki/321-shadow-process" className="text-sky-400 hover:text-sky-300">321</Link>
          ), Grow Up (quest learning), Show Up (real-world action).
        </p>
      </div>
    </HandbookDeepPage>
  )
}
