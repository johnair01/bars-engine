import { db } from '@/lib/db'
import type { NotificationChannel, NotificationStatus, NotificationType } from './types'

export type CreateNotificationLogInput = {
  playerId: string
  type: NotificationType
  channel?: NotificationChannel
  periodKey?: string | null
  metadata?: Record<string, unknown>
}

export async function createNotificationLog(input: CreateNotificationLogInput) {
  return db.notificationLog.create({
    data: {
      playerId: input.playerId,
      type: input.type,
      channel: input.channel ?? 'email',
      status: 'pending',
      periodKey: input.periodKey ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  })
}

export async function finalizeNotificationLog(
  id: string,
  status: NotificationStatus,
  externalId?: string | null,
  metadata?: Record<string, unknown>,
) {
  return db.notificationLog.update({
    where: { id },
    data: {
      status,
      externalId: externalId ?? null,
      sentAt: status === 'sent' ? new Date() : undefined,
      metadataJson: metadata ? JSON.stringify(metadata) : undefined,
    },
  })
}

export async function hasNotificationForPeriod(
  playerId: string,
  type: NotificationType,
  periodKey: string,
): Promise<boolean> {
  const existing = await db.notificationLog.findFirst({
    where: {
      playerId,
      type,
      periodKey,
      status: { in: ['sent', 'skipped'] },
    },
    select: { id: true },
  })
  return !!existing
}

export async function listRecentNotificationLogs(playerId: string, take = 10) {
  return db.notificationLog.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      type: true,
      channel: true,
      status: true,
      sentAt: true,
      createdAt: true,
      metadataJson: true,
    },
  })
}
