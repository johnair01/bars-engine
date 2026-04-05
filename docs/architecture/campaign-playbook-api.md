# Campaign Playbook API — Service Contracts v0

## Overview

The Campaign Playbook System exposes service-layer contracts for playbook CRUD, generation, update, export, and deck generation. Implementation may use Server Actions or HTTP endpoints.

**Reference**: [campaign-playbook-system.md](campaign-playbook-system.md)

---

## Playbook Management

### 1. Get Playbook

**Contract**: `getPlaybook(instanceId: string) => Promise<{ success: true; playbook: Playbook } | { error: string }>`

**Behavior**: Returns playbook for the instance. Creates empty playbook if none exists (lazy init) or returns 404 depending on policy.

**Route**: Server Action `getPlaybook` or `GET /api/campaign/:instanceId/playbook`

---

### 2. Update Playbook (Manual)

**Contract**: `updatePlaybook(input: UpdatePlaybookInput) => Promise<{ success: true } | { error: string }>`

**Input**:
```ts
interface UpdatePlaybookInput {
  instanceId: string
  updates: {
    origin?: string
    vision?: string
    people?: string
    invitations?: string
    timeline?: string
    kotterStages?: Record<number, string>  // stage 1–8 → narrative
    domainStrategy?: Record<string, string>  // domain key → strategy text
    raciRoles?: string
  }
  source?: 'manual' | 'bar' | '321' | 'external'
  authorId?: string
}
```

**Behavior**: Applies manual updates to specified sections. Tracks source and author for audit.

**Route**: Server Action `updatePlaybook` or `POST /api/campaign/:instanceId/playbook/update`

---

### 3. Generate Playbook (Automated)

**Contract**: `generatePlaybook(instanceId: string) => Promise<{ success: true; playbook: Playbook } | { error: string }>`

**Behavior**: Collects campaign artifacts (BARs, quests, events, comments), clusters by section, synthesizes, updates playbook. Returns updated playbook.

**Route**: Server Action `generatePlaybook` or `POST /api/campaign/:instanceId/playbook/generate`

---

### 4. Export Playbook

**Contract**: `exportPlaybook(input: ExportPlaybookInput) => Promise<{ success: true; content: string; format: string } | { error: string }>`

**Input**:
```ts
interface ExportPlaybookInput {
  instanceId: string
  format: 'markdown' | 'pdf' | 'plain'
  sections?: string[]  // optional: subset of sections to export
}
```

**Behavior**: Returns playbook content in requested format.

**Route**: Server Action `exportPlaybook` or `GET /api/campaign/:instanceId/playbook/export?format=markdown`

---

### 5. Export Snippet (Communications)

**Contract**: `exportPlaybookSnippet(input: ExportSnippetInput) => Promise<{ success: true; content: string; type: string } | { error: string }>`

**Input**:
```ts
interface ExportSnippetInput {
  instanceId: string
  type: 'tweet_thread' | 'email_invitation' | 'campaign_summary'
  options?: Record<string, unknown>  // e.g. maxLength, tone
}
```

**Behavior**: Generates snippet suitable for social media, email, or summary.

**Route**: Server Action `exportPlaybookSnippet` or `GET /api/campaign/:instanceId/playbook/export/snippet?type=tweet_thread`

---

### 6. Get Campaign Deck

**Contract**: `getCampaignDeck(instanceId: string) => Promise<{ success: true; deck: CampaignDeck } | { error: string }>`

**Response**:
```ts
interface CampaignDeck {
  activeQuests: { id: string; title: string; status: string }[]
  availableQuests: { id: string; title: string }[]
  events: { id: string; title: string; status: string; startTime?: Date }[]
  keyActors: { id: string; name: string; role?: string }[]
  strategicGoals: string[]
}
```

**Behavior**: Pulls from playbook structure and live data (CustomBar, EventArtifact, InstanceMembership).

**Route**: Server Action `getCampaignDeck` or `GET /api/campaign/:instanceId/playbook/deck`

---

## Data Types

### Playbook

```ts
interface Playbook {
  id: string
  instanceId: string

  // Core narrative
  origin: string
  vision: string
  people: string
  invitations: string
  timeline: string

  // Kotter stages (1–8)
  kotterStages: Record<number, string>

  // Domain strategy (GATHERING_RESOURCES | RAISE_AWARENESS | DIRECT_ACTION | SKILLFUL_ORGANIZING)
  domainStrategy: Record<string, string>

  // RACI
  raciRoles: string

  // Metadata
  recentUpdates: string
  generatedSummary: string
  createdAt: Date
  updatedAt: Date
}
```

---

## Route vs Action Decision

| Surface | Use |
|---------|-----|
| Dashboard, campaign UI, React forms | Server Action |
| Export download, webhooks | Route Handler |

---

## References

- [campaign-playbook-system.md](campaign-playbook-system.md)
- [event-campaign-api.md](event-campaign-api.md)
- [system-bar-api.md](system-bar-api.md)
