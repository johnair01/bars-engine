# System BAR API — Service Contracts v0

## Overview

Bars-engine uses **Next.js server actions** as the primary interface (`src/actions/create-bar.ts`, `src/actions/bars.ts`). API routes exist for specific flows (`/api/quests/[questId]/apply-move`, etc.). This document defines service contracts that can be implemented as server actions or HTTP endpoints. UI consumes the same boundaries.

---

## Service Boundaries

### 1. Create BAR

**Contract**: `createInteractionBar(payload: CreateInteractionBarPayload) => Promise<{ success: true; barId: string } | { error: string }>`

**Payload**:
```ts
type CreateInteractionBarPayload = {
  barType: 'quest_invitation' | 'help_request' | 'appreciation' | 'coordination'
  title: string
  description: string
  visibility: 'private' | 'public'
  payload: Record<string, unknown>  // subtype-specific
  parentId?: string   // quest or BAR
  campaignRef?: string
}
```

**Implementation**: Extend `createCustomBar` or add `createInteractionBar` in `src/actions/`. Set `CustomBar.type`, `inputs` (JSON string of payload).

---

### 2. List BARs

**Contract**: `listBars(filters: ListBarsFilters) => Promise<{ success: true; bars: CustomBar[] } | { error: string }>`

**Filters**:
```ts
type ListBarsFilters = {
  campaignRef?: string
  barType?: string | string[]
  visibility?: 'private' | 'public'
  creatorId?: string
  parentId?: string
  status?: string | string[]
}
```

**Implementation**: Prisma `customBar.findMany` with dynamic `where`. Apply visibility rules (creator sees own private; public visible to all).

---

### 3. Get BAR by ID

**Contract**: `getBar(id: string) => Promise<{ success: true; bar: CustomBar; responses?: BarResponse[] } | { error: string }>`

**Implementation**: `customBar.findUnique` with optional `include: { responses: true }` when BarResponse exists.

---

### 4. Respond to BAR

**Contract**: `respondToBar(barId: string, response: BarResponsePayload) => Promise<{ success: true } | { error: string }>`

**Payload**:
```ts
type BarResponsePayload = {
  responseType: 'join' | 'curious' | 'witness' | 'offer_help' | 'decline' | 'cant_help' | 'appreciate'
  message?: string
}
```

**Implementation**: Create BarResponse (or child CustomBar). Validate bar exists, status allows responses, responder not already responded. Optionally transition BAR status (e.g. open → active when first join).

---

### 5. Close BAR

**Contract**: `closeBar(barId: string) => Promise<{ success: true } | { error: string }>`

**Implementation**: Update `CustomBar.status` to `'closed'`. Validate creator or admin.

---

### 6. Archive BAR

**Contract**: `archiveBar(barId: string) => Promise<{ success: true } | { error: string }>`

**Implementation**: Update `CustomBar.status` to `'archived'`. Validate creator or admin.

---

### 7. Transition BAR State

**Contract**: `transitionBarState(barId: string, toStatus: string) => Promise<{ success: true } | { error: string }>`

**Valid transitions** (subtype-aware):
- open → active (when first response received)
- active → fulfilled (when slots filled or goal met)
- open | active → closed (manual)
- closed → archived

**Implementation**: Validate current status and allowed transition. Optionally auto-transition on response (e.g. quest_invitation fulfilled when requestedSlots reached).

---

### 8. BAR Feed

**Contract**: `getBarFeed(filters: BarFeedFilters) => Promise<{ success: true; bars: CustomBar[] } | { error: string }>`

**Filters**:
```ts
type BarFeedFilters = {
  campaignRef?: string
  barTypes?: string[]
  statuses?: string[]
  limit?: number
  offset?: number
}
```

**Purpose**: Action-oriented feed for dashboard (open invitations, help requests, appreciation). Not a generic social wall.

---

## HTTP Equivalents (Optional)

If REST routes are added, map as follows:

| Service | Method | Path |
|---------|--------|------|
| createInteractionBar | POST | /api/bars |
| listBars | GET | /api/bars?campaignRef=&barType=&... |
| getBar | GET | /api/bars/:id |
| respondToBar | POST | /api/bars/:id/respond |
| closeBar | POST | /api/bars/:id/close |
| archiveBar | POST | /api/bars/:id/archive |
| transitionBarState | POST | /api/bars/:id/transition |
| getBarFeed | GET | /api/bars/feed?campaignRef=&... |

---

## Dashboard Usage

Dashboard should query BARs and render actionable items:

- "2 open invitation BARs in your campaign"
- "1 help request matches your archetype"
- "Someone appreciated your courage BAR"

**Implementation**: `getBarFeed` with filters. Dashboard components call server actions or fetch `/api/bars/feed`.

---

## Existing Code References

- `src/actions/create-bar.ts` — createCustomBar (FormData)
- `src/actions/bars.ts` — createPlayerBar, shareBar, etc.
- `prisma/schema.prisma` — CustomBar, BarShare
- `src/app/api/quests/[questId]/apply-move/route.ts` — example API route pattern
