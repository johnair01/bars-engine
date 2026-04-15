import Link from 'next/link'
import { HandbookDeepPage } from '@/components/wiki/HandbookDeepPage'

/**
 * @page /wiki/handbook/safety
 * @entity WIKI
 * @description Safety tools — calibration, opt-in intensity, escalation paths
 * @permissions public
 * @agentDiscoverable true
 */
export default function HandbookSafetyPage() {
  return (
    <HandbookDeepPage slug="handbook/safety" title="Safety and facilitation" breadcrumbLabel="Safety">
      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          BARS asks players to work with real charge. Use safety tools common to story games:
          lines &amp; veils, open door, script change, and a culture where stopping is success.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-zinc-300">Lines &amp; veils</strong> — Hard no topics vs. soft / fade-to-black topics.
          </li>
          <li>
            <strong className="text-zinc-300">Open door</strong> — Anyone can leave the room; the fiction will not punish them.
          </li>
          <li>
            <strong className="text-zinc-300">Check-ins</strong> — Short thumbs or 1–5 after heavy scenes.
          </li>
        </ul>
        <p>
          If someone is flooded, move to{' '}
          <Link href="/emotional-first-aid" className="text-sky-400 hover:text-sky-300">Emotional First Aid</Link>
          {' '}or pause the game. Roadblock Quests exist because stuckness is meaningful — not because
          people should stay stuck alone.
        </p>
      </div>
    </HandbookDeepPage>
  )
}
