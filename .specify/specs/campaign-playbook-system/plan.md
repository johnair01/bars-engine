# Plan: Campaign Playbook System v0

## Strategy

API-first implementation. Start with Playbook model and types; add core API (get, update, generate, export, deck); integrate artifact collection and synthesis. Playbook Skill is Phase 4 (optional).

---

## File Impacts

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | Add Playbook model |
| `src/features/playbook/types/index.ts` | Playbook, CampaignDeck, UpdatePlaybookInput |
| `src/features/playbook/services/artifact-collector.ts` | Collect BARs, quests, events for instance |
| `src/features/playbook/services/synthesizer.ts` | Cluster and summarize by section |
| `src/features/playbook/services/export.ts` | Markdown, PDF, snippet generation |
| `src/features/playbook/api/playbook-actions.ts` | Server Actions |
| `src/features/playbook/__tests__/playbook.test.ts` | Unit tests |

If `src/features/` does not exist, use `src/lib/playbook/` or adapt to existing structure.

---

## Phases

### Phase 1: Data Model and Types

- Add Playbook model to Prisma (instanceId, origin, vision, people, invitations, timeline, kotterStages JSON, domainStrategy JSON, raciRoles, recentUpdates, generatedSummary)
- Define TypeScript types
- Run `npm run db:sync`

### Phase 2: Core API

- getPlaybook: fetch or lazy-init
- updatePlaybook: apply manual updates
- generatePlaybook: collect artifacts → synthesize → update
- exportPlaybook: format to markdown/pdf/plain
- exportPlaybookSnippet: tweet_thread, email_invitation, campaign_summary
- getCampaignDeck: aggregate from playbook + live data

### Phase 3: Artifact Collection and Synthesis

- Artifact collector: CustomBar (campaignRef), EventCampaign, EventArtifact, InstanceMembership, GameboardSlot
- Cluster by playbook section (origin → early BARs; vision → campaign description; etc.)
- Summarize (rule-based or AI-assisted)
- Map to Kotter stages
- Synthesize RACI from participation

### Phase 4: Playbook Skill (Optional)

- Player capability: playbook_skill level
- Actions: submit insights, write summaries, curate BARs, propose quests
- Unlocks at high skill: strategy generation, diagnostics, templating

---

## Initial Use Case

Bruised Banana Residency Campaign:
- Campaign origin from early BARs
- Residency vision from Instance.targetDescription
- Key collaborators from InstanceMembership
- Invitation messages from onboarding flow
- Fundraising strategy in GATHERING_RESOURCES domain
- Events and workshops from EventArtifact
- Quest progress from CustomBar + PlayerQuest

---

## Verification

1. Create Playbook for Instance; run db:sync
2. getPlaybook returns playbook
3. updatePlaybook persists manual updates
4. generatePlaybook produces coherent narrative from artifacts
5. exportPlaybook returns valid markdown
6. getCampaignDeck returns active quests, events, actors
