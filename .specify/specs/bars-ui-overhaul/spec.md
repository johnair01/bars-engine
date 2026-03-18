# Spec: BARs UI Overhaul

## Purpose

Redesign the BARs experience so that BARs are easier and more enjoyable to interface with, feel like talismans when received, serve as seeds for quests/daemons/artifacts, and can be organized, composted, and extended from physical form (photo upload).

**Problem**: The current BARs page (`/bars`) is a flat list (Inbox, My BARs, Sent). Receiving a BAR feels like email. There is no way to organize BARs into topics, merge them, or compost/delete. BARs are not clearly positioned as seeds for the main game loop. Physical BARs (cards, paper) cannot be ingested into the system.

**Practice**: Deftness Development — API-first, extend existing schema where possible.

**GM Analysis**: [GM_ANALYSIS.md](GM_ANALYSIS.md) — Six-face analysis emphasizing deftness, API-first, and delight. BARs are the most important data type; building blocks to all other features.

## BARs as Spine

BARs are not one feature among many—they are the **substrate**. Quests, daemons, artifacts, invitations, cleanup, next action, and market all grow from BARs. This spec is **spine work**: central infrastructure that enables composition across the game. Prioritize accordingly.

## Generative Dependencies

Solving BAR well eliminates or reduces the need for separate flows elsewhere:

| Pillar | Downstream payoff |
|--------|-------------------|
| **BAR API** | MCP, strand system, future features compose with BARs without new UI |
| **Talisman receive** | Sharing economy feels meaningful; "Received" not "Inbox" |
| **Grow actions** | Quest/daemon/artifact creation converges on one "Grow from BAR" surface |
| **Compost** | Admin and player both benefit; "return to soil" reduces clutter |

## BARs: Scrap of Paper / Tiny Whiteboard

BARs are **visual media**—somewhere between a scrap of paper and a tiny whiteboard. Not documents.

- **No title** — Single content field. "What's on it." Schema title is derived (first line) for internal use.
- **Content first** — One freeform area. Photo attachable on detail. Monospace for scrap feel.
- **Intent** — Optional tags (quest, reflection, gift). Not required.
- **Display** — Content is primary. Photo shown first when present. Cards show content preview, not title.

## BARs Are CARDS with Two Sides

A BAR is a **card** you can flip and share.

| Side | Purpose |
|------|---------|
| **Face** | Hook. What you see when it arrives or in a list. Image + teaser. |
| **Back** | Full content. The flip. Full text, intent, provenance, grow actions. |

List = Face. Detail = Back (or flip). Share = send the card. Editor = edit both sides.

## Share-as-BAR Axiom

> When you share a Quest or Campaign with someone **outside** the game, you can ONLY share it as a BAR.

Every game object (Quest, Campaign, Daemon, Thread) must be **collapsible into a BAR**. The BAR is the portable artifact that draws people into creating their own game content. "Share this quest" → create BAR → send. Recipient gets talisman; can "Grow as Quest" to claim.

**Analysis**: [BAR_ONTOLOGY_ANALYSIS.md](BAR_ONTOLOGY_ANALYSIS.md) — existing BARs audit, collapse contract, editor sophistication.

## Delight Principles

1. **First receive** = ritual moment, full attention, not interruptible
2. **Grow actions** = clear metaphor ("Plant as Quest," "Wake as Daemon"), one-tap with confirmation
3. **Compost** = "Return to soil" copy, not "delete"
4. **Photo upload** = "Bring your BAR into the Conclave" framing
5. **Received BARs** = "Talismans" or "Received," not "Inbox"

## BAR Lifecycle

| State | Who can transition | Notes |
|-------|---------------------|-------|
| draft | Creator | Not yet shared |
| active | Creator, system | Shared or published |
| shared | — | BarShare exists |
| archived | Creator, recipient (own), admin | Soft; recoverable |
| merged | Player, admin | Originals archived; merged BAR has mergedFromIds |
| deleted | Player (soft), admin (hard) | Soft = recoverable 30d; hard = final |

**Rule**: Never lose provenance. Merged BAR stores `mergedFromIds` (JSON array of source BAR ids).

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Talisman receive** | Receiving a BAR (BarShare) triggers a reveal moment: card-style reveal, ceremonial copy, optional sound/haptic |
| **BAR as seed** | BAR detail shows "Grow from this BAR" actions: Create Quest, Wake Daemon, Create Artifact. One-tap flows. |
| **Organize & Compost** | Player: folders/topics (BarTopic or tags); merge BARs into topic; archive; soft-delete. Admin: same + bulk merge, bulk archive, hard delete. |
| **Photo upload** | Attach photo to new or existing BAR via Asset (type: bar_attachment). Mobile-first: camera or gallery. OCR optional (future). |
| **Fungibility** | BAR → Quest, BAR → Daemon seed, BAR → Artifact. Clear CTAs on BAR detail. |

