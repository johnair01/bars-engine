/**
 * Campaign Invitation System v0 — Type definitions
 *
 * Spec: docs/architecture/campaign-invitation-system.md
 * API: docs/architecture/campaign-invitation-api.md
 */

export type InvitationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type InvitationType =
  | 'guiding_coalition'
  | 'campaign_collaborator'
  | 'domain_contributor'
  | 'event_participant'
  | 'observer'

export type RaciRole = 'responsible' | 'accountable' | 'consulted' | 'informed'

export interface CampaignInvitation {
  id: string
  instanceId: string
  targetActorId: string
  invitedRole: string
  acceptedRole: string | null
  invitationType: string
  messageText: string
  status: InvitationStatus
  createdByActorId: string
  createdAt: Date
  updatedAt: Date
  sentAt: Date | null
  respondedAt: Date | null
}

export interface CreateInvitationInput {
  instanceId: string
  targetActorId: string
  invitedRole: string
  invitationType: InvitationType
  messageText: string
  createdByActorId: string
}

export interface ListInvitationsFilters {
  status?: InvitationStatus
  targetActorId?: string
}

export interface ConfirmRoleInput {
  invitationId: string
  actorId: string
  acceptedRole: RaciRole
}

export interface ExportInvitationInput {
  invitationId: string
  format: 'plain' | 'email' | 'sms' | 'copy'
}
