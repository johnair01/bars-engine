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

  const baseSlug = options?.slug ?? `encounter-${Date.now()}`
  const slug = await ensureUniqueSlug(baseSlug)
  const title = options?.title ?? `${template.name} (draft)`

  const adventure = await db.adventure.create({
    data: {
      slug,
      title,
      status: 'DRAFT',
      visibility: 'PRIVATE_QUEST',
      startNodeId: template.startNodeId,
    },
  })

  for (const slot of sortedSlots) {
    await db.passage.create({
      data: {
        adventureId: adventure.id,
        nodeId: slot.nodeId,
        text: `[Edit: ${slot.nodeId}]`,
        choices: '[]',
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
