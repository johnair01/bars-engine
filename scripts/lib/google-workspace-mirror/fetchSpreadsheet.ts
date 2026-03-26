import type { sheets_v4 } from 'googleapis'

export type FetchedSpreadsheet = {
  title: string
  markdownBody: string
  links: string[]
}

function valuesToMarkdownTable(rows: string[][]): string {
  if (rows.length === 0) return '_(empty sheet)_'
  const width = Math.max(...rows.map((r) => r.length))
  const pad = (r: string[], i: number) => (r[i] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
  const header = Array.from({ length: width }, (_, i) => pad(rows[0], i))
  const sep = Array.from({ length: width }, () => '---')
  const out = ['| ' + header.join(' | ') + ' |', '| ' + sep.join(' | ') + ' |']
  for (let r = 1; r < rows.length; r++) {
    const row = Array.from({ length: width }, (_, i) => pad(rows[r], i))
    out.push('| ' + row.join(' | ') + ' |')
  }
  return out.join('\n')
}

export async function fetchSpreadsheetAsMarkdown(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<FetchedSpreadsheet> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const props = meta.data.properties
  const title = props?.title?.trim() || 'Untitled spreadsheet'
  const sheetTabs = meta.data.sheets ?? []
  const chunks: string[] = [`# ${title}`, '', `**Spreadsheet ID:** \`${spreadsheetId}\``, '']

  for (const sh of sheetTabs) {
    const st = sh.properties?.title ?? 'Sheet'
    const escaped = `'${st.replace(/'/g, "''")}'`
    const range = `${escaped}!A1:ZZ5000`
    let rows: string[][] = []
    try {
      const v = await sheets.spreadsheets.values.get({ spreadsheetId, range })
      rows = (v.data.values as string[][]) ?? []
    } catch {
      chunks.push(`## ${st}`, '', '_(could not read range — check permissions)_', '')
      continue
    }
    chunks.push(`## ${st}`, '', valuesToMarkdownTable(rows), '')
  }

  const markdownBody = chunks.join('\n').trim()
  const links: string[] = []
  const urlRe = /https?:\/\/[^\s)\]>"']+/gi
  let m: RegExpExecArray | null
  while ((m = urlRe.exec(markdownBody)) !== null) {
    links.push(m[0].replace(/[,;.]+$/, ''))
  }
  return { title, markdownBody, links }
}
