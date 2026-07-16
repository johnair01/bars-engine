'use client'

import type { BriefPayloadV1 } from './brief'
import type { PostV1 } from '@/lib/raise-awareness/post'

const KEY = 'card-to-carousel-brief-v1'
export type BriefSessionV1 = { version: 1; brief: BriefPayloadV1; post?: PostV1; updatedAt: string }
export function loadBriefSession(): BriefSessionV1 | null {
  try { const raw = window.sessionStorage.getItem(KEY); if (!raw) return null; const value = JSON.parse(raw) as BriefSessionV1; return value.version === 1 ? value : null } catch { return null }
}
export function saveBriefSession(value: BriefSessionV1) { window.sessionStorage.setItem(KEY, JSON.stringify({ ...value, updatedAt: new Date().toISOString() })) }
export function clearBriefSession() { window.sessionStorage.removeItem(KEY) }
