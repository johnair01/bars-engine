# Spec Kit Prompt: Campaign Playbook System v0

## Role

You are a Spec Kit agent responsible for implementing the Campaign Playbook System.

## Objective

Implement a Campaign Playbook System that automatically generates and maintains a structured strategic document for every campaign (Instance) in Bars-engine. The playbook serves as a living strategy guide, collaboration artifact, and exportable communications tool.

## Prompt (API-First)

> Implement Campaign Playbook System per [.specify/specs/campaign-playbook-system/spec.md](../specs/campaign-playbook-system/spec.md). **API-first**: define service/action signatures and data shapes before UI. Spec: [campaign-playbook-system](../specs/campaign-playbook-system/spec.md). API contracts: [docs/architecture/campaign-playbook-api.md](../../docs/architecture/campaign-playbook-api.md).

## Requirements

- **Scope**: One Playbook per Instance (campaign)
- **Sections**: Origin, Vision, People, Invitations, Timeline; Kotter stages (1–8); Domain strategy (4 domains); RACI roles
- **Editing**: Manual updates + automated synthesis from BARs, quests, events
- **Export**: Markdown, PDF, plain text; snippets (tweet_thread, email_invitation, campaign_summary)
- **Deck**: getCampaignDeck returns active quests, available quests, events, key actors, strategic goals
- **API**: getPlaybook, updatePlaybook, generatePlaybook, exportPlaybook, exportPlaybookSnippet, getCampaignDeck

## Checklist (API-First Order)

- [ ] Playbook model in Prisma; run db:sync
- [ ] Types (Playbook, CampaignDeck, UpdatePlaybookInput)
- [ ] getPlaybook, updatePlaybook implemented
- [ ] Artifact collector (CustomBar, EventCampaign, InstanceMembership)
- [ ] Synthesizer (cluster by section, Kotter mapping, RACI)
- [ ] generatePlaybook implemented
- [ ] exportPlaybook, exportPlaybookSnippet implemented
- [ ] getCampaignDeck implemented
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/campaign-playbook-system/spec.md (done)
- [ ] .specify/specs/campaign-playbook-system/plan.md (done)
- [ ] .specify/specs/campaign-playbook-system/tasks.md (done)
- [ ] src/features/playbook/ (or src/lib/playbook/) — types, services, api
- [ ] Playbook model in Prisma
- [ ] Tests for artifact collection, synthesis, export

## Initial Use Case

Bruised Banana Residency Campaign: campaign origin, residency vision, key collaborators, invitation messages, fundraising strategy, events and workshops, quest progress.

## References

- [campaign-playbook-system.md](../../docs/architecture/campaign-playbook-system.md)
- [campaign-playbook-api.md](../../docs/architecture/campaign-playbook-api.md)
- [campaign-playbook-example.md](../../docs/examples/campaign-playbook-example.md)
- [event-campaign-api.md](../../docs/architecture/event-campaign-api.md)
- [src/lib/kotter.ts](../../src/lib/kotter.ts)
