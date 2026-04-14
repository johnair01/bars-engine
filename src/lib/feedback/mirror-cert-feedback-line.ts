/**
 * Durable mirror of cert / site-signal / Share Your Signal JSONL lines.
 * When `BLOB_READ_WRITE_TOKEN` is set (Vercel), writes one private JSON object per event.
 * Otherwise appends to `.feedback/cert_feedback.jsonl` (local dev / triage).
 * @see .specify/specs/cert-feedback-blob-persistence/spec.md (CFB)
 */
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { put } from '@vercel/blob'

export type CertFeedbackJsonlLine = {
  timestamp: string
  playerId: string
  playerName: string
  questId: string
  passageName: string
  feedback: string
  backlogItemId?: string
}

const PREFIX = 'cert-feedback/events'

/**
 * Best-effort: never throws. Logs Blob failures and falls back to JSONL when possible.
 */
export async function mirrorCertFeedbackLine(entry: CertFeedbackJsonlLine): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    try {
      const day = entry.timestamp.slice(0, 10) || new Date().toISOString().slice(0, 10)
      const pathname = `${PREFIX}/${day}/${randomUUID()}.json`
      await put(pathname, JSON.stringify(entry), {
        access: 'private',
        contentType: 'application/json',
      })
      return
    } catch (e) {
      console.error('[mirrorCertFeedbackLine] Blob upload failed, falling back to JSONL:', e)
    }
  }

  try {
    const feedbackDir = path.join(process.cwd(), '.feedback')
    await fs.mkdir(feedbackDir, { recursive: true })
    const feedbackFile = path.join(feedbackDir, 'cert_feedback.jsonl')
    await fs.appendFile(feedbackFile, `${JSON.stringify(entry)}\n`)
  } catch (e) {
    console.error('[mirrorCertFeedbackLine] JSONL append failed:', e)
  }
}
