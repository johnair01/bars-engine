import { db } from '@/lib/db'
import type { Instance } from '@prisma/client'

export type ResolveInstanceResult =
  | { ok: true; instance: Instance }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'ambiguous'; count: number }

export async function resolveInstance(params: {
  instanceId?: string
  campaignRef?: string
}): Promise<ResolveInstanceResult> {
  if (params.instanceId?.trim()) {
    const instance = await db.instance.findUnique({
      where: { id: params.instanceId.trim() },
    })
    if (!instance) return { ok: false, reason: 'not_found' }
    return { ok: true, instance }
  }

  const ref = params.campaignRef?.trim()
  if (ref) {
    const list = await db.instance.findMany({
      where: { campaignRef: ref },
    })
    if (list.length === 0) return { ok: false, reason: 'not_found' }
    if (list.length > 1) return { ok: false, reason: 'ambiguous', count: list.length }
    return { ok: true, instance: list[0] }
  }

  return { ok: false, reason: 'not_found' }
}
