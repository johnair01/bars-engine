'use client'

import type { ReactNode } from 'react'
import { CopyTextButton } from '@/components/ui/CopyTextButton'

type Props = {
  /** String copied to clipboard (e.g. markdown source or visible slice) */
  textToCopy: string
  children: ReactNode
  className?: string
  copyAriaLabel?: string
}

/**
 * Wraps readable content with a top-right-aligned Copy control.
 */
export function CopyableProse({ textToCopy, children, className = '', copyAriaLabel = 'Copy text' }: Props) {
  return (
    <div className={className}>
      <div className="flex justify-end mb-1">
        <CopyTextButton text={textToCopy} aria-label={copyAriaLabel} />
      </div>
      {children}
    </div>
  )
}
