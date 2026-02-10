'use client'

import { useState } from 'react'
import { castIChing } from '@/actions/cast-iching'
import { useRouter } from 'next/navigation'

type Hexagram = {
    id: number
    name: string
    tone: string
    text: string
}

interface CastingRitualProps {
    mode?: 'page' | 'modal'
    onComplete: (hexagramId: number) => Promise<void>
    onCancel?: () => void
}

// Simple hexagram line visualization
function HexagramLines({ id, animate }: { id: number, animate: boolean }) {
    // Generate 6 lines from hexagram ID (binary representation)
    const lines = []
    let num = id
    for (let i = 0; i < 6; i++) {
        lines.unshift(num % 2 === 1) // true = solid (yang), false = broken (yin)
        num = Math.floor(num / 2)
    }

    return (
        <div className="flex flex-col gap-2 items-center">
            {lines.map((solid, i) => (
                <div
                    key={i}
                    className={`h-3 transition-all duration-500 ${animate ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                >
                    {solid ? (
                        <div className="w-24 h-3 bg-yellow-400 rounded-sm" />
                    ) : (
                        <div className="flex gap-3">
                            <div className="w-10 h-3 bg-yellow-400 rounded-sm" />
                            <div className="w-10 h-3 bg-yellow-400 rounded-sm" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export function CastingRitual({ mode = 'page', onComplete, onCancel }: CastingRitualProps) {
    const router = useRouter()
    const [phase, setPhase] = useState<'ready' | 'casting' | 'revealed' | 'accepted'>('ready')
    const [hexagram, setHexagram] = useState<Hexagram | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCast = async () => {
        setPhase('casting')
        setError(null)

        // Dramatic pause
        await new Promise(r => setTimeout(r, 2000))

        const result = await castIChing()

        if (result.error) {
            setError(result.error)
            setPhase('ready')
            return
        }

        if (result.hexagram) {
            setHexagram(result.hexagram)
            setPhase('revealed')
        }
    }

    const handleAccept = async () => {
        if (!hexagram) return
        setIsSubmitting(true)

        try {
            await onComplete(hexagram.id)
            setMessage('The Oracle has spoken.')

            setPhase('accepted')

            // Redirect or close after delay
            setTimeout(() => {
                if (mode === 'page') router.push('/')
                // If modal, parent handles closing via state change or we stay on accepted state
            }, 2000)

        } catch (e: any) {
            setError(e.message)
            setIsSubmitting(false)
        }
    }

    const handleCastAnother = () => {
        setHexagram(null)
        setPhase('ready')
        setMessage(null)
    }

    return (
        <div className={`flex flex-col items-center justify-center ${mode === 'page' ? 'min-h-[60vh]' : 'p-4'}`}>
            {phase === 'ready' && (
                <div className="text-center space-y-8">
                    <div className="space-y-4">
                        {mode === 'page' && <h2 className="text-3xl font-bold text-white">The I Ching Awaits</h2>}
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Cast the yarrow stalks to receive guidance. The hexagram will illuminate your path.
                        </p>
                    </div>

                    <button
                        onClick={handleCast}
                        className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-yellow-900/30 hover:scale-105"
                    >
                        ✧ Cast the I Ching ✧
                    </button>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}
                </div>
            )}

            {phase === 'casting' && (
                <div className="text-center space-y-8">
                    <div className="animate-pulse">
                        <div className="text-6xl mb-4">☰</div>
                        <p className="text-yellow-400 font-mono">Casting the yarrow stalks...</p>
                    </div>
                    <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 animate-[loading_2s_ease-in-out]"
                            style={{ animation: 'loading 2s ease-in-out forwards' }} />
                    </div>
                </div>
            )}

            {phase === 'revealed' && hexagram && (
                <div className="text-center space-y-8 w-full">
                    <div className="space-y-6">
                        <HexagramLines id={hexagram.id} animate={false} />

                        <div className="space-y-2">
                            <div className="text-sm text-yellow-500 font-mono uppercase tracking-wider">
                                Hexagram {hexagram.id}
                            </div>
                            <h2 className="text-3xl font-bold text-white">{hexagram.name}</h2>
                            <p className="text-lg text-zinc-400">{hexagram.tone}</p>
                        </div>

                        <div className="max-w-lg mx-auto p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                            <p className="text-zinc-300 italic leading-relaxed">{hexagram.text}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleCastAnother}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                            Cast Again
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition shadow-lg shadow-green-900/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin">↻</span>
                                    <span>Divining...</span>
                                </>
                            ) : (
                                <span>Accept Reading →</span>
                            )}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}
                </div>
            )}

            {phase === 'accepted' && (
                <div className="text-center space-y-6">
                    <div className="text-6xl">✓</div>
                    <h2 className="text-2xl font-bold text-green-400">{message || 'Wisdom Received'}</h2>
                    {mode === 'page' && <p className="text-zinc-500">Returning to dashboard...</p>}
                </div>
            )}

            <style jsx>{`
                @keyframes loading {
                    from { width: 0; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    )
}
