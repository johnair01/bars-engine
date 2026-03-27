'use client'

import { useCallback, useState } from 'react'

type Props = {
  /** Plain text to place on the clipboard */
  text: string
  className?: string
  'aria-label'?: string
  /** Shown when `text` is empty — button is disabled */
  disabled?: boolean
}

/**
 * Small control to copy prose / passage / field text. Layout-only Tailwind; no arbitrary hex.
 */
export function CopyTextButton({
  text,
  className = '',
  'aria-label': ariaLabel = 'Copy text',
  disabled = false,
}: Props) {
  const [copied, setCopied] = useState(false)
  const empty = !text.trim()

  const onCopy = useCallback(async () => {
    if (empty) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [empty, text])

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled || empty}
      aria-label={ariaLabel}
      className={`shrink-0 rounded-lg border border-zinc-600 bg-zinc-900/90 px-2 py-1 text-[11px] font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition ${className}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
