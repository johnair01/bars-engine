'use client'

import { useCallback, useState } from 'react'
import { listSwapListings, moderateSwapListing, type SwapListingSummary } from '@/actions/swap-listing'

export function SwapGalleryClient({
  slug,
  initialListings,
  initialHasMore,
  initialPage,
  pageSize,
  canModerate,
}: {
  slug: string
  initialListings: SwapListingSummary[]
  initialHasMore: boolean
  initialPage: number
  pageSize: number
  canModerate: boolean
}) {
  const [listings, setListings] = useState(initialListings)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [includeHidden, setIncludeHidden] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (nextPage: number, hidden: boolean) => {
      setLoading(true)
      setError(null)
      const res = await listSwapListings(slug, nextPage, { includeHidden: hidden })
      setLoading(false)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setListings(res.listings)
      setHasMore(res.hasMore)
      setPage(res.page)
    },
    [slug]
  )

  async function onToggleHidden() {
    if (!canModerate) return
    const next = !includeHidden
    setIncludeHidden(next)
    await loadPage(1, next)
  }

  async function loadMore() {
    if (!hasMore || loading) return
    setLoading(true)
    setError(null)
    const res = await listSwapListings(slug, page + 1, { includeHidden })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setListings((prev) => [...prev, ...res.listings])
    setHasMore(res.hasMore)
    setPage(res.page)
  }

  async function onModerate(barId: string, action: 'hide' | 'unhide' | 'archive') {
    setError(null)
    const res = await moderateSwapListing(slug, barId, action)
    if (!res.ok) {
      setError(res.error)
      return
    }
    await loadPage(page, includeHidden)
  }

  return (
    <div className="space-y-8">
      {canModerate && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={onToggleHidden}
              className="rounded border-zinc-600"
            />
            Show hidden listings
          </label>
        </div>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {listings.length === 0 ? (
        <p className="text-zinc-500 text-sm">No listings yet. Be the first to list an item.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl border overflow-hidden flex flex-col ${
                item.swapListingHidden ? 'border-amber-900/50 bg-amber-950/10' : 'border-zinc-800 bg-zinc-950/40'
              }`}
            >
              <div className="aspect-square bg-zinc-900 relative">
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No photo</div>
                )}
                {item.swapListingHidden ? (
                  <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-amber-900/80 text-amber-100 px-2 py-0.5 rounded">
                    Hidden
                  </span>
                ) : null}
              </div>
              <div className="p-4 flex flex-col flex-1 gap-2">
                <h2 className="font-semibold text-white text-sm line-clamp-2">{item.title}</h2>
                <p className="text-xs text-zinc-500 line-clamp-3">{item.description}</p>
                <div className="text-[10px] text-zinc-600 space-y-0.5 mt-auto">
                  {[item.brand, item.size, item.condition].filter(Boolean).join(' · ') || '—'}
                </div>
                <p className="text-[10px] text-zinc-600">Listed by {item.creatorName ?? 'player'}</p>
                {canModerate ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                    {item.swapListingHidden ? (
                      <button
                        type="button"
                        onClick={() => onModerate(item.id, 'unhide')}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Unhide
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onModerate(item.id, 'hide')}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        Hide
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onModerate(item.id, 'archive')}
                      className="text-xs text-red-400/90 hover:text-red-300"
                    >
                      Archive
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <button
          type="button"
          disabled={loading}
          onClick={loadMore}
          className="w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-300 text-sm py-2 px-4 hover:bg-zinc-900 disabled:opacity-40"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      ) : null}

      <p className="text-[10px] text-zinc-600">
        Showing {listings.length} listing{listings.length === 1 ? '' : 's'} per page (up to {pageSize} per load).
      </p>
    </div>
  )
}
