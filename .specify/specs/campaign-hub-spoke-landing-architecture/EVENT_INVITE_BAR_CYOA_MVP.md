# Spec appendix: Event invite BAR + lightweight CYOA (MVP)

**Imported from:** operator draft `bars_engine_event_impl.md`.  
**Relates to:** [TEST_PLAN_PARTY_AND_INTAKE.md](./TEST_PLAN_PARTY_AND_INTAKE.md), [spec.md](./spec.md), Partiful copy [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md).

## Goal

Enable invitations that:

1. Act as a **portal** into the engine  
2. Contain a **lightweight CYOA** (≤ ~3 min)  
3. **Prepare** guests for **April 5**  
4. Ship **fast** — “doorway, not a system”

## Intended flow

```text
Partiful (RSVP) → public BAR link → JSON CYOA → role / intent → deeper routes (/event, /campaign/hub, quest)
```

**Note:** Partiful remains the **RSVP + logistics** canonical link per event. **`/event`** stays the **in-app campaign home** (see test plan). The **BAR** is the **bridge** from “I RSVP’d” to “I’m oriented before April 5.”

### Evolution — BAR-first invitation + event initiation Twine

Product direction: the **BAR URL can be the primary share** (text / QR), with **two primary actions** on the invite surface: **RSVP on Partiful** and **begin initiation Twine** scoped to **this event** via **explicit `eventSlug` in the URL**. One **dedicated `Adventure` per event** (e.g. Apr 4 vs Apr 5).

**Canonical spec:** [.specify/specs/event-invite-party-initiation/spec.md](../event-invite-party-initiation/spec.md) (routing, slugs, `partifulUrl` + `eventSlug` on BAR).

## MVP capabilities (tiers from draft)

| Tier | Capability |
|------|------------|
| **T1** | Public-facing BAR surface; story renderer; JSON story; ending screen |
| **T2** | Polish |
| **T3** | Persistence across sessions |

## Story schema (draft — JSON)

```ts
type Story = {
  id: string
  start: string
  passages: Passage[]
}

type Passage = {
  id: string
  text: string
  choices?: Choice[]
  ending?: Ending
}

type Choice = { label: string; next: string }
type Ending = { role: string; description: string }
```

## Map to existing codebase (avoid parallel engines)

| Draft concept | Likely implementation |
|---------------|------------------------|
| **Public invite route** | **`/invite/[barId]`** — [`src/app/invite/[barId]/page.tsx`](../../../src/app/invite/[barId]/page.tsx): no login; only `CustomBar` with `type === event_invite`, `visibility === public`, `storyContent` valid JSON ([`parseEventInviteStory`](../../../src/lib/event-invite-story/schema.ts)). |
| JSON story | Stored in **`CustomBar.storyContent`**; rendered by [`EventInviteStoryReader`](../../../src/components/event-invite/EventInviteStoryReader.tsx) (client, ReactMarkdown, &lt;3 min flow). |
| `type: event_invite` | **`event_invite`** string on `CustomBar.type` (no migration). |
| Ending → role | Ending screen CTA links to `/campaign/hub?ref=bruised-banana`, `/event`, or sign-up — no new DB table for v0. |

## Principle

**Under 3 minutes.** One emotional beat: *you’re entering something playful and real.*

## Open tasks (when implementing)

- [x] Public path: **`/invite/[barId]`** + `event_invite` + `public`.  
- [x] **EventInviteStoryReader** + `parseEventInviteStory`.  
- [x] Seed: `npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-event-invite-bar.ts"` → stable id **`bb-event-invite-apr26`**.  
- [x] Default ending CTAs: `/event`, `/campaign/hub?ref=bruised-banana`, `/conclave`.  
- [x] Partiful / email: paste engine URLs — see **`docs/events/PARTIFUL_ENGINE_LINKS.md`** (Apr 4 + Apr 5 invite BARs).  
- [ ] Optional: analytics on `/invite/*`; optional `localStorage` resume (Tier 3).

## Non-goals (this MVP)

- Full Twine macros server-side  
- Saving mid-story (Tier 3) unless trivial `localStorage`
