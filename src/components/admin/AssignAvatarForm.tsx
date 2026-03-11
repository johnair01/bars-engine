'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { assignAvatarToPlayer } from '@/actions/admin'
import { deriveAvatarConfig, type AvatarConfig } from '@/lib/avatar-utils'
import { Avatar } from '@/components/Avatar'

type Player = { id: string; name: string; contactValue?: string }
type Nation = { id: string; name: string }
type Archetype = { id: string; name: string }

const BASE_VARIANTS = [
    { value: '', label: 'Default (from pronouns)' },
    { value: 'default', label: 'Default' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'neutral', label: 'Neutral' },
] as const

interface AssignAvatarFormProps {
    players: Player[]
    nations: Nation[]
    archetypes: Archetype[]
    onSuccess?: () => void
}

export function AssignAvatarForm({ players, nations, archetypes, onSuccess }: AssignAvatarFormProps) {
    const router = useRouter()
    const [playerId, setPlayerId] = useState('')
    const [nationId, setNationId] = useState('')
    const [archetypeId, setArchetypeId] = useState('')
    const [genderKey, setGenderKey] = useState<string>('')
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [isPending, startTransition] = useTransition()

    const previewConfig = useMemo(() => {
        if (!nationId && !archetypeId) {
            return JSON.stringify({
                nationKey: '',
                archetypeKey: '',
                variant: 'default',
                genderKey: (genderKey as AvatarConfig['genderKey']) || 'default',
            } satisfies AvatarConfig)
        }
        return deriveAvatarConfig(nationId || null, archetypeId || null, null, {
            nationName: nations.find((n) => n.id === nationId)?.name,
            archetypeName: archetypes.find((p) => p.id === archetypeId)?.name,
            genderKey: genderKey
                ? (genderKey as 'male' | 'female' | 'neutral' | 'default')
                : undefined,
        })
    }, [nationId, archetypeId, genderKey, nations, archetypes])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        if (!playerId) {
            setMessage({ type: 'error', text: 'Select a player' })
            return
        }
        if (!nationId && !archetypeId) {
            setMessage({ type: 'error', text: 'Select at least one nation or archetype' })
            return
        }

        startTransition(async () => {
            const result = await assignAvatarToPlayer(playerId, {
                nationId: nationId || undefined,
                archetypeId: archetypeId || undefined,
                genderKey: genderKey ? (genderKey as 'male' | 'female' | 'neutral' | 'default') : undefined,
            })
            if ('error' in result) {
                setMessage({ type: 'error', text: result.error ?? 'Unknown error' })
                return
            }
            setMessage({ type: 'success', text: 'Avatar assigned.' })
            router.refresh()
            onSuccess?.()
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4"
        >
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Assign Avatar (for testing)
            </h3>
            <p className="text-xs text-zinc-500">
                Manually set avatar config on a player to verify sprite stacking without running the quest flow.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Preview</span>
                    <Avatar
                        player={{
                            name: 'Preview',
                            avatarConfig: previewConfig ?? undefined,
                        }}
                        size="xl"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Player</label>
                    <select
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50"
                    >
                        <option value="">Select player...</option>
                        {players.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.contactValue ? `(${p.contactValue})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Nation</label>
                    <select
                        value={nationId}
                        onChange={(e) => setNationId(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50"
                    >
                        <option value="">None</option>
                        {nations.map((n) => (
                            <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Archetype</label>
                    <select
                        value={archetypeId}
                        onChange={(e) => setArchetypeId(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50"
                    >
                        <option value="">None</option>
                        {archetypes.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Base variant</label>
                    <select
                        value={genderKey}
                        onChange={(e) => setGenderKey(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500/50"
                    >
                        {BASE_VARIANTS.map((v) => (
                            <option key={v.value || 'empty'} value={v.value}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        {isPending ? 'Assigning...' : 'Assign Avatar'}
                    </button>
                </div>
            </div>
            {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                </p>
            )}
        </form>
    )
}
