import type { drive_v3 } from 'googleapis'

const MIME_DOC = 'application/vnd.google-apps.document'
const MIME_SHEET = 'application/vnd.google-apps.spreadsheet'

export type ResolvedDriveFile = {
  id: string
  name: string
  mimeType: string
  webViewLink?: string | null
  kind: 'document' | 'spreadsheet' | 'other'
}

export async function resolveDriveFile(
  drive: drive_v3.Drive,
  fileId: string
): Promise<ResolvedDriveFile> {
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,webViewLink',
    supportsAllDrives: true,
  })
  const f = res.data
  const mimeType = f.mimeType ?? ''
  let kind: ResolvedDriveFile['kind'] = 'other'
  if (mimeType === MIME_DOC) kind = 'document'
  else if (mimeType === MIME_SHEET) kind = 'spreadsheet'
  return {
    id: f.id ?? fileId,
    name: f.name ?? 'Untitled',
    mimeType,
    webViewLink: f.webViewLink,
    kind,
  }
}
