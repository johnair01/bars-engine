# Spec Kit Prompt: Event Campaign Engine + Event Artifact System v1

## Role

You are a Spec Kit agent implementing the Event Campaign Engine. Campaigns are production organisms; events are produced artifacts. Domain (canonical) and topic (flexible) are distinct. API-first.

## Objective

Implement per [.specify/specs/event-campaign-engine/spec.md](../specs/event-campaign-engine/spec.md). **API-first**: define campaign and event service contracts before UI. API doc: [event-campaign-api.md](../../docs/architecture/event-campaign-api.md).

## Ontology (Load-Bearing)

- **Domain**: One of GATHERING_RESOURCES, SKILLFUL_ORGANIZING, RAISE_AWARENESS, DIRECT_ACTION. Fixed.
- **Topic**: Flexible subject matter (Allyship, Emotional First Aid, etc.).
- **Campaign**: Production organism.
- **Event**: Produced artifact.
- **Production grammar**: Kotter (collective) or Epiphany Bridge (individual).

## Requirements

- **EventCampaign model**: campaignContext, topic, primaryDomain, productionGrammar, status, linkedEventIds
- **EventArtifact model**: linkedCampaignId, title, topic, campaignContext, primaryDomain, secondaryDomain, eventType, location, times, status, recordingUrl
- **EventParticipant**: participantState, functionalRole, raciRole (distinct)
- **EventInvite**: actorId, invitedByActorId, inviteStatus, inviteSource
- **Domain validation**: Only canonical four allowed
- **Event inheritance**: topic, campaignContext, primaryDomain from campaign
- **Calendar export**: GET /api/events/[id]/calendar → .ics

## Checklist (API-First Order)

- [ ] API contracts in [event-campaign-api.md](../../docs/architecture/event-campaign-api.md)
- [ ] EventCampaign, EventArtifact, EventParticipant, EventInvite models
- [ ] Domain validation (src/lib/event-campaign/domains.ts)
- [ ] event-campaign.ts: createCampaign, getCampaign, instantiateEventProductionThread, advanceCampaignMilestone, listCampaignEvents
- [ ] event-artifact.ts: createEvent, getEvent, listEvents, inviteToEvent, joinEvent, attachRecording, completeEvent
- [ ] checkCampaignReadiness, emitEventFromCampaign
- [ ] Calendar export (.ics)
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] .specify/specs/event-campaign-engine/spec.md
- [ ] .specify/specs/event-campaign-engine/plan.md
- [ ] .specify/specs/event-campaign-engine/tasks.md
- [ ] docs/architecture/event-campaign-api.md
- [ ] prisma/schema.prisma: EventCampaign, EventArtifact, EventParticipant, EventInvite
- [ ] src/lib/event-campaign/domains.ts
- [ ] src/actions/event-campaign.ts
- [ ] src/actions/event-artifact.ts
- [ ] src/lib/event-campaign/calendar.ts
- [ ] GET /api/events/[id]/calendar (or equivalent)

## Reference

- Spec: [.specify/specs/event-campaign-engine/spec.md](../specs/event-campaign-engine/spec.md)
- Plan: [.specify/specs/event-campaign-engine/plan.md](../specs/event-campaign-engine/plan.md)
- API: [docs/architecture/event-campaign-api.md](../../docs/architecture/event-campaign-api.md)
- Allyship domains: [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts)
