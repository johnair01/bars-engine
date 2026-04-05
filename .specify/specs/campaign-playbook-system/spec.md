# Spec: Campaign Playbook System v0

## Purpose

Create a Campaign Playbook System that automatically generates and maintains a structured strategic document for every campaign (Instance) in Bars-engine. The playbook serves as a living strategy guide, collaboration artifact, and exportable communications tool.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI).

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| Scope | One Playbook per Instance (campaign) |
| Editing | Dual pathway: manual updates + automated synthesis |
| Kotter | Map content to 8 Kotter stages |
| Domains | Four canonical: GATHERING_RESOURCES, RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING |
| RACI | Synthesize from quest participation, InstanceMembership, EventParticipant |

---

## Conceptual Model

| Dimension | Playbook System |
|-----------|-----------------|
| **WHO** | Instance (campaign), Players (authors, curators) |
| **WHAT** | Strategic narrative, domain strategy, RACI, timeline |
| **WHERE** | Instance-scoped; export to Markdown, PDF, snippets |
| **Energy** | BARs, quests, events, comments as artifact sources |
| **Personal throughput** | Playbook Skill (curate, summarize, propose) |

---

## API Contracts (API-First)

See [docs/architecture/campaign-playbook-api.md](../../../docs/architecture/campaign-playbook-api.md).

### Core

- `getPlaybook(instanceId) => Promise<{ success; playbook } | { error }>`
- `updatePlaybook(input) => Promise<{ success } | { error }>`
- `generatePlaybook(instanceId) => Promise<{ success; playbook } | { error }>`
- `exportPlaybook({ instanceId, format }) => Promise<{ success; content; format } | { error }>`
- `exportPlaybookSnippet({ instanceId, type }) => Promise<{ success; content; type } | { error }>`
- `getCampaignDeck(instanceId) => Promise<{ success; deck } | { error }>`

**Route vs Action**: Server Actions for dashboard/campaign UI; Route Handlers for export download.

---

## User Stories

### P1: Get Playbook

**As a** campaign participant or admin, **I want** to view the campaign playbook, **so** I understand what is happening and how to contribute.

**Acceptance**: `getPlaybook(instanceId)` returns playbook; lazy-init or 404 per policy.

### P2: Manual Update

**As a** campaign steward, **I want** to submit narrative updates and strategic insights, **so** the playbook reflects human curation.

**Acceptance**: `updatePlaybook` applies updates to specified sections; source and author tracked.

### P3: Automated Generation

**As a** system or admin, **I want** to trigger playbook generation from campaign artifacts, **so** the playbook stays current.

**Acceptance**: `generatePlaybook` collects BARs, quests, events; clusters by section; synthesizes; updates playbook.

### P4: Export

**As a** campaign steward, **I want** to export the playbook in Markdown, PDF, or snippets, **so** I can use it for communications.

**Acceptance**: `exportPlaybook` and `exportPlaybookSnippet` return content in requested format.

### P5: Campaign Deck

**As a** campaign participant, **I want** to see the campaign deck (active quests, events, actors, goals), **so** I understand the gameboard.

**Acceptance**: `getCampaignDeck` returns structured deck from playbook and live data.

---

## Functional Requirements

### Phase 1: Data Model and Types

- **FR1**: Playbook model (Prisma or equivalent)
- **FR2**: Playbook type with sections (origin, vision, people, invitations, timeline, kotterStages, domainStrategy, raciRoles)
- **FR3**: CampaignDeck type

### Phase 2: Core API

- **FR4**: getPlaybook
- **FR5**: updatePlaybook
- **FR6**: generatePlaybook (artifact collection + synthesis)
- **FR7**: exportPlaybook (markdown, pdf, plain)
- **FR8**: exportPlaybookSnippet (tweet_thread, email_invitation, campaign_summary)
- **FR9**: getCampaignDeck

### Phase 3: Integration

- **FR10**: Artifact collection from CustomBar, EventCampaign, EventArtifact, InstanceMembership
- **FR11**: Kotter stage mapping
- **FR12**: RACI synthesis from participation data

### Phase 4: Playbook Skill (Optional)

- **FR13**: Playbook Skill as player capability
- **FR14**: Unlock strategy generation, diagnostics, templating at high skill

---

## Non-Functional Requirements

- Private BAR content not exposed in playbook without visibility rules
- Export formats valid and usable
- Generation idempotent and traceable

---

## Dependencies

- [event-campaign-api.md](../../../docs/architecture/event-campaign-api.md)
- [system-bar-api.md](../../../docs/architecture/system-bar-api.md)
- [src/lib/kotter.ts](../../../src/lib/kotter.ts)
- Instance, CustomBar, EventCampaign, EventArtifact, InstanceMembership (Prisma)

---

## References

- [campaign-playbook-system.md](../../../docs/architecture/campaign-playbook-system.md)
- [campaign-playbook-api.md](../../../docs/architecture/campaign-playbook-api.md)
- [campaign-playbook-example.md](../../../docs/examples/campaign-playbook-example.md)
