'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import type { SwapEventIntakePayload } from '@/lib/swap-event-intake'
import {
  mergeSwapEventIntake,
  parseSwapEventIntakeJson,
  SWAP_EVENT_ROLE_CO_HOST,
  SWAP_EVENT_ROLE_HOST,
  SWAP_EVENT_ROLE_PARTICIPANT,
  swapEventIntakePayloadSchema,
} from '@/lib/swap-event-intake'
import {
  canEditSwapEventIntake,
  canManageSwapEventRoles,
  canPublishSwapEventIntake,
  getSwapEventScopedRole,
} from '@/lib/swap-event-permissions'

async function resolveRecipientToPlayerId(identifier: string): Promise<string | null> {
  if (!identifier?.trim()) return null
  const trimmed = identifier.trim().toLowerCase()
  const account = await db.account.findUnique({
    where: { email: trimmed },
    include: { players: { select: { id: true }, take: 1 } },
  })
  if (account?.players[0]) return account.players[0].id
  const byContact = await db.player.findFirst({
    where: { contactValue: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true },
  })
  if (byContact) return byContact.id
  const byName = await db.player.findFirst({
    where: { name: { equals: identifier.trim(), mode: 'insensitive' } },
    select: { id: true },
  })
  if (byName) return byName.id
  return null
}

export type SwapOrganizerRow = {
  playerId: string
  name: string | null
  roleKey: string | null
}

export async function loadSwapOrganizerContext(slug: string): Promise<
  | { ok: false; error: string }
  | {
      ok: true
      instance: { id: string; slug: string; name: string; parentInstanceId: string | null }
      intake: SwapEventIntakePayload
      publishedAt: Date | null
      canEdit: boolean
      canPublish: boolean
      canManageRoles: boolean
      scopedRole: 'host' | 'co_host' | 'participant' | null
      memberships: SwapOrganizerRow[]
    }
> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Sign in to manage swap event intake.' }

  const instance = await db.instance.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      parentInstanceId: true,
      swapEventIntake: true,
      swapEventIntakePublishedAt: true,
    },
  })
  if (!instance) return { ok: false, error: 'Instance not found.' }

  const scopedRole = await getSwapEventScopedRole(playerId, instance.id)
  const canEdit = canEditSwapEventIntake(isAdmin, scopedRole === 'participant' ? null : scopedRole)
  const canPublish = canPublishSwapEventIntake(isAdmin, scopedRole === 'participant' ? null : scopedRole)
  const canManageRoles = canManageSwapEventRoles(isAdmin, scopedRole === 'participant' ? null : scopedRole)

  if (!canEdit && !canManageRoles) {
    return { ok: false, error: 'You do not have swap organizer access for this instance.' }
  }

  const parsed = parseSwapEventIntakeJson(instance.swapEventIntake)
  const intake = parsed.ok ? parsed.data : {}

  const mems = await db.instanceMembership.findMany({
    where: { instanceId: instance.id },
    include: { player: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const swapRelevant = mems.filter(
    (m) =>
      m.roleKey === SWAP_EVENT_ROLE_HOST ||
      m.roleKey === SWAP_EVENT_ROLE_CO_HOST ||
      m.roleKey === SWAP_EVENT_ROLE_PARTICIPANT
  )
  const memberships: SwapOrganizerRow[] = swapRelevant.map((m) => ({
    playerId: m.playerId,
    name: m.player.name,
    roleKey: m.roleKey,
  }))

  return {
    ok: true,
    instance,
    intake,
    publishedAt: instance.swapEventIntakePublishedAt,
    canEdit,
    canPublish,
    canManageRoles,
    scopedRole,
    memberships,
  }
}

export async function saveSwapEventIntake(
  slug: string,
  payload: SwapEventIntakePayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = swapEventIntakePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid payload' }
  }

  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Not authenticated' }

  const instance = await db.instance.findUnique({ where: { slug }, select: { id: true, swapEventIntake: true } })
  if (!instance) return { ok: false, error: 'Instance not found' }

  const scopedRole = await getSwapEventScopedRole(playerId, instance.id)
  if (!canEditSwapEventIntake(isAdmin, scopedRole === 'participant' ? null : scopedRole)) {
    return { ok: false, error: 'Forbidden' }
  }

  const merged = mergeSwapEventIntake(instance.swapEventIntake, parsed.data)
  await db.instance.update({
    where: { id: instance.id },
    data: { swapEventIntake: merged as Prisma.InputJsonValue },
  })
  revalidatePath(`/swap-organizer/${slug}`)
  return { ok: true }
}

export async function publishSwapEventIntake(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Not authenticated' }

  const instance = await db.instance.findUnique({ where: { slug }, select: { id: true } })
  if (!instance) return { ok: false, error: 'Instance not found' }

  const scopedRole = await getSwapEventScopedRole(playerId, instance.id)
  if (!canPublishSwapEventIntake(isAdmin, scopedRole === 'participant' ? null : scopedRole)) {
    return { ok: false, error: 'Only the swap host (or an admin) can publish.' }
  }

  await db.instance.update({
    where: { id: instance.id },
    data: { swapEventIntakePublishedAt: new Date() },
  })
  revalidatePath(`/swap-organizer/${slug}`)
  return { ok: true }
}

const ASSIGNABLE_SWAP_ROLES = [SWAP_EVENT_ROLE_HOST, SWAP_EVENT_ROLE_CO_HOST, SWAP_EVENT_ROLE_PARTICIPANT] as const

export async function assignSwapEventRole(
  slug: string,
  recipient: string,
  roleKey: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ASSIGNABLE_SWAP_ROLES.includes(roleKey as (typeof ASSIGNABLE_SWAP_ROLES)[number])) {
    return { ok: false, error: 'Invalid role' }
  }

  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Not authenticated' }

  const instance = await db.instance.findUnique({ where: { slug }, select: { id: true } })
  if (!instance) return { ok: false, error: 'Instance not found' }

  const scopedRole = await getSwapEventScopedRole(playerId, instance.id)
  if (!canManageSwapEventRoles(isAdmin, scopedRole === 'participant' ? null : scopedRole)) {
    return { ok: false, error: 'Forbidden' }
  }

  if (roleKey === SWAP_EVENT_ROLE_HOST && !isAdmin) {
    const hostCount = await db.instanceMembership.count({
      where: { instanceId: instance.id, roleKey: SWAP_EVENT_ROLE_HOST },
    })
    if (hostCount > 0) {
      return { ok: false, error: 'A swap host is already set. Ask an admin to reassign the host.' }
    }
  }

  if (roleKey === SWAP_EVENT_ROLE_HOST && isAdmin) {
    await db.instanceMembership.updateMany({
      where: { instanceId: instance.id, roleKey: SWAP_EVENT_ROLE_HOST },
      data: { roleKey: SWAP_EVENT_ROLE_CO_HOST },
    })
  }

  const targetPlayerId = await resolveRecipientToPlayerId(recipient)
  if (!targetPlayerId) return { ok: false, error: 'Could not resolve that email or player name.' }

  await db.instanceMembership.upsert({
    where: { instanceId_playerId: { instanceId: instance.id, playerId: targetPlayerId } },
    create: { instanceId: instance.id, playerId: targetPlayerId, roleKey },
    update: { roleKey },
  })

  revalidatePath(`/swap-organizer/${slug}`)
  return { ok: true }
}

/** Public read: only after host/admin published (Phase C+ gallery may use this). */
export async function getPublishedSwapEventIntakeBySlug(
  slug: string
): Promise<SwapEventIntakePayload | null> {
  const inst = await db.instance.findUnique({
    where: { slug },
    select: { swapEventIntake: true, swapEventIntakePublishedAt: true },
  })
  if (!inst?.swapEventIntakePublishedAt) return null
  const p = parseSwapEventIntakeJson(inst.swapEventIntake)
  return p.ok ? p.data : null
}

const RSVP_EMAIL = z.string().trim().email().max(320)
const RSVP_NAME = z.string().trim().max(200).optional()
const RSVP_PARTIFUL = z.string().trim().max(500).optional()

