# Spec Kit Prompt: Campaign onboarding CYOA (unified) — COC

## Role

You are a Spec Kit agent shipping **one ontological authoring layer** for **onboarding CYOA** in BARs: **campaigns need onboarding**; **invitations are onboarding**; **invites are always CYOA** here. **Event-invite** stories (`EventInviteStory`, `/invite/event/[barId]`) and **campaign / initiation CYOA** (`CampaignReader`, `Adventure`/`Passage`, `campaign-passage`) are **facets of the same flow**—converge UX over time; implement **phased** (invite builder first).

## Objective

Implement per [.specify/specs/campaign-onboarding-cyoa/spec.md](../specs/campaign-onboarding-cyoa/spec.md), [plan.md](../specs/campaign-onboarding-cyoa/plan.md), and [tasks.md](../specs/campaign-onboarding-cyoa/tasks.md). Do **not** treat this as a siloed “invite JSON fix” only—**align** with [unified-cyoa-graph-authoring](../specs/unified-cyoa-graph-authoring/spec.md) (UGA) where graph validation overlaps.

**Funding is part of onboarding:** Phase **F** in plan/tasks — persistent donate/support on campaign surfaces, pre/post signup paths, board nav as buttons—coordinate with [donation-self-service-wizard](../specs/donation-self-service-wizard/spec.md).

## Prompt (paste)

> Implement **Campaign onboarding CYOA (unified)** per `.specify/specs/campaign-onboarding-cyoa/`. **Phase A–D:** Replace raw `event_invite` **JSON** with a **LEGO + prompt** builder; `storyContent` stays validated `EventInviteStory` via compile/round-trip; **preview** with `EventInviteStoryReader`; fix **steward vs owner** permission mismatch on invite edit if spec decides. **Phase E (later):** Reuse **shared builder primitives** for **campaign passage** authoring (`CampaignPassageEditModal` / `campaign-passage`) with explicit role policy. **UI Covenant** + card tokens for operator UI. Verification: `npm run build` && `npm run check`; manual `/hand` + `/invite/event/[barId]`.

## Requirements

- **Storage:** No invalid graph persisted—`parseEventInviteStory` (and later passage graph rules) on save.
- **Dual-track:** Static prompt templates work **without** AI; optional AI = draft-only + confirm.
- **Challenger:** Scoped by `campaignRef` / BAR id / adventure; no cross-tenant writes.
- **Related code:** `EventInviteBarContentEditor`, `CampaignReader`, `src/actions/campaign-passage.ts`, `playerCanEditEventInviteBar`.

## Checklist

- [ ] Phase A decisions + permissions aligned with spec
- [ ] Invite builder shipped (JSON = advanced collapse only, if at all)
- [ ] Runbook or `/event` pointer for stewards (per tasks)
- [ ] Phase E scoped separately if not in same PR
- [ ] `npm run build` && `npm run check`

## Deliverables

- [x] Spec kit: `.specify/specs/campaign-onboarding-cyoa/`
- [ ] Implementation per `tasks.md`
- [ ] Backlog: [COC — 1.51](../backlog/BACKLOG.md)
