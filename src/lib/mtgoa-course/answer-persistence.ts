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

export function createCourseAnswerEnvelope(
  day: MtgoaCourseDayId,
  answers: Record<string, CourseAnswerValue>,
  updatedAt = new Date().toISOString(),
): CourseAnswerEnvelope {
  return {
    schemaVersion: MTGOA_COURSE_ANSWER_SCHEMA_VERSION,
    courseId: 'mtgoa-30-day-v1',
    day,
    updatedAt,
    answers,
  }
}
