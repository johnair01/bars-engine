# Spec: K-Space Librarian — Quest-Driven Docs + BAR-Fueled Canon

## Purpose

Implement a deterministic, quest-driven documentation system that turns **Library Requests** (player confusion) into:
1. A searchable **Player Handbook / Codex** (Sphinx/RST build output)
2. A **Backlog item** if missing
3. A **DocQuest** that recruits players to validate the answer
4. A **BAR-based evidence bundle** that becomes the fuel for canon formation

Canon is **earned** (draft → validated → canonical → deprecated). "Doc-schisms" (conflicts between sources) become a structured quest type: **Schism Hunt**.

## API Contracts (API-First)

> Define before implementation. Route Handler for external/search; Server Action for modal form.

### submitLibraryRequestAction

**Input**: `{ requestText: string; requestType?: string; contextJson?: Record<string, unknown> }`  
**Output**: `Promise<{ success: true; requestId: string; resolved?: { docNodeId: string; slug: string }; spawned?: { docQuestId: string } } | { error: string }>`

- **Server Action** — "Request from Library" modal form.
- Calls `resolveOrSpawn`: search DocNodes; if match → return resolved; else create BacklogItem + DocNode + DocQuest, return spawned.

### resolveOrSpawn

**Input**: `{ requestText: string; createdById: string; instanceId: string; contextJson?: Record<string, unknown> }`  
**Output**: `Promise<{ resolved: DocNode } | { spawned: { backlogItemId: string; docNodeId: string; docQuestId: string } }>`

- **Internal** — Used by submitLibraryRequestAction. Search DocNodes; if match → resolved; else create BacklogItem, DocNode, DocQuest.

### GET /api/library/search

**Query**: `q: string; type?: string; scope?: string`  
**Output**: `NextResponse.json({ nodes: DocNodeSummary[] })`

- **Route Handler** — Search DocNodes by query, type, scope. Returns slug, title, scope, canonicalStatus.

## Conceptual Model (Game Language)

- **WHO**: Player (requestor, completer)
- **WHAT**: DocQuest (CustomBar type 'doc'), Library Request, Doc Node
- **WHERE**: Instance scope (campaign), global scope
- **Energy**: Vibeulons (reward for DocQuest completion)
- **Personal throughput**: Wake Up (search docs), Show Up (complete DocQuest, submit evidence)

## User Stories

### Player

- As a player, I can click "Request from Library" and get either an answer (link to relevant doc node) or a quest that helps resolve the confusion and rewards participation.
- As a player, I can complete a DocQuest and submit BARs as evidence (observations, instructions, canon phrasing, lore tie-in).

### Admin/GM

- As an admin, I can see new Library Requests, their status, and whether they resolved or spawned backlog + quests.
- As an admin, I can promote a validated doc node to Canonical, or deprecate/merge duplicates.
- As an admin, I can view Schisms and run Schism Hunts to reconcile drift.

### Developer

- As a developer, I can generate docs from DB content into RST and publish via CI.
- As a developer, I can inspect provenance: which BARs/quests/instances support a canonical claim.

## Functional Requirements

### Phase 1: MVP

- **FR1**: LibraryRequest model: id, createdById, instanceId, requestText, requestType, privacy, contextJson, status, resolvedDocNodeId, spawnedBacklogItemId, spawnedDocQuestId.
- **FR2**: DocNode model: id, nodeType, title, slug, scope, scope, tags, bodyRst, bodySource, canonicalStatus, provenanceJson.
- **FR3**: BacklogItem model: id, title, description, severity, area, status, sourceLibraryRequestId, linkedDocNodeId, linkedDocQuestId.
- **FR4**: DocEvidenceLink model: links CustomBar completions to DocNodes (kind, weight, confidence).
- **FR5**: CustomBar: add docQuestMetadata (JSON), evidenceKind (nullable).
- **FR6**: POST /library/requests creates LibraryRequest.
- **FR7**: resolveOrSpawn: search DocNodes; if match → resolved; else create BacklogItem + DocNode + DocQuest.
- **FR8**: GET /library/search: search DocNodes by q, type, scope.
- **FR9**: Admin pages: /admin/library (list requests), /admin/docs (list DocNodes, promote, merge).
- **FR10**: "Request from Library" UI: modal/form visible when logged in; auto-capture context (route, questId).

### Phase 2: DocQuest Completion + Evidence

- **FR11**: DocQuest = CustomBar with type 'doc', docQuestMetadata populated.
- **FR12**: DocQuest completion: player submits evidence (CustomBar with evidenceKind); DocEvidenceLink created.
- **FR13**: Deterministic draft generation from BAR cluster (doc-assembly.ts).

### Phase 3: RST/Sphinx Build

- **FR14**: Script export-docs-to-rst.ts exports DocNodes to RST.
- **FR15**: Sphinx build produces HTML; deployable to static host.

### Phase 4: Schism Detection (Future)

- **FR16**: Schism model; detection job creates Schism + DocQuest when conflicting canon found.

## Non-functional Requirements

- Spawn caps: max 10 doc stubs per instance per day.
- Default scope for new docs: experimental.
- Canonical requires validation + admin promotion.
- Anti-farming: diminishing returns for repeated contributions in same tag domain per day (Phase 2+).

## Verification Quest

- **ID**: `cert-k-space-librarian-v1`
- **Steps**: Submit Library Request; verify resolved or spawned; check admin/library; complete DocQuest (if spawned); verify docs build.

## Dependencies

- Instance model (existing)
- CustomBar model (existing)
- Wiki (existing; add Library link)

## Out of Scope (v1)

- Full semantic search / embeddings
- Auto-committing generated RST into repo
- Multi-tenant docs portals per community
