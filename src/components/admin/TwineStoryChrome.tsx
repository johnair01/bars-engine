import Link from 'next/link'

type Segment = 'story' | 'ir' | 'stitcher'

type Props = {
  storyId: string
  storyTitle: string
  segment: Segment
}

/**
 * Breadcrumb + quick links for Twine detail / IR / stitcher (Phase E).
 */
export function TwineStoryChrome({ storyId, storyTitle, segment }: Props) {
  return (
    <div className="mb-6 space-y-3">
      <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-1">
        <Link href="/admin" className="hover:text-zinc-300">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/twine" className="hover:text-zinc-300">
          Twine
        </Link>
        <span>/</span>
        <Link href={`/admin/twine/${storyId}`} className="hover:text-zinc-300 truncate max-w-[min(100%,14rem)] font-medium text-zinc-300">
          {storyTitle}
        </Link>
        {segment === 'ir' && (
          <>
            <span>/</span>
            <span className="text-zinc-400">IR</span>
          </>
        )}
        {segment === 'stitcher' && (
          <>
            <span>/</span>
            <span className="text-zinc-400">Stitcher</span>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href={`/admin/twine/${storyId}`}
          className={`rounded-md border px-2.5 py-1.5 transition-colors ${
            segment === 'story'
              ? 'border-slate-500 bg-slate-900/80 text-slate-200'
              : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          Bindings
        </Link>
        <Link
          href={`/admin/twine/${storyId}/ir`}
          className={`rounded-md border px-2.5 py-1.5 transition-colors ${
            segment === 'ir'
              ? 'border-slate-500 bg-slate-900/80 text-slate-200'
              : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          IR
        </Link>
        <Link
          href={`/admin/twine/stitcher?id=${encodeURIComponent(storyId)}`}
          className={`rounded-md border px-2.5 py-1.5 transition-colors ${
            segment === 'stitcher'
              ? 'border-slate-500 bg-slate-900/80 text-slate-200'
              : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          Stitcher
        </Link>
      </div>
    </div>
  )
}
