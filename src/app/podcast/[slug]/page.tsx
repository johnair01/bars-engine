import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EpisodeFeature } from '@/components/podcast/EpisodeFeature'
import { getEpisodeTranscript, getPodcastEpisodes } from '@/lib/podcast'

export const revalidate = 3600

type EpisodePageProps = {
  params: Promise<{ slug: string }>
}

async function episodeForSlug(slug: string) {
  const episodes = await getPodcastEpisodes()
  return episodes.find((episode) => episode.slug === slug) ?? null
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const { slug } = await params
  const episode = await episodeForSlug(slug)
  if (!episode) return { title: 'Podcast episode' }
  return {
    title: `${episode.title} — Mastering the Game of Allyship`,
    description: episode.excerpt,
    openGraph: { images: ['https://masteringallyship.com/mtgoa-podcast-show-art-3000.jpg'] },
  }
}

/**
 * @page /podcast/:slug
 * @entity CAMPAIGN
 * @description A feed-driven podcast episode with players, show notes, and an optional transcript.
 * @permissions public
 * @relationships /podcast, RSS feed, content/podcast/episodes.json
 * @dimensions WHO:listener, WHAT:episode, WHERE:podcast, ENERGY:practice
 * @example /podcast/episode-1
 * @agentDiscoverable true
 */
export default async function PodcastEpisodePage({ params }: EpisodePageProps) {
  const { slug } = await params
  const episode = await episodeForSlug(slug)
  if (!episode) notFound()
  const transcript = await getEpisodeTranscript(episode)

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-10 text-xs text-zinc-500">
          <Link href="/podcast" className="hover:text-zinc-300">The podcast</Link>
          <span aria-hidden="true"> / </span>
          <span>Episode {episode.number}</span>
        </nav>
        <EpisodeFeature episode={episode} transcript={transcript} headingLevel="h1" />
        <Link
          href="/podcast"
          className="mt-12 inline-block text-sm font-bold text-amber-200 underline underline-offset-4"
        >
          ← Back to all episodes
        </Link>
      </div>
    </main>
  )
}
