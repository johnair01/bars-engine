'use client'

import { useEffect, useState } from 'react'

const PODCAST_RSS_URL = 'https://anchor.fm/s/117f3a4cc/podcast/rss'

const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-5 text-sm font-bold text-zinc-100 transition hover:border-amber-500/70 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'

export function PodcastActions({ spotifyUrl }: { spotifyUrl: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2200)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copyRss() {
    try {
      await navigator.clipboard.writeText(PODCAST_RSS_URL)
      setCopied(true)
    } catch {
      window.prompt('Copy the RSS feed:', PODCAST_RSS_URL)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a className={buttonClass} href={spotifyUrl} target="_blank" rel="noreferrer">
        Listen on Spotify
      </a>
      {/* Apple Podcasts and the YouTube playlist stay hidden until their public URLs exist. */}
      <button className={buttonClass} type="button" onClick={copyRss}>
        Copy the RSS feed
      </button>
      <span className="min-w-14 text-sm text-emerald-300" role="status" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  )
}
