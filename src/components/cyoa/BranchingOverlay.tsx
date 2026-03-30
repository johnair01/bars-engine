'use client'

import { useEffect, useState } from 'react'

export function BranchingOverlay({ onComplete }: { onComplete: () => void }) {
    const [stage, setStage] = useState<'resonance' | 'shift' | 'complete'>('resonance')

    useEffect(() => {
        const t1 = setTimeout(() => setStage('shift'), 1000)
        const t2 = setTimeout(() => {
            setStage('complete')
            onComplete()
        }, 2000)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [onComplete])

    if (stage === 'complete') return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            {/* Background Dim */}
            <div className={`absolute inset-0 bg-purple-900/20 backdrop-blur-sm transition-opacity duration-1000 ${stage === 'shift' ? 'opacity-0' : 'opacity-100'}`} />

            {/* resonance Circle */}
            <div className={`relative w-64 h-64 border-2 border-purple-500 rounded-full transition-all duration-1000 ${stage === 'resonance' ? 'scale-100 opacity-100' : 'scale-[3] opacity-0'
                }`}>
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
            </div>

            {/* Narrative Shift Text */}
            <div className={`absolute text-white font-black italic uppercase tracking-tighter text-4xl transition-all duration-1000 transform ${stage === 'resonance' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                Yes-And
            </div>

            {/* Glitch Overlay (CSS only) */}
            <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-30">
                <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
            </div>
        </div>
    )
}
