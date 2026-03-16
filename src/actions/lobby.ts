'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function listInstances() {
  const instances = await db.instance.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { memberships: true } },
    },
  })
  return instances
}

export async function copyInstance(sourceId: string, newSlug: string, newName: string) {
  const source = await db.instance.findUnique({ where: { id: sourceId } })
  if (!source) return { error: 'Instance not found' }

  const existing = await db.instance.findUnique({ where: { slug: newSlug } })
  if (existing) return { error: 'Slug already taken' }

  const newInstance = await db.instance.create({
    data: {
      slug: newSlug,
      name: newName,
      domainType: source.domainType,
      theme: source.theme,
      targetDescription: source.targetDescription,
      wakeUpContent: source.wakeUpContent,
      showUpContent: source.showUpContent,
      storyBridgeCopy: source.storyBridgeCopy,
      isEventMode: true,
      sourceInstanceId: sourceId,
    },
  })
  revalidatePath('/lobby')
  return { instance: newInstance }
}

export async function approveExportRequest(requestId: string) {
  const req = await db.instanceExportRequest.findUnique({
    where: { id: requestId },
    include: { instance: true },
  })
  if (!req) return { error: 'Not found' }

  // Generate config bundle
  const configBundle = JSON.stringify(
    {
      instance: {
        slug: req.instance.slug,
        name: req.instance.name,
        domainType: req.instance.domainType,
        theme: req.instance.theme,
        targetDescription: req.instance.targetDescription,
        wakeUpContent: req.instance.wakeUpContent,
        showUpContent: req.instance.showUpContent,
        isEventMode: req.instance.isEventMode,
      },
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
    null,
    2,
  )

  await db.instanceExportRequest.update({
    where: { id: requestId },
    data: { status: 'approved', configBundle, resolvedAt: new Date() },
  })
  revalidatePath('/lobby')
  return { success: true, configBundle }
}
