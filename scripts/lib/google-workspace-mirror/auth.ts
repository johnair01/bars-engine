/**
 * Auth for Google Docs / Sheets / Drive read-only mirror script.
 */

import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

export const MIRROR_SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
]

export async function getMirrorAuth(): Promise<InstanceType<typeof google.auth.JWT> | InstanceType<typeof google.auth.OAuth2Client>> {
  const keyPath = process.env.GOOGLE_WORKSPACE_MIRROR_CREDENTIALS?.trim()
  if (keyPath) {
    const resolved = path.resolve(process.cwd(), keyPath)
    if (!fs.existsSync(resolved)) {
      throw new Error(`GOOGLE_WORKSPACE_MIRROR_CREDENTIALS file not found: ${resolved}`)
    }
    const auth = new google.auth.GoogleAuth({
      keyFile: resolved,
      scopes: MIRROR_SCOPES,
    })
    const client = await auth.getClient()
    return client as InstanceType<typeof google.auth.JWT>
  }

  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  const rt = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()
  if (cid && cs && rt) {
    const oauth2 = new google.auth.OAuth2(cid, cs)
    oauth2.setCredentials({ refresh_token: rt })
    return oauth2
  }

  throw new Error(
    'Missing Google credentials. Set either:\n' +
      '  GOOGLE_WORKSPACE_MIRROR_CREDENTIALS=/path/to/service-account.json\n' +
      'or OAuth:\n' +
      '  GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN\n' +
      '(all read-only scopes: documents, spreadsheets, drive).'
  )
}
