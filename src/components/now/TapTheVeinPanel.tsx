import Link from 'next/link'
import type { TtvPanelSummary } from '@/actions/tap-the-vein'

/**
 * TapTheVeinPanel — NOW-hub daily-ritual card (design handoff §13–§15).
 *
 * Sibling of DailyChargePanel in size + rhythm, but carries the purple/liminal
 * accent (Daily Charge owns earth-gold). Three states: not_started / in_progress
 * / sealed. Read-only summary — viewing NOW never starts the ritual.
 */

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'
const purpleGlow = 'var(--bars-liminal-glow)'

function SectionLabel({ status, sealedAt }: { status: TtvPanelSummary['status']; sealedAt: string | null }) {
  const right =
    status === 'sealed'
      ? `sealed${sealedAt ? ` · ${formatTime(sealedAt)}` : ''}`
      : status === 'in_progress'
        ? 'in progress'
        : 'not started'
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 11 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: purple }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: purple, boxShadow: `0 0 6px 1px ${purpleGlow}`, display: 'inline-block' }} />
        Tap the Vein
      </span>
      <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>{right}</span>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const cardShell = (glow: boolean): React.CSSProperties => ({
  borderRadius: 10,
  background: 'var(--bars-surface-card)',
  boxShadow: glow
    ? `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${purple} 55%, transparent), 0 6px 24px -10px ${purpleGlow}`
    : `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)`,
})

const CHARGE_TONE: Record<string, string> = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#4ade80',
}

/**
 * Today's commitments, reachable from the dashboard.
 *
 * Player signal: "There should also be a way to access your daily tasks from the
 * dashboard" — the panel counted tasks but never showed them, so the work was
 * always one navigation away. Blocked ones sort first: a blocker you can't see
 * is a blocker you don't clear.
 */
function TaskList({
  tasks,
  blocked,
}: {
  tasks: TtvPanelSummary['openTasks']
  blocked: number
}) {
  if (tasks.length === 0) return null
  const ordered = [...tasks].sort((a, b) => Number(b.blocked) - Number(a.blocked))

  return (
    <div style={{ marginTop: 12 }}>
      {blocked > 0 && (
        <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171', margin: '0 0 6px' }}>
          {blocked} blocked
        </p>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {ordered.map((t) => {
          const tone = t.chargeLevel ? CHARGE_TONE[t.chargeLevel] : null
          const row = (
            <span className="flex items-baseline gap-2" style={{ minHeight: 32, padding: '5px 0' }}>
              <span
                aria-hidden
                style={{
                  flex: 'none',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: t.blocked ? '#f87171' : tone ?? 'var(--bars-line-strong)',
                  transform: 'translateY(-1px)',
                }}
              />
              <span
                className="truncate"
                style={{
                  fontFamily: body,
                  fontSize: 12.5,
                  lineHeight: 1.4,
                  color: t.blocked ? '#fca5a5' : 'var(--bars-text-secondary)',
                }}
              >
                {t.text}
              </span>
            </span>
          )
          return (
            <li key={t.id}>
              {t.href ? (
                <Link href={t.href} className="block" style={{ textDecoration: 'none' }}>
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function TapTheVeinPanel({ summary }: { summary: TtvPanelSummary }) {
  return (
    <section>
      <SectionLabel status={summary.status} sealedAt={summary.sealedAt} />

      {summary.status === 'not_started' && (
        <div style={cardShell(true)}>
          <div style={{ padding: '16px 16px 15px' }}>
            <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--bars-text-primary)', margin: 0 }}>
              Tap the morning vein
            </h3>
            <p style={{ fontFamily: body, fontSize: 12, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '4px 0 0' }}>
              Free-write the morning charge, then commit up to 5 tasks.
            </p>
            <Link
              href="/tap-the-vein"
              className="flex items-center justify-center gap-2"
              style={{ marginTop: 14, minHeight: 48, borderRadius: 8, background: purple, color: '#fff', fontFamily: display, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 6px 18px -8px ${purpleGlow}` }}
            >
              Begin the ritual →
            </Link>
          </div>
        </div>
      )}

      {summary.status === 'in_progress' && (
        <div style={cardShell(true)}>
          <div style={{ padding: '16px 16px 15px' }}>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: display, fontWeight: 800, fontSize: 30, lineHeight: 1, color: 'var(--bars-text-primary)' }}>{summary.setForToday}</span>
                <span style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-secondary)' }}>
                  task{summary.setForToday === 1 ? '' : 's'} committed
                </span>
              </div>
              {summary.carried > 0 && (
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-wood-gem)' }}>
                  · {summary.carried} carried
                </span>
              )}
            </div>

            <div className="flex gap-1.5" style={{ marginTop: 12 }} aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{ flex: 1, height: 5, borderRadius: 9999, background: i < Math.min(summary.setForToday, 5) ? purple : 'var(--bars-line)' }}
                />
              ))}
            </div>

            <TaskList tasks={summary.openTasks} blocked={summary.blocked} />

            <Link
              href="/tap-the-vein"
              className="flex items-center justify-center gap-2"
              style={{ marginTop: 14, minHeight: 48, borderRadius: 8, background: 'transparent', color: purple, fontFamily: display, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${purple} 60%, transparent)` }}
            >
              Continue the ritual →
            </Link>
          </div>
        </div>
      )}

      {summary.status === 'sealed' && (
        <div style={cardShell(true)}>
          <div style={{ padding: '15px 16px' }}>
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center rounded-full flex-none"
                style={{ width: 40, height: 40, color: purple, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${purple} 60%, transparent)`, fontSize: 16 }}
                aria-hidden
              >
                ✓
              </span>
              <div className="min-w-0">
                <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: 'var(--bars-text-primary)', margin: 0 }}>The vein is tapped.</h3>
                <p style={{ fontFamily: body, fontSize: 11.5, lineHeight: 1.4, color: 'var(--bars-text-secondary)', margin: '3px 0 0' }}>
                  {summary.setForToday} task{summary.setForToday === 1 ? '' : 's'} set for today · {summary.completed} already paved.
                </p>
              </div>
            </div>

            {/* Sealing the ritual is when the work starts, so the commitments
                have to stay reachable here — not only while the ritual is open. */}
            <TaskList tasks={summary.openTasks} blocked={summary.blocked} />
          </div>
        </div>
      )}
    </section>
  )
}
