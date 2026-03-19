/** Shared shape for listing EventArtifacts (campaign page + invite modal). */

export type EventArtifactListItem = {
  id: string
  title: string
  startTime: Date | null
  endTime: Date | null
  parentEventArtifactId: string | null
}
