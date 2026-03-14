'use client'

// ---------------------------------------------------------------------------
// SceneCard — atomic unit of contemplative game UI
// One scene = one question. No nav chrome during a scene.
// ---------------------------------------------------------------------------

import { GMVoiceLabel, type GMVoice } from './GMVoice'

export type SceneTone = 'contemplative' | 'charged' | 'revelatory' | 'completion'

const TONE_BORDER: Record<SceneTone, string> = {
  contemplative: 'border-zinc-800/0',
  charged:       'border-amber-900/20',
  revelatory:    'border-indigo-900/30',
  completion:    'border-emerald-900/30',
}

type Props = {
  gmVoice?: GMVoice
  gmLine?: string
  prompt: string
  subtext?: React.ReactNode
  tone?: SceneTone
  children: React.ReactNode
  progress?: { current: number; total: number }
}

export function SceneCard({
  gmVoice,
  gmLine,
  prompt,
  subtext,
  tone = 'contemplative',
  children,
  progress,
}: Props) {
  return (
    <div className="space-y-7">
      {progress && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: progress.total }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 w-5 rounded-full transition-colors ${
                  i < progress.current
                    ? 'bg-purple-500'
                    : i === progress.current
                    ? 'bg-purple-400'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          {/* Step count deliberately omitted — gift of context, not frontloaded structure */}
        </div>
      )}

      {gmVoice && gmLine && (
        <GMVoiceLabel voice={gmVoice} line={gmLine} />
      )}

      <div className={`space-y-2 border-l-2 pl-5 ${TONE_BORDER[tone]}`}>
        <p className="text-zinc-100 text-lg font-medium leading-relaxed">{prompt}</p>
        {subtext && (
          <p className="text-zinc-600 text-xs">{subtext}</p>
        )}
      </div>

      <div>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SceneInput — consistent textarea for scene card free-writes
// ---------------------------------------------------------------------------

type InputProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  rows?: number
  autoFocus?: boolean
}

export function SceneInput({ value, onChange, placeholder = 'Write freely…', rows = 4, autoFocus }: InputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-5 py-4 text-zinc-200 text-sm leading-relaxed placeholder-zinc-700 outline-none transition-colors resize-none"
    />
  )
}

// ---------------------------------------------------------------------------
// SceneShortInput — single-line input for names/short answers
// ---------------------------------------------------------------------------

type ShortInputProps = {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function SceneShortInput({ value, onChange, placeholder = 'Type here…', autoFocus }: ShortInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-5 py-4 text-zinc-200 text-sm placeholder-zinc-700 outline-none transition-colors"
    />
  )
}

// ---------------------------------------------------------------------------
// SceneNav — back/forward controls between scene cards
// ---------------------------------------------------------------------------

type NavProps = {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
}

export function SceneNav({
  onBack,
  onNext,
  nextLabel = 'Continue →',
  nextDisabled = false,
  nextLoading = false,
}: NavProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      {onBack && (
        <button
          onClick={onBack}
          className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled || nextLoading}
        className="ml-auto bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        {nextLoading ? 'Working…' : nextLabel}
      </button>
    </div>
  )
}
