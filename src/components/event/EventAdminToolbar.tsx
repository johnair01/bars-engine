'use client'

import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

interface EventAdminToolbarProps {
  instanceId: string
  instanceName: string
  events: EventArtifactListItem[]
  /** Rendered admin action components (modals mount from here) */
  children?: React.ReactNode
}

/**
 * Floating bottom toolbar for admin/organizer users.
 * Existing modal components are passed as children and rendered inside this bar.
 */
export function EventAdminToolbar({
  children,
}: EventAdminToolbarProps) {
  return (
    <div className="cs-admin-toolbar">
      {children}
    </div>
  )
}
