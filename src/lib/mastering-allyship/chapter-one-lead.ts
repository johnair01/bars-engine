export const CHAPTER_ONE_LEAD_SOURCE = 'mastering-allyship-chapter-1'
export const CHAPTER_ONE_READ_HREF = '/mastering-allyship/chapter-1/read'
export const CHAPTER_ONE_PDF_HREF = '/chapter-one.pdf'
export const CHAPTER_ONE_DESIGN_HANDOFF_PATH =
  'docs/handoffs/2026-07-13-chapter-one-lead-magnet-design-handoff.md'

export const CHAPTER_ONE_LEAD_TITLE = 'Chapter 1: The Call to Play'
export const CHAPTER_ONE_LEAD_PROMISE =
  'Start the book for free and discover why allyship is a learnable practice, not a fixed identity.'

export type ChapterOneLeadRow = {
  id: string
  email: string
  name: string | null
  source: string
  createdAt: Date
}

function csvCell(value: string | null | undefined): string {
  const raw = value ?? ''
  return `"${raw.replace(/"/g, '""')}"`
}

export function chapterOneLeadsToCsv(rows: ChapterOneLeadRow[]): string {
  const header = ['created_at', 'email', 'name', 'source', 'id'].map(csvCell).join(',')
  const body = rows.map((row) =>
    [
      row.createdAt.toISOString(),
      row.email,
      row.name,
      row.source,
      row.id,
    ].map(csvCell).join(','),
  )
  return [header, ...body].join('\n')
}
