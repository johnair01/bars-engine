import Link from 'next/link'
import type { PlayerNextMove } from '@/actions/next-action-bridge'

type StarOfBethlehemCardProps = {
  move: PlayerNextMove
}

/**
 * Single "your next move" card on NOW — Star of Bethlehem (Octalysis CD2).
 * One signal, not a task list. PMA / golden-path alignment.
 */
export function StarOfBethlehemCard({ move }: StarOfBethlehemCardProps) {
  if (move.kind === 'next_action') {
    return (
      <Link
        href={`/quest/${move.questId}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '14px 16px',
          borderRadius: 10,
          background: '#14130f',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(212,160,23,0.35)',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 8.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#d4a017',
          }}
        >
          Your next move
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: '#f4f2ec', lineHeight: 1.35 }}>
          {move.nextAction}
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#6b6965' }}>
          on {move.questTitle} →
        </span>
      </Link>
    )
  }

  if (move.kind === 'quest_needs_action') {
    return (
      <Link
        href={`/quest/${move.questId}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '14px 16px',
          borderRadius: 10,
          background: '#14130f',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 8.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#d4a017',
          }}
        >
          Your next move
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0' }}>
          Name the next smallest step on &ldquo;{move.questTitle}&rdquo;
        </span>
      </Link>
    )
  }

  if (move.kind === 'ttv_task') {
    return (
      <Link
        href="/tap-the-vein"
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '14px 16px',
          borderRadius: 10,
          background: '#14130f',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(124,58,237,0.35)',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 8.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#7c3aed',
          }}
        >
          Your next move
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0', lineHeight: 1.35 }}>
          {move.taskText}
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#6b6965' }}>
          Tap the Vein →
        </span>
      </Link>
    )
  }

  if (move.kind === 'ttv_start') {
    return (
      <Link
        href="/tap-the-vein"
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '14px 16px',
          borderRadius: 10,
          background: '#14130f',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(124,58,237,0.25)',
        }}
      >
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 8.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#7c3aed',
          }}
        >
          Your next move
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0' }}>
          Open Tap the Vein — set up to five moves for today
        </span>
      </Link>
    )
  }

  return (
    <Link
      href="/bars/capture"
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '14px 16px',
        borderRadius: 10,
        background: '#14130f',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 8.5,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#6b6965',
        }}
      >
        Your next move
      </span>
      <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0' }}>
        Capture what&apos;s alive — plant a seed on the board
      </span>
    </Link>
  )
}
