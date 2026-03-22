/**
 * Persist MicroTwineModule + TwineStory from pre-built Twee source (no MicroTwineConfig wizard).
 * Used by BAR → Quest proposal publish (FM T4.2) and any path that already has Twee text.
 */

import { db } from '@/lib/db'
import { parseTwee, parseTwineHtml, type ParsedTwineStory } from '@/lib/twee-parser'

function escapeXmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function escapePassageBody(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Build Twine 2 HTML artifact compatible with {@link parseTwineHtml} (matches compileMicroTwine shape).
 */
export function buildHtmlArtifactFromParsedTwee(
  parsed: ParsedTwineStory,
  displayTitle: string,
  ifid: string
): string {
  const startPid =
    parsed.passages.find((p) => p.name === parsed.startPassage)?.pid ?? parsed.passages[0]?.pid ?? '1'
  const storyData = `
<tw-storydata name="${escapeXmlAttr(displayTitle)}" startnode="${startPid}" creator="TweePersist" creator-version="1.0.0" ifid="${escapeXmlAttr(ifid)}" format="SugarCube" format-version="2.36.1">
${parsed.passages
  .map(
    (p) =>
      `  <tw-passagedata pid="${escapeXmlAttr(p.pid)}" name="${escapeXmlAttr(p.name)}" tags="" x="0" y="0">${escapePassageBody(p.text)}</tw-passagedata>`
  )
  .join('\n')}
</tw-storydata>`.trim()

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeXmlAttr(displayTitle)}</title></head><body>${storyData}</body></html>`
}

export interface PersistQuestTweeModuleParams {
  questId: string
  creatorId: string
  questTitle: string
  tweeSource: string
  canonicalJson: string
}

/**
 * Upsert MicroTwineModule, compile HTML, link TwineStory on CustomBar (same end state as compileMicroTwine).
 */
export async function persistQuestTweeModule(params: PersistQuestTweeModuleParams): Promise<void> {
  const { questId, creatorId, questTitle, tweeSource, canonicalJson } = params

  const parsed = parseTwee(tweeSource)
  if (parsed.passages.length === 0) {
    throw new Error('persistQuestTweeModule: parseTwee produced no passages')
  }

  const ifid = `${questId}-ifid`
  const htmlArtifact = buildHtmlArtifactFromParsedTwee(parsed, questTitle || `${questId} Narrative`, ifid)
  const parsedStory = parseTwineHtml(htmlArtifact)

  await db.microTwineModule.upsert({
    where: { questId },
    create: {
      questId,
      canonicalJson,
      tweeSource,
      htmlArtifact,
      isDraft: false,
    },
    update: {
      canonicalJson,
      tweeSource,
      htmlArtifact,
      isDraft: false,
      updatedAt: new Date(),
    },
  })

  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: { id: true, title: true, twineStoryId: true, creatorId: true },
  })

  if (!quest) return

  let twineStoryId = quest.twineStoryId

  if (twineStoryId) {
    await db.twineStory.update({
      where: { id: twineStoryId },
      data: {
        sourceText: htmlArtifact,
        parsedJson: JSON.stringify(parsedStory),
      },
    })
  } else {
    const twineStory = await db.twineStory.create({
      data: {
        title: quest.title || `${questId} Narrative`,
        sourceText: htmlArtifact,
        parsedJson: JSON.stringify(parsedStory),
        isPublished: true,
        createdById: creatorId,
      },
    })
    twineStoryId = twineStory.id
    await db.customBar.update({
      where: { id: questId },
      data: { twineStoryId },
    })
  }
}
