import type { Metadata } from 'next'
import { GlossaryReader } from '@/components/deck/GlossaryReader'
import { GLOSSARY } from '@/lib/allyship-deck/glossary'

export const metadata: Metadata = {
  title: 'The Allyship Deck — Glossary',
  description: 'Plain-language definitions of every term on the Allyship Deck: the moves, faces, domains, channels, BARs, and core concepts.',
}

/**
 * @route /deck/glossary
 * @page /deck/glossary
 * @entity SYSTEM
 * @description Deep-linkable dictionary of every recurring deck term. Built from
 *   the canonical move-library data (plus a small authored set). Ungated
 *   reference material — terms on cards link here via `/deck/glossary#<id>`.
 * @permissions public
 * @energyCost 0 (read-only)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:/deck, ENERGY:N/A
 * @agentDiscoverable true
 * @example /deck/glossary#shaman
 */
export default function DeckGlossaryPage() {
  return <GlossaryReader terms={GLOSSARY} />
}
