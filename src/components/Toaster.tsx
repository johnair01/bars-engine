'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: { background: 'rgb(24 24 27)', border: '1px solid rgb(63 63 70)', color: 'rgb(228 228 231)' },
        classNames: { toast: 'border-zinc-700 bg-zinc-900 text-zinc-200' },
      }}
    />
  )
}
