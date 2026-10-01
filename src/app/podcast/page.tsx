import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EpisodeFeature } from '@/components/podcast/EpisodeFeature'
import { OnYourShowSection } from '@/components/podcast/OnYourShowSection'
import { PodcastActions } from '@/components/podcast/PodcastActions'
import { PodcastGuestForm } from '@/components/podcast/PodcastGuestForm'
import {
  SPOTIFY_SHOW_URL,
  formatEpisodeDate,
  getEpisodeTranscript,
  getPodcastEpisodes,
} from '@/lib/podcast'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Mastering the Game of Allyship — The podcast',
  description:
    'Conversations about showing up for other people, and about what gets in the way. Listen to the podcast, come on the show, or book Wendell for yours.',
  openGraph: {
    title: 'Mastering the Game of Allyship — The podcast',
    description: 'Conversations about showing up for other people, and about what gets in the way.',
    images: ['https://masteringallyship.com/mtgoa-podcast-show-art-3000.jpg'],
  },
}

/**
 * @page /podcast
 * @entity CAMPAIGN
 * @description The Mastering the Game of Allyship podcast: feed-driven episodes, guest intake,
 *   and booking details for other podcast hosts.
 * @permissions public
 * @relationships RSS feed, /speaking, /mastering-allyship, content/podcast/episodes.json
 * @dimensions WHO:listener, WHAT:practice, WHERE:podcast, ENERGY:invite
 * @example /podcast
 * @agentDiscoverable true
 */
export default async function PodcastPage() {
  const episodes = await getPodcastEpisodes()
  const latest = episodes[0] ?? null
  const transcript = latest ? await getEpisodeTranscript(latest) : []

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>The podcast</span>
        </nav>

        <header className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-14">
          <Image
            src="/mtgoa-podcast-show-art-3000.jpg"
            alt="Mastering the Game of Allyship podcast cover art"
            width={3000}
            height={3000}
            sizes="(max-width: 1024px) calc(100vw - 2rem), 420px"
            priority
            className="aspect-square w-full rounded-3xl border border-zinc-800 object-cover shadow-2xl shadow-black/50"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
              Mastering the Game of Allyship · The podcast
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] text-white sm:text-5xl">
              Conversations about showing up for other people.
            </h1>
            <div className="mt-6 space-y-4 text-base leading-7 text-zinc-300">
              <p>
                Mastering the Game of Allyship is a podcast about showing up for other people,
                and about what gets in the way. I talk with friends, practitioners, and people who
                work inside organizations about allyship as something you practice rather than a
                label you claim.
              </p>
              <p>
                Some episodes stay with the big questions, like what allyship is at its core.
                Others get practical: caring for aging parents, being an ally to men, and what
                happens when an organization tries to put allyship to work. Every conversation is
                recorded in one take, unscripted.
              </p>
            </div>
            <div className="mt-7">
              <PodcastActions spotifyUrl={SPOTIFY_SHOW_URL} />
            </div>
            <p className="mt-5 text-sm text-zinc-400">
              Host a show?{' '}
              <a href="#on-your-show" className="text-amber-200 underline underline-offset-4">
                Here&apos;s how to book me.
              </a>
            </p>
          </div>
        </header>

        <section className="mt-20 border-t border-zinc-800 pt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">Latest episode</p>
          {latest ? (
            <div className="mt-5">
              <EpisodeFeature episode={latest} transcript={transcript} />
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-6">
              <h2 className="text-2xl font-bold text-white">The feed is taking a minute.</h2>
              <p className="mt-3 text-zinc-400">
                Listen on Spotify now; episodes will appear here as soon as the feed is available.
              </p>
            </div>
          )}
        </section>

        <section className="mt-20 border-t border-zinc-800 pt-16" aria-labelledby="all-episodes">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">The archive</p>
          <h2 id="all-episodes" className="mt-3 text-3xl font-bold text-white">All episodes</h2>
          {episodes.length > 1 ? (
            <div className="mt-7 divide-y divide-zinc-800 border-y border-zinc-800">
              {episodes.slice(1).map((episode) => (
                <Link
                  key={episode.slug}
                  href={`/podcast/${episode.slug}`}
                  className="group grid gap-3 py-6 transition sm:grid-cols-[9rem_1fr_auto] sm:items-start"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">
                    Episode {episode.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-200">{episode.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{episode.excerpt}</p>
                  </div>
                  <div className="text-sm text-zinc-500 sm:text-right">
                    <span className="block">{formatEpisodeDate(episode.publishedAt)}</span>
                    {episode.duration ? <span className="mt-1 block">{episode.duration}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-zinc-400">More conversations will appear here as they&apos;re published.</p>
          )}
        </section>

        <section id="be-a-guest" className="mt-20 scroll-mt-24 border-t border-zinc-800 pt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">Be a guest</p>
          <h2 className="mt-3 text-4xl font-bold text-white">Come on the show.</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-zinc-300">
            <p>
              I&apos;m looking for people who practice this, not people who have the right opinions
              about it. That includes people inside organizations who can tell me where allyship
              breaks down in their building, and people helping someone they love through
              something hard.
            </p>
            <p>
              Tell me who you are and what you&apos;d want to talk about. I read every one, and if
              it&apos;s a fit I&apos;ll send you a link to book a recording time. If it isn&apos;t, I&apos;ll tell
              you that too.
            </p>
          </div>
          <div className="mt-8">
            <PodcastGuestForm />
          </div>
        </section>

        <div className="mt-20">
          <OnYourShowSection />
        </div>
      </div>
    </main>
  )
}
