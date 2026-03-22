'use client'

import { CampaignReader } from '@/app/campaign/components/CampaignReader'
import type { ResolvedDemoOrientationLink } from '@/lib/demo-orientation/resolve'
import Link from 'next/link'

export function DemoOrientationClient({ config }: { config: ResolvedDemoOrientationLink }) {
  const initialNode = { id: config.startNodeId, text: '', choices: [] as { text: string; targetId: string }[] }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
      <div className="w-full max-w-2xl space-y-4 mb-2">
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90">
          <strong>Preview</strong> — Explore this orientation without an account. Sign up below when you&apos;re ready
          to save progress.
          {config.label ? ` · ${config.label}` : null}
        </div>
        <div className="flex flex-wrap gap-3 justify-end text-xs">
          <Link href="/event/donate" className="text-green-400 hover:text-green-300">
            Support the campaign →
          </Link>
          <Link href="/wiki/donation-guide" className="text-zinc-500 hover:text-zinc-300">
            How donations work
          </Link>
        </div>
      </div>
      <CampaignReader
        initialNode={initialNode}
        adventureSlug={config.adventureSlug}
        campaignRef={config.campaignRef ?? undefined}
        demoHandoff={{
          maxSteps: config.maxSteps,
          endNodeId: config.endNodeId,
          demoToken: config.token,
          campaignRef: config.campaignRef,
          inviteId: config.inviteId,
        }}
      />
    </div>
  )
}
