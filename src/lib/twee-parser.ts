/**
 * Twine / Twee parsing: Twee 3 source → structure, and Twine 2 HTML → structure.
 */

export interface ParsedLink {
  label: string
  target: string
}

export interface ParsedPassage {
  pid: string
  name: string
  text: string
  cleanText: string
  links: ParsedLink[]
  tags: string[]
}

export interface ParsedTwineStory {
  title: string
  startPassage: string
  passages: ParsedPassage[]
}

function parseWikiLinks(text: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const re = /\[{2,}([\s\S]*?)\]{2,}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const inner = m[1].trim()
    if (inner.includes('->')) {
      const [label, target] = inner.split('->')
      links.push({ label: label.trim(), target: target.trim() })
    } else if (inner.includes('|')) {
      const [label, target] = inner.split('|')
      links.push({ label: label.trim(), target: target.trim() })
    } else {
      links.push({ label: inner, target: inner })
    }
  }
  return links
}

function stripWikiLinks(text: string): string {
  return text.replace(/\[{2,}([\s\S]*?)\]{2,}/g, '').trim()
}

/**
 * Parse a Twee 3 source string into ParsedTwineStory.
 * Handles: :: StoryTitle, :: StoryData, :: PassageName
 */
export function parseTwee(tweeSource: string): ParsedTwineStory {
  const lines = tweeSource.split(/\r?\n/)
  let title = 'Untitled Story'
  let startPassage = 'Start'
  const passages: ParsedPassage[] = []
  const passageMap = new Map<string, ParsedPassage>()

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const passageMatch = line.match(/^::\s+(.+)$/)
    if (passageMatch) {
      const name = passageMatch[1].trim()
      if (name === 'StoryTitle') {
        i++
        const titleLines: string[] = []
        while (i < lines.length && !lines[i].match(/^::\s+/)) {
          titleLines.push(lines[i])
          i++
        }
        title = titleLines.join('\n').trim() || title
        continue
      }
      if (name === 'StoryData') {
        i++
        const dataLines: string[] = []
        while (i < lines.length && !lines[i].match(/^::\s+/)) {
          dataLines.push(lines[i])
          i++
        }
        const dataStr = dataLines.join('\n').trim()
        try {
          const data = JSON.parse(dataStr) as { start?: string }
          if (data.start) startPassage = data.start
        } catch {
          /* ignore */
        }
        continue
      }
      let passageName = name
      let tags: string[] = []
      const bracketMatch = name.match(/^(.+?)\s+\[([^\]]*)\]$/)
      if (bracketMatch) {
        passageName = bracketMatch[1].trim()
        tags = bracketMatch[2].split(/\s+/).filter(Boolean)
      }
      i++
      const contentLines: string[] = []
      while (i < lines.length && !lines[i].match(/^::\s+/)) {
        contentLines.push(lines[i])
        i++
      }
      const rawText = contentLines.join('\n').trim()
      const links = parseWikiLinks(rawText)
      const cleanText = stripWikiLinks(rawText)
      const pid = String(passages.length + 1)
      const passage: ParsedPassage = {
        pid,
        name: passageName,
        text: rawText,
        cleanText,
        links,
        tags,
      }
      passages.push(passage)
      passageMap.set(passageName, passage)
      continue
    }
    i++
  }

  if (!passageMap.has(startPassage) && passages.length > 0) {
    startPassage = passages[0].name
  }

  return { title, startPassage, passages }
}

function decodeEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
}

/**
 * Parse Twine 2 published HTML (tw-storydata / tw-passagedata) into ParsedTwineStory.
 */
export function parseTwineHtml(html: string): ParsedTwineStory {
  const storyMatch = html.match(/<tw-storydata\s[^>]*>/i)
  if (!storyMatch) {
    throw new Error('No <tw-storydata> found. Is this a Twine 2 HTML file?')
  }

  const storyTag = storyMatch[0]
  const titleMatch = storyTag.match(/name="([^"]*)"/)
  const startNodeMatch = storyTag.match(/startnode="([^"]*)"/)

  const title = titleMatch ? decodeEntities(titleMatch[1]) : 'Untitled'
  const startPid = startNodeMatch ? startNodeMatch[1] : '1'

  const passageRegex =
    /<tw-passagedata\s+pid="([^"]*)"\s+name="([^"]*)"(?:\s+tags="([^"]*)")?[^>]*>([\s\S]*?)<\/tw-passagedata>/gi
  const passages: ParsedPassage[] = []
  let pm: RegExpExecArray | null
  while ((pm = passageRegex.exec(html)) !== null) {
    const pid = pm[1]
    const name = decodeEntities(pm[2])
    const tags = pm[3] ? pm[3].split(/\s+/).filter(Boolean) : []
    const rawText = decodeEntities(pm[4].trim())
    const links = parseWikiLinks(rawText)
    const cleanText = stripWikiLinks(rawText)

    passages.push({ pid, name, text: rawText, cleanText, links, tags })
  }

  if (passages.length === 0) {
    throw new Error('No passages found in Twine HTML.')
  }

  const startPassageObj = passages.find((p) => p.pid === startPid)
  const startPassage = startPassageObj ? startPassageObj.name : passages[0].name

  return { title, startPassage, passages }
}
