# Tasks: Campaign Playbook System v0

## Phase 1 — Data Model and Types

- [x] Add CampaignPlaybook model to `prisma/schema.prisma` (note: Playbook name reserved for archetype model)
- [x] Fields: id, instanceId, origin, vision, people, invitations, timeline, kotterStages (Json), domainStrategy (Json), raciRoles, recentUpdates, generatedSummary, createdAt, updatedAt
- [x] Relation: Instance has one CampaignPlaybook
- [x] Run `npm run db:sync`
- [x] Create `src/features/playbook/types/index.ts`
- [x] Define Playbook, CampaignDeck, UpdatePlaybookInput, ExportPlaybookInput types
- [x] Run `npm run check`

---

## Phase 2 — Core API

- [x] Create `src/actions/playbook.ts` (Server Actions)
- [x] Implement getPlaybook(instanceId)
- [x] Implement updatePlaybook(input)
- [x] Implement generatePlaybook(instanceId) — stub synthesis initially
- [x] Implement exportPlaybook(input) — markdown, plain, pdf
- [x] Implement exportPlaybookSnippet(input) — campaign_summary, tweet_thread, email_invitation
- [x] Implement getCampaignDeck(instanceId)
- [x] Run `npm run build` and `npm run check`

---

## Phase 3 — Artifact Collection and Synthesis

- [x] Create `src/features/playbook/services/artifact-collector.ts`
- [x] Collect CustomBar (BARs, quests) for instance (campaignRef)
- [x] Collect EventCampaign, EventArtifact for instance
- [x] Collect InstanceMembership for people/RACI
- [x] Collect GameboardSlot for stewards
- [x] Create `src/features/playbook/services/synthesizer.ts`
- [x] Cluster artifacts by playbook section
- [x] Map to Kotter stages (1–8)
- [x] Synthesize domain strategy per domain
- [x] Synthesize RACI from participation
- [x] Wire synthesizer into generatePlaybook
- [x] Run `npm run check`

---

## Phase 4 — Export Formats

- [ ] Create `src/features/playbook/services/export.ts`
- [ ] Markdown export (full playbook)
- [ ] Plain text export
- [ ] PDF export (optional: use library or external service)
- [ ] Snippet: tweet_thread
- [ ] Snippet: email_invitation
- [ ] Snippet: campaign_summary
- [ ] Run `npm run check`

---

## Phase 5 — Integration and UI (Optional)

- [ ] Add playbook view to campaign page or admin
- [ ] Add manual update form
- [ ] Add generate button
- [ ] Add export download links
- [ ] Add campaign deck display (or link to gameboard)
- [ ] Run `npm run build` and `npm run check`

---

## Phase 6 — Playbook Skill (Optional)

- [ ] Define Playbook Skill in player capability model
- [ ] Actions: submit strategic insight, write summary, curate BARs, propose quest
- [ ] Unlock logic for strategy generation, diagnostics, templating
- [ ] Run `npm run check`

---

## Verification

- [ ] Tests: getPlaybook returns playbook
- [ ] Tests: updatePlaybook persists
- [ ] Tests: generatePlaybook produces valid structure
- [ ] Tests: exportPlaybook returns non-empty markdown
- [ ] Tests: getCampaignDeck returns expected shape
- [ ] Manual: Bruised Banana playbook generated and exported
