/**
 * Template Library — generate Adventures from reusable templates.
 * @see .specify/specs/template-library-draft-adventure/spec.md
 */

import { db } from '@/lib/db'

export type AdventureTemplate = Awaited<ReturnType<typeof db.adventureTemplate.findFirst>> extends infer T
  ? T extends null ? never : T
  : never

export interface PassageSlot {
  nodeId: string
  label?: string
  order: number
}

export interface GenerateOptions {
  title?: string
  slug?: string
  /** Top-level campaign ref (e.g. bruised-banana). Sets Adventure.campaignRef. */
  campaignRef?: string
  /** Subcampaign domain (e.g. DIRECT_ACTION). Sets Adventure.subcampaignDomain. */
  subcampaignDomain?: string
}

const FACE_PLACEHOLDER: Record<string, { face: string; guidance: string }> = {
  context: { face: 'Shaman', guidance: 'Ground the scene. What world does the player stand in?' },
  anomaly: { face: 'Challenger', guidance: 'Introduce tension. What disrupts or tests the player?' },
  choice: { face: 'Diplomat', guidance: 'Present options. What paths can the player take?' },
  response: { face: 'Regent', guidance: 'Resolve the moment. What outcome or ruling emerges?' },
  artifact: { face: 'Architect', guidance: 'Deliver a takeaway. What does the player carry forward?' },
}

export const FACE_COLORS: Record<string, { label: string; bg: string; text: string }> = {
  shaman:     { label: 'Shaman',     bg: 'bg-violet-500/15', text: 'text-violet-300' },
  challenger: { label: 'Challenger', bg: 'bg-red-500/15',    text: 'text-red-300'    },
  diplomat:   { label: 'Diplomat',   bg: 'bg-sky-500/15',    text: 'text-sky-300'    },
  regent:     { label: 'Regent',     bg: 'bg-amber-500/15',  text: 'text-amber-300'  },
  architect:  { label: 'Architect',  bg: 'bg-emerald-500/15',text: 'text-emerald-300'},
}

/** Derive the GM face for a passage slot from its nodeId. */
export function getFaceForNodeId(nodeId: string): { face: string; label: string; bg: string; text: string } {
  const prefix = nodeId.replace(/_\d+$/, '')
  const entry = FACE_PLACEHOLDER[prefix] ?? FACE_PLACEHOLDER['artifact']
  const colors = FACE_COLORS[entry.face.toLowerCase()] ?? FACE_COLORS['architect']
  return { face: entry.face.toLowerCase(), ...colors }
}

/** Return true if the passage text is still an unedited placeholder. */
export function isPlaceholderText(text: string): boolean {
  return Object.values(FACE_PLACEHOLDER).some(({ face, guidance }) =>
    text.startsWith(`${face}: ${guidance}`)
  ) || /^\[Edit: \S+\]$/.test(text.trim())
}

/** Return the campaign function guidance string for a passage slot (no face prefix). */
export function getGuidanceForNodeId(nodeId: string): string {
  const prefix = nodeId.replace(/_\d+$/, '')
  const entry = FACE_PLACEHOLDER[prefix] ?? FACE_PLACEHOLDER['artifact']
  return entry.guidance
}

/** Return face-specific placeholder text for a passage slot. */
export function getPlaceholderForSlot(nodeId: string): string {
  const prefix = nodeId.replace(/_\d+$/, '')
  const entry = FACE_PLACEHOLDER[prefix] ?? FACE_PLACEHOLDER['artifact']
  return `${entry.face}: ${entry.guidance} [Edit: replace with your content.]`
}

/** List all templates. */
export async function listTemplates() {
  return db.adventureTemplate.findMany({
    orderBy: { key: 'asc' },
  })
}

/** Generate a draft Adventure from a template. Creates Adventure + Passages with placeholder text. */
export async function generateFromTemplate(
  templateId: string,
  options?: GenerateOptions
) {
  const template = await db.adventureTemplate.findUnique({
    where: { id: templateId },
  })
  if (!template) throw new Error('Template not found')

  const slots = JSON.parse(template.passageSlots) as PassageSlot[]
  const sortedSlots = [...slots].sort((a, b) => a.order - b.order)

  const baseSlug =
    options?.slug ??
    (options?.subcampaignDomain
      ? `${options.campaignRef ?? 'campaign'}-${options.subcampaignDomain.toLowerCase()}-${Date.now()}`
      : `encounter-${Date.now()}`)
  const slug = await ensureUniqueSlug(baseSlug)
  const title =
    options?.title ??
    (options?.subcampaignDomain
      ? `${template.name} — ${options.subcampaignDomain.replace(/_/g, ' ')} (draft)`
      : `${template.name} (draft)`)

  const adventure = await db.adventure.create({
    data: {
      slug,
      title,
      status: 'DRAFT',
      visibility: 'PRIVATE_QUEST',
      startNodeId: template.startNodeId,
      campaignRef: options?.campaignRef ?? null,
      subcampaignDomain: options?.subcampaignDomain ?? null,
    },
  })

  for (let i = 0; i < sortedSlots.length; i++) {
    const slot = sortedSlots[i]
    const nextSlot = sortedSlots[i + 1]
    // Linear flow: each passage links to next (except artifact)
    const choices =
      nextSlot
        ? JSON.stringify([{ text: 'Continue', targetId: nextSlot.nodeId }])
        : '[]'
    await db.passage.create({
      data: {
        adventureId: adventure.id,
        nodeId: slot.nodeId,
        text: getPlaceholderForSlot(slot.nodeId),
        choices,
      },
    })
  }

  return adventure
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base
  let n = 0
  while (true) {
    const existing = await db.adventure.findUnique({ where: { slug } })
    if (!existing) return slug
    n++
    slug = `${base}-${n}`
  }
}

/** Promote a DRAFT Adventure to ACTIVE. */
export async function promoteDraftToActive(adventureId: string) {
  const adventure = await db.adventure.findUnique({
    where: { id: adventureId },
  })
  if (!adventure) throw new Error('Adventure not found')
  if (adventure.status !== 'DRAFT') throw new Error('Adventure is not a draft')

  return db.adventure.update({
    where: { id: adventureId },
    data: { status: 'ACTIVE' },
  })
}
