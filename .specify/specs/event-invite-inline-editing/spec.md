# Event invite inline editing

## Purpose

Allow **admins** and **campaign instance owners** (same rules as link editing) to update **headline** (`title`), **subtitle** (`description`), and **CYOA JSON** (`storyContent` on `CustomBar`) from the public invite URL and from **Hand → Vault**, without seeds-only workflows.

**See also:** [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) — unified ontology (campaign + invite onboarding CYOA) and **LEGO / prompt-driven builder**; invite `storyContent` ships **Visual builder + Advanced JSON** in `EventInviteBarContentEditor` (**Phase B–D**); campaign CYOA authoring **Phase E**. This spec covers **where** saves happen and **who** may save.

**Out of scope (v1):** Custom labels for "RSVP on Partiful →" / "Begin initiation →" (remain fixed in `EventInvitePartyActions`).

## Data model

- Source of truth: `CustomBar` fields `title`, `description`, `storyContent` (stringified `EventInviteStory` per [`src/lib/event-invite-story/schema.ts`](../../../src/lib/event-invite-story/schema.ts)).
- Validation: `parseEventInviteStory` must succeed before persist.

## Authorization

Reuse [`playerCanEditEventInviteBar`](../../../src/lib/event-invite-bar-permissions.ts) (**admin** or **owner / steward** on instance matching `campaignRef`; not creator-only without membership).

## Surfaces

1. **`/invite/event/[barId]`** — Collapsible editor for eligible users; visitors unchanged.
2. **Vault (`/hand`)** — Same fields in each campaign invitation BAR row (below link row / near existing Partiful form).

## Cache

After save: `revalidatePath` for `/invite/event/[barId]`, `/hand`, `/event`.

## Acceptance

- [ ] Server action rejects invalid JSON / invalid story shape.
- [ ] Unauthorized users cannot mutate (403-style error message).
- [ ] Saved changes appear on public invite after refresh; metadata title/description follow DB.
