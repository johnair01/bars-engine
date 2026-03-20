/**
 * Append-only daemon evolution log (JSON array on Daemon.evolutionLog).
 * Spec: .specify/specs/individuation-engine/spec.md
 */

import { db } from '@/lib/db'

export type DaemonEvolutionEntry = {
  date: string
  event: string
  channelBefore: string | null
  channelAfter: string | null
  altitudeBefore: string | null
  altitudeAfter: string | null
  questId?: string
  sessionId?: string
  source?: string
}

export async function appendDaemonEvolutionLog(
  daemonId: string,
  entry: Omit<DaemonEvolutionEntry, 'date'> & { date?: string }
): Promise<void> {
  const daemon = await db.daemon.findUnique({
    where: { id: daemonId },
    select: { evolutionLog: true },
  })
  if (!daemon) return

  let log: DaemonEvolutionEntry[] = []
  try {
    const parsed = JSON.parse(daemon.evolutionLog || '[]') as unknown
    log = Array.isArray(parsed) ? (parsed as DaemonEvolutionEntry[]) : []
  } catch {
    log = []
  }

  log.push({
    ...entry,
    date: entry.date ?? new Date().toISOString(),
  })

  await db.daemon.update({
    where: { id: daemonId },
    data: { evolutionLog: JSON.stringify(log) },
  })
}
