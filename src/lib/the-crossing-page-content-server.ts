import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  parseTheCrossingPageTheme,
  THE_CROSSING_PAGE_DEFAULT_CONTENT,
  type TheCrossingPageContent,
} from '@/lib/the-crossing-page-content'

export async function getTheCrossingPageContent(): Promise<TheCrossingPageContent> {
  try {
    const config = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })
    return parseTheCrossingPageTheme(config?.theme)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getTheCrossingPageContent] Falling back to defaults:', error)
    }
    return THE_CROSSING_PAGE_DEFAULT_CONTENT
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
