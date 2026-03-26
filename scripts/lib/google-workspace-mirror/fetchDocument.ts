import type { docs_v1 } from 'googleapis'
import { extractWorkspaceLinksFromText } from './urls'

export type FetchedDocument = {
  title: string
  markdownBody: string
  links: string[]
}

function walkParagraph(p: unknown, linkSet: Set<string>, lineParts: string[]): void {
  if (!p || typeof p !== 'object') return
  const para = p as Record<string, unknown>
  const elements = para.elements
  if (!Array.isArray(elements)) return
  for (const el of elements) {
    if (!el || typeof el !== 'object') continue
    const er = el as Record<string, unknown>
    const tr = er.textRun as Record<string, unknown> | undefined
    if (tr?.content != null) lineParts.push(String(tr.content))
    const ts = tr?.textStyle as Record<string, unknown> | undefined
    const link = ts?.link as Record<string, unknown> | undefined
    if (link?.url) linkSet.add(String(link.url))
  }
}

function walkTable(t: unknown, linkSet: Set<string>, lines: string[]): void {
  if (!t || typeof t !== 'object') return
  const table = t as Record<string, unknown>
  const rows = table.tableRows
  if (!Array.isArray(rows)) return
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const cells = r.tableCells
    if (!Array.isArray(cells)) continue
    const cellTexts: string[] = []
    for (const cell of cells) {
      if (!cell || typeof cell !== 'object') continue
      const c = cell as Record<string, unknown>
      const content = c.content
      if (!Array.isArray(content)) continue
      const cellLines: string[] = []
      for (const se of content) walkStructuralElement(se, linkSet, cellLines)
      cellTexts.push(cellLines.join(' ').replace(/\s+/g, ' ').trim())
    }
    if (cellTexts.length) lines.push('| ' + cellTexts.join(' | ') + ' |')
  }
}

function walkStructuralElement(el: unknown, linkSet: Set<string>, lines: string[]): void {
  if (!el || typeof el !== 'object') return
  const e = el as Record<string, unknown>
  if (e.paragraph) {
    const parts: string[] = []
    walkParagraph(e.paragraph, linkSet, parts)
    const line = parts.join('')
    if (line.trim()) lines.push(line.replace(/\n/g, ' ').trimEnd())
  }
  if (e.table) {
    lines.push('')
    walkTable(e.table, linkSet, lines)
    lines.push('')
  }
}

export function documentToMarkdown(doc: docs_v1.Schema$Document): FetchedDocument {
  const linkSet = new Set<string>()
  const lines: string[] = []
  const body = doc.body as Record<string, unknown> | undefined | null
  const content = body?.content
  if (Array.isArray(content)) {
    for (const se of content) walkStructuralElement(se, linkSet, lines)
  }

  const title = doc.title?.trim() || 'Untitled document'
  const rawText = lines.join('\n')
  for (const u of extractWorkspaceLinksFromText(rawText)) linkSet.add(u)

  const markdownBody = rawText.trim()
  return {
    title,
    markdownBody,
    links: [...linkSet],
  }
}
