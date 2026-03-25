import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSwapGalleryAccess } from '@/actions/swap-listing'
import { SwapNewListingForm } from './SwapNewListingForm'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const access = await getSwapGalleryAccess(slug)
  if (!access) return { title: 'New listing' }
  return {
    title: `List an item · ${access.instanceName}`,
    description: 'Create a clothing swap listing with photos and metadata.',
  }
}

export default async function SwapNewListingPage({ params }: Props) {
  const { slug } = await params
  const access = await getSwapGalleryAccess(slug)
  if (!access) notFound()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link href={`/swap/${slug}/gallery`} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Gallery
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">New swap listing</h1>
          <p className="text-sm text-zinc-500 mt-1">{access.instanceName}</p>
        </div>

        {!access.canCreate ? (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            {!access.published
              ? 'Listings open after organizers publish intake (or ask a host to add you as co-host for rehearsal).'
              : 'You need membership on this swap campaign to list items.'}
          </div>
        ) : (
          <SwapNewListingForm slug={slug} />
        )}
      </div>
    </div>
  )
}
