'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
  completeCourseDay,
  getCourseProgressServerSnapshot,
  getCourseProgressSnapshot,
  subscribeCourseProgress,
} from './course-progress-store'

const subscribeNothing = () => () => {}
const onClient = () => true
const onServer = () => false

/**
 * The board's view of the reader's progress.
 *
 * `ready` is false for the server render and the hydrating render, and true
 * afterwards. The board uses it to hold back a lock reason for the one frame
 * before it knows one — telling a reader to "finish Day 2 first" when they
 * finished it last week would be worse than saying nothing.
 */
export function useCourseProgress() {
  const progress = useSyncExternalStore(
    subscribeCourseProgress,
    getCourseProgressSnapshot,
    getCourseProgressServerSnapshot,
  )
  const ready = useSyncExternalStore(subscribeNothing, onClient, onServer)
  const complete = useCallback((day: number) => completeCourseDay(day), [])

  return { progress, ready, complete }
}
