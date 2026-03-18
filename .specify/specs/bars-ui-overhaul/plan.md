# Plan: BARs UI Overhaul

## Summary

Redesign the BARs experience: talisman receive moment, BAR-as-seed (quest/daemon/artifact), organize & compost (topics, merge, archive/delete), and photo upload for physical BARs.

## Implementation Order

### Phase 1: Foundation — Schema & Photo Upload
- Add schema for BarTopic, BarTopicAssignment; CustomBar.archivedAt, mergedIntoId, mergedFromIds
- Photo upload: Asset bar_attachment flow; "Add photo" on create + detail; "Create from photo"
- Run db:sync

### Phase 2: Talisman Receive UX
- BarShare first-view tracking (viewedAt or new table)
- Reveal moment component: full-screen/modal, ceremonial copy, sender
- Inbox entry point: unviewed BARs trigger reveal on first open

### Phase 3: BAR as Seed (Grow Actions)
- BAR detail: "Grow from this BAR" section
- Create Quest: pre-fill from BAR, sourceBarId
- Wake Daemon: stub or link to Daemon creation
- Create Artifact: stub

### Phase 4: Organize & Compost
- Topics: create, assign, filter
- Merge: mergeBars server action, mergedIntoId
- Archive/delete: archiveBar, deleteBar (soft)
- Compost view: archived BARs, recover

### Phase 5: Admin Bulk & Polish
- Admin BAR list: filters, bulk select, bulk topic/archive/delete
- Hard delete for admin when appropriate
- Mobile polish, empty states

## File Impacts

| File | Change |
|------|--------|
| `prisma/schema.prisma` | BarTopic, BarTopicAssignment; CustomBar.archivedAt, mergedIntoId |
| `src/app/bars/page.tsx` | Talisman inbox, topic tabs, compost link |
| `src/app/bars/[id]/page.tsx` | Reveal moment, Grow actions, photo display, organize |
| `src/app/bars/create/` | Photo upload, create-from-photo |
| `src/actions/bars.ts` | mergeBars, archiveBar, deleteBar, topic CRUD |
| `src/actions/assets.ts` or new | Photo upload for BAR |
| `src/components/bars/` | TalismanReveal, GrowFromBar, BarTopicSelector, BarCompostView |

## Risks & Mitigations

- **Schema bloat**: BarTopic could be JSON tags on CustomBar instead of separate table. Trade-off: topics as first-class enables filtering and admin bulk.
- **Photo storage**: Vercel Blob or existing upload path. Ensure size limits, format validation.
- **Merge semantics**: Merging 2+ BARs — how to combine title/description? Template: concatenate with separator, or prompt user. v0: simple concatenation.

## Phase 5.6: Audit, Face/Back Editor, Quest→BAR Collapse

*Full plan: [PLAN_AUDIT_EDITOR_COLLAPSE.md](PLAN_AUDIT_EDITOR_COLLAPSE.md)*

1. **Audit**: Run existing BARs audit; document findings; remediate if needed.
2. **Face/Back Editor**: Two-sided card UI; create preview; edit mode; ART feel.
3. **Quest→BAR Collapse**: collapseQuestToBar action; "Share as BAR" on quest; provenance badges.

## Verification

- Receive BAR → see talisman reveal once
- Create Quest from BAR → quest has sourceBarId
- Create topic, assign BARs, filter by topic
- Merge 2 BARs → 1 new BAR, originals archived
- Upload photo to BAR → image visible on card and detail
- Create BAR from photo only → BAR + Asset created
