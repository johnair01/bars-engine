import { db } from '@/lib/db'

/** Ensure every id exists on custom_bars. Returns false if any missing. */
export async function questIdsExist(ids: string[]): Promise<boolean> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return true
  const count = await db.customBar.count({
    where: { id: { in: unique } },
  })
  return count === unique.length
}
