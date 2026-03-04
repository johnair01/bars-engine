/**
 * K-Space Librarian: deterministic draft generation from BAR cluster.
 * Assembles DocEvidenceLinks + PlayerQuest inputs into RST body for a DocNode.
 */

import { db } from '@/lib/db'

const KIND_PRIORITY: Record<string, number> = {
    canon_statement: 3,
    instruction: 2,
    observation: 1,
    spec_clause: 3,
    lore: 2,
    schism: 0
}

export type AssembleDraftOptions = {
    docNodeId: string
    includeExistingBody?: boolean
}

export type AssembleDraftResult = {
    bodyRst: string
    evidenceCount: number
    kindsUsed: string[]
}

/**
 * Assemble a deterministic RST draft from DocEvidenceLinks and PlayerQuest inputs.
 * Evidence is sorted by kind priority (canon > instruction > observation), then weight.
 */
export async function assembleDraft(
    options: AssembleDraftOptions
): Promise<AssembleDraftResult> {
    const { docNodeId, includeExistingBody = false } = options

    const [docNode, links] = await Promise.all([
        db.docNode.findUnique({
            where: { id: docNodeId },
            select: { bodyRst: true, title: true }
        }),
        db.docEvidenceLink.findMany({
            where: { docNodeId },
            orderBy: [{ weight: 'desc' }, { id: 'asc' }]
        })
    ])

    if (!docNode) {
        return { bodyRst: '', evidenceCount: 0, kindsUsed: [] }
    }

    const playerQuestIds = links
        .map((l) => l.playerQuestId)
        .filter((id): id is string => !!id)
    const playerQuests =
        playerQuestIds.length > 0
            ? await db.playerQuest.findMany({
                  where: { id: { in: playerQuestIds } },
                  select: { id: true, inputs: true }
              })
            : []
    const inputsByPqId = Object.fromEntries(
        playerQuests.map((pq) => [pq.id, pq.inputs])
    )

    type EvidenceItem = { kind: string; text: string; weight: number; id: string }
    const items: EvidenceItem[] = []

    for (const link of links) {
        let text = ''
        if (link.playerQuestId) {
            const raw = inputsByPqId[link.playerQuestId]
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as Record<string, unknown>
                    const et = parsed?.evidenceText
                    text = typeof et === 'string' ? et.trim() : ''
                } catch {
                    // ignore malformed inputs
                }
            }
        }
        if (!text) continue
        items.push({
            kind: link.kind,
            text,
            weight: link.weight,
            id: link.id
        })
    }

    items.sort((a, b) => {
        const pa = KIND_PRIORITY[a.kind] ?? 0
        const pb = KIND_PRIORITY[b.kind] ?? 0
        if (pa !== pb) return pb - pa
        if (a.weight !== b.weight) return b.weight - a.weight
        return a.id.localeCompare(b.id)
    })

    const kindsUsed = [...new Set(items.map((i) => i.kind))]
    const sections: string[] = []

    if (includeExistingBody && docNode.bodyRst?.trim()) {
        sections.push('.. existing content\n')
        sections.push(docNode.bodyRst.trim())
        sections.push('')
    }

    if (items.length > 0) {
        sections.push('.. evidence (BAR cluster)\n')
        for (const item of items) {
            const label = item.kind.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            sections.push(`${label}\n${'-'.repeat(label.length)}`)
            sections.push('')
            sections.push(item.text)
            sections.push('')
        }
    }

    const bodyRst = sections.join('\n').trim()
    return { bodyRst, evidenceCount: items.length, kindsUsed }
}