## Conceptual Model

| Dimension | Meaning |
|-----------|---------|
| **WHO** | Player (receive, organize, compost, grow); Admin (curate, bulk organize, delete) |
| **WHAT** | BAR = talisman, seed, compostable artifact. Topic = folder/collection. Compost = archive or merge. |
| **WHERE** | `/bars` (wallet), `/bars/[id]` (detail), `/bars/create`, `/bars/compost` (organize view) |
| **Energy** | BARs carry intention; growing from BAR creates quests/daemons/artifacts |
| **Personal throughput** | Receive → Reveal → Organize → Grow or Compost |

## User Stories

### P1: Receive BAR as Talisman

**As a** player who receives a BAR from another player, **I want** the experience to feel like receiving a talisman—a ceremonial reveal, not an email notification—**so** it feels meaningful and ritual-appropriate.

**Acceptance**: When opening a received BAR for the first time (or from Inbox), show a reveal moment: card flip or ceremonial reveal, optional "You have received a talisman" copy, provenance (who sent, when). First-time view is distinct from subsequent views.

### P2: BAR as Seed for Quest, Daemon, Artifact

**As a** player with a BAR, **I want** to easily grow it into a quest, daemon, or artifact, **so** BARs are seeds for the main game loop.

**Acceptance**: BAR detail shows "Grow from this BAR" section with actions: Create Quest (→ QuestProposal or direct quest), Wake Daemon (→ Daemon seed), Create Artifact (→ GrowthSceneArtifact or similar). Each action has a one-tap or short flow. Existing `sourceBarId` on CustomBar and QuestProposal.barId support quest-from-BAR.

### P3: Organize BARs and Compost

**As a** player (or admin) with many BARs, **I want** to organize them into topics, merge related BARs, and compost (archive or delete) what's no longer needed, **so** my BAR collection stays manageable and meaningful.

**Acceptance**:
- **Topics**: Create topics (e.g. "Campaign ideas", "Shadow beliefs"); assign BARs to topics. Topics are player-scoped (or instance-scoped for admin).
- **Merge**: Select 2+ BARs → merge into one (title, description combined; originals archived or soft-deleted).
- **Compost**: Archive (hide from main view, recoverable) or delete (soft-delete for player; hard delete for admin when appropriate).
- **Admin**: Bulk select, bulk assign topic, bulk archive, bulk delete. Admin BAR list has filters (topic, creator, date).

### P4: Photo Upload for Physical BARs

**As a** player with physical BARs (cards, paper, drawings), **I want** to photograph them and upload to the system, **so** my real-world BARs become digital and can enter the game loop.

**Acceptance**: Create BAR flow and BAR detail have "Add photo" / "Upload from camera". Image stored as Asset (type: bar_attachment, customBarId). Mobile: camera or gallery picker. Desktop: file picker. Image displayed on BAR card and detail. Optional: create BAR from photo only (title/description from OCR or manual entry).

## API Contracts

Define contract before UI. Server actions wrap these or share logic. Route handlers (`/api/*`) for external consumers (MCP, future mobile).

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| GET | `/api/bars` | List BARs (filters: topic, archived, mine/received) | `{ bars: BarSummary[] }` |
| GET | `/api/bars/:id` | BAR detail + assets + provenance | `{ bar: BarDetail }` |
| POST | `/api/bars/:id/view` | Mark BarShare viewed (talisman first-view) | `{ success }` |
| POST | `/api/bars/:id/grow/quest` | Create quest from BAR | `{ questId, quest }` |
| POST | `/api/bars/:id/grow/daemon` | Stub: daemon seed from BAR | `{ daemonId? }` |
| POST | `/api/bars/:id/grow/artifact` | Stub: artifact from BAR | `{ artifactId? }` |
| POST | `/api/bars/merge` | Merge BARs | `{ mergedBarId, mergedBar }` |
| POST | `/api/bars/:id/archive` | Archive BAR (soft) | `{ success }` |
| POST | `/api/bars/:id/delete` | Soft-delete (player) or hard (admin) | `{ success }` |
| POST | `/api/bars/:id/attach-photo` | Upload image, create Asset | `{ assetId, url }` |
| GET | `/api/bars/topics` | List player topics | `{ topics: BarTopic[] }` |
| POST | `/api/bars/topics` | Create topic | `{ topicId, topic }` |
| POST | `/api/bars/:id/topics/:topicId` | Assign BAR to topic | `{ success }` |

**Unified BAR module**: One `src/actions/bars.ts` (or `src/lib/bars.ts`) for all BAR ops. Avoid scattered logic.

## Functional Requirements

### FR1: Talisman Receive UX

