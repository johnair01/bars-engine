'use client'

/**
 * PlantBarInGarden — the Hand/Vault → Garden affordance on the BAR detail page.
 * Opens a bottom sheet with the shared PlantTriad (desired outcome / where you are
 * now / where you want to be) and calls `plantBarToGarden`, which sets gardenId,
 * matures the seed, and frees any Hand slot. Shown only for an owner's not-yet-
 * planted BAR (the page gates on `canMoveHandVault`).
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlantTriad } from '@/components/plant/PlantTriad'
import { plantBarToGarden } from '@/actions/garden'

export function PlantBarInGarden({ barId }: { barId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(triad: { experienceIntent: string; dissatisfaction: string[]; satisfaction: string[] }) {
    setError(null)
    startTransition(async () => {
      const res = await plantBarToGarden({ barId, ...triad })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <h2 className="text-sm font-bold text-zinc-200">Plant in your Garden</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Name the arc — desired outcome, where you are now, where you want to be — and grow this BAR under today&rsquo;s lens.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 font-bold text-white transition-colors hover:bg-emerald-600"
      >
        Plant in Garden ❀
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.62)' }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full"
            style={{
              maxWidth: 432,
              background: 'var(--bars-surface-elevated)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 -20px 60px rgba(0,0,0,0.6)',
              padding: '10px 16px calc(16px + env(safe-area-inset-bottom))',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-3">
              <span style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--bars-line-strong)' }} />
            </div>
            <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
              Plant · grow it under today&rsquo;s lens
            </span>
            <h2 style={{ fontFamily: 'var(--bars-font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '6px 0 12px' }}>
              What is this for?
            </h2>

            <PlantTriad busy={pending} onSubmit={submit} />

            {error && (
              <p style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 10, color: '#e06b6b', margin: '10px 2px 0' }}>{error}</p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full"
              style={{ marginTop: 10, minHeight: 44, fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'transparent' }}
            >
              ← Close
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
