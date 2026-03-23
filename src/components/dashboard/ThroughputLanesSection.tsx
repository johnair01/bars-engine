import Link from 'next/link'
import { SCENE_ATLAS_DISPLAY_NAME } from '@/lib/creator-scene-grid-deck/branding'

type Props = {
  /** Optional active instance — forwarded as query for future collective I Ching context. */
  activeInstanceId?: string | null
}

export function ThroughputLanesSection({ activeInstanceId }: Props) {
  const ichingHref =
    activeInstanceId != null && activeInstanceId !== ''
      ? `/iching?instanceId=${encodeURIComponent(activeInstanceId)}`
      : '/iching'

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Throughput</p>
          <p className="text-sm text-zinc-400 mt-0.5">
            Personal practice vs collective field — same Charge → answer pattern, different containers.
          </p>
        </div>
        <Link
          href="/play"
          className="text-xs uppercase tracking-widest text-amber-500/90 hover:text-amber-400 shrink-0"
        >
          Try it →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">Personal</p>
          <ul className="text-sm space-y-1.5">
            <li>
              <Link href="/capture" className="text-emerald-200/90 hover:text-emerald-100 underline-offset-2 hover:underline">
                Capture Charge
              </Link>
              <span className="text-zinc-600"> — name the voltage</span>
            </li>
            <li>
              <Link href="/creator-scene-deck" className="text-emerald-200/90 hover:text-emerald-100 underline-offset-2 hover:underline">
                {SCENE_ATLAS_DISPLAY_NAME}
              </Link>
              <span className="text-zinc-600"> — 52-cell private deck</span>
            </li>
            <li>
              <Link href="/hand" className="text-emerald-200/90 hover:text-emerald-100 underline-offset-2 hover:underline">
                Hand / Vault
              </Link>
              <span className="text-zinc-600"> — drafts & quests</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-amber-900/35 bg-amber-950/15 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Collective</p>
          <ul className="text-sm space-y-1.5">
            <li>
              <Link href={ichingHref} className="text-amber-200/90 hover:text-amber-100 underline-offset-2 hover:underline">
                Cast I Ching
              </Link>
              <span className="text-zinc-600"> — reading for the field</span>
            </li>
            <li>
              <Link href="/game-map" className="text-amber-200/90 hover:text-amber-100 underline-offset-2 hover:underline">
                Game map
              </Link>
              <span className="text-zinc-600"> — where we are</span>
            </li>
            <li>
              <Link href="/campaign" className="text-amber-200/90 hover:text-amber-100 underline-offset-2 hover:underline">
                Campaign
              </Link>
              <span className="text-zinc-600"> — shared stakes</span>
            </li>
            <li>
              <Link href="/world" className="text-amber-200/90 hover:text-amber-100 underline-offset-2 hover:underline">
                Enter Lobby
              </Link>
              <span className="text-zinc-600"> — trade BARs in your nation room</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
