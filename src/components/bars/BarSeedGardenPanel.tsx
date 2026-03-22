'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MATURITY_PHASES,
  SOIL_KINDS,
  bsmCopy,
  effectiveMaturity,
  maturityLabel,
  parseSeedMetabolization,
  type MaturityPhase,
  type SoilKind,
} from '@/lib/bar-seed-metabolization'
import {
  compostBarSeed,
  nameBarSeedSoil,
  restoreBarSeedFromCompost,
  updateBarSeedMaturity,
} from '@/actions/bar-seed-metabolization'

type BarSeedGardenPanelProps = {
  barId: string
  seedMetabolization: string | null
  archivedAt: Date | null
}

export function BarSeedGardenPanel({ barId, seedMetabolization, archivedAt }: BarSeedGardenPanelProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [compostOpen, setCompostOpen] = useState(false)
  const [releaseDraft, setReleaseDraft] = useState('')

  const meta = useMemo(() => parseSeedMetabolization(seedMetabolization), [seedMetabolization])
  const maturity = effectiveMaturity(meta)
  const isComposted = archivedAt != null

  const soilValue = meta.soilKind ?? ''
  const contextNote = meta.contextNote ?? ''

  const run = async (fn: () => Promise<{ ok?: true; error?: string }>, okMsg?: string) => {
    startTransition(async () => {
      const r = await fn()
      if (r.error) {
        toast.error(r.error)
        return
      }
      if (okMsg) toast.success(okMsg)
      router.refresh()
    })
  }

  return (
    <section className="bg-teal-950/25 border border-teal-900/50 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span className="text-teal-400" aria-hidden>
            🌿
          </span>
          {bsmCopy.panelTitle}
        </h2>
        <p className="text-zinc-500 text-sm">{bsmCopy.panelHint}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-teal-600/90">{bsmCopy.soilLabel}</label>
        <select
          className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2"
          disabled={pending || isComposted}
          value={soilValue}
          onChange={(e) => {
            const v = e.target.value
            const soilKind = v === '' ? null : (v as SoilKind)
            void run(
              () => nameBarSeedSoil(barId, { soilKind }),
              v ? 'Soil updated' : 'Soil cleared'
            )
          }}
        >
          <option value="">{bsmCopy.soilUnset}</option>
          {SOIL_KINDS.map((k) => (
            <option key={k} value={k}>
              {k === 'campaign'
                ? bsmCopy.soilCampaign
                : k === 'thread'
                  ? bsmCopy.soilThread
                  : bsmCopy.soilHolding}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-teal-600/90">{bsmCopy.contextNoteLabel}</label>
        <textarea
          className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 min-h-[72px] placeholder:text-zinc-600"
          disabled={pending || isComposted}
          placeholder={bsmCopy.contextNotePlaceholder}
          defaultValue={contextNote}
          key={contextNote}
          onBlur={(e) => {
            const next = e.target.value.trim()
            if (next === (meta.contextNote ?? '').trim()) return
            void run(() => nameBarSeedSoil(barId, { soilKind: meta.soilKind ?? null, contextNote: next }))
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-teal-600/90">{bsmCopy.maturityLabel}</label>
        <select
          className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2"
          disabled={pending || isComposted}
          value={maturity}
          onChange={(e) => {
            const m = e.target.value as MaturityPhase
            void run(() => updateBarSeedMaturity(barId, { maturity: m }), 'Maturity saved')
          }}
        >
          {MATURITY_PHASES.map((p) => (
            <option key={p} value={p}>
              {maturityLabel(p)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-4">{bsmCopy.graduateHint}</p>

      {isComposted ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 space-y-3">
          <p className="text-sm text-amber-200/90 font-medium">{bsmCopy.restoreTitle}</p>
          <p className="text-xs text-zinc-500">{bsmCopy.restoreHint}</p>
          {meta.releaseNote ? (
            <p className="text-xs text-zinc-400 italic border-l-2 border-amber-900/40 pl-3">&ldquo;{meta.releaseNote}&rdquo;</p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void run(() => restoreBarSeedFromCompost(barId), 'Restored')}
            className="text-sm px-4 py-2 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white font-medium disabled:opacity-50"
          >
            {bsmCopy.restoreButton}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setCompostOpen((o) => !o)}
            className="text-sm font-medium text-zinc-300 hover:text-white"
          >
            {bsmCopy.compostTitle}
          </button>
          <p className="text-xs text-zinc-500">{bsmCopy.compostHint}</p>
          {compostOpen && (
            <>
              <textarea
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 min-h-[64px] placeholder:text-zinc-600"
                placeholder={bsmCopy.compostReleasePlaceholder}
                value={releaseDraft}
                onChange={(e) => setReleaseDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void run(
                    () => compostBarSeed(barId, { releaseNote: releaseDraft.trim() || null }),
                    'Composted with care'
                  )
                }
                className="text-sm px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium border border-zinc-600 disabled:opacity-50"
              >
                {bsmCopy.compostConfirm}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
