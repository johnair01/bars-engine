/**
 * Parse Google Workspace URLs into a normalized file id + kind.
 */

const DOC_PATH = /\/document\/d\/([a-zA-Z0-9_-]+)/
const SHEET_PATH = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
const DRIVE_FILE_PATH = /\/file\/d\/([a-zA-Z0-9_-]+)/
const OPEN_ID = /[?&]id=([a-zA-Z0-9_-]+)/

export type WorkspaceResourceKind = 'document' | 'spreadsheet' | 'unknown'

export type ParsedWorkspaceUrl = {
  id: string
  kind: WorkspaceResourceKind
  originalUrl: string
}

export function parseGoogleWorkspaceUrl(raw: string): ParsedWorkspaceUrl | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')
  const path = url.pathname

  const docM = path.match(DOC_PATH)
  if (docM) return { id: docM[1], kind: 'document', originalUrl: trimmed }

  const sheetM = path.match(SHEET_PATH)
  if (sheetM) return { id: sheetM[1], kind: 'spreadsheet', originalUrl: trimmed }

  const driveM = path.match(DRIVE_FILE_PATH)
  if (driveM) return { id: driveM[1], kind: 'unknown', originalUrl: trimmed }

  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const idM = trimmed.match(OPEN_ID)
    if (idM) return { id: idM[1], kind: 'unknown', originalUrl: trimmed }
  }

  return null
}

const WORKSPACE_HOST = /docs\.google\.com|drive\.google\.com|spreadsheets\.google\.com/i

export function extractWorkspaceLinksFromText(text: string): string[] {
  const out: string[] = []
  const re = /https?:\/\/[^\s)\]>"']+/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const u = m[0].replace(/[,;.]+$/, '')
    try {
      const parsed = new URL(u)
      if (WORKSPACE_HOST.test(parsed.hostname)) out.push(u)
    } catch {
      /* skip */
    }
  }
  return out
}
