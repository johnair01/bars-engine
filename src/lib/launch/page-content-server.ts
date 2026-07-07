import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { LAUNCH_DEFAULT_CONTENT, parseLaunchPageTheme, type LaunchPageContent } from './page-content'

export async function getLaunchPageContent(): Promise<LaunchPageContent> {
  try {
    const config = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })
    return parseLaunchPageTheme(config?.theme)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getLaunchPageContent] Falling back to defaults:', error)
    }
    return LAUNCH_DEFAULT_CONTENT
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
