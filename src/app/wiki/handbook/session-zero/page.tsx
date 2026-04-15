import Link from 'next/link'
import { HandbookDeepPage } from '@/components/wiki/HandbookDeepPage'

/**
 * @page /wiki/handbook/session-zero
 * @entity WIKI
 * @description Session zero — safety, expectations, table contract for BARS analog play
 * @permissions public
 * @agentDiscoverable true
 */
export default function HandbookSessionZeroPage() {
  return (
    <HandbookDeepPage slug="handbook/session-zero" title="Session zero" breadcrumbLabel="Session zero">
      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          Before you play BARS in person, agree on how you will treat each other. Session zero is the
          conversation where the group names intensity boundaries, how to pause or stop, and what
          &quot;success&quot; looks like for this table.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-zinc-300">Content calibration</strong> — What topics are in-bounds?
            What needs a content warning?
          </li>
          <li>
            <strong className="text-zinc-300">Pause / stop</strong> — A word or gesture anyone can use
            to slow down or end a scene.
          </li>
          <li>
            <strong className="text-zinc-300">Roles</strong> — Who keeps time, who reads prompts, who
            tracks tokens if you use physical vibeulons.
          </li>
        </ul>
        <p>
          Pair this with{' '}
          <Link href="/wiki/emotional-first-aid-guide" className="text-sky-400 hover:text-sky-300 underline">
            Emotional First Aid
          </Link>{' '}
          when anyone is near overwhelm. Stuckness is data — see{' '}
          <Link href="/wiki/handbook" className="text-emerald-400 hover:text-emerald-300 underline">
            the handbook hub
          </Link>
          .
        </p>
      </div>
    </HandbookDeepPage>
  )
}
