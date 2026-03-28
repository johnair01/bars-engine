/**
 * Durable player feedback: `BacklogItem` in Postgres (works on Vercel).
 * Best-effort mirror to `.feedback/cert_feedback.jsonl` when the filesystem is writable (local dev / triage skill).
 */
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '@/lib/db'

export type PlayerFeedbackSource =
  | 'share_your_signal'
  | 'site_signal_nav'
  | 'certification'
  | 'library_spawn'
  | 'manual'

export type PersistPlayerFeedbackInput = {
  source: PlayerFeedbackSource
  playerId: string
  playerName?: string | null
  questId?: string
  passageName?: string
  feedback: string
  context?: Record<string, unknown>
  area?: 'rules' | 'ux' | 'tech' | 'lore' | 'social' | 'other'
  severity?: 'low' | 'medium' | 'high' | 'blocking'
}

function titleForFeedback(source: PlayerFeedbackSource, questId: string | undefined, feedback: string): string {
  const label =
    source === 'share_your_signal'
      ? 'Share Your Signal'
      : source === 'site_signal_nav'
        ? 'Site signal'
        : source === 'certification'
          ? `Cert: ${questId ?? 'quest'}`
          : 'Player feedback'
  const first = feedback.split('\n').find((l) => l.trim().length > 0)?.trim() ?? feedback.trim()
  const snippet = first.length > 100 ? `${first.slice(0, 97)}…` : first
  return `${label}: ${snippet || '(no text)'}`.slice(0, 200)
}

function descriptionBlock(
  input: PersistPlayerFeedbackInput,
  feedback: string
): string {
  const lines = [
    feedback,
    '',
    '---',
    `source: ${input.source}`,
    input.questId ? `questId: ${input.questId}` : null,
    input.passageName ? `passageName: ${input.passageName}` : null,
    input.playerName ? `playerName: ${input.playerName}` : null,
    `playerId: ${input.playerId}`,
  ]
  return lines.filter(Boolean).join('\n')
}

type JsonlEntry = {
  timestamp: string
  playerId: string
  playerName: string
  questId: string
  passageName: string
  feedback: string
  backlogItemId?: string
}

async function appendCertFeedbackJsonlBestEffort(entry: JsonlEntry): Promise<void> {
  try {
    const feedbackDir = path.join(process.cwd(), '.feedback')
    await fs.mkdir(feedbackDir, { recursive: true })
    const feedbackFile = path.join(feedbackDir, 'cert_feedback.jsonl')
    await fs.appendFile(feedbackFile, `${JSON.stringify(entry)}\n`)
  } catch {
    // Expected on serverless (no writable disk); DB row is canonical.
  }
}

/**
 * Creates a `BacklogItem` and mirrors to JSONL when possible.
 * Returns `{ backlogItemId }` on success.
 */
export async function persistPlayerFeedbackToBacklog(
  input: PersistPlayerFeedbackInput
): Promise<{ backlogItemId: string } | { error: string }> {
  const feedback = input.feedback.trim()
  if (!feedback) return { error: 'Empty feedback' }

  const title = titleForFeedback(input.source, input.questId, feedback)
  const description = descriptionBlock(input, feedback)

  try {
    const row = await db.backlogItem.create({
      data: {
        title,
        description,
        severity: input.severity ?? 'medium',
        area: input.area ?? 'ux',
        status: 'new',
        source: input.source,
        submittedByPlayerId: input.playerId,
        contextJson: input.context ? JSON.stringify(input.context) : null,
      },
    })

    await appendCertFeedbackJsonlBestEffort({
      timestamp: new Date().toISOString(),
      playerId: input.playerId,
      playerName: input.playerName ?? 'Unknown',
      questId: input.questId ?? 'player-feedback',
      passageName: input.passageName ?? input.source,
      feedback,
      backlogItemId: row.id,
    })

    return { backlogItemId: row.id }
  } catch (e) {
    console.error('[persistPlayerFeedbackToBacklog]', e)
    return { error: e instanceof Error ? e.message : 'Failed to persist feedback' }
  }
}
