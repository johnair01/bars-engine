'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import {
  captureBarFromCanvas,
  type CanvasItem,
} from '@/actions/bars'

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGICAL_W = 392
const LOGICAL_H = 812

const CLAMP_X = { min: 44, max: 348 } as const
const CLAMP_Y = { min: 122, max: 560 } as const

const COMPOST_THRESHOLD_Y = 512

const CHARGE_LABELS: Record<number, string> = {
  1: 'barely a flicker',
  2: 'a low hum',
  3: "it's sitting with me",
  4: 'hard to shake',
  5: "can't put it down",
}

const ELEMENT_ORDER: ElementKey[] = ['fire', 'water', 'wood', 'metal', 'earth']

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

function textColor(tint: ElementKey | null) {
  return tint ? ELEMENT_TOKENS[tint].gem : '#f4f1ec'
}

function buildDefaultItems(defaultText?: string): CanvasItem[] {
  if (defaultText?.trim()) {
    return [{
      id: 'seed-text-1',
      type: 'text',
      x: 196,
      y: 300,
      rot: 0,
      text: defaultText.trim(),
      tint: null,
      size: 27,
    }]
  }
  return [{
    id: 'seed-text-1',
    type: 'text',
    x: 184,
    y: 218,
    rot: -2,
    text: 'I went quiet in the\nmeeting again.',
    tint: 'water',
    size: 27,
  }]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EditingTarget = string | 'new' | null

interface DragState {
  pointerId: number
  itemId: string
  startX: number
  startY: number
  originX: number
  originY: number
  scale: number
  moved: boolean
  currentX: number
  currentY: number
}

interface GestureState {
  pointer1Id: number
  pointer2Id: number
  itemId: string
  p1Start: { x: number; y: number }
  p2Start: { x: number; y: number }
  p1Current: { x: number; y: number }
  p2Current: { x: number; y: number }
  originSize: number
  originRot: number
  scale: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldBackground({ fieldTint }: { fieldTint: ElementKey | null }) {
  const el = fieldTint ? ELEMENT_TOKENS[fieldTint] : null
  const topGlow = el
    ? `radial-gradient(ellipse 130% 66% at 50% 6%, color-mix(in srgb, ${el.frame} 30%, transparent), transparent 56%),`
    : ''

  const bg = [
    topGlow,
    'radial-gradient(ellipse 110% 55% at 50% 122%, rgba(124,58,237,0.12), transparent 54%)',
    'repeating-linear-gradient(115deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 27px)',
    'repeating-linear-gradient(58deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 35px)',
    'linear-gradient(180deg, #14151a, #0b0c0f)',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: bg, transition: 'background 0.5s ease' }}
    />
  )
}

function Vignette() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'linear-gradient(180deg, rgba(6,7,10,0.55), transparent 20%, transparent 60%, rgba(6,7,10,0.94))',
      }}
    />
  )
}

function TopChrome() {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 14 }}>
      {/* Story progress strip */}
      <div className="flex gap-[5px] px-5 pt-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-sm" style={{ background: 'rgba(255,255,255,0.16)' }}>
            {i === 0 && (
              <div
                className="h-full rounded-sm"
                style={{
                  width: '62%',
                  background: '#a855f7',
                  boxShadow: '0 0 8px 0 #a855f7',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between px-5 pt-3" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        <span className="font-mono text-[12px] tabular-nums" style={{ color: 'rgba(232,226,218,0.85)' }}>
          {time}
        </span>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.08em]"
          style={{ color: 'rgba(232,226,218,0.6)' }}
        >
          drag to move · tap to edit
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'rgba(232,226,218,0.66)' }}>
          ♦ 1428
        </span>
      </div>
    </div>
  )
}

interface ToolRailProps {
  fieldTint: ElementKey | null
  onAddText: () => void
  onAddPhoto: () => void
  onAddVoice: () => void
  onAddLink: () => void
  onSetElement: (el: ElementKey) => void
}

