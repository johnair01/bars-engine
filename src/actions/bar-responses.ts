'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import {
  intentToRaciRole,
  MAX_RESPONSE_DEPTH,
  type BarIntent,
  type BarThread,
  type BarResponseNode,
  type BarRoles,
} from '@/lib/bar-raci'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

// ---------------------------------------------------------------------------
// respondToBar
// ---------------------------------------------------------------------------

export interface RespondToBarInput {
  barId: string
  responseType: string
  intent?: BarIntent | null
  message?: string | null
  /** Provide to create a depth-1 reply to an existing response. */
  parentResponseId?: string | null
}

export async function respondToBar(
  input: RespondToBarInput
): Promise<{ success: true; responseId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const { barId, responseType, intent, message, parentResponseId } = input

  // Derive depth and enforce max
  let depth = 0
  if (parentResponseId) {
    const parent = await db.barResponse.findUnique({
      where: { id: parentResponseId },
      select: { depth: true, barId: true },
    })
    if (!parent) return { error: 'Parent response not found' }
    if (parent.barId !== barId) return { error: 'Parent response belongs to a different BAR' }
    depth = parent.depth + 1
    if (depth > MAX_RESPONSE_DEPTH) {
      return { error: `Threading limited to depth ${MAX_RESPONSE_DEPTH + 1}` }
    }
  }

  const raciRole = intentToRaciRole(intent ?? null)

  // For depth-0 responses: upsert (one intent per player per BAR at top level)
  // For depth-1 replies: always create
  if (depth === 0) {
    const existing = await db.barResponse.findUnique({
      where: { barId_responderId: { barId, responderId: playerId } },
      select: { id: true },
    })

    if (existing) {
      const updated = await db.barResponse.update({
        where: { id: existing.id },
        data: {
          responseType,
          intent: intent ?? null,
          raciRole,
          message: message ?? null,
        },
        select: { id: true },
      })
      return { success: true, responseId: updated.id }
    }
  }

  const created = await db.barResponse.create({
    data: {
      barId,
      responderId: playerId,
      responseType,
      intent: intent ?? null,
      raciRole,
      parentResponseId: parentResponseId ?? null,
      depth,
      message: message ?? null,
    },
    select: { id: true },
  })

  return { success: true, responseId: created.id }
}

// ---------------------------------------------------------------------------
// getBarThread
// ---------------------------------------------------------------------------

const responderSelect = {
  id: true,
  name: true,
} as const

export async function getBarThread(barId: string): Promise<BarThread | { error: string }> {
  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: {
      id: true,
      title: true,
      type: true,
      creatorId: true,
      responses: {
        where: { depth: 0 },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          barId: true,
          responderId: true,
          responseType: true,
          intent: true,
          raciRole: true,
          depth: true,
          message: true,
          createdAt: true,
          responder: { select: responderSelect },
          replies: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              barId: true,
              responderId: true,
              responseType: true,
              intent: true,
              raciRole: true,
              depth: true,
              message: true,
              createdAt: true,
              responder: { select: responderSelect },
            },
          },
        },
      },
    },
  })

  if (!bar) return { error: 'BAR not found' }

  const responses: BarResponseNode[] = bar.responses.map((r) => ({
    ...r,
    replies: r.replies.map((reply) => ({ ...reply, replies: [] })),
  }))

  return {
    barId: bar.id,
    barTitle: bar.title,
    barType: bar.type,
    creatorId: bar.creatorId,
    responses,
  }
}

// ---------------------------------------------------------------------------
// getBarRoles
// ---------------------------------------------------------------------------

export async function getBarRoles(barId: string): Promise<BarRoles | { error: string }> {
  const exists = await db.customBar.findUnique({ where: { id: barId }, select: { id: true } })
  if (!exists) return { error: 'BAR not found' }

  const responses = await db.barResponse.findMany({
    where: {
      barId,
      depth: 0,
      raciRole: { not: null },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      raciRole: true,
      intent: true,
      responder: { select: { id: true, name: true } },
    },
  })

  const roles: BarRoles = {
    Responsible: [],
    Accountable: [],
    Consulted: [],
    Informed: [],
  }

  for (const r of responses) {
    const role = r.raciRole as keyof BarRoles | null
    if (!role || !(role in roles)) continue
    roles[role].push({
      playerId: r.responder.id,
      name: r.responder.name,
      intent: r.intent ?? '',
    })
  }

  return roles
}
