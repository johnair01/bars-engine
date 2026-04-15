'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type RecentBar = {
  id: string
  title: string
  description: string
  type: string
  createdAt: string
}

type QuestProposal = {
  questId: string
  presentingFace: string
  rationale: string[]
  sceneHint: string
  artifactPrize: {
    title: string
    line: string
    type: string
  }
}

type ResolveResponse = {
  collective: {
    kotterStage: number
    allyshipDomain: string | null
    campaignRef: string | null
  }
  player: {
    nationKey: string | null
    archetypeKey: string | null
  }
  proposals: QuestProposal[]
  meta: unknown
  sourceBar: { id: string; description: string } | null
}

export function Experiment5PlayShell({
  playerId,
  nations,
  sampleAssets,
  recentBars,
}: {
  playerId: string
  nations: string[]
  sampleAssets: string[]
  recentBars: RecentBar[]
}) {
  const [scene, setScene] = useState<'farm' | 'forest'>('farm')
  const [nation, setNation] = useState<string>(nations[0] ?? 'argyra')
  const [chargeText, setChargeText] = useState('I want to turn overwhelm into one useful action for the village.')
  const [loadingResolve, setLoadingResolve] = useState(false)
  const [loadingSeed, setLoadingSeed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolveData, setResolveData] = useState<ResolveResponse | null>(null)
  const [seededBarId, setSeededBarId] = useState<string | null>(null)

  const filteredAssets = useMemo(
    () => sampleAssets.filter((asset) => (scene === 'farm' ? asset.includes('_farm_') : asset.includes('_forest_'))),
    [sampleAssets, scene]
  )

  async function runResolve() {
    setLoadingResolve(true)
    setError(null)
    setSeededBarId(null)
    try {
      const res = await fetch('/api/play/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene,
          nationKey: nation,
          chargeText,
        }),
      })
      const json = (await res.json()) as ResolveResponse | { error?: string }
      if (!res.ok) {
        setResolveData(null)
        setError((json as { error?: string }).error ?? `Resolve failed (${res.status})`)
        return
      }
      setResolveData(json as ResolveResponse)
    } catch (e) {
      setResolveData(null)
      setError(e instanceof Error ? e.message : 'Resolve failed')
    } finally {
      setLoadingResolve(false)
    }
  }

  async function seedInteractionBar() {
    setLoadingSeed(true)
    setError(null)
    setSeededBarId(null)
    try {
      const title = `[exp5/${scene}] ${chargeText.slice(0, 42)}`
      const description = chargeText.trim() || 'Experiment 5 seed BAR'
      const res = await fetch('/api/bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barType: 'reflection',
          title,
          description,
          visibility: 'private',
          payload: {
            source: 'exp5-play-shell',
            scene,
            nation,
            playerId,
          },
        }),
      })
      const json = (await res.json()) as { error?: string; barId?: string }
      if (!res.ok || !json.barId) {
        setError(json.error ?? `Failed to seed BAR (${res.status})`)
        return
      }
      setSeededBarId(json.barId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to seed BAR')
    } finally {
      setLoadingSeed(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-zinc-400">Scene</div>
          <div className="inline-flex rounded-lg overflow-hidden border border-zinc-700">
            {(['farm', 'forest'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScene(s)}
                className={`px-3 py-1.5 text-xs ${
                  scene === s ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="text-xs text-zinc-400 ml-2" htmlFor="nation-select">
            Nation
          </label>
          <select
            id="nation-select"
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs"
            value={nation}
            onChange={(e) => setNation(e.target.value)}
          >
            {nations.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {filteredAssets.map((asset) => (
            <div key={asset} className="bg-zinc-900 border border-zinc-800 rounded p-2">
              <img
                src={`/api/play/sprites/${nation}/${asset}`}
                alt={`${nation} ${asset}`}
                className="w-12 h-12 image-rendering-pixelated"
              />
              <p className="text-[10px] text-zinc-500 mt-1 truncate">{asset.replace('exp3_', '')}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400" htmlFor="charge-text">
            Charge text
          </label>
          <textarea
            id="charge-text"
            value={chargeText}
            onChange={(e) => setChargeText(e.target.value)}
            className="w-full min-h-24 rounded-lg bg-zinc-900 border border-zinc-700 p-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runResolve}
            disabled={loadingResolve}
            className="px-3 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
          >
            {loadingResolve ? 'Resolving…' : 'Resolve quest proposals'}
          </button>
          <button
            type="button"
            onClick={seedInteractionBar}
            disabled={loadingSeed}
            className="px-3 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60"
          >
            {loadingSeed ? 'Seeding…' : 'Seed interaction BAR'}
          </button>
          {seededBarId ? (
            <Link href={`/bars/${seededBarId}`} className="px-3 py-2 text-sm rounded border border-amber-700 text-amber-300">
              Open seeded BAR
            </Link>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        {resolveData ? (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-400">
              Collective: Kotter {resolveData.collective.kotterStage} · domain {resolveData.collective.allyshipDomain ?? 'unset'} · campaign{' '}
              {resolveData.collective.campaignRef ?? 'unset'}
            </p>
            {resolveData.sourceBar ? (
              <p className="text-xs text-zinc-500">
                Source BAR: <Link href={`/bars/${resolveData.sourceBar.id}`}>{resolveData.sourceBar.id}</Link>
              </p>
            ) : null}
            <div className="space-y-2">
              {resolveData.proposals.map((proposal) => (
                <div key={`${proposal.questId}-${proposal.presentingFace}`} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <span className="text-zinc-300">Quest {proposal.questId}</span>
                    <span className="text-amber-300">{proposal.presentingFace}</span>
                  </div>
                  <p className="text-sm text-zinc-200 mt-1">{proposal.artifactPrize.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">{proposal.sceneHint}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Recent BAR context</h2>
        <p className="text-xs text-zinc-500">
          Adapter uses your latest BARs as matching signal when available.
        </p>
        <div className="space-y-2">
          {recentBars.length === 0 ? (
            <p className="text-xs text-zinc-600">No BARs yet.</p>
          ) : (
            recentBars.map((bar) => (
              <Link
                href={`/bars/${bar.id}`}
                key={bar.id}
                className="block border border-zinc-800 rounded p-2 hover:border-zinc-700"
              >
                <p className="text-xs text-zinc-400">{bar.type}</p>
                <p className="text-sm text-zinc-200 truncate">{bar.title}</p>
              </Link>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
