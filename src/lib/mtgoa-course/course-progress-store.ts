'use client'

import {
  COURSE_PROGRESS_STORAGE_KEY,
  EMPTY_COURSE_PROGRESS,
  parseCourseProgress,
  serializeCourseProgress,
  withDayCompleted,
} from './course-progress'
import type { CourseProgress } from './course-progress'

/**
 * The reader's progress as an external store.
 *
 * `localStorage` is exactly the "external system" React means: it changes
 * outside the render tree, in this tab when a day is finished and in another tab
 * when the same reader walks a day there. So it is subscribed to rather than
 * copied into state on mount.
 *
 * The snapshot is cached against the raw string it was parsed from, because
 * `useSyncExternalStore` compares snapshots by identity — re-parsing on every
 * read would return a new object each time and spin forever.
 */

type Listener = () => void

const listeners = new Set<Listener>()

let cachedRaw: string | null = null
let cached: CourseProgress = EMPTY_COURSE_PROGRESS

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(COURSE_PROGRESS_STORAGE_KEY)
  } catch {
    return null
  }
}

function emit(): void {
  for (const listener of listeners) listener()
}

export function getCourseProgressSnapshot(): CourseProgress {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cached = parseCourseProgress(raw)
  }
  return cached
}

/**
 * What the server renders against. Always "nothing finished yet", because the
 * server cannot know — and showing less than the truth for one frame is the
 * safe direction to be wrong in.
 */
export function getCourseProgressServerSnapshot(): CourseProgress {
  return EMPTY_COURSE_PROGRESS
}

export function subscribeCourseProgress(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== COURSE_PROGRESS_STORAGE_KEY) return
  emit()
}

/**
 * Record a finished day and tell anything watching.
 *
 * Writes one day number. Nothing a reader typed passes through here — a day's
 * answers stay where they have always stayed.
 */
export function completeCourseDay(day: number): void {
  const current = getCourseProgressSnapshot()
  const next = withDayCompleted(current, day)
  if (next === current) return
  try {
    window.localStorage.setItem(COURSE_PROGRESS_STORAGE_KEY, serializeCourseProgress(next))
  } catch {
    /* Browser storage is optional; the board simply will not remember. */
  }
  // Refresh the cache from what was actually written, so a rejected write does
  // not leave the board claiming progress that no storage kept.
  cachedRaw = readRaw()
  cached = parseCourseProgress(cachedRaw)
  emit()
}
