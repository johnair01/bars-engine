import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSwapGalleryAccess, listSwapListings } from '@/actions/swap-listing'
import { SwapGalleryClient } from './SwapGalleryClient'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const access = await getSwapGalleryAccess(slug)
  if (!access) return { title: 'Swap gallery' }
  return {
    title: `Gallery · ${access.instanceName}`,
    description: 'Clothing swap listings for this campaign.',
  }
}

export default async function SwapGalleryPage({ params }: Props) {
  const { slug } = await params
  const access = await getSwapGalleryAccess(slug)
  if (!access) notFound()

  if (!access.canViewGallery) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Gallery not available</h1>
          <p className="text-sm text-zinc-500">
            The swap gallery opens after organizers publish campaign intake. Check back soon or contact your host.
          </p>
          <Link href="/event" className="text-sm text-amber-500 hover:text-amber-400">
            ← Events
          </Link>
        </div>
      </div>
    )
  }

  const first = await listSwapListings(slug, 1, { includeHidden: false })
  if (!first.ok) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-300">{first.error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link href="/event" className="text-xs text-zinc-500 hover:text-zinc-300">
              ← Campaign / events
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">Swap gallery</h1>
            <p className="text-sm text-zinc-500 mt-1">{access.instanceName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {access.canCreate ? (
              <Link
                href={`/swap/${slug}/new`}
                className="inline-flex items-center justify-center rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-100 text-sm font-bold px-4 py-2 border border-amber-800"
              >
                List an item
              </Link>
            ) : null}
            <Link
              href={`/swap-orientation/${slug}`}
              className="text-sm text-zinc-500 hover:text-zinc-300 py-2"
            >
              Orientation
            </Link>
          </div>
        </header>

        <SwapGalleryClient
          slug={slug}
          initialListings={first.listings}
          initialHasMore={first.hasMore}
          initialPage={first.page}
          pageSize={first.pageSize}
          canModerate={first.canModerate}
        />
      </div>
    </div>
  )
}
