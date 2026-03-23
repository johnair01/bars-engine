/**
 * Event Campaign Engine — Kotter context + iCal helpers (GH)
 */

import { KOTTER_STAGES, type KotterStage } from '@/lib/kotter'

// ---------------------------------------------------------------------------
// Kotter context
// ---------------------------------------------------------------------------

export interface EventKotterContext {
  productionGrammar: string
  stage: KotterStage
  stageName: string
  stageEmoji: string
  stageMove: string
  stageTrigram: string
  completedEventCount: number
  totalEventCount: number
  /** Fraction 0–1 for progress display. */
  progress: number
}

export interface EpiphanyBridgeContext {
  productionGrammar: 'epiphany_bridge'
  completedEventCount: number
  totalEventCount: number
  progress: number
  note: string
}

/**
 * Derive the Kotter context for a campaign from its event completion counts.
 * Stage = min(8, completedCount + 1): each completed artifact advances by one.
 */
export function deriveKotterContext(
  completedEventCount: number,
  totalEventCount: number
): EventKotterContext {
  const rawStage = Math.min(8, Math.max(1, completedEventCount + 1)) as KotterStage
  const ks = KOTTER_STAGES[rawStage]
  return {
    productionGrammar: 'kotter',
    stage: rawStage,
    stageName: ks.name,
    stageEmoji: ks.emoji,
    stageMove: ks.move,
    stageTrigram: ks.trigram,
    completedEventCount,
    totalEventCount,
    progress: totalEventCount > 0 ? completedEventCount / totalEventCount : 0,
  }
}

export function deriveEpiphanyBridgeContext(
  completedEventCount: number,
  totalEventCount: number
): EpiphanyBridgeContext {
  return {
    productionGrammar: 'epiphany_bridge',
    completedEventCount,
    totalEventCount,
    progress: totalEventCount > 0 ? completedEventCount / totalEventCount : 0,
    note: 'Epiphany Bridge arc — detailed stage mapping in future spec.',
  }
}

// ---------------------------------------------------------------------------
// iCal / .ics helpers
// ---------------------------------------------------------------------------

/** Format a Date to iCal UTC datetime string: 20260315T180000Z */
export function formatIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Escape iCal text values (commas, semicolons, backslashes). */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/** Fold long iCal lines at 75 chars per RFC 5545. */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let i = 75
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join('\r\n')
}

export interface IcsEventInput {
  uid: string
  summary: string
  description: string
  location: string
  startTime: Date | null
  endTime: Date | null
  createdAt: Date
}

/** Build a complete iCal VCALENDAR string for a single event. */
export function buildIcsContent(event: IcsEventInput): string {
  const now = formatIcsDateTime(new Date())
  const start = event.startTime ? formatIcsDateTime(event.startTime) : now
  const end = event.endTime
    ? formatIcsDateTime(event.endTime)
    : formatIcsDateTime(new Date((event.startTime ?? new Date()).getTime() + 60 * 60 * 1000))

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BARS Engine//Event Artifact//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    foldIcsLine(`UID:${event.uid}@bars-engine`),
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(event.summary)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description)}`),
    foldIcsLine(`LOCATION:${escapeIcsText(event.location)}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
