'use client'

import { useMemo, useState, useTransition } from 'react'
import { saveCharacterSprite } from '@/actions/character-sprite'
import type { WokaLayerCatalog, WokaLayerPart } from '@/lib/wa/layer-catalog'

const PARTS: WokaLayerPart[] = ['body', 'eyes', 'hair', 'clothes', 'hat', 'accessory']

const PART_LABELS: Record<WokaLayerPart, string> = {
  body: 'Body',
  eyes: 'Eyes',
  hair: 'Hair',
  clothes: 'Clothes',
  hat: 'Hat',
  accessory: 'Accessory',
}

const ERROR_LABELS: Record<string, string> = {
  unauthorized: 'Your session expired. Sign in again.',
  unknown_texture: 'That part is no longer available. Pick another.',
  no_player: 'No player record was found for this account.',
}

type Props = {
  catalog: WokaLayerCatalog
  nationKey?: string | null
  archetypeKey?: string | null
  initialLayers?: string[] | null
  isPending: boolean
  onContinue: () => void
}

function defaultId(
  catalog: WokaLayerCatalog,
  part: WokaLayerPart,
  nationKey?: string | null,
  archetypeKey?: string | null,
): string | undefined {
  if (part === 'body') return 'wa:body:warm'
  if (part === 'eyes') return 'wa:eyes:ink'
  if (part === 'hair') return 'wa:hair:black'
  if (part === 'clothes' && nationKey && archetypeKey) {
    return `wa:clothes:${nationKey}:${archetypeKey}`
  }
  if (part === 'hat' && nationKey) return `wa:hat:${nationKey}`
  if (part === 'accessory' && archetypeKey) return `wa:accessory:${archetypeKey}`
  return catalog.parts[part][0]?.id
}

function initialSelection(
  catalog: WokaLayerCatalog,
  initialLayers?: string[] | null,
  nationKey?: string | null,
  archetypeKey?: string | null,
): Partial<Record<WokaLayerPart, string>> {
  const selection: Partial<Record<WokaLayerPart, string>> = {}
  for (const part of PARTS) {
    const saved = initialLayers
      ?.map((id) => catalog.parts[part].find((texture) => texture.id === id))
      .find(Boolean)
    const id = saved?.id ?? defaultId(catalog, part, nationKey, archetypeKey)
    if (id) selection[part] = id
  }
  return selection
}

function composeUrl(selection: Partial<Record<WokaLayerPart, string>>): string {
  const params = new URLSearchParams()
  for (const part of PARTS) {
    const id = selection[part]
    if (id) params.set(part, id)
  }
  return `/api/woka/compose?${params.toString()}`
}

function LayerThumb({ path }: { path: string }) {
  return (
    <div
      aria-hidden
      className="h-14 w-14 shrink-0 rounded-md border border-zinc-700 bg-zinc-950"
      style={{
        backgroundImage: `url(${path})`,
        backgroundSize: '168px 224px',
        backgroundPosition: '-56px 0',
        imageRendering: 'pixelated',
      }}
    />
  )
}

export function OuroborosSpriteStep({
  catalog,
  nationKey,
  archetypeKey,
  initialLayers,
  isPending,
  onContinue,
}: Props) {
  const [selection, setSelection] = useState(() =>
    initialSelection(catalog, initialLayers, nationKey, archetypeKey),
  )
  const [activePart, setActivePart] = useState<WokaLayerPart>('body')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSave] = useTransition()

  const preview = useMemo(() => composeUrl(selection), [selection])
  const busy = isPending || isSaving

  const choose = (part: WokaLayerPart, id: string) => {
    setError(null)
    setSelection((current) => ({ ...current, [part]: id }))
  }

  const save = () => {
    setError(null)
    const textureIds = PARTS.map((part) => selection[part]).filter(
      (id): id is string => Boolean(id),
    )
    startSave(async () => {
      const result = await saveCharacterSprite({ textureIds })
      if (!result.success) {
        setError(ERROR_LABELS[result.error] ?? 'Could not save this body.')
        return
      }
      onContinue()
    })
  }

  const options = catalog.parts[activePart]

  return (
    <div className="space-y-6">
      <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
        Build your body
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Dress the character you chose</h2>
        <p className="text-zinc-400 text-sm">
          Nation and archetype set the first outfit. Change any layer you want; the dojo uses the
          same stack.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            {/* The compositor route returns a 96x128 sheet; show its idle frame. */}
            <div
              role="img"
              aria-label="Your character preview"
              className="mx-auto h-40 w-32 rounded-lg border border-zinc-800 bg-zinc-900"
              style={{
                backgroundImage: `url(${preview})`,
                backgroundSize: '288px 384px',
                backgroundPosition: '-96px 0',
                imageRendering: 'pixelated',
              }}
            />
          </div>
          {nationKey && archetypeKey && (
            <p className="text-xs text-zinc-500">
              Seeded from <span className="text-zinc-300">{nationKey}</span> ·{' '}
              <span className="text-zinc-300">{archetypeKey}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PARTS.map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setActivePart(part)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePart === part
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {PART_LABELS[part]}
              </button>
            ))}
          </div>

          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {options.map((texture) => {
              const selected = selection[activePart] === texture.id
              return (
                <button
                  key={texture.id}
                  type="button"
                  onClick={() => choose(activePart, texture.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
                    selected
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                  }`}
                >
                  <LayerThumb path={texture.path} />
                  <span className="min-w-0 text-xs text-zinc-300">{texture.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={busy || !selection.body}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {busy ? 'Saving...' : 'Use this body'}
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="px-4 py-3 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
