import type { PodcastEpisode, TranscriptParagraph } from '@/lib/podcast'
import { formatEpisodeDate } from '@/lib/podcast'

export function EpisodeFeature({
  episode,
  transcript,
  headingLevel = 'h2',
}: {
  episode: PodcastEpisode
  transcript: TranscriptParagraph[]
  headingLevel?: 'h1' | 'h2'
}) {
  const Heading = headingLevel

  return (
    <article className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
          Episode {episode.number} · {formatEpisodeDate(episode.publishedAt)}
          {episode.duration ? ` · ${episode.duration}` : ''}
        </p>
        <Heading className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {episode.title}
        </Heading>
      </header>

      {episode.spotifyEmbedUrl ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black/40">
          <iframe
            src={episode.spotifyEmbedUrl}
            title={`Listen to ${episode.title} on Spotify`}
            width="100%"
            height="180"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      ) : episode.audioUrl ? (
        <audio className="w-full" controls preload="metadata" src={episode.audioUrl}>
          <a href={episode.audioUrl}>Listen to the episode</a>
        </audio>
      ) : null}

      {episode.youtubeId ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${episode.youtubeId}`}
            title={`Watch ${episode.title} on YouTube`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : null}

      <section aria-labelledby={`episode-${episode.number}-notes`}>
        <h3 id={`episode-${episode.number}-notes`} className="text-xl font-bold text-white">
          Show notes
        </h3>
        <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-zinc-300">
          {episode.notes || 'Show notes are coming soon.'}
        </div>
      </section>

      {transcript.length ? (
        <details className="group rounded-2xl border border-zinc-800 bg-black/25 p-5">
          <summary className="cursor-pointer font-bold text-amber-200 marker:text-zinc-500">
            Read the transcript
          </summary>
          <div className="mt-6 space-y-5 border-t border-zinc-800 pt-6 text-[15px] leading-7 text-zinc-300">
            {transcript.map((paragraph, index) => (
              <p key={`${paragraph.speaker ?? 'speaker'}-${index}`}>
                {paragraph.speaker ? <strong className="text-white">{paragraph.speaker}: </strong> : null}
                {paragraph.text}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  )
}
