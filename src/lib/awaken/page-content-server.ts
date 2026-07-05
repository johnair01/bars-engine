import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  AWAKEN_DEFAULT_CONTENT,
  parseAwakenPageTheme,
  type AwakenPageContent,
} from '@/lib/awaken/content'

export async function getAwakenPageContent(): Promise<AwakenPageContent> {
  try {
    const config = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })
    return parseAwakenPageTheme(config?.theme)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getAwakenPageContent] Falling back to defaults:', error)
    }
    return AWAKEN_DEFAULT_CONTENT
  }
}

export async function getCurrentPlayerIsAdmin(): Promise<boolean> {
  try {
    const player = await getCurrentPlayer()
    return player?.roles.some((role) => role.role.key === 'admin') ?? false
  } catch {
    return false
  }
}
