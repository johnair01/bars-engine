'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { uploadSpriteAsset } from '@/actions/admin'
import { slugifyName } from '@/lib/avatar-utils'
import { getSpriteDirForLayer } from '@/lib/avatar-parts'

type SpriteAssetsData = {
    byLayer: Record<string, { expected: string[]; existing: string[] }>
    nations: { name: string }[]
    archetypes: { name: string }[]
}

const LAYERS = ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'] as const
const BASE_KEYS = ['male', 'female', 'neutral', 'default']

export function SpriteAssetsClient({ data }: { data: SpriteAssetsData }) {
    const router = useRouter()
    const [selectedLayer, setSelectedLayer] = useState<string>('base')
    const [keyInput, setKeyInput] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const getKeysForLayer = (layer: string): string[] => {
        if (layer === 'base') return BASE_KEYS
        if (layer === 'nation_body' || layer === 'nation_accent') {
            return data.nations.map((n) => slugifyName(n.name))
        }
        if (layer === 'archetype_outfit' || layer === 'archetype_accent') {
            return data.archetypes.map((p) => slugifyName(p.name))
        }
        return []
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        if (!file) {
            setError('Please select a PNG file')
            return
        }
        const key = keyInput.trim() || (selectedLayer === 'base' ? 'default' : '')
        if (!key && selectedLayer !== 'base') {
            setError('Please enter a key or select from expected keys')
            return
        }

        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.set('layer', selectedLayer)
                formData.set('key', key)
                formData.set('file', file)
                await uploadSpriteAsset(formData)
                setSuccess(`Uploaded ${selectedLayer}/${key}.png`)
                setFile(null)
                setKeyInput('')
                router.refresh()
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed')
            }
        })
    }

    return (
        <div className="space-y-8">
            {/* Layer browser */}
            {LAYERS.map((layer) => {
                const { expected, existing } = data.byLayer[layer] ?? { expected: [], existing: [] }
                const missing = expected.filter((k) => !existing.includes(k))
                const extra = existing.filter((k) => !expected.includes(k))

                return (
                    <section key={layer} className="space-y-4">
                        <h2 className="text-xl font-semibold text-white capitalize">
                            {layer.replace(/_/g, ' ')}
                        </h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                            {existing.map((key) => (
                                <div
                                    key={key}
                                    className="flex flex-col items-center gap-1 p-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                                >
                                    <img
                                        src={`/sprites/parts/${getSpriteDirForLayer(layer)}/${key}.png`}
                                        alt={key}
                                        className="w-12 h-12 object-contain rounded"
                                    />
                                    <span className="text-xs text-zinc-400 truncate w-full text-center">
                                        {key}
                                    </span>
                                </div>
                            ))}
                            {missing.map((key) => (
                                <div
                                    key={key}
                                    className="flex flex-col items-center gap-1 p-2 bg-zinc-900/50 border border-amber-900/50 rounded-lg border-dashed"
                                    title="Missing - expected from Nation/Playbook"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded text-zinc-500 text-xs">
                                        ?
                                    </div>
                                    <span className="text-xs text-amber-500 truncate w-full text-center">
                                        {key}
                                    </span>
                                </div>
                            ))}
                            {extra.map((key) => (
                                <div
                                    key={key}
                                    className="flex flex-col items-center gap-1 p-2 bg-zinc-900 border border-zinc-600 rounded-lg"
                                    title="Extra - not in expected list"
                                >
                                    <img
                                        src={`/sprites/parts/${getSpriteDirForLayer(layer)}/${key}.png`}
                                        alt={key}
                                        className="w-12 h-12 object-contain rounded"
                                    />
                                    <span className="text-xs text-zinc-500 truncate w-full text-center">
                                        {key}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            })}

            {/* Upload form */}
            <section className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h2 className="text-xl font-semibold text-white">Upload Sprite</h2>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Layer</label>
                            <select
                                value={selectedLayer}
                                onChange={(e) => {
                                    setSelectedLayer(e.target.value)
                                    setKeyInput('')
                                }}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            >
                                {LAYERS.map((l) => (
                                    <option key={l} value={l}>
                                        {l.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Key</label>
                            <input
                                type="text"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder={
                                    selectedLayer === 'base'
                                        ? 'default, male, female, neutral'
                                        : 'e.g. bold-heart'
                                }
                                list={`keys-${selectedLayer}`}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                            />
                            <datalist id={`keys-${selectedLayer}`}>
                                {getKeysForLayer(selectedLayer).map((k) => (
                                    <option key={k} value={k} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">PNG File</label>
                            <input
                                type="file"
                                accept="image/png"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-purple-600 file:text-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {isPending ? 'Uploading…' : 'Upload'}
                    </button>
                </form>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {success && <p className="text-green-400 text-sm">{success}</p>}
            </section>
        </div>
    )
}
