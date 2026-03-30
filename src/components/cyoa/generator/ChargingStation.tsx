'use client'

import React from 'react'
import { EmotionChannel } from '@/lib/transformation-move-registry/types'

interface ChargingStationProps {
    currentCharge: EmotionChannel
    onChargeChange: (charge: EmotionChannel) => void
}

const CHARGES: { id: EmotionChannel; label: string; color: string; desc: string }[] = [
    { id: 'fear', label: 'Fear', color: 'text-purple-400', desc: 'Cautious, observant, safety-first.' },
    { id: 'anger', label: 'Anger', color: 'text-red-400', desc: 'Assertive, confrontational, energetic.' },
    { id: 'sadness', label: 'Sadness', color: 'text-blue-400', desc: 'Reflective, internalizing, grieving.' },
    { id: 'joy', label: 'Joy', color: 'text-yellow-400', desc: 'Expansive, playful, celebratory.' },
    { id: 'neutrality', label: 'Neutral', color: 'text-zinc-400', desc: 'Objective, grounded, steady.' },
]

export function ChargingStation({ currentCharge, onChargeChange }: ChargingStationProps) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-zinc-200 text-sm font-semibold mb-2">Charging Station</h3>
            <p className="text-zinc-500 text-xs mb-6 italic">How does this memory feel right now? This fuel dictates the robot's limbs.</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CHARGES.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => onChargeChange(c.id)}
                        className={`
              flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-300
              ${currentCharge === c.id
                                ? `bg-zinc-800 border-zinc-600 ${c.color} shadow-lg shadow-zinc-950/50 scale-[1.02]`
                                : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800/50'
                            }
            `}
                    >
                        <span className="text-sm font-bold mb-1">{c.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-4 p-3 rounded bg-zinc-950/50 border border-zinc-900">
                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                    <span className="text-zinc-400 uppercase mr-2">Effect:</span>
                    {CHARGES.find(c => c.id === currentCharge)?.desc}
                </p>
            </div>
        </div>
    )
}
