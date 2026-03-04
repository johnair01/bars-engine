/**
 * Twee (Twee 3) format parser for Twine stories.
 * Produces a structure compatible with twine-parser's ParsedTwineStory.
 */

import type { ParsedLink, ParsedPassage, ParsedTwineStory } from './twine-parser'

/**
 * Parse Twine link syntax: [[Label->Target]] or [[Label|Target]] or [[Target]]
 */
function parseLinks(text: string): ParsedLink[] {
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

/**
 * Strip wiki-link markup from passage text, leaving only the label.
 */
function stripLinkMarkup(text: string): string {
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
            // Regular passage
            i++
            const contentLines: string[] = []
            while (i < lines.length && !lines[i].match(/^::\s+/)) {
                contentLines.push(lines[i])
                i++
            }
            const rawText = contentLines.join('\n').trim()
            const links = parseLinks(rawText)
            const cleanText = stripLinkMarkup(rawText)
            const pid = String(passages.length + 1)
            const passage: ParsedPassage = {
                pid,
                name,
                text: rawText,
                cleanText,
                links,
                tags: []
            }
            passages.push(passage)
            passageMap.set(name, passage)
            continue
        }
        i++
    }

    // Ensure start passage exists
    if (!passageMap.has(startPassage) && passages.length > 0) {
        startPassage = passages[0].name
    }

    return { title, startPassage, passages }
}