function ToolRail({ fieldTint, onAddText, onAddPhoto, onAddVoice, onAddLink, onSetElement }: ToolRailProps) {
  const btnBase: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.07)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    color: 'rgba(232,226,218,0.85)',
  }

  return (
    <div
      className="absolute flex flex-col items-end gap-[9px]"
      style={{ top: 104, right: 14, zIndex: 16 }}
    >
      {/* Tool buttons */}
      <button style={btnBase} onClick={onAddText} aria-label="Add text">
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.04em' }}>
          Aa
        </span>
      </button>
      <button style={btnBase} onClick={onAddPhoto} aria-label="Add photo">
        <span style={{ fontSize: 18 }}>▦</span>
      </button>
      <button style={btnBase} onClick={onAddVoice} aria-label="Add voice">
        {/* Mini waveform */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {[{ x: 2, h: 7 }, { x: 5, h: 14 }, { x: 8, h: 9 }, { x: 11, h: 5 }].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={(16 - bar.h) / 2}
              width={2}
              height={bar.h}
              rx={1}
              fill="rgba(232,226,218,0.85)"
            />
          ))}
        </svg>
      </button>
      <button style={btnBase} onClick={onAddLink} aria-label="Add link">
        <span style={{ fontSize: 16 }}>↗</span>
      </button>

      {/* Divider */}
      <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.14)', margin: '3px 5px' }} />

      {/* Element rows */}
      {ELEMENT_ORDER.map((el) => {
        const tok = ELEMENT_TOKENS[el]
        const active = fieldTint === el
        return (
          <div key={el} className="flex items-center gap-[10px]">
            <span
              className="font-mono text-[8.5px] uppercase tracking-[0.14em]"
              style={{ color: active ? tok.gem : 'rgba(232,226,218,0.55)' }}
            >
              {el.toUpperCase()}
            </span>
            <button
              onClick={() => onSetElement(el)}
              aria-label={`Attune to ${el}`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                fontSize: 16,
                backdropFilter: 'blur(5px)',
                border: 'none',
                cursor: 'pointer',
                ...(active
                  ? {
                      color: tok.gem,
                      background: `color-mix(in srgb, ${tok.frame} 26%, transparent)`,
                      boxShadow: `inset 0 0 0 1.5px ${tok.frame}, 0 0 12px -6px ${tok.glow}`,
                      textShadow: `0 0 8px ${tok.glow}`,
                    }
                  : {
                      color: 'rgba(232,226,218,0.85)',
                      background: 'rgba(255,255,255,0.07)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                    }),
              }}
            >
              {tok.sigil}
            </button>
          </div>
        )
      })}
    </div>
  )
}

interface TextStickerProps {
  item: CanvasItem
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
}

function TextSticker({ item, isDragging, onPointerDown }: TextStickerProps) {
  const color = textColor((item.tint as ElementKey | null) ?? null)
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item.id)}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        transform: `translate(-50%, -50%) rotate(${item.rot}deg) ${isDragging ? 'scale(1.04)' : ''}`,
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        fontSize: item.size ?? 27,
        lineHeight: 1.25,
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        maxWidth: 300,
        padding: '4px 8px',
        borderRadius: 9,
        color,
        textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.6)',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.16s cubic-bezier(0.16,1,0.3,1)',
        ...(isDragging
          ? {
              filter: 'brightness(1.06) drop-shadow(0 18px 26px rgba(0,0,0,0.55))',
              boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.04)',
            }
          : {}),
      }}
    >
      {item.text}
    </div>
  )
}

interface LinkChipProps {
  item: CanvasItem
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
}

function LinkChip({ item, isDragging, onPointerDown }: LinkChipProps) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item.id)}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        transform: `translate(-50%, -50%) rotate(${item.rot}deg) ${isDragging ? 'scale(1.04)' : ''}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: 210,
        padding: '9px 12px',
        borderRadius: 10,
        background: 'rgba(20,21,26,0.86)',
        boxShadow:
          '0 14px 30px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.08)',
        color: 'rgba(232,226,218,0.85)',
        fontFamily: 'Nunito, sans-serif',
        fontSize: 12,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.16s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <span style={{ opacity: 0.6 }}>↗</span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label || item.url}
      </span>
    </div>
  )
}

interface VoiceChipProps {
  item: CanvasItem
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
}

function VoiceChip({ item, isDragging, onPointerDown }: VoiceChipProps) {
  const waterFrame = ELEMENT_TOKENS.water.frame
  const waterGem = ELEMENT_TOKENS.water.gem
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item.id)}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        transform: `translate(-50%, -50%) rotate(${item.rot}deg) ${isDragging ? 'scale(1.04)' : ''}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 13px 9px 11px',
        borderRadius: 11,
        background: `color-mix(in srgb, ${waterFrame} 24%, #15110e)`,
        boxShadow: `0 14px 30px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px color-mix(in srgb, ${waterFrame} 50%, transparent)`,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.16s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Mini waveform */}
      <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
        {[{ x: 0, h: 6 }, { x: 3, h: 13 }, { x: 6, h: 9 }, { x: 9, h: 16 }, { x: 12, h: 7 }].map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={(18 - bar.h) / 2}
            width={2}
            height={bar.h}
            rx={1}
            fill={waterGem}
          />
        ))}
      </svg>
      <span
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 10,
          color: 'rgba(232,226,218,0.85)',
        }}
      >
        {item.label || '0:00 voice'}
      </span>
    </div>
  )
}

interface CompostNodeProps {
  overTrash: boolean
  reducedMotion: boolean
}

