'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { captureBar } from '@/actions/capture-bar'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

const ELEMENTS: Array<{ key: ElementKey; sigil: string; label: string }> = [
    { key: 'fire',  sigil: '火', label: 'Fire' },
    { key: 'water', sigil: '水', label: 'Water' },
    { key: 'wood',  sigil: '木', label: 'Wood' },
    { key: 'metal', sigil: '金', label: 'Metal' },
    { key: 'earth', sigil: '土', label: 'Earth' },
]

interface SimpleCaptureFormProps {
    defaultText?: string
    campaignRef?: string
}

export function SimpleCaptureForm({ defaultText = '', campaignRef }: SimpleCaptureFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [content, setContent] = useState(defaultText)
    const [element, setElement] = useState<ElementKey | null>(null)
    const [error, setError] = useState<string | null>(null)

    function handleKeep() {
        const trimmed = content.trim()
        if (!trimmed) {
            setError('Add a line to capture')
            return
        }
        setError(null)
        startTransition(async () => {
            const result = await captureBar({
                content: trimmed,
                destination: 'hand',
            })
            if ('error' in result) {
                setError(result.error)
                return
            }
            // Held in the Hand by default; a full Hand parks it in the Vault
            // (Fork A — silent fallback, no overflow modal on this surface).
            const dest = 'placedIn' in result && result.placedIn === 'hand' ? 'hand' : 'vault'
            const barId = result.barId
            const titleParam = encodeURIComponent(trimmed.split('\n')[0].slice(0, 60))
            router.push(`/bars/kept?barId=${barId}&dest=${dest}&title=${titleParam}`)
        })
    }

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'var(--bars-bg-base, #0a0908)' }}
        >
            {/* Top chrome */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
                <button
                    onClick={() => router.back()}
                    className="text-sm"
                    style={{ color: 'var(--bars-text-secondary, #a09e98)' }}
                >
                    ← Back
                </button>
                <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--bars-text-primary, #e8e6e0)' }}
                >
                    Capture a BAR
                </span>
            </div>

            <div className="flex flex-col gap-5 px-4 flex-1 pb-32">

                {/* Main textarea */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: element
                            ? `1px solid ${ELEMENT_TOKENS[element].cssVarColor}55`
                            : '1px solid rgba(255,255,255,0.08)',
                        transition: 'border-color 0.2s',
                    }}
                >
                    <textarea
                        value={content}
                        onChange={(e) => { setContent(e.target.value); setError(null) }}
                        placeholder="What happened? What are you noticing? What wants to move?"
                        rows={7}
                        className="w-full px-4 py-4 text-sm leading-relaxed resize-none outline-none bg-transparent"
                        style={{ color: '#e8e6e0' }}
                        autoFocus
                    />
                </div>

                {/* Element tint (optional) */}
                <div>
                    <p
                        className="text-xs uppercase tracking-widest mb-2"
                        style={{ color: 'var(--bars-text-muted, #6b6965)' }}
                    >
                        Field tint — optional
                    </p>
                    <div className="flex gap-2">
                        {ELEMENTS.map(({ key, sigil, label }) => {
                            const token = ELEMENT_TOKENS[key]
                            const active = element === key
                            return (
                                <button
                                    key={key}
                                    onClick={() => setElement(active ? null : key)}
                                    className="flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-all duration-150"
                                    title={label}
                                    style={{
                                        background: active ? token.cssVarColor + '22' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${active ? token.cssVarColor : 'rgba(255,255,255,0.08)'}`,
                                    }}
                                >
                                    <span className="text-lg">{sigil}</span>
                                    <span
                                        className="text-[10px]"
                                        style={{ color: active ? token.cssVarColor : '#6b6965' }}
                                    >
                                        {label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {campaignRef && (
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                            background: 'rgba(124,58,237,0.1)',
                            border: '1px solid rgba(124,58,237,0.25)',
                        }}
                    >
                        <span className="text-xs" style={{ color: '#a78bfa' }}>
                            Campaign: {campaignRef}
                        </span>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-400">{error}</p>
                )}
            </div>

            {/* Sticky CTAs */}
            <div
                className="fixed bottom-0 left-0 right-0 flex flex-col gap-2 px-4 py-4"
                style={{
                    background: 'linear-gradient(to top, #0a0908 80%, transparent)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <button
                    onClick={handleKeep}
                    disabled={isPending || !content.trim()}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{
                        background: content.trim() ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.06)',
                        border: content.trim()
                            ? '1px solid rgba(167,139,250,0.6)'
                            : '1px solid rgba(255,255,255,0.08)',
                        color: content.trim() ? '#e8e6e0' : '#6b6965',
                        opacity: isPending ? 0.6 : 1,
                    }}
                >
                    {isPending ? 'Keeping…' : 'Keep · tune later'}
                </button>
                <button
                    onClick={() => router.push('/bars/capture')}
                    className="w-full py-2.5 rounded-xl text-sm text-center"
                    style={{
                        background: 'transparent',
                        color: '#6b6965',
                    }}
                >
                    Open canvas →
                </button>
            </div>
        </div>
    )
}
