/**
 * @route GET /api/campaign/[ref]/export
 * @description Steward-only CSV export of the ally board — every lead, every
 *   claimed task, and every offer to the collective, in one flat sheet that opens
 *   in Excel, Numbers, or Google Sheets. Each row carries a `dashboard_url` back
 *   to the live board, so the spreadsheet is a snapshot that always knows where
 *   the truth lives.
 * @permissions steward (same guard as the leads board)
 *
 * One sheet rather than three, deliberately: an SMB-scale campaign is easier to
 * sort and filter in a single table than to reconcile across tabs. `row_type`
 * distinguishes lead / task / offer.
 */
import { NextResponse } from 'next/server'
import { allyBoard } from '@/actions/ally-campaign'
import { PARENT_REF } from '@/lib/ally-campaign/board'
import { getDomainLabel } from '@/lib/allyship-domains'

export const dynamic = 'force-dynamic'

/**
 * RFC 4180 escaping. Everything is quoted rather than conditionally quoted —
 * simpler to reason about, and immune to a name containing a comma, a newline
 * pasted into `notes`, or a quote character in someone's own words.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

function row(values: unknown[]): string {
  return values.map(cell).join(',')
}

const HEADERS = [
  'row_type',
  'id',
  'name',
  'contact',
  'workstream',
  'domain',
  'superpower',
  'orientation',
  'status',
  'unit',
  'value',
  'bounty_vibeulons',
  'needs_help',
  'detail',
  'created_at',
  'dashboard_url',
]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params
  if (ref !== PARENT_REF) {
    return NextResponse.json({ error: 'Unknown campaign.' }, { status: 404 })
  }

  const res = await allyBoard()
  if (!res.ok) {
    // 403 rather than a redirect: this is an API surface, and a spreadsheet tool
    // following a redirect to a login page produces a very confusing CSV.
    return NextResponse.json({ error: res.error }, { status: 403 })
  }
  const { board } = res

  const origin = new URL(request.url).origin
  const dashboard = `${origin}/campaign/${PARENT_REF}/allies`

  const lines: string[] = [row(HEADERS)]

  for (const lead of board.leads) {
    lines.push(
      row([
        'lead',
        lead.id,
        lead.name ?? '',
        lead.contact ?? '',
        lead.workstream ?? '',
        getDomainLabel(lead.domain),
        lead.superpower ?? '',
        lead.orientation ?? '',
        lead.status,
        'vibeulons',
        lead.vibeulonsEarned,
        '',
        '',
        lead.notes ?? '',
        lead.createdAt,
        `${dashboard}#lead-${lead.id}`,
      ]),
    )
  }

  for (const need of board.needs) {
    lines.push(
      row([
        'task',
        need.id,
        need.claimantName ?? '',
        '',
        need.workstream,
        getDomainLabel(need.domain),
        need.superpower,
        need.orientation,
        need.status,
        need.unit,
        need.value,
        need.bountyVibeulons,
        need.needsHelp ? 'yes' : '',
        need.title,
        '',
        `${dashboard}#need-${need.id}`,
      ]),
    )
  }

  for (const offer of board.offers) {
    lines.push(
      row([
        'offer',
        offer.id,
        offer.leadName ?? '',
        '',
        '',
        getDomainLabel(offer.domain),
        '',
        '',
        offer.status,
        offer.unit,
        offer.value,
        '',
        '',
        offer.body,
        offer.createdAt,
        `${dashboard}#offer-${offer.id}`,
      ]),
    )
  }

  // Leading BOM so Excel opens UTF-8 correctly on a double-click.
  const csv = `﻿${lines.join('\r\n')}\r\n`
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ally-board-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
