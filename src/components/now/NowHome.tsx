import Link from 'next/link'
import { db } from '@/lib/db'
import { getTodayChargeTargets } from '@/actions/daily-charge'
import { parseSeedMetabolization, effectiveMaturity } from '@/lib/bar-seed-metabolization/parse'
import { HAND_SIZE } from '@/lib/hand-service'
import { HandGlance, type HandSlotData } from '@/components/now/HandGlance'
import { DailyChargePanel } from '@/components/now/DailyChargePanel'
import { TapTheVeinPanel } from '@/components/now/TapTheVeinPanel'
import { getTodayPanelSummary } from '@/actions/tap-the-vein'
import { CaptureBox } from '@/components/now/CaptureBox'
import { Clean321Launcher } from '@/components/clean321/Clean321Launcher'

type NowHomeProps = {
  playerId: string
  vibulons: number
}

export async function NowHome({ playerId, vibulons }: NowHomeProps) {
  const [handSlots, chargeTargets, barCounts, ttvSummary] = await Promise.all([
    db.handSlot.findMany({
      where: { playerId },
      orderBy: { slotIndex: 'asc' },
      include: {
        bar: { select: { id: true, title: true, nation: true, seedMetabolization: true } },
      },
    }),
    getTodayChargeTargets(),
    fetchBarCounts(playerId),
    getTodayPanelSummary(),
  ])

  const ttvPanel = 'error' in ttvSummary
    ? { status: 'not_started' as const, setForToday: 0, carried: 0, completed: 0, sealedAt: null }
    : ttvSummary

  // Build all 6 slots (filled + empty)
  const slotMap = new Map(handSlots.map(s => [s.slotIndex, s]))
  const slots: HandSlotData[] = []
  for (let i = 0; i < HAND_SIZE; i++) {
    const s = slotMap.get(i)
    const bar = s?.bar ?? null
    slots.push({
      slotIndex: i,
      barId: bar?.id ?? null,
      title: bar?.title ?? null,
      element: bar?.nation ?? null,
      maturity: bar ? effectiveMaturity(parseSeedMetabolization(bar.seedMetabolization)) : null,
    })
  }

  const filledCount = slots.filter(s => s.barId).length
  const chargeData = 'error' in chargeTargets
    ? { alreadyDoneToday: false, handBars: [] as Array<{ barId: string; title: string; maturity: string }> }
    : chargeTargets

  const tools = [
    { kind: 'link' as const, href: '/emotional-first-aid', icon: '✚', iconColor: '#2980b9', iconGlow: '#1a7a8a', label: 'First Aid', sub: 'soothe the charge', mono: false },
    { kind: 'clean321' as const, href: '', icon: '3·2·1', iconColor: '#7c3aed', iconGlow: '#7c3aed', label: 'Clean Up', sub: 'metabolize it', mono: true },
    { kind: 'link' as const, href: '/iching', icon: '☰', iconColor: '#d4a017', iconGlow: '#d4a017', label: 'I Ching', sub: 'consult the lines', mono: false },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0908', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Nunito, sans-serif' }}>
      {/* Page label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0 8px' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b6965' }}>
          BARS Engine
        </span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#6b6965' }} />
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7c3aed' }}>
          Now /
        </span>
      </div>

      {/* Main phone-frame container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 432,
        flex: 1,
        background: '#0a0908',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <header style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111110', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px rgba(255,255,255,0.12)', color: '#a09e98', fontSize: 12 }}>
              ◇
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: '#e8e6e0', lineHeight: 1 }}>
                Now
              </span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6965', lineHeight: 1 }}>
                The active loop
              </span>
            </div>
          </div>
          {/* Vibulon count */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6965' }}>
              VIBULON
            </span>
            <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: '#e8e6e0', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              {vibulons.toLocaleString()}
              <span style={{ fontSize: 10, color: '#7c3aed' }}>◆</span>
            </span>
          </div>
        </header>

        {/* Scrollable main area */}
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Hand glance */}
          <HandGlance
            slots={slots}
            filledCount={filledCount}
            vaultCount={barCounts.vaultCount}
            gardenCount={barCounts.gardenCount}
          />

          {/* Observatory — folded into Now: zoom through time across your lenses */}
          <Link
            href="/observatory"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '13px 16px',
              borderRadius: 10,
              background: '#1a1a18',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <span style={{ fontSize: 16, color: '#7c3aed', textShadow: '0 0 12px #7c3aed', lineHeight: 1 }}>
                ◎
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0', lineHeight: 1 }}>
                  Observatory
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6965', lineHeight: 1 }}>
                  Zoom through time · your lenses
                </span>
              </div>
            </div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#6b6965' }}>→</span>
          </Link>

          {/* Tap the Vein — daily ritual (sibling of Daily Charge, above it).
              The brainstorm (dump → distill) lives INSIDE the ritual, between the
              free-write and commit — not as a standalone NOW card. */}
          <TapTheVeinPanel summary={ttvPanel} />

          {/* Daily charge */}
          <DailyChargePanel
            alreadyDoneToday={chargeData.alreadyDoneToday}
            handBars={chargeData.handBars}
          />

          {/* Tools rail — When you're activated */}
          <div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b6965' }}>
              When you're activated
            </span>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {tools.map(tool =>
                tool.kind === 'clean321' ? (
                  <Clean321Launcher
                    key={tool.label}
                    icon={tool.icon}
                    iconColor={tool.iconColor}
                    iconGlow={tool.iconGlow}
                    label={tool.label}
                    sub={tool.sub}
                    mono={tool.mono}
                  />
                ) : (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    style={{
                      flex: 1,
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      padding: '13px 12px',
                      borderRadius: 8,
                      background: '#1a1a18',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  >
                    <span style={{
                      fontFamily: tool.mono ? 'Space Mono, monospace' : 'Jost, sans-serif',
                      fontWeight: 800,
                      fontSize: tool.mono ? 15 : 17,
                      lineHeight: 1,
                      color: tool.iconColor,
                      textShadow: `0 0 12px ${tool.iconGlow}`,
                    }}>
                      {tool.icon}
                    </span>
                    <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 12, color: '#e8e6e0' }}>
                      {tool.label}
                    </span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b6965' }}>
                      {tool.sub}
                    </span>
                  </Link>
                )
              )}
            </div>
          </div>
        </main>

        {/* Capture footer */}
        <CaptureBox />
      </div>
    </div>
  )
}

async function fetchBarCounts(playerId: string): Promise<{ vaultCount: number; gardenCount: number }> {
  const [allBars, handBarIds] = await Promise.all([
    db.customBar.findMany({
      where: { creatorId: playerId, status: 'active', archivedAt: null },
      select: { id: true, seedMetabolization: true },
    }),
    db.handSlot.findMany({
      where: { playerId, barId: { not: null } },
      select: { barId: true },
    }),
  ])

  const inHandIds = new Set(handBarIds.map(s => s.barId))

  let vaultCount = 0
  let gardenCount = 0

  for (const bar of allBars) {
    const maturity = effectiveMaturity(parseSeedMetabolization(bar.seedMetabolization))
    if (maturity === 'context_named' || maturity === 'elaborated') {
      gardenCount++
    } else if ((maturity === 'captured' || !maturity) && !inHandIds.has(bar.id)) {
      vaultCount++
    }
  }

  return { vaultCount, gardenCount }
}
