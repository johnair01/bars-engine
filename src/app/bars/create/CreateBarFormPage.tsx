'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { uploadBarAsset } from '@/lib/asset-upload-client'
import { createPlayerBar, createBarForUpload } from '@/actions/bars'
import {
    ELEMENT_TOKENS,
    elementCssVars,
    altitudeCssVars,
    type ElementKey,
} from '@/lib/ui/card-tokens'

const ELEMENT_ORDER: ElementKey[] = ['fire', 'water', 'wood', 'metal', 'earth']

// Neutral, un-tinted card vars (no element chosen yet) — muted graphite frame, no glow.
const UNTINTED_VARS: Record<string, string> = {
    '--element-frame': '#3f3f46',
    '--element-glow': 'transparent',
    '--element-gem': '#6b6965',
}

/** Cheap, immutable provenance phrase derived from the capture hour. */
function timeOfDayPhrase(d: Date): string {
    const h = d.getHours()
    if (h < 5) return 'night'
    if (h < 8) return 'dawn'
    if (h < 11) return 'morning'
    if (h < 14) return 'midday'
    if (h < 17) return 'afternoon'
    if (h < 20) return 'dusk'
    if (h < 23) return 'evening'
    return 'night'
}

function formatClock(d: Date): string {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function CreateBarFormPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [content, setContent] = useState('')
    const [fieldTint, setFieldTint] = useState<ElementKey | null>(null)
    const [showMedia, setShowMedia] = useState(false)
    const [hasPhotoFront, setHasPhotoFront] = useState(false)
    const [hasPhotoBack, setHasPhotoBack] = useState(false)
    // Confirmation (Screen B) — set once a BAR is kept.
    const [kept, setKept] = useState<{ id: string; text: string } | null>(null)

    // Provenance is rendered client-side after mount to avoid hydration drift.
    const [now, setNow] = useState<Date | null>(null)
    useEffect(() => {
        setNow(new Date())
    }, [])

    const cardVars = useMemo<Record<string, string>>(() => {
        const base = fieldTint ? elementCssVars(fieldTint) : UNTINTED_VARS
        return { ...base, ...altitudeCssVars('neutral') }
    }, [fieldTint])

    const hasText = content.trim().length >= 1
    const hasPhoto = hasPhotoFront || hasPhotoBack
    const canKeep = (hasText || hasPhoto) && !isPending

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setIsPending(true)

        const form = e.currentTarget
        const formData = new FormData(form)
        const text = (formData.get('content') as string || '').trim()
        const tags = (formData.get('tags') as string || '').trim()
        const socialLinks = (formData.get('socialLinks') as string || '').trim()
        const photoFront = formData.get('photoFront') as File | null
        const photoBack = formData.get('photoBack') as File | null
        const photosPresent = (photoFront && photoFront.size > 0) || (photoBack && photoBack.size > 0)

        try {
            if (photosPresent) {
                const createResult = await createBarForUpload({
                    content: text,
                    tags,
                    socialLinks,
                    hasPhotos: true,
                    fieldTint: fieldTint ?? undefined,
                })
                if (createResult.error) {
                    setError(createResult.error)
                    return
                }
                if (!createResult.barId) {
                    setError('Failed to keep this BAR')
                    return
                }
                const uploads: Promise<unknown>[] = []
                if (photoFront && photoFront.size > 0) {
                    uploads.push(uploadBarAsset(photoFront, { barId: createResult.barId, side: 'front' }))
                }
                if (photoBack && photoBack.size > 0) {
                    uploads.push(uploadBarAsset(photoBack, { barId: createResult.barId, side: 'back' }))
                }
                await Promise.all(uploads)
                setKept({ id: createResult.barId, text: text || 'Photo' })
            } else {
                const result = await createPlayerBar(null, formData)
                if (result?.error) {
                    setError(result.error)
                    return
                }
                if (result?.success && result.barId) {
                    setKept({ id: result.barId, text })
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Could not keep this BAR'
            setError(msg)
        } finally {
            setIsPending(false)
        }
    }

    // ─── Screen B — Kept confirmation ────────────────────────────────────────
    if (kept) {
        return (
            <div className="flex flex-col items-center text-center gap-6 py-8">
                <div
                    className="relative flex items-center justify-center w-20 h-20 rounded-full"
                    style={{
                        ...elementCssVars('wood'),
                        background: 'color-mix(in srgb, var(--element-glow) 14%, #1a1a18)',
                        boxShadow: '0 0 28px 6px color-mix(in srgb, var(--element-glow) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                >
                    <span className="text-3xl" style={{ color: 'var(--element-gem)' }}>◇</span>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-[#e8e6e0] tracking-tight">A seed is on the board</h2>
                    <p className="text-[#a09e98] text-sm max-w-xs">
                        Kept as a <span className="font-mono text-[#e8e6e0]">captured</span> seed, provenance locked.
                        Tune it whenever you&apos;re ready — or leave it to compost.
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <p className="text-[10px] uppercase tracking-widest font-mono text-[#6b6965] mb-1.5">Just kept</p>
                    <div
                        className="cultivation-card text-left px-4 py-3"
                        style={{ ...UNTINTED_VARS, ...altitudeCssVars('dissatisfied') }}
                    >
                        <p className="text-[#e8e6e0] text-sm whitespace-pre-wrap line-clamp-3">{kept.text}</p>
                    </div>
                </div>

                <div className="w-full max-w-sm flex flex-col gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => { router.push('/bars'); router.refresh() }}
                        className="w-full py-3 px-4 rounded-lg font-bold text-white transition active:scale-[0.97]"
                        style={{ background: '#7c3aed', boxShadow: '0 0 18px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                    >
                        To the board
                    </button>
                    <Link
                        href={`/bars/${kept.id}/tune`}
                        className="w-full py-3 px-4 rounded-lg text-center text-[#a09e98] border border-white/10 hover:text-[#e8e6e0] hover:border-white/20 transition"
                    >
                        Tune now →
                    </Link>
                </div>
            </div>
        )
    }

    // ─── Screen A — Capture ──────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-5" encType="multipart/form-data">
            {/* Locked provenance chip */}
            <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden />
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#6b6965]">provenance locked</span>
                <span className="text-[11px] font-mono text-[#a09e98] tabular-nums">
                    {now ? `${formatClock(now)} · ${timeOfDayPhrase(now)}` : '—'}
                </span>
            </div>

            {/* The blank card */}
            <div className="relative cultivation-card overflow-hidden" style={cardVars}>
                <div className="card-frame-gradient" aria-hidden />
                {fieldTint && <div className="card-corner-glow" aria-hidden />}
                <div className="relative z-[1] p-4">
                    <textarea
                        name="content"
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="A line. A scrap. Whatever wants to go on the board."
                        className="w-full bg-transparent border-0 outline-none resize-y text-[18px] leading-relaxed text-[#e8e6e0] placeholder:text-[#6b6965]"
                    />
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] uppercase tracking-widest font-mono text-[#6b6965]">untuned seed</span>
                        {fieldTint && (
                            <span className="text-sm" style={{ color: 'var(--element-gem)' }}>
                                {ELEMENT_TOKENS[fieldTint].sigil}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Carry the field tint to the no-photo (createPlayerBar) path */}
            <input type="hidden" name="fieldTint" value={fieldTint ?? ''} />

            {/* Field tint — optional */}
            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-mono text-[#6b6965]">
                    Field tint — optional, pre-tunes the element
                </p>
                <div className="flex gap-2">
                    {ELEMENT_ORDER.map((el) => {
                        const t = ELEMENT_TOKENS[el]
                        const selected = fieldTint === el
                        return (
                            <button
                                key={el}
                                type="button"
                                aria-pressed={selected}
                                aria-label={el}
                                onClick={() => setFieldTint(selected ? null : el)}
                                className="flex-1 h-11 rounded-md text-lg transition active:scale-[0.97]"
                                style={{
                                    color: selected ? t.gem : '#a09e98',
                                    background: selected ? `color-mix(in srgb, ${t.frame} 20%, transparent)` : 'rgba(255,255,255,0.02)',
                                    boxShadow: selected
                                        ? `inset 0 0 0 1.5px ${t.frame}, 0 0 10px color-mix(in srgb, ${t.glow} 40%, transparent)`
                                        : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                                }}
                            >
                                {t.sigil}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Media row — visual affordances reveal the existing photo / inspiration paths */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setShowMedia((s) => !s)}
                    className="flex-1 py-2.5 rounded-md text-sm text-[#a09e98] border border-white/[0.08] hover:border-white/20 hover:text-[#e8e6e0] transition"
                >
                    ◳ Photo
                </button>
                <button
                    type="button"
                    onClick={() => setShowMedia((s) => !s)}
                    className="flex-1 py-2.5 rounded-md text-sm text-[#a09e98] border border-white/[0.08] hover:border-white/20 hover:text-[#e8e6e0] transition"
                >
                    ❝ Inspiration
                </button>
            </div>

            <div className={showMedia ? 'space-y-4' : 'sr-only'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 min-w-0">
                        <label className="block text-xs text-[#6b6965]">Front photo</label>
                        <input
                            name="photoFront"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => setHasPhotoFront(!!e.target.files?.length)}
                            className="block w-full max-w-full min-w-0 bg-black/40 border border-white/[0.08] rounded-md px-3 py-2 text-[#e8e6e0]/80 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#7c3aed]/80 file:text-white file:text-xs"
                        />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <label className="block text-xs text-[#6b6965]">Back photo</label>
                        <input
                            name="photoBack"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => setHasPhotoBack(!!e.target.files?.length)}
                            className="block w-full max-w-full min-w-0 bg-black/40 border border-white/[0.08] rounded-md px-3 py-2 text-[#e8e6e0]/80 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#7c3aed]/80 file:text-white file:text-xs"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-[#6b6965]">Inspiration links (optional)</label>
                    <textarea
                        name="socialLinks"
                        rows={2}
                        placeholder="Paste URLs, one per line (max 5). YouTube, Spotify, Instagram, Twitter/X, Vimeo, Substack."
                        className="w-full bg-black/40 border border-white/[0.08] rounded-md px-3 py-2 text-[#e8e6e0]/80 placeholder:text-[#6b6965] outline-none resize-y text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-xs text-[#6b6965]">Intent (optional)</label>
                    <input
                        name="tags"
                        type="text"
                        maxLength={200}
                        placeholder="quest, reflection, gift..."
                        className="w-full bg-black/40 border border-white/[0.08] rounded-md px-3 py-2 text-[#e8e6e0] outline-none text-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">{error}</div>
            )}

            {/* CTA */}
            <div className="space-y-2 pt-1">
                <button
                    type="submit"
                    disabled={!canKeep}
                    className="w-full py-3.5 px-4 rounded-lg font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed"
                    style={
                        canKeep
                            ? { background: '#7c3aed', boxShadow: '0 0 18px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)' }
                            : { background: '#1a1a18', color: '#6b6965', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }
                    }
                >
                    {isPending ? 'Keeping…' : 'Keep · tune later'}
                </button>
                <p className="text-center text-xs text-[#6b6965]">
                    Kept as a <span className="font-mono text-[#a09e98]">captured</span> seed. Tuning is never required to keep.
                </p>
            </div>
        </form>
    )
}
