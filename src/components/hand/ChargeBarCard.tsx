'use client'

import Link from 'next/link'
import { BarFlipCard } from '@/components/bars/BarFlipCard'

type AssetLike = { id: string; url: string; mimeType?: string | null; metadataJson?: string | null; side?: string | null }

type ChargeBarCardProps = {
  bar: { id: string; title: string; description: string; createdAt: Date; assets?: AssetLike[] }
}

export function ChargeBarCard({ bar }: ChargeBarCardProps) {
  const imageAssets = (bar.assets ?? []).filter((a) => a.mimeType?.startsWith('image/'))
  const hasImages = imageAssets.length > 0

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
      {hasImages ? (
        <div className="shrink-0 w-16 h-16 overflow-hidden rounded-lg">
          <BarFlipCard assets={imageAssets} compact />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{bar.title}</p>
        <p className="text-zinc-500 text-xs mt-0.5">
          {new Date(bar.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="shrink-0 flex gap-2">
        <Link
          href={`/bars/${bar.id}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white transition"
        >
          Turn into Quest →
        </Link>
        <Link
          href={`/capture/explore?barId=${bar.id}`}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white transition"
        >
          Explore →
        </Link>
      </div>
    </div>
  )
}