/** Light RSVP for swap sub-campaigns — no nation/archetype. Sets httpOnly cookie for return visits. */
export async function recordSwapEventRsvp(
  slug: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const emailRaw = formData.get('email')
  const nameRaw = formData.get('name')
  const partifulRaw = formData.get('partifulRef')
  const emailParsed = RSVP_EMAIL.safeParse(typeof emailRaw === 'string' ? emailRaw : '')
  if (!emailParsed.success) {
    return { ok: false, error: 'Valid email is required.' }
  }
  const emailNorm = emailParsed.data.toLowerCase()
  const nameParsed = RSVP_NAME.safeParse(typeof nameRaw === 'string' ? nameRaw : undefined)
  const partifulParsed = RSVP_PARTIFUL.safeParse(typeof partifulRaw === 'string' ? partifulRaw : undefined)
  if (!nameParsed.success || !partifulParsed.success) {
    return { ok: false, error: 'Invalid name or Partiful reference.' }
  }

  const inst = await db.instance.findUnique({
    where: { slug },
    select: { id: true, swapEventIntake: true },
  })
  if (!inst?.swapEventIntake) {
    return { ok: false, error: 'Swap instance not found.' }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const [recentInstance, recentEmail] = await Promise.all([
    db.swapEventRsvp.count({
      where: { instanceId: inst.id, createdAt: { gte: oneHourAgo } },
    }),
    db.swapEventRsvp.count({
      where: { instanceId: inst.id, email: emailNorm, createdAt: { gte: oneHourAgo } },
    }),
  ])
  if (recentInstance >= 120) {
    return { ok: false, error: 'Too many RSVPs for this event right now. Try again in an hour.' }
  }
  if (recentEmail >= 5) {
    return { ok: false, error: 'Too many RSVP attempts for this email. Try again later.' }
  }

  const row = await db.swapEventRsvp.create({
    data: {
      instanceId: inst.id,
      email: emailNorm,
      name: nameParsed.data || null,
      partifulRef: partifulParsed.data || null,
      skipFullOnboarding: true,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(
    'bars_swap_rsvp',
    JSON.stringify({ instanceId: inst.id, rsvpId: row.id }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90,
      path: '/',
    }
  )

  revalidatePath(`/swap-rsvp/${slug}`)
  return { ok: true }
}

export type SwapRsvpFormState = { ok: true } | { ok: false; error: string } | null

/** Form action wrapper — pass instance slug as hidden input `slug`. */
export async function recordSwapEventRsvpFormAction(
  _prev: SwapRsvpFormState,
  formData: FormData
): Promise<SwapRsvpFormState> {
  const slugRaw = formData.get('slug')
  const slug = typeof slugRaw === 'string' ? slugRaw.trim() : ''
  if (!slug) {
    return { ok: false, error: 'Missing event slug.' }
  }
  return recordSwapEventRsvp(slug, formData)
}

export type CreateSwapJoinGameInviteResult =
  | { ok: true; path: string; token: string; maxUses: number }
  | { ok: false; error: string }

/**
 * Golden-path style invite for “join full game” after RSVP (GP-INV: Invite.instanceId + `/invite/:token`).
 * New signups from this link receive InstanceMembership when `createCharacter` runs.
 */
export async function createSwapJoinGameInvite(
  slug: string,
  maxUsesInput?: number
): Promise<CreateSwapJoinGameInviteResult> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) {
    return { ok: false, error: 'Sign in to create an invite.' }
  }

  const instance = await db.instance.findUnique({
    where: { slug },
    select: { id: true, swapEventIntake: true },
  })
  if (!instance?.swapEventIntake) {
    return { ok: false, error: 'Swap instance not found.' }
  }

  const scopedRole = await getSwapEventScopedRole(playerId, instance.id)
  const canInvite = isAdmin || scopedRole === 'host' || scopedRole === 'co_host'
  if (!canInvite) {
    return { ok: false, error: 'Only swap host or co-host can create join-game invites.' }
  }

  const maxUses = Math.min(500, Math.max(1, Math.floor(maxUsesInput ?? 25)))
  const token = `swap_gp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`

  await db.invite.create({
    data: {
      token,
      status: 'active',
      maxUses,
      uses: 0,
      forgerId: playerId,
      instanceId: instance.id,
    },
  })

  revalidatePath(`/swap-organizer/${slug}`)
  return { ok: true, path: `/invite/${token}`, token, maxUses }
}