function CompostNode({ overTrash, reducedMotion }: CompostNodeProps) {
  const earthTok = ELEMENT_TOKENS.earth
  return (
    <div
      className="bars-compost-node"
      role="img"
      aria-label="Compost — drag here to remove"
      style={{
        position: 'absolute',
        bottom: 196,
        left: '50%',
        transform: `translateX(-50%) ${overTrash ? 'scale(1.12)' : 'scale(1)'}`,
        width: 62,
        height: 62,
        borderRadius: '50%',
        zIndex: 34,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        transition: 'all 0.16s ease',
        ...(overTrash
          ? {
              color: earthTok.gem,
              background: `color-mix(in srgb, ${earthTok.frame} 42%, rgba(5,4,3,0.7))`,
              boxShadow: `inset 0 0 0 1.5px ${earthTok.frame}, 0 0 26px -2px ${earthTok.glow}`,
              animation: reducedMotion ? 'none' : 'barsCompostPulse 1.1s ease-in-out infinite',
            }
          : {
              color: 'rgba(232,226,218,0.72)',
              background: 'rgba(5,4,3,0.66)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 20px -8px rgba(0,0,0,0.7)',
              animation: 'none',
            }),
      }}
    >
      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" aria-hidden>
        <path d="M1 4h16" strokeWidth={2} strokeLinecap="round" />
        <path d="M6 4V2h6v2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 4l1 14h10l1-14" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
        }}
      >
        Compost
      </span>
    </div>
  )
}

interface BottomChromeProps {
  fieldTint: ElementKey | null
  charge: 1 | 2 | 3 | 4 | 5
  onSetCharge: (c: 1 | 2 | 3 | 4 | 5) => void
  intent: string
  onIntentChange: (v: string) => void
  onCapture: () => void
  capturing: boolean
  captureError: string | null
}

function BottomChrome({ fieldTint, charge, onSetCharge, intent, onIntentChange, onCapture, capturing, captureError }: BottomChromeProps) {
  const [showIntent, setShowIntent] = useState(false)
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const tok = fieldTint ? ELEMENT_TOKENS[fieldTint] : null

  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex flex-col gap-[14px]"
      style={{
        zIndex: 18,
        padding: '34px 24px 24px',
        background: 'linear-gradient(transparent, rgba(8,9,12,0.86) 30%, rgba(8,9,12,0.96))',
      }}
    >
      {/* Charge selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'rgba(232,226,218,0.72)' }}
          >
            Charge — how charged it feels
          </span>
          <span
            className="font-[Nunito,sans-serif] text-[12.5px]"
            style={{ color: 'rgba(232,226,218,0.92)' }}
          >
            {CHARGE_LABELS[charge]}
          </span>
        </div>
        <div className="flex gap-[5px]">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              onClick={() => onSetCharge(n)}
              className="flex-1 cursor-pointer border-none p-0"
              aria-label={`Charge ${n}: ${CHARGE_LABELS[n]}`}
              style={{
                height: 5,
                borderRadius: 3,
                transition: 'all 0.22s ease',
                background:
                  n <= charge
                    ? (tok?.gem ?? '#a855f7')
                    : 'rgba(255,255,255,0.13)',
                boxShadow:
                  n <= charge && tok
                    ? `0 0 10px -2px ${tok.glow}`
                    : n <= charge
                    ? '0 0 10px -2px rgba(168,85,247,0.6)'
                    : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Intent field (collapsed by default) */}
      {showIntent ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={intent}
            onChange={(e) => onIntentChange(e.target.value)}
            maxLength={80}
            placeholder="quest, reflection, gift…"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.18)',
              outline: 'none',
              padding: '4px 0',
              fontFamily: 'Nunito, sans-serif',
              fontSize: 13,
              color: '#e8e6e0',
            }}
          />
          <button
            onClick={() => { onIntentChange(''); setShowIntent(false) }}
            style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,226,218,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowIntent(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'Space Mono, monospace', fontSize: 9,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: intent ? 'rgba(232,226,218,0.7)' : 'rgba(232,226,218,0.35)',
            textAlign: 'left',
          }}
        >
          {intent ? `intent: ${intent}` : '+ intent'}
        </button>
      )}

      {/* Provenance */}
      <span
        className="font-mono text-[9px] uppercase tracking-[0.1em]"
        style={{ color: 'rgba(232,226,218,0.58)' }}
      >
        {timeStr} · auto-located
      </span>

      {/* Error */}
      {captureError && (
        <p className="text-[11px] text-red-400 font-mono">{captureError}</p>
      )}

      {/* Primary action */}
      <button
        onClick={onCapture}
        disabled={capturing}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 8,
          background: '#7c3aed',
          color: '#fff',
          fontFamily: 'Jost, sans-serif',
          fontWeight: 700,
          fontSize: 15.5,
          border: 'none',
          cursor: capturing ? 'default' : 'pointer',
          opacity: capturing ? 0.7 : 1,
          boxShadow: '0 0 30px -6px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
          transition: 'opacity 0.2s',
        }}
      >
        {capturing ? 'Capturing…' : 'Capture this seed →'}
      </button>
    </div>
  )
}

interface TextEditorOverlayProps {
  editing: EditingTarget
  draft: string
  draftTint: ElementKey | 'none'
  draftSize: number
  onDraftChange: (v: string) => void
  onDraftTintChange: (t: ElementKey | 'none') => void
  onDraftSizeChange: (s: number) => void
  onDone: () => void
}

