import { cache } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import episodeExtrasJson from '../../content/podcast/episodes.json'

export const PODCAST_RSS_URL = 'https://anchor.fm/s/117f3a4cc/podcast/rss'
export const SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/3fYJkEl5A0PGDmIbuKRDse'

type EpisodeExtra = {
  youtubeId?: string
  transcript?: string
}

const episodeExtras = episodeExtrasJson as Record<string, EpisodeExtra>

export type PodcastEpisode = {
  number: number
  slug: string
  title: string
  publishedAt: string
  duration: string | null
  notes: string
  excerpt: string
  audioUrl: string | null
  spotifyUrl: string
  spotifyEmbedUrl: string | null
  youtubeId: string | null
  transcriptPath: string | null
}

export type TranscriptParagraph = {
  speaker: string | null
  text: string
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10
      const digits = radix === 16 ? code.slice(2) : code.slice(1)
      const point = Number.parseInt(digits, radix)
      return Number.isFinite(point) ? String.fromCodePoint(point) : entity
    }
    return named[code.toLowerCase()] ?? entity
  })
}

function unwrap(value: string): string {
  return value.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim()
}

function tag(block: string, name: string): string | null {
  const escaped = name.replace(':', '\\:')
  const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'))
  return match ? decodeEntities(unwrap(match[1])) : null
}

function attribute(block: string, tagName: string, attributeName: string): string | null {
  const match = block.match(new RegExp(`<${tagName}\\b[^>]*\\b${attributeName}="([^"]+)"[^>]*>`, 'i'))
  return match ? decodeEntities(match[1]) : null
}

function notesFromHtml(html: string): string {
  return decodeEntities(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/([a-z0-9”'])\.([A-Z])/g, '$1. $2')
    .replace(/Timestamps\s*(?=\d)/i, '\n\nTimestamps\n')
    .replace(/Links:\s*/i, '\n\nLinks\n')
    .replace(/(MasteringAllyship\.com)(?=[A-Z])/g, '$1\n')
    .replace(/(@[A-Za-z0-9_-]+)(?=[A-Z][a-z]+['’]s)/g, '$1\n')
    .replace(/([^\n])(\d{1,2}:\d{2}(?::\d{2})?\s+)/g, '$1\n$2')
    .replace(/([^\n])(https?:\/\/)/g, '$1\n$2')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function firstTwoSentences(text: string): string {
  const prose = text.split(/\n\s*(?:Timestamps|Links)\b/i)[0].replace(/\s+/g, ' ').trim()
  const sentences = prose.match(/[^.!?]+[.!?]+(?:[”'\"])?/g)
  if (!sentences?.length) return prose
  return sentences.slice(0, 2).map((sentence) => sentence.trim()).join(' ')
}

function episodeNumber(block: string, title: string, index: number): number {
  const feedNumber = Number.parseInt(tag(block, 'itunes:episode') ?? '', 10)
  if (Number.isFinite(feedNumber)) return feedNumber
  const titleNumber = title.match(/\bepisode\s+(\d+)\b/i)
  return titleNumber ? Number.parseInt(titleNumber[1], 10) : index + 1
}

function spotifyEmbedUrl(link: string): string | null {
  const match = link.match(/pod\/show\/([^/]+)\/episodes\/([^/?#]+)/)
  if (!match) return null
  return `https://podcasters.spotify.com/pod/show/${match[1]}/embed/episodes/${match[2]}`
}

export function parsePodcastFeed(xml: string): PodcastEpisode[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  const episodes = items.map((match, index) => {
    const block = match[1]
    const title = tag(block, 'title') ?? `Episode ${index + 1}`
    const number = episodeNumber(block, title, index)
    const description = tag(block, 'description') ?? tag(block, 'itunes:summary') ?? ''
    const notes = notesFromHtml(description)
    const spotifyUrl = tag(block, 'link') ?? SPOTIFY_SHOW_URL
    const extra = episodeExtras[String(number)] ?? {}

    return {
      number,
      slug: `episode-${number}`,
      title,
      publishedAt: tag(block, 'pubDate') ?? '',
      duration: tag(block, 'itunes:duration'),
      notes,
      excerpt: firstTwoSentences(notes),
      audioUrl: attribute(block, 'enclosure', 'url'),
      spotifyUrl,
      spotifyEmbedUrl: spotifyEmbedUrl(spotifyUrl),
      youtubeId: extra.youtubeId?.trim() || null,
      transcriptPath: extra.transcript?.trim() || null,
    } satisfies PodcastEpisode
  })

  return episodes.sort((a, b) => {
    const dateDifference = Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
    return Number.isNaN(dateDifference) ? b.number - a.number : dateDifference
  })
}

export const getPodcastEpisodes = cache(async (): Promise<PodcastEpisode[]> => {
  try {
    const response = await fetch(PODCAST_RSS_URL, { next: { revalidate: 3600 } })
    if (!response.ok) throw new Error(`RSS request returned ${response.status}`)
    return parsePodcastFeed(await response.text())
  } catch (error) {
    console.error('[podcast] could not load RSS feed', error)
    return []
  }
})

function cleanCueText(value: string): { speaker: string | null; text: string } {
  const voice = value.match(/^<v(?:\.[^ >]+)?\s+([^>]+)>([\s\S]*)$/i)
  if (voice) {
    return {
      speaker: decodeEntities(voice[1].trim()),
      text: decodeEntities(voice[2].replace(/<[^>]+>/g, '').trim()),
    }
  }
  const plain = value.replace(/<[^>]+>/g, '').trim()
  const named = plain.match(/^([^:\n]{1,60}):\s+([\s\S]+)$/)
  return named
    ? { speaker: decodeEntities(named[1].trim()), text: decodeEntities(named[2].trim()) }
    : { speaker: null, text: decodeEntities(plain) }
}

export function parseVtt(vtt: string): TranscriptParagraph[] {
  const paragraphs: TranscriptParagraph[] = []
  const blocks = vtt.replace(/^\uFEFF/, '').split(/\r?\n\r?\n+/)

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (!lines.length || lines[0] === 'WEBVTT' || lines[0].startsWith('NOTE')) continue
    const timingIndex = lines.findIndex((line) => line.includes('-->'))
    if (timingIndex < 0) continue
    const cue = cleanCueText(lines.slice(timingIndex + 1).join(' '))
    if (!cue.text) continue
    const previous = paragraphs.at(-1)
    if (previous && previous.speaker === cue.speaker) previous.text += ` ${cue.text}`
    else paragraphs.push(cue)
  }

  return paragraphs
}

export async function getEpisodeTranscript(episode: PodcastEpisode): Promise<TranscriptParagraph[]> {
  if (!episode.transcriptPath) return []
  const relative = path.normalize(episode.transcriptPath).replace(/^([/\\])+/, '')
  if (!relative.startsWith(`content${path.sep}podcast${path.sep}transcripts${path.sep}`)) {
    console.error('[podcast] transcript path must live in content/podcast/transcripts', relative)
    return []
  }
  try {
    return parseVtt(await readFile(path.join(process.cwd(), relative), 'utf8'))
  } catch (error) {
    console.error('[podcast] could not read transcript', { relative, error })
    return []
  }
}

export function formatEpisodeDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
