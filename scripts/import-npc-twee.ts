#!/usr/bin/env tsx
/**
 * Import a Twee file as Adventure segments with seam-based splitting.
 *
 * Detects [seam:...] tags on passages and splits the Twee into multiple
 * Adventure rows (segments). Each segment is pure narrative. Seam metadata
 * on terminal passages links segments together.
 *
 * Usage: npx tsx scripts/import-npc-twee.ts
 *
 * Idempotent: deletes and recreates if adventures exist.
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ─── Configuration ──────────────────────────────────────────────────────────

const TWEE_FILE = path.resolve(__dirname, '../docs/examples/cyoa-flow-pyrakanth-clean-up.twee')
const BASE_SLUG = 'ignis-trial'
const CAMPAIGN_REF = 'bruised-banana'

// Default segment slug if no seam splits happen
const DEFAULT_SLUG = 'ignis-trial-descent'
const DEFAULT_TITLE = "Ignis's Trial — The Descent"

// ─── Twee Parser ────────────────────────────────────────────────────────────

interface SeamConfig {
  type: string          // 321_reflection, bar_create, carry_and_return
  npc?: string          // NPC id
  next?: string         // next adventure slug
  move?: string         // move key from library
}

interface TweePassage {
  title: string
  tags: string[]
  text: string
  links: Array<{ text: string; target: string }>
  seam?: SeamConfig
}

function parseSeamTag(tags: string[]): SeamConfig | undefined {
  // Look for seam:... in tags
  const seamTag = tags.find(t => t.startsWith('seam:'))
  if (!seamTag) return undefined

  const config: SeamConfig = { type: seamTag.slice(5) }
  for (const tag of tags) {
    if (tag.startsWith('npc:')) config.npc = tag.slice(4)
    if (tag.startsWith('next:')) config.next = tag.slice(5)
    if (tag.startsWith('move:')) config.move = tag.slice(5)
  }
  return config
}

function parseTwee(content: string): TweePassage[] {
  const passages: TweePassage[] = []
  const parts = content.split(/^:: /m).filter(Boolean)

  for (const part of parts) {
    const lines = part.split('\n')
    const headerLine = lines[0] ?? ''

    // Parse title and optional tags: :: Title [tag1 tag2 key:value]
    const tagMatch = headerLine.match(/^(.+?)\s*\[(.+?)\]\s*$/)
    const title = tagMatch ? tagMatch[1].trim() : headerLine.trim()
    const tags = tagMatch ? tagMatch[2].split(/\s+/) : []

    if (!title) continue

    const bodyLines = lines.slice(1)
    const rawText = bodyLines.join('\n').trim()

    // Extract [[text|target]] links
    const links: Array<{ text: string; target: string }> = []
    const linkRegex = /\[\[([^\]]+)\]\]/g
    let match
    while ((match = linkRegex.exec(rawText)) !== null) {
      const inner = match[1]
      if (inner.includes('|')) {
        const [text, target] = inner.split('|', 2)
        links.push({ text: text.trim(), target: target.trim() })
      } else {
        links.push({ text: inner.trim(), target: inner.trim() })
      }
    }

    // Clean text: separate narrative from link blocks, strip duplicate choice bullets
    const textLines: string[] = []
    let inLinkBlock = false
    for (const line of bodyLines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
        inLinkBlock = true
      } else if (inLinkBlock && trimmed === '') {
        // skip
      } else {
        inLinkBlock = false
        textLines.push(line)
      }
    }

    const choiceTexts = new Set(links.map(l => l.text.toLowerCase().replace(/\s*\(not implemented\)/i, '').trim()))
    const filteredLines = textLines.filter(line => {
      const bulletMatch = line.match(/^\*\s+\*\*(.+?)\*\*/)
      if (bulletMatch && choiceTexts.has(bulletMatch[1].toLowerCase().trim())) return false
      return true
    })

    const cleanText = filteredLines.join('\n')
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '')
      .replace(/\[\[([^\]]+)\]\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    const seam = parseSeamTag(tags)
    passages.push({ title, tags, text: cleanText, links, seam })
  }

  return passages
}

// ─── Segment Splitter ───────────────────────────────────────────────────────

interface Segment {
  slug: string
  title: string
  startNodeId: string
  passages: TweePassage[]
}

