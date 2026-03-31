'use client'

import { useState } from 'react'
import { CastingRitual } from './CastingRitual'

export function DashboardCaster() {
    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-4 rounded-xl border border-yellow-800/50 bg-yellow-950/20 hover:border-yellow-600/60 hover:bg-yellow-900/20 text-yellow-500 transition-colors flex items-center justify-between gap-3"
            >
                <div>
                    <span className="text-xl mr-2">☰</span>
                    <span className="font-semibold text-white">Cast the I Ching</span>
                </div>
                <span className="text-lg opacity-60">→</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-yellow-800/50 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-yellow-900/20">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                    ✕
                </button>
                <div className="space-y-4">
                    <CastingRitual
                        mode="modal"
                        onCancel={() => setIsOpen(false)}
                    />
                </div>
            </div>
        </div>
    )
}
