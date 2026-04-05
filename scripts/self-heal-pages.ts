/**
 * Self-Heal Pages Script
 *
 * Reads an audit report and produces GM Face–based healing recommendations.
 * Uses the canonical 6 Game Master Faces: Shaman, Challenger, Regent, Architect, Diplomat, Sage.
 * Canonical source: this codebase only. Reference: .agent/context/game-master-sects.md, src/lib/quest-grammar/types.ts
 *
 * Usage:
 *   npm run audit:pages -- --output audit-report.json
 *   npm run heal:pages -- audit-report.json
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

type AuditResult = { url: string; status: number; ok: boolean; error?: string }
type AuditReport = {
  baseUrl?: string
  total?: number
  ok?: number
  broken?: number
  errors?: number
  results: AuditResult[]
}

/** Canonical 6 Game Master Faces. Do not add or rename. */
const GM_FACES = {
  Shaman: {
    role: 'Mythic threshold',
    mission: 'Belonging, ritual space, bridge between worlds',
    questions: ['Does this page belong?', 'Is the entity in the right place?', 'Is the slug/ID correct?'],
  },
  Challenger: {
    role: 'Proving ground',
    mission: 'Action, edge, lever',
    questions: ['Is the page actionable?', 'Is there a clear next step?', 'Is the auth boundary clear?'],
  },
  Regent: {
    role: 'Order, structure',
    mission: 'Roles, rules, collective tool',
    questions: ['Is the schema correct?', 'Are roles/permissions correct?', 'Are rules enforced?'],
  },
  Architect: {
    role: 'Blueprint',
    mission: 'Strategy, project, advantage',
    questions: ['Is the query optimized?', 'Are systems coherent?', 'Is the error handled?'],
  },
  Diplomat: {
    role: 'Weave',
    mission: 'Relational field, care, connector',
    questions: ['Who can access?', 'Is the auth flow correct?', 'Is the connection between user and page clear?'],
  },
  Sage: {
    role: 'Whole',
    mission: 'Integration, emergence, flow',
    questions: ['Does the whole cohere?', 'Is the failure traceable?', 'Is lineage preserved?'],
  },
} as const

type FaceKey = keyof typeof GM_FACES

function routeFailure(result: AuditResult): { primary: FaceKey; secondary: FaceKey[]; actions: string[] } {
  const { url, status, error } = result
  const isTimeout = !!error?.toLowerCase().includes('timeout')
  const isConnection = !!error?.toLowerCase().includes('refused') || !!error?.toLowerCase().includes('aborted')

  if (status === 404) {
    return {
      primary: 'Shaman',
      secondary: ['Sage'],
      actions: [
        'Check entity exists in DB; verify slug/ID mapping',
        'Ensure VALID_SLUGS or equivalent includes the slug',
        'Add `if (!entity) notFound()` before render',
      ],
    }
  }

  if (status >= 500) {
    return {
      primary: 'Architect',
      secondary: ['Regent'],
      actions: [
        'Run `npm run db:sync` if schema may have drifted',
        'Wrap data fetch in try/catch; return generic error UI',
        'Ensure error page does not leak stack traces or internal IDs',
      ],
    }
  }

  if (isTimeout || isConnection) {
    return {
      primary: 'Architect',
      secondary: ['Challenger'],
      actions: [
        'Optimize query: add `include`, avoid N+1; add DB index if needed',
        'Add `loading.tsx` or Suspense; show skeleton immediately',
        'Consider moving heavy computation to background or edge',
      ],
    }
  }

  if (status === 307) {
    const isAdmin = url.startsWith('/admin')
    return {
      primary: 'Diplomat',
      secondary: ['Regent'],
      actions: isAdmin
        ? ['307 expected for admin routes when not logged in; document as auth-required']
        : [
            'Confirm auth is required for this route',
            'Consider public fallback or teaser if appropriate',
            'Ensure redirect target is correct (e.g. /login, /conclave)',
          ],
    }
  }

  if (status >= 400 && status < 500) {
    return {
      primary: 'Shaman',
      secondary: ['Architect', 'Challenger'],
      actions: [
        'Verify route param types (slug vs id)',
        'Check auth middleware; ensure correct redirect',
        'Add explicit error boundary or fallback UI',
      ],
    }
  }

  return {
    primary: 'Sage',
    secondary: ['Architect'],
    actions: ['Add logging for this failure', 'Ensure error is traceable in logs'],
  }
}

function pageToFile(path: string): string {
  const clean = path.replace(/^\//, '').replace(/\/$/, '') || 'page'
  const segments = clean.split('/')
  const fileSegments = segments.map((s) => (s.includes('[') ? s : s))
  return `src/app/${fileSegments.join('/')}/page.tsx`
}

function main() {
  const reportPath = process.argv[2] || 'audit-report.json'
  const absPath = join(process.cwd(), reportPath)

  if (!existsSync(absPath)) {
    console.error(`Report not found: ${absPath}`)
    console.error('Run: npm run audit:pages -- --output audit-report.json')
    process.exit(1)
  }

  const raw = readFileSync(absPath, 'utf-8')
  let report: AuditReport
  try {
    report = JSON.parse(raw) as AuditReport
  } catch {
    console.error('Invalid JSON in report')
    process.exit(1)
  }

  const results = report.results ?? []
  const broken = results.filter((r) => r.status >= 400)
  const timeouts = results.filter((r) => r.status === 0 && r.error)
  const needsHealing = [...broken, ...timeouts]
  const redirects = results.filter((r) => r.status === 307)
  const needsReview = redirects

  if (needsHealing.length === 0) {
    console.log('No broken pages or timeouts. Nothing to heal.')
    process.exit(0)
  }

  console.log('=== Self-Healing Report (GM Face Framework) ===\n')
  console.log('Canonical 6 Faces: Shaman, Challenger, Regent, Architect, Diplomat, Sage')
  console.log(`Base URL: ${report.baseUrl ?? 'unknown'}`)
  console.log(`Pages needing healing: ${needsHealing.length}\n`)

  for (const r of needsHealing) {
    const { primary, secondary, actions } = routeFailure(r)
    const statusStr = r.error ? `ERR: ${r.error}` : String(r.status)
    const file = pageToFile(r.url)
    const faceMeta = GM_FACES[primary]

    console.log('────────────────────────────────────────────')
    console.log(`  ${r.url}`)
    console.log(`  Status: ${statusStr}  |  File: ${file}`)
    console.log(`  Primary Face: ${primary} (${faceMeta.role})`)
    console.log(`  Secondary: ${secondary.join(', ')}`)
    console.log('')
    console.log('  Healing actions:')
    for (const a of actions) {
      console.log(`    • ${a}`)
    }
    console.log('')
    console.log(`  ${primary} questions:`)
    for (const q of faceMeta.questions) {
      console.log(`    - ${q}`)
    }
    console.log('')
  }

  if (needsReview.length > 0) {
    console.log('────────────────────────────────────────────')
    console.log('Auth redirects (307) — review if intentional:')
    for (const r of needsReview.slice(0, 10)) {
      console.log(`  ${r.url}`)
    }
    if (needsReview.length > 10) {
      console.log(`  ... and ${needsReview.length - 10} more`)
    }
    console.log('')
  }

  console.log('────────────────────────────────────────────')
  console.log('Next steps:')
  console.log('  1. For each page above, apply healing actions')
  console.log('  2. Re-run: npm run audit:pages')
  console.log('  3. See docs/SELF_HEALING_PAGES.md for full framework')
  console.log('')
}

main()
