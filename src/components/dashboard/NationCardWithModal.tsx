'use client'

/**
 * NationCardWithModal — Nation identity card with expandable detail modal.
 *
 * Uses CultivationCard as the rendering primitive (three-channel encoding).
 * Element resolution follows the CultivationCard priority chain:
 *   1. Validated `element` prop (per-card override — e.g. from player.nation.element)
 *   2. NationProvider context element (player's current nation)
 *   3. 'earth' safe default (CultivationCard's own fallback)
 *
 * Interior text accent is derived from useNation() — consistent with the
 * card's resolved element so textAccent always matches the frame/glow channel.
 *
 * No inline palettes. All token derivation via ELEMENT_TOKENS (card-tokens.ts).
 * No local 'earth' fallback — invalid/absent element defers to CultivationCard.
 */

import { useState } from 'react'
import { NationModal } from './NationModal'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { useNation } from '@/lib/ui/nation-provider'

// ─── Types ────────────────────────────────────────────────────────────────────

type NationCardWithModalProps = {
    nation: { id: string; name: string; description: string }
    /**
     * Wuxing element — overrides NationProvider context when provided and valid.
     * Accepts raw DB string (player.nation.element) — validated internally.
     * When absent or unrecognised, CultivationCard inherits from NationProvider context.
     * Explicitly typed string|null to match Prisma Nation.element field type.
     */
    element?: string | null
}

// ─── Element Validation ───────────────────────────────────────────────────────
// Returns ElementKey when valid, undefined when absent or unrecognised.
// undefined signals CultivationCard to fall through to the NationProvider context.
// No local 'earth' fallback — that fallback belongs to CultivationCard's priority chain.

const VALID_ELEMENTS: ReadonlyArray<ElementKey> = ['fire', 'water', 'wood', 'metal', 'earth']

function validateElement(el: string | null | undefined): ElementKey | undefined {
    if (!el) return undefined
    return VALID_ELEMENTS.includes(el as ElementKey) ? (el as ElementKey) : undefined
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NationCardWithModal({ nation, element }: NationCardWithModalProps) {
    const [modalOpen, setModalOpen] = useState(false)

    // Validate element prop — undefined when absent or invalid.
    // CultivationCard's element prop is optional; undefined means "use context or earth fallback".
    const validatedElement = validateElement(element)

    // Access NationProvider context for interior text token derivation.
    // textAccent mirrors CultivationCard's resolved element so visual channels are consistent:
    //   1. validatedElement (explicit prop override) → prop element's textAccent
    //   2. contextElement   (NationProvider)         → context element's textAccent
    //   3. 'earth'          (safe fallback)          → earth textAccent
    const { element: contextElement } = useNation()
    const textAccentElement: ElementKey = validatedElement ?? contextElement ?? 'earth'
    const textAccent = ELEMENT_TOKENS[textAccentElement].textAccent

    return (
        <>
            <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="hover:opacity-80 transition text-left"
                aria-label={`Open ${nation.name} nation details`}
            >
                {/*
                  element={validatedElement} — undefined when invalid/absent.
                  CultivationCard reads NationProvider context when element is undefined.
                  Three-channel encoding: element → color, altitude neutral, stage seed.
                */}
                <CultivationCard
                    element={validatedElement}
                    altitude="neutral"
                    stage="seed"
                    className="px-4 py-2"
                    aria-label={`${nation.name} nation — ${textAccentElement} element`}
                >
                    <div className={`text-[10px] uppercase tracking-widest mb-1 ${textAccent}`}>
                        Nation
                    </div>
                    <div className={`font-bold ${textAccent}`}>
                        {nation.name}
                    </div>
                </CultivationCard>
            </button>

            <NationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                nation={nation}
            />
        </>
    )
}
