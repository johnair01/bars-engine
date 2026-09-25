'use client'

/**
 * Client side of ally attribution: capture the parameter, remember it, hand it
 * back for outbound links.
 *
 * Runs on any page that mounts it, not just `/launch` — an ally may link
 * anywhere, and a referral that only counts when it lands on one specific page
 * is a referral that mostly doesn't count.
 */

import { useEffect, useState } from 'react'
import {
  ALLY_COOKIE,
  ALLY_COOKIE_DAYS,
  isPlausibleLeadId,
  readAllyParam,
} from './referral'

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  // `SameSite=Lax` so the cookie survives the click out to Gumroad and back.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`
}

/**
 * The current ally credit, if any.
 *
 * FIRST TOUCH WINS: once a referral is stored it is not overwritten by a later
 * link. The person who did the work of getting someone to look is the one who
 * earned it, and silently reassigning credit on a second visit would make the
 * board lie to the ally who actually did the asking.
 */
export function useAllyReferral(): string | null {
  const [allyId, setAllyId] = useState<string | null>(null)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = readCookie(ALLY_COOKIE)
    } catch {
      // Cookies disabled — attribution degrades to nothing, which is fine.
    }

    if (isPlausibleLeadId(stored)) {
      setAllyId(stored)
      return
    }

    const fromUrl = readAllyParam(window.location.search)
    if (!fromUrl) return

    try {
      writeCookie(ALLY_COOKIE, fromUrl, ALLY_COOKIE_DAYS)
    } catch {
      // Still attribute this session even if it can't be persisted.
    }
    setAllyId(fromUrl)
  }, [])

  return allyId
}
