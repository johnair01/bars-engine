'use client'

import { useState } from 'react'

interface EventAdminToolbarProps {
  children: React.ReactNode
}

export function EventAdminToolbar({ children }: EventAdminToolbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div
          className="mb-2 p-4 rounded-xl border space-y-3 max-h-[60vh] overflow-y-auto w-80"
          style={{
            background: 'var(--ep-surface-elevated, #1a2235)',
            borderColor: 'var(--ep-border, #1e293b)',
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--ep-gold, #EAB308)' }}
            >
              Admin
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm hover:opacity-70"
              style={{ color: 'var(--ep-text-muted, #64748B)' }}
            >
              Close
            </button>
          </div>
          {children}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg border shadow-lg transition-transform hover:scale-105"
        style={{
          background: 'var(--ep-surface, #111827)',
          borderColor: 'var(--ep-border, #1e293b)',
          color: 'var(--ep-gold, #EAB308)',
        }}
        aria-label={open ? 'Close admin panel' : 'Open admin panel'}
      >
        {open ? '×' : '⚙'}
      </button>
    </div>
  )
}
