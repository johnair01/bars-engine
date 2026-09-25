'use client'

import { completeCourseDay } from './course-progress-store'

/**
 * Record that a reader reached a day's receipt.
 *
 * Called by each day's flow when its receipt screen opens, which is what lets
 * the board open tomorrow. Kept as its own tiny module so a day flow imports one
 * verb and nothing else — the six components that call it are long-lived flows,
 * and the smaller the seam into them the better.
 *
 * Safe to call repeatedly; a receipt that re-renders writes nothing new.
 */
export function markCourseDayComplete(day: number): void {
  completeCourseDay(day)
}