function TextEditorOverlay({
  editing,
  draft,
  draftTint,
  draftSize,
  onDraftChange,
  onDraftTintChange,
  onDraftSizeChange,
  onDone,
}: TextEditorOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing !== null) {
      // Move caret to end on open
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      })
    }
  }, [editing])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const draftColor = draftTint === 'none' ? '#f4f1ec' : ELEMENT_TOKENS[draftTint as ElementKey].gem

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: 40,
        background: 'rgba(5,4,3,0.9)',
        backdropFilter: 'blur(9px)',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onDone()
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between" style={{ padding: '18px 18px 0' }}>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{ color: 'rgba(232,226,218,0.6)' }}
        >
          Compose · type your spark
        </span>
        <button
          onClick={onDone}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            background: '#7c3aed',
            color: '#fff',
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 20px -6px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          Done
        </button>
      </div>

      {/* Textarea */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: '0 52px' }}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="type your spark…"
          rows={4}
          style={{
            width: '100%',
            maxWidth: 316,
            minHeight: 64,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            textAlign: 'center',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: draftSize,
            lineHeight: 1.25,
            color: draftColor,
            caretColor: '#a855f7',
            textShadow: '0 2px 16px rgba(0,0,0,0.7)',
          }}
        />
      </div>

      {/* Size slider */}
      <div className="flex items-center gap-3 px-6" style={{ paddingBottom: 4 }}>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 11, color: 'rgba(232,226,218,0.5)', flexShrink: 0 }}>A</span>
        <input
          type="range"
          min={12}
          max={80}
          step={1}
          value={draftSize}
          onChange={(e) => onDraftSizeChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, color: 'rgba(232,226,218,0.5)', flexShrink: 0 }}>A</span>
      </div>

      {/* Element colour rail */}
      <div
        className="flex flex-col items-center gap-[9px]"
        style={{ paddingBottom: 30 }}
      >
        <span
          className="font-mono text-[8.5px] uppercase tracking-[0.16em]"
          style={{ color: 'rgba(232,226,218,0.5)' }}
        >
          Attune to an element
        </span>
        <div className="flex gap-[13px]">
          {/* None swatch */}
          {(['none', ...ELEMENT_ORDER] as const).map((t) => {
            const isSelected = draftTint === t
            const fill = t === 'none' ? '#f4f1ec' : `color-mix(in srgb, ${ELEMENT_TOKENS[t].frame} 30%, #111110)`
            const gem = t === 'none' ? '#f4f1ec' : ELEMENT_TOKENS[t].gem
            const glow = t === 'none' ? undefined : ELEMENT_TOKENS[t].glow
            return (
              <button
                key={t}
                onClick={() => onDraftTintChange(t as ElementKey | 'none')}
                aria-label={t === 'none' ? 'No element' : t}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: fill,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: t === 'none' ? 0 : 16,
                  color: gem,
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isSelected
                    ? `0 0 0 2px #050403, 0 0 0 4px ${gem}, ${glow ? `0 0 14px -3px ${glow}` : ''}`
                    : 'inset 0 0 0 1px rgba(255,255,255,0.14)',
                  transition: 'all 0.16s ease',
                }}
              >
                {t !== 'none' && ELEMENT_TOKENS[t as ElementKey].sigil}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface CapturedOverlayProps {
  barId: string
  title: string
  onTuneNow: () => void
  onBackToBoard: () => void
}

function CapturedOverlay({ title, onTuneNow, onBackToBoard }: CapturedOverlayProps) {
  const woodGem = '#2ecc71'
  const woodGlow = '#27ae60'
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5"
      style={{
        zIndex: 50,
        background: 'rgba(10,9,8,0.88)',
        backdropFilter: 'blur(12px)',
        padding: '0 28px',
      }}
    >
      {/* Wood ◇ glyph */}
      <div
        aria-hidden
        style={{
          fontSize: 64,
          color: woodGem,
          filter: `drop-shadow(0 0 32px ${woodGlow}) drop-shadow(0 0 8px ${woodGem})`,
          lineHeight: 1,
        }}
      >
        ◇
      </div>

      {/* Headline */}
      <p
        style={{
          fontFamily: 'Jost, sans-serif',
          fontWeight: 700,
          fontSize: 28,
          color: '#e8e6e0',
          textAlign: 'center',
          margin: 0,
        }}
      >
        A seed is on the board
      </p>

      {/* Derived title */}
      <p
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 11,
          color: 'rgba(232,226,218,0.55)',
          margin: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {title}
      </p>

      <div className="flex flex-col gap-3 w-full" style={{ marginTop: 8 }}>
        {/* Tune now */}
        <button
          onClick={onTuneNow}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 8,
            background: '#7c3aed',
            color: '#fff',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 700,
            fontSize: 15.5,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 30px -6px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          Tune now →
        </button>

        {/* Back to board */}
        <button
          onClick={onBackToBoard}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 8,
            background: 'transparent',
            color: 'rgba(232,226,218,0.72)',
            fontFamily: 'Jost, sans-serif',
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
        >
          Back to board
        </button>
      </div>
    </div>
  )
}

interface VoiceRecorderOverlayProps {
  onPlace: (blob: Blob, durationSec: number) => void
  onClose: () => void
}

function VoiceRecorderOverlay({ onPlace, onClose }: VoiceRecorderOverlayProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'done'>('idle')
  const [durationSec, setDurationSec] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(6))
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const blobRef = useRef<Blob | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== 'recording') {
      setWaveHeights(status === 'done'
        ? [18, 32, 22, 40, 14, 28, 36, 20, 44, 16, 30, 24, 38, 18, 34, 22, 42, 14, 28, 20]
        : Array(20).fill(6)
      )
      return
    }
    const id = setInterval(() => {
      setWaveHeights(Array.from({ length: 20 }, () => Math.floor(Math.random() * 36) + 8))
    }, 100)
    return () => clearInterval(id)
  }, [status])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startRecording() {
    setStatus('requesting')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        blobRef.current = blob
        setStatus('done')
      }
      mr.start()
      mediaRecorderRef.current = mr
      setDurationSec(0)
      setStatus('recording')
      timerRef.current = setInterval(() => setDurationSec((s) => s + 1), 1000)
    } catch {
      setError('Microphone access denied')
      setStatus('idle')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function handlePlace() {
    if (blobRef.current) onPlace(blobRef.current, durationSec)
  }

  function formatDur(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const waterGem = ELEMENT_TOKENS.water.gem
  const isRecording = status === 'recording'
  const isDone = status === 'done'

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex: 40, background: 'rgba(5,4,3,0.94)', backdropFilter: 'blur(10px)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between" style={{ padding: '18px 18px 0' }}>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{ color: 'rgba(232,226,218,0.6)' }}
        >
          Voice memo
        </span>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(232,226,218,0.7)',
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        {/* Waveform bars */}
        <div className="flex items-center gap-[3px]" style={{ height: 52 }}>
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={isRecording ? 'bars-voice-bar' : ''}
              style={{
                width: 3,
                height: h,
                borderRadius: 2,
                background: isDone
                  ? `color-mix(in srgb, ${waterGem} 65%, transparent)`
                  : isRecording
                  ? waterGem
                  : 'rgba(255,255,255,0.14)',
                transformOrigin: 'center',
                animation: isRecording
                  ? `barsVoiceBar ${0.4 + (i % 7) * 0.08}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite`
                  : 'none',
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 36,
            letterSpacing: '0.04em',
            color: isRecording ? '#e8e6e0' : isDone ? '#e8e6e0' : 'rgba(232,226,218,0.25)',
          }}
        >
          {formatDur(durationSec)}
        </span>

        {/* Error */}
        {error && (
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#f87171', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Record / Stop button */}
        {!isDone && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={status === 'requesting'}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: 'none',
              cursor: status === 'requesting' ? 'default' : 'pointer',
              background: isRecording ? '#ef4444' : '#7c3aed',
              boxShadow: isRecording
                ? '0 0 0 10px rgba(239,68,68,0.15), 0 0 32px -6px rgba(239,68,68,0.65)'
                : '0 0 28px -6px rgba(124,58,237,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {isRecording ? (
              <div style={{ width: 22, height: 22, borderRadius: 4, background: '#fff' }} />
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff' }} />
            )}
          </button>
        )}

        {/* Hint text */}
        {!isDone && (
          <p
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: isRecording ? 'rgba(239,68,68,0.65)' : 'rgba(232,226,218,0.3)',
              textAlign: 'center',
            }}
          >
            {isRecording ? 'tap to stop' : status === 'requesting' ? 'requesting mic…' : 'tap to start'}
          </p>
        )}

        {/* Done actions */}
        {isDone && (
          <div className="flex flex-col gap-3" style={{ width: 256 }}>
            <button
              onClick={handlePlace}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 8,
                background: '#7c3aed',
                color: '#fff',
                fontFamily: 'Jost, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 22px -6px rgba(124,58,237,0.6)',
              }}
            >
              Place on canvas →
            </button>
            <button
              onClick={() => { blobRef.current = null; setDurationSec(0); setStatus('idle') }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 8,
                background: 'transparent',
                color: 'rgba(232,226,218,0.55)',
                fontFamily: 'Jost, sans-serif',
                fontSize: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
            >
              Record again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeedCaptureWhiteboard({
  defaultText,
  campaignRef,
  provenanceSource,
}: {
  defaultText?: string
  campaignRef?: string
  provenanceSource?: string
}) {
  const router = useRouter()
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  // Map of itemId → File for photos selected but not yet uploaded
  const photoFilesRef = useRef<Map<string, File>>(new Map())
  // Map of itemId → Blob for voice memos recorded but not yet uploaded
  const audioFilesRef = useRef<Map<string, Blob>>(new Map())
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')

  const [items, setItems] = useState<CanvasItem[]>(() => buildDefaultItems(defaultText))
  const [fieldTint, setFieldTint] = useState<ElementKey | null>('water')
  const [charge, setCharge] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [editing, setEditing] = useState<EditingTarget>(null)
  const [draft, setDraft] = useState('')
  const [draftTint, setDraftTint] = useState<ElementKey | 'none'>('none')
  const [draftSize, setDraftSize] = useState(30)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overTrash, setOverTrash] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [intent, setIntent] = useState('')
  const [captured, setCaptured] = useState<{ barId: string; title: string } | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ─── Drag handlers ─────────────────────────────────────────────────────────

  const handleItemPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation()
      if (!boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const scale = rect.width / LOGICAL_W

      // Second pointer on same item while dragging → start pinch/rotate gesture
      const existingDrag = dragRef.current
      if (existingDrag && existingDrag.itemId === id) {
        const item = items.find((i) => i.id === id)
        if (!item) return
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        gestureRef.current = {
          pointer1Id: existingDrag.pointerId,
          pointer2Id: e.pointerId,
          itemId: id,
          p1Start: { x: existingDrag.currentX, y: existingDrag.currentY },
          p2Start: { x: e.clientX, y: e.clientY },
          p1Current: { x: existingDrag.currentX, y: existingDrag.currentY },
          p2Current: { x: e.clientX, y: e.clientY },
          originSize: item.size ?? (item.type === 'photo' ? 1.0 : 27),
          originRot: item.rot,
          scale,
        }
        dragRef.current = null
        setDragId(null)
        return
      }

      const item = items.find((i) => i.id === id)
      if (!item) return

      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        itemId: id,
        startX: e.clientX,
        startY: e.clientY,
        originX: item.x,
        originY: item.y,
        scale,
        moved: false,
        currentX: e.clientX,
        currentY: e.clientY,
      }
      setDragId(id)
    },
    [items]
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // ── Gesture mode (pinch + rotate) ──────────────────────────────────────
    const g = gestureRef.current
    if (g) {
      if (e.pointerId === g.pointer1Id) g.p1Current = { x: e.clientX, y: e.clientY }
      if (e.pointerId === g.pointer2Id) g.p2Current = { x: e.clientX, y: e.clientY }

      const initDist = Math.hypot(g.p2Start.x - g.p1Start.x, g.p2Start.y - g.p1Start.y)
      const curDist  = Math.hypot(g.p2Current.x - g.p1Current.x, g.p2Current.y - g.p1Current.y)
      const scaleFactor = initDist > 1 ? curDist / initDist : 1

      const initAngle = Math.atan2(g.p2Start.y - g.p1Start.y, g.p2Start.x - g.p1Start.x)
      const curAngle  = Math.atan2(g.p2Current.y - g.p1Current.y, g.p2Current.x - g.p1Current.x)
      const angleDelta = (curAngle - initAngle) * (180 / Math.PI)

      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== g.itemId) return it
          const isPhoto = it.type === 'photo'
          const newSize = isPhoto
            ? clamp(g.originSize * scaleFactor, 0.35, 3.5)
            : clamp(Math.round(g.originSize * scaleFactor), 12, 80)
          return { ...it, size: newSize, rot: g.originRot + angleDelta }
        })
      )
      return
    }

    // ── Single-pointer drag ─────────────────────────────────────────────────
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    drag.currentX = e.clientX
    drag.currentY = e.clientY

    const dx = (e.clientX - drag.startX) / drag.scale
    const dy = (e.clientY - drag.startY) / drag.scale

    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true
    }
    if (!drag.moved) return

    const newX = clamp(drag.originX + dx, CLAMP_X.min, CLAMP_X.max)
    const newY = clamp(drag.originY + dy, CLAMP_Y.min, CLAMP_Y.max)

    setItems((prev) =>
      prev.map((it) => (it.id === drag.itemId ? { ...it, x: newX, y: newY } : it))
    )
    setOverTrash(drag.originY + dy > COMPOST_THRESHOLD_Y)
  }, [])

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // ── Gesture exit ────────────────────────────────────────────────────────
      const g = gestureRef.current
      if (g && (e.pointerId === g.pointer1Id || e.pointerId === g.pointer2Id)) {
        gestureRef.current = null
        setDragId(null)
        return
      }

      // ── Single-pointer drag end ─────────────────────────────────────────────
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return

      if (overTrash) {
        setItems((prev) => prev.filter((it) => it.id !== drag.itemId))
      } else if (!drag.moved) {
        // Tap — open editor for text items; play voice memos
        const item = items.find((i) => i.id === drag.itemId)
        if (item?.type === 'text') {
          setDraft(item.text ?? '')
          setDraftTint((item.tint as ElementKey | 'none') ?? 'none')
          setDraftSize(item.size ?? 27)
          setEditing(drag.itemId)
        } else if (item?.type === 'voice' && item.text) {
          new Audio(item.text).play().catch(() => {})
        }
      }

      dragRef.current = null
      setDragId(null)
      setOverTrash(false)
    },
    [overTrash, items]
  )

  // Canvas background pointer-down: only used to detect second-finger gesture
  // when the second finger lands on empty canvas rather than on a sticker
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const scale = rect.width / LOGICAL_W
      const item = items.find((i) => i.id === drag.itemId)
      if (!item) return
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      gestureRef.current = {
        pointer1Id: drag.pointerId,
        pointer2Id: e.pointerId,
        itemId: drag.itemId,
        p1Start: { x: drag.currentX, y: drag.currentY },
        p2Start: { x: e.clientX, y: e.clientY },
        p1Current: { x: drag.currentX, y: drag.currentY },
        p2Current: { x: e.clientX, y: e.clientY },
        originSize: item.size ?? (item.type === 'photo' ? 1.0 : 27),
        originRot: item.rot,
        scale,
      }
      dragRef.current = null
      setDragId(null)
    },
    [items]
  )

  // ─── Editor commit ─────────────────────────────────────────────────────────

  const commitEditor = useCallback(() => {
    const trimmed = draft.trim()

    if (editing === 'new') {
      if (trimmed) {
        const newItem: CanvasItem = {
          id: makeId(),
          type: 'text',
          x: 196,
          y: 300,
          rot: 0,
          text: trimmed,
          tint: draftTint === 'none' ? null : draftTint,
          size: draftSize,
        }
        setItems((prev) => [...prev, newItem])
        if (draftTint !== 'none') setFieldTint(draftTint as ElementKey)
      }
    } else if (editing) {
      if (trimmed) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === editing
              ? { ...it, text: trimmed, tint: draftTint === 'none' ? null : draftTint, size: draftSize }
              : it
          )
        )
        if (draftTint !== 'none') setFieldTint(draftTint as ElementKey)
      } else {
        setItems((prev) => prev.filter((it) => it.id !== editing))
      }
    }

    setEditing(null)
  }, [editing, draft, draftTint, draftSize])

  // ─── Element toggle ────────────────────────────────────────────────────────

  const handleSetElement = useCallback(
    (el: ElementKey) => {
      setFieldTint((prev) => (prev === el ? null : el))
    },
    []
  )

  // ─── Tool actions ──────────────────────────────────────────────────────────

  const handleAddText = useCallback(() => {
    setDraft('')
    setDraftTint(fieldTint ?? 'none')
    setDraftSize(30)
    setEditing('new')
  }, [fieldTint])

  const handleAddPhoto = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handlePhotoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const id = makeId()
    const previewUrl = URL.createObjectURL(file)
    // Store File object for upload on capture
    photoFilesRef.current.set(id, file)
    setItems((prev) => [
      ...prev,
      {
        id,
        type: 'photo',
        x: 130,
        y: 300,
        rot: -4,
        assetId: null,
        text: previewUrl,  // blob URL for preview only
      },
    ])
    e.target.value = ''
  }, [])

  const handleAddVoice = useCallback(() => {
    setShowVoiceRecorder(true)
  }, [])

  const handleVoiceRecorded = useCallback((blob: Blob, durationSec: number) => {
    const id = makeId()
    const previewUrl = URL.createObjectURL(blob)
    const m = Math.floor(durationSec / 60)
    const s = String(durationSec % 60).padStart(2, '0')
    audioFilesRef.current.set(id, blob)
    setItems((prev) => [
      ...prev,
      { id, type: 'voice', x: 196, y: 300, rot: -3, text: previewUrl, label: `${m}:${s}` },
    ])
    setShowVoiceRecorder(false)
  }, [])

  const handleAddLink = useCallback(() => {
    setLinkInputValue('')
    setShowLinkInput(true)
  }, [])

  const handleLinkSubmit = useCallback(() => {
    const url = linkInputValue.trim()
    if (!url) { setShowLinkInput(false); return }
    let label = url
    try { label = new URL(url).hostname } catch { /* keep raw */ }
    setItems((prev) => [
      ...prev,
      { id: makeId(), type: 'link', x: 176, y: 460, rot: -2, url, label },
    ])
    setShowLinkInput(false)
  }, [linkInputValue])

  // ─── Capture ───────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    setCaptureError(null)
    setCapturing(true)
    try {
      const result = await captureBarFromCanvas({
        items,
        fieldTint,
        charge,
        storyContent: intent.trim() || undefined,
        campaignRef,
        provenanceSource,
      })
      if ('error' in result) {
        setCaptureError(result.error)
        return
      }

      const { barId, title } = result

      // Upload pending photos and voice memos now that we have a barId
      const mediaItems = items.filter(i => i.type === 'photo' || i.type === 'voice')
      if (mediaItems.length > 0) {
        const { uploadBarAsset } = await import('@/lib/asset-upload-client')
        await Promise.allSettled(
          mediaItems.map(async (item) => {
            if (item.type === 'photo') {
              const file = photoFilesRef.current.get(item.id)
              if (!file) return
              await uploadBarAsset(file, { barId, side: 'front' })
            } else if (item.type === 'voice') {
              const blob = audioFilesRef.current.get(item.id)
              if (!blob) return
              const file = new File([blob], 'voice-memo.webm', { type: blob.type })
              await uploadBarAsset(file, { barId, side: 'front' })
            }
          })
        )
      }

      setCaptured({ barId, title })
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Capture failed')
    } finally {
      setCapturing(false)
    }
  }, [items, fieldTint, charge, intent, campaignRef, provenanceSource])

  // ─── Scale to viewport ─────────────────────────────────────────────────────

  const [scale, setScale] = useState(1)
  useEffect(() => {
    function updateScale() {
      const vw = Math.min(window.innerWidth, 520)
      const vh = window.innerHeight
      const sx = vw / LOGICAL_W
      const sy = vh / LOGICAL_H
      setScale(Math.min(sx, sy, 1))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex items-start justify-center w-full"
      style={{ minHeight: '100dvh', background: '#0a0908' }}
    >
      {/* Phone frame / logical canvas */}
      <div
        ref={boardRef}
        style={{
          width: LOGICAL_W,
          height: LOGICAL_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 38,
          flexShrink: 0,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoSelected}
        />

        {/* Link input overlay */}
        {showLinkInput && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 50, background: 'rgba(5,4,3,0.92)', backdropFilter: 'blur(10px)' }}
          >
            <div className="flex flex-col gap-4 w-72">
              <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(232,226,218,0.7)]">
                Paste a link
              </label>
              <input
                ref={linkInputRef}
                type="url"
                autoFocus
                placeholder="https://…"
                value={linkInputValue}
                onChange={(e) => setLinkInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit(); if (e.key === 'Escape') setShowLinkInput(false) }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e8e6e0] font-mono outline-none focus:border-purple-500/50"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkInput(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-[11px] font-mono uppercase tracking-widest text-[rgba(232,226,218,0.6)] hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="flex-1 rounded-lg py-2 text-[11px] font-mono uppercase tracking-widest text-white"
                  style={{ background: '#7c3aed' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <FieldBackground fieldTint={fieldTint} />
        <Vignette />

        {/* Canvas items layer */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 10 }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="region"
          aria-label="Seed canvas"
        >
          {items.map((item) => {
            const isDragging = dragId === item.id
            if (item.type === 'text') {
              return (
                <TextSticker
                  key={item.id}
                  item={item}
                  isDragging={isDragging}
                  onPointerDown={handleItemPointerDown}
                />
              )
            }
            if (item.type === 'photo') {
              const photoW = Math.round(118 * (item.size ?? 1.0))
              const photoH = Math.round(132 * (item.size ?? 1.0))
              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handleItemPointerDown(e, item.id)}
                  style={{
                    position: 'absolute',
                    left: item.x,
                    top: item.y,
                    width: photoW,
                    height: photoH,
                    transform: `translate(-50%,-50%) rotate(${item.rot}deg) ${isDragging ? 'scale(1.04)' : ''}`,
                    borderRadius: 11,
                    background: 'linear-gradient(155deg,#2b2724,#15110e)',
                    boxShadow:
                      '0 14px 30px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.06)',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    overflow: 'hidden',
                    transition: isDragging ? 'none' : 'transform 0.16s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {item.text ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.text}
                      alt="photo sticker"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-between h-full p-2">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 30, color: 'rgba(232,226,218,0.3)' }}>▦</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 8.5,
                          color: 'rgba(232,226,218,0.6)',
                        }}
                      >
                        moment.jpg
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            if (item.type === 'voice') {
              return (
                <VoiceChip
                  key={item.id}
                  item={item}
                  isDragging={isDragging}
                  onPointerDown={handleItemPointerDown}
                />
              )
            }
            if (item.type === 'link') {
              return (
                <LinkChip
                  key={item.id}
                  item={item}
                  isDragging={isDragging}
                  onPointerDown={handleItemPointerDown}
                />
              )
            }
            return null
          })}
        </div>

        <TopChrome />

        <ToolRail
          fieldTint={fieldTint}
          onAddText={handleAddText}
          onAddPhoto={handleAddPhoto}
          onAddVoice={handleAddVoice}
          onAddLink={handleAddLink}
          onSetElement={handleSetElement}
        />

        {/* Compost node (visible while dragging) */}
        {dragId !== null && <CompostNode overTrash={overTrash} reducedMotion={reducedMotion} />}

        <BottomChrome
          fieldTint={fieldTint}
          charge={charge}
          onSetCharge={setCharge}
          intent={intent}
          onIntentChange={setIntent}
          onCapture={handleCapture}
          capturing={capturing}
          captureError={captureError}
        />

        {/* Voice recorder overlay */}
        {showVoiceRecorder && (
          <VoiceRecorderOverlay
            onPlace={handleVoiceRecorded}
            onClose={() => setShowVoiceRecorder(false)}
          />
        )}

        {/* Text editor overlay */}
        {editing !== null && (
          <TextEditorOverlay
            editing={editing}
            draft={draft}
            draftTint={draftTint}
            draftSize={draftSize}
            onDraftChange={setDraft}
            onDraftTintChange={setDraftTint}
            onDraftSizeChange={setDraftSize}
            onDone={commitEditor}
          />
        )}

        {/* Post-capture confirmation overlay */}
        {captured && (
          <CapturedOverlay
            barId={captured.barId}
            title={captured.title}
            onTuneNow={() => router.push(`/bars/${captured.barId}`)}
            onBackToBoard={() => router.push('/hand')}
          />
        )}
      </div>
    </div>
  )
}
