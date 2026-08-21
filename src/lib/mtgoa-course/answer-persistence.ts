import type { MtgoaCourseDayId } from './course-days'

export const MTGOA_COURSE_ANSWER_SCHEMA_VERSION = 'mtgoa-course-answer-v1' as const

/**
 * This is intentionally not a feature flag. Answers must not persist until the
 * product has an explicit consent, identity, retention, deletion, and security
 * decision. Keeping this literal prevents an environment variable from silently
 * activating collection before those decisions exist.
 */
export const COURSE_ANSWER_PERSISTENCE_ENABLED = false as const

export type CourseAnswerValue = string | string[] | boolean | null

export type CourseAnswerEnvelope = {
  schemaVersion: typeof MTGOA_COURSE_ANSWER_SCHEMA_VERSION
  courseId: 'mtgoa-30-day-v1'
  day: MtgoaCourseDayId
  updatedAt: string
  answers: Record<string, CourseAnswerValue>
}

export type CourseAnswerPersistence = {
  status: 'disabled'
  save: (envelope: CourseAnswerEnvelope) => Promise<void>
  load: (day: MtgoaCourseDayId) => Promise<CourseAnswerEnvelope | null>
}

/**
 * Future persistence seam. This adapter deliberately does no browser storage,
 * network request, analytics emission, or database write while the feature is off.
 */
export const disabledCourseAnswerPersistence: CourseAnswerPersistence = {
  status: 'disabled',
  async save() {},
  async load() { return null },
}

/**
 * Day 4's Grow Up prototype types free-text names of real people into its
 * "dump names" step. The course foundation note recommends those be categorically
 * excluded from any future save, and this list is how that decision is enforced
 * rather than remembered: `createCourseAnswerEnvelope` drops these keys.
 *
 * @see MTGOA_30_DAY_COURSE_FOUNDATION_DAYS_1_TO_3_2026-08-19.md — persistence decision 5
 */
export const COURSE_ANSWER_EXCLUDED_KEYS: readonly string[] = ['names', 'people', 'who'] as const

export function createCourseAnswerEnvelope(
  day: MtgoaCourseDayId,
  answers: Record<string, CourseAnswerValue>,
  updatedAt = new Date().toISOString(),
): CourseAnswerEnvelope {
  const scrubbed: Record<string, CourseAnswerValue> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (COURSE_ANSWER_EXCLUDED_KEYS.includes(key)) continue
    scrubbed[key] = value
  }
  return {
    schemaVersion: MTGOA_COURSE_ANSWER_SCHEMA_VERSION,
    courseId: 'mtgoa-30-day-v1',
    day,
    updatedAt,
    answers: scrubbed,
  }
}
