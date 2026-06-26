/** Shared, non-server constants/types for the player events surface. */

/** Visibility values that make an event discoverable to all logged-in players. */
export const DISCOVERABLE_VISIBILITIES = ['public', 'discoverable'] as const

export type PlayerEventOverviewItem = {
  id: string
  title: string
  description: string
  startTime: Date | null
  endTime: Date | null
  timezone: string | null
  locationType: string
  locationDetails: string | null
  instanceId: string | null
  visibility: string
  status: string
}
