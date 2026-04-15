/**
 * Campaign Playbook System v0 — Type definitions
 *
 * Spec: docs/architecture/campaign-playbook-system.md
 * API: docs/architecture/campaign-playbook-api.md
 */

/** Canonical allyship domains */
export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'
  | 'SKILLFUL_ORGANIZING'

/** Playbook section content (matches Prisma CampaignPlaybook) */
export interface Playbook {
  id: string
  instanceId: string
  origin: string
  vision: string
  people: string
  invitations: string
  timeline: string
  kotterStages: Record<number, string>
  domainStrategy: Record<string, string>
  raciRoles: string
  recentUpdates: string
  generatedSummary: string
  createdAt: Date
  updatedAt: Date
}

/** Input for manual playbook updates */
export interface UpdatePlaybookInput {
  instanceId: string
  updates: {
    origin?: string
    vision?: string
    people?: string
    invitations?: string
    timeline?: string
    kotterStages?: Record<number, string>
    domainStrategy?: Record<string, string>
    raciRoles?: string
  }
  source?: 'manual' | 'bar' | '321' | 'external'
  authorId?: string
}

/** Input for playbook export */
export interface ExportPlaybookInput {
  instanceId: string
  format: 'markdown' | 'pdf' | 'plain'
  sections?: string[]
}

/** Input for export snippet */
export interface ExportSnippetInput {
  instanceId: string
  type: 'tweet_thread' | 'email_invitation' | 'campaign_summary'
  options?: Record<string, unknown>
}

/** Campaign deck structure */
export interface CampaignDeck {
  activeQuests: { id: string; title: string; status: string }[]
  availableQuests: { id: string; title: string }[]
  events: { id: string; title: string; status: string; startTime?: Date }[]
  keyActors: { id: string; name: string; role?: string }[]
  strategicGoals: string[]
}