- **FR1a**: BarShare first-open triggers reveal state. Add `BarShare.viewedAt DateTime?` to track first view; null = unviewed.
- **FR1b**: Reveal moment: full-screen or modal with card-style layout, ceremonial copy ("A talisman has arrived"), **sender name + note prominent**, optional timestamp. Label received section "Talismans" or "Received," not "Inbox."
- **FR1c**: After reveal, normal BAR detail. Reveal does not repeat.

### FR2: BAR as Seed (Grow Actions)

- **FR2a**: BAR detail page shows "Grow from this BAR" with: Create Quest, Wake Daemon, Create Artifact.
- **FR2b**: Create Quest: opens quest creation with BAR pre-filled (sourceBarId, description). Reuse QuestProposal or create-bar flow.
- **FR2c**: Wake Daemon: if Daemon system supports BAR-as-seed, link BAR to Daemon creation. Otherwise, stub for future.
- **FR2d**: Create Artifact: link BAR to GrowthSceneArtifact or similar. Stub acceptable for v0.

### FR3: Organize & Compost

- **FR3a**: Schema: Add `BarTopic` (id, playerId, name, sortOrder) and `BarTopicAssignment` (barId, topicId) or `CustomBar.topicIds` (JSON array). Admin: instance-scoped topics or global.
- **FR3b**: Topics UI: Create topic, assign BAR to topic, filter by topic. Topic list in sidebar or tabs.
- **FR3c**: Merge: `mergeBars(barIds: string[], mergedTitle?, mergedDescription?)` server action. Creates new BAR with `mergedFromIds`; marks originals archived. **Requires confirmation + preview** before merge.
- **FR3d**: Compost: `archiveBar(barId)`, `deleteBar(barId)` (soft-delete: `status: 'archived'` or `deletedAt`). Admin: hard delete when appropriate.
- **FR3e**: Admin: Bulk select, bulk topic assign, bulk archive, bulk delete. Filters: topic, creator, date range.

### FR4: Photo Upload

- **FR4a**: Asset model supports `bar_attachment`; `customBarId` links to CustomBar. Extend if needed (e.g. multiple assets per BAR).
- **FR4b**: Upload UI: "Add photo" on BAR create form and BAR detail. Accept image files (jpg, png, webp). Store in Vercel Blob or existing asset storage.
- **FR4c**: "Create BAR from photo": Upload image first, then optional title/description. Creates CustomBar + Asset in one flow.
- **FR4d**: BAR card and detail display primary asset image when present.

## Schema Additions (Draft)

```prisma
// BarShare: add viewedAt for talisman first-view
// BarShare.viewedAt DateTime?

// BarTopic for organization
model BarTopic {
  id        String   @id @default(cuid())
  playerId  String
  name      String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  player    Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  bars      BarTopicAssignment[]
  @@unique([playerId, name])
  @@map("bar_topics")
}

model BarTopicAssignment {
  id       String   @id @default(cuid())
  barId    String
  topicId  String
  bar      CustomBar @relation(fields: [barId], references: [id], onDelete: Cascade)
  topic    BarTopic  @relation(fields: [topicId], references: [id], onDelete: Cascade)
  @@unique([barId, topicId])
  @@map("bar_topic_assignments")
}

// CustomBar additions
// mergedIntoId   String?    // when set, this BAR was merged into another
// mergedFromIds String?    // JSON array of source BAR ids (when this is the merged result)
// archivedAt    DateTime?  // soft-delete / archive
// deletedAt     DateTime?  // soft-delete (recoverable)
```

## Non-functional Requirements

- Mobile-first: talisman reveal, photo upload, organize flows work on small screens.
- Touch targets: min 44px for actions.
- Performance: BAR list paginated or virtualized when >50 items.

## Out of Scope (v0)

- OCR for photo → title/description (manual entry only).
- Daemon-from-BAR full flow (stub or link to existing Daemon creation).
- Artifact-from-BAR full flow (stub).
- Multiplayer "watch someone receive" (single-player only).

## Dependencies

- Asset model, Vercel Blob or upload storage
- BarShare, CustomBar, QuestProposal
- Daemon model (for Wake Daemon stub)
- [asset-management-bar-upload-walkable-sprites](.specify/specs/asset-management-bar-upload-walkable-sprites/spec.md) — BAR attachment pattern
- [daemons-inner-work-collectibles](.specify/specs/daemons-inner-work-collectibles/spec.md) — talisman metaphor
- [golden-path-cleanup-bar](.specify/specs/golden-path-cleanup-bar/spec.md) — BAR as output of cleanup

## Reference

- Current BARs page: [src/app/bars/page.tsx](../../src/app/bars/page.tsx)
- BAR detail: [src/app/bars/[id]/page.tsx](../../src/app/bars/[id]/page.tsx)
- Create BAR: [src/app/bars/create/](../../src/app/bars/create/)
- Asset model: [prisma/schema.prisma](../../prisma/schema.prisma)
- Bars actions: [src/actions/bars.ts](../../src/actions/bars.ts)
