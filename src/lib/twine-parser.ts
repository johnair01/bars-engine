/**
 * Minimal Twine 2 HTML parser.
 *
 * Extracts <tw-storydata> and <tw-passagedata> nodes from a Twine 2
 * published HTML string and returns a JSON structure the runtime can use.
 */

export interface ParsedLink {
    label: string
    target: string
}

export interface ParsedPassage {
    pid: string
    name: string
    text: string      // raw text (may still contain wiki-link markup)
    cleanText: string  // text with links replaced by labels only
    links: ParsedLink[]
    tags: string[]
}

export interface ParsedTwineStory {
    title: string
    startPassage: string
    passages: ParsedPassage[]
}

/**
 * Parse Twine link syntax:
 *   [[Label->Target]]   or   [[Label|Target]]   or   [[Target]]
 */
function parseLinks(text: string): ParsedLink[] {
    const links: ParsedLink[] = []
    const re = /\[\[([^\]]+)\]\]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
        const inner = m[1]
        // [[Label->Target]]
        if (inner.includes('->')) {
            const [label, target] = inner.split('->')
            links.push({ label: label.trim(), target: target.trim() })
        // [[Label|Target]]
        } else if (inner.includes('|')) {
            const [label, target] = inner.split('|')
            links.push({ label: label.trim(), target: target.trim() })
        // [[Target]] (label == target)
        } else {
            links.push({ label: inner.trim(), target: inner.trim() })
        }
    }
    return links
}

/**
 * Strip wiki-link markup from passage text, leaving only the label.
 */
function stripLinkMarkup(text: string): string {
    return text.replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
        if (inner.includes('->')) return inner.split('->')[0].trim()
        if (inner.includes('|')) return inner.split('|')[0].trim()
        return inner.trim()
    })
}

/**
 * Decode basic HTML entities that Twine encodes in passage text.
 */
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
 * Parse a Twine 2 published HTML string into a structured story.
 *
 * Works by regex-matching the custom elements that Twine 2 emits:
 *   <tw-storydata name="..." startnode="..." ...>
 *     <tw-passagedata pid="..." name="..." tags="...">passage text</tw-passagedata>
 *   </tw-storydata>
 */
export function parseTwineHtml(html: string): ParsedTwineStory {
    // Extract story metadata
    const storyMatch = html.match(/<tw-storydata\s[^>]*>/i)
    if (!storyMatch) {
        throw new Error('No <tw-storydata> found. Is this a Twine 2 HTML file?')
    }

    const storyTag = storyMatch[0]
    const titleMatch = storyTag.match(/name="([^"]*)"/)
    const startNodeMatch = storyTag.match(/startnode="([^"]*)"/)

    const title = titleMatch ? decodeEntities(titleMatch[1]) : 'Untitled'
    const startPid = startNodeMatch ? startNodeMatch[1] : '1'

    // Extract passages
    const passageRegex = /<tw-passagedata\s+pid="([^"]*)"\s+name="([^"]*)"(?:\s+tags="([^"]*)")?[^>]*>([\s\S]*?)<\/tw-passagedata>/gi
    const passages: ParsedPassage[] = []
    let pm: RegExpExecArray | null
    while ((pm = passageRegex.exec(html)) !== null) {
        const pid = pm[1]
        const name = decodeEntities(pm[2])
        const tags = pm[3] ? pm[3].split(/\s+/).filter(Boolean) : []
        const rawText = decodeEntities(pm[4].trim())
        const links = parseLinks(rawText)
        const cleanText = stripLinkMarkup(rawText)

        passages.push({ pid, name, text: rawText, cleanText, links, tags })
    }

    if (passages.length === 0) {
        throw new Error('No passages found in Twine HTML.')
    }

    // Resolve start passage name from pid
    const startPassageObj = passages.find(p => p.pid === startPid)
    const startPassage = startPassageObj ? startPassageObj.name : passages[0].name

    return { title, startPassage, passages }
}