function splitIntoSegments(passages: TweePassage[]): Segment[] {
  // Collect all unique seam.next slug values — these define segment boundaries.
  // When we encounter a passage that has a DIFFERENT seam.next than the previous group
  // (or is the first non-seam passage after seam passages), we split.
  const segmentSlugs: string[] = [DEFAULT_SLUG]
  const seen = new Set<string>()
  for (const p of passages) {
    if (p.seam?.next && !seen.has(p.seam.next)) {
      seen.add(p.seam.next)
      segmentSlugs.push(p.seam.next)
    }
  }

  // Build segments: group passages by their seam.next boundary.
  // All passages with the same seam.next (or no seam) belong to the same segment,
  // until we hit a passage whose seam.next differs from the current group's.
  const segments: Segment[] = []
  let currentPassages: TweePassage[] = []
  let currentSeamNext: string | null = null

  for (const passage of passages) {
    const thisSeamNext = passage.seam?.next ?? null

    // Split when: this passage has a different seam.next than the current group,
    // AND the current group already has seam passages with a specific next.
    if (
      currentPassages.length > 0 &&
      currentSeamNext !== null &&
      thisSeamNext !== currentSeamNext
    ) {
      const slug = segmentSlugs[segments.length] ?? `${BASE_SLUG}-${segments.length}`
      segments.push({
        slug,
        title: segments.length === 0 ? DEFAULT_TITLE : `Ignis's Trial — Part ${segments.length + 1}`,
        startNodeId: currentPassages[0].title,
        passages: [...currentPassages],
      })
      currentPassages = []
      currentSeamNext = null
    }

    currentPassages.push(passage)
    if (thisSeamNext) currentSeamNext = thisSeamNext
  }

  // Final segment
  if (currentPassages.length > 0) {
    const slug = segmentSlugs[segments.length] ?? `${BASE_SLUG}-final`
    segments.push({
      slug,
      title: segments.length === 0 ? DEFAULT_TITLE : `Ignis's Trial — The Harvest`,
      startNodeId: currentPassages[0].title,
      passages: currentPassages,
    })
  }

  return segments
}

// ─── Import Logic ───────────────────────────────────────────────────────────

async function main() {
  console.log(`--- Importing Twee with Seam Protocol ---\n`)
  console.log(`  Source: ${path.basename(TWEE_FILE)}`)

  if (!fs.existsSync(TWEE_FILE)) {
    console.error(`File not found: ${TWEE_FILE}`)
    process.exit(1)
  }

  const content = fs.readFileSync(TWEE_FILE, 'utf-8')
  const passages = parseTwee(content)
  console.log(`  Parsed ${passages.length} passages`)

  const seamCount = passages.filter(p => p.seam).length
  console.log(`  Found ${seamCount} seam tags`)

  const segments = splitIntoSegments(passages)
  console.log(`  Split into ${segments.length} segments\n`)

  for (const segment of segments) {
    console.log(`--- Segment: ${segment.slug} (${segment.passages.length} passages) ---`)

    // Upsert Adventure
    let adventure = await prisma.adventure.findUnique({
      where: { slug: segment.slug },
    })

    if (adventure) {
      await prisma.passage.deleteMany({ where: { adventureId: adventure.id } })
      await prisma.adventure.update({
        where: { id: adventure.id },
        data: {
          title: segment.title,
          startNodeId: segment.startNodeId,
          status: 'ACTIVE',
          campaignRef: CAMPAIGN_REF,
        },
      })
      console.log(`  Updated Adventure "${segment.slug}" (${adventure.id})`)
    } else {
      adventure = await prisma.adventure.create({
        data: {
          slug: segment.slug,
          title: segment.title,
          startNodeId: segment.startNodeId,
          status: 'ACTIVE',
          campaignRef: CAMPAIGN_REF,
        },
      })
      console.log(`  Created Adventure "${segment.slug}" (${adventure.id})`)
    }

    // Create Passages
    for (const passage of segment.passages) {
      let choices: Array<{ text: string; targetId: string }> = passage.links.map(l => ({
        text: l.text,
        targetId: l.target,
      }))

      // Build metadata
      let metadata: Record<string, unknown> | undefined

      if (passage.seam) {
        metadata = {
          actionType: 'adventure_seam',
          seamType: passage.seam.type,
          ...(passage.seam.npc ? { npcId: passage.seam.npc } : {}),
          ...(passage.seam.next ? { nextAdventureSlug: passage.seam.next } : {}),
          ...(passage.seam.move ? { moveKey: passage.seam.move } : {}),
          // For within-segment seams, store the next passage nodeId
          ...(choices.length > 0 ? { nextTargetId: choices[0].targetId } : {}),
        }
        // 321_reflection seams navigate to a different adventure segment — strip choices
        // bar_create and carry_and_return seams advance within the same segment — keep choices
        if (passage.seam.type === '321_reflection') {
          choices = []
        }
      }

      // CompleteReflection: carry_and_return
      if (passage.seam?.type === 'carry_and_return') {
        choices = [{ text: 'Return to the clearing', targetId: 'redirect:returnTo' }]
      }

      await prisma.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: passage.title,
          text: passage.text,
          choices: JSON.stringify(choices),
          metadata: metadata ?? undefined,
        },
      })

      const seamLabel = passage.seam ? ` [seam:${passage.seam.type}]` : ''
      console.log(`  ✅ ${passage.title}${seamLabel} (${choices.length} choices)`)
    }
    console.log()
  }

  // Summary
  console.log(`✅ Imported ${segments.length} segments:`)
  for (const seg of segments) {
    const adv = await prisma.adventure.findUnique({ where: { slug: seg.slug }, select: { id: true } })
    console.log(`   ${seg.slug} (${adv?.id}) — ${seg.passages.length} passages`)
  }
  console.log(`\n   Play segment 1: /adventure/<id>/play`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
