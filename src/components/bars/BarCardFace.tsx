'use client'

/**
 * Renders the Face of a BAR card — image + first line teaser.
 * Used in list cards and as the "Face" view in detail.
 */
export function BarCardFace({
  description,
  imageUrl,
  className = '',
}: {
  description: string
  imageUrl?: string | null
  className?: string
}) {
  const firstLine = (description || '').trim().split(/\r?\n/)[0]?.trim() || ''
  return (
    <div className={`rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900/50 min-w-0 ${className}`}>
      {imageUrl && (
        <div className="aspect-[4/3] overflow-hidden">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 min-w-0">
        <p className="font-mono text-sm text-zinc-300 line-clamp-2 break-words">{firstLine || description}</p>
      </div>
    </div>
  )
}
