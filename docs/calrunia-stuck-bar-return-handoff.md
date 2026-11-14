---
type: implementation-plan
title: "Calrunia Stuck BAR Return - API and Build Plan"
status: ready-for-implementation
created: 2026-11-13
---

# Stuck BAR return: API and build plan

## Outcome

An authenticated player who previously chose to keep a BAR can retrieve that same kernel in their Nook, identify what is currently stuck, and play a new or meaningfully changed encounter selected for that BAR and situation. The experience offers a next possibility and an optional dated player update; it never asserts that the player's feeling shifted or their real-world problem was solved.

This is a narrow implementation plan for the first integrated journey spec in The Library, not a completed feature. Keep the execution ledger in The Library updated after each bounded step, including exact branch/commit, API contracts, tests, remaining risks and next action. Push authorized commits to the pickup branch after verified steps, without overwriting another person's updates.

## Current behavior and critical boundary

The pickup branch `codex/available-for-pickup/calrunia-creation-bars` contains `POST /api/calrunia/kept` and owner-scoped `GET /api/calrunia/kept[?id=…]`. The existing UI saves an explicit kernel, the intake snapshot and notes, and then reopens the original journey from the Nook stand. It **does not** capture new stuck context or select a different encounter. Its old intake also requires a named belief.

The current capture stores the entire admitted intake under `CustomBar.agentMetadata` as `calrunia_return_v1`. `getBarDetail` in `src/actions/bars.ts` fetches a full BAR record and returns it for an owner, authorized share recipient or public BAR. Therefore a non-owner may receive intake metadata if the BAR becomes shared or public, even though the `/kept` endpoint is owner-scoped. A proposed narrow redaction on the pickup branch's BAR-detail path addresses that **one read path**, not every list, export, share, logging or delete path. Treat comprehensive private-data isolation as a release gate; audit actual consumers and migrate storage or implement complete permission-aware projection before promising privacy. Avoid relying on a client-only redaction.

## Delivery order and API checkpoints

### 1. Establish a safe verified base

- Recheck the pickup branch's head and current main, both companion council and relevant Nook/forest branches, and board rulings. Do not overwrite another worktree or silently change canon. The previous environment could not start local Postgres because `shmget` was denied; use a disposable local Postgres in a capable environment, never production credentials.
- Test the current explicit save, owner retrieval, other-player denial, private/shared/public projections and deletion. Inspect `src/actions/bars.ts` `getBarDetail`/list/share/export paths, API handlers and any direct Prisma consumers. Document exact evidence and untested surfaces.
- **Checkpoint:** record the tested baseline and current source revision. Fix any demonstrated exposure before adding personal return input. No broad privacy claim is made until the full relevant access path has a test.

### 2. Define minimal source and storage

Keep the intentionally captured kernel and its selected source BAR ID; add only current context the player explicitly chooses to save. Prefer an owner-scoped private record with clear deletion semantics over putting a full private intake inside a BAR record that may be shared. Preserve v1 data and explicitly migrate or safely read it; never copy old private intake into a public/shared response. The implementation may reuse an existing schema or add a migration after tracing current models.

Proposed internal shape, subject to the current repo's actual schema:

```ts
type ConfirmedEA = { channel: 'fear' | 'sadness' | 'joy' | 'anger' | 'neutrality'; altitude: 'dissatisfied' | 'neutral' | 'satisfied'; playerWords?: string }
type CurrentSignal = { status: 'unknown' } | { status: 'confirmed'; value: ConfirmedEA }
type ReturnContext = {
  barId: string;                   // server-authorized owner record, stable identity
  obstacle: string | null;         // chosen/edited by the player; null means unknown
  currentSignal: CurrentSignal;
  belief: { value: string; evidenceIds: string[] } | null; // optional, never inferred
  retainContext: boolean;          // consent to persist this context, independent of starting play
}
type SelectionTrace = {
  barId: string; purpose: string; basicMoves: string[]; eaMoveId: string | null;
  atlas: { id: string; originalFit: 'covered' | 'partial' | 'gap' | 'conflict'; condition?: string }[];
  face: string; ruleVariant: string; reasons: string[]; unknowns: string[];
}
```

Desired satisfaction belongs to the creation and, if chosen, must be a **confirmed satisfied state**: Wonder-Excitement/metal, Poignance/water, Bliss/wood, Triumph/fire or Peace/earth. The present signal is independent. Preserve player words alongside the canonical choice. The five Basic Moves and 15 EA moves remain separate. Never set a player-reported state from a predicted route or fictional outcome.

### 3. API contract: return proposal

Add an authenticated, owner-authorized endpoint or equivalent existing action only after the storage audit. Candidate HTTP shape (adjust paths to the repository's actual patterns):

```http
POST /api/calrunia/kept/{barId}/return-proposals
Content-Type: application/json
Idempotency-Key: <client-generated-operation-id>

{ "obstacle": "... or null", "currentSignal": { "status": "unknown" },
  "belief": null, "retainContext": false }
```

- Server obtains player identity, authorizes the exact BAR, validates every field and the optional canonical move, and treats unknown as unknown. Do not require a belief, current EA state or long text. Never accept creator ID, consent or another person's emotion as authority from a request.
- Return `{ proposalId, barId, encounter, selectionTrace, status: 'proposed' }` with `Cache-Control: no-store`. A proposal is not an accepted quest or a completed outcome. Unknown/no-obstacle can return a discovery-oriented option; if a meaningful selection cannot yet be made, return a typed `needs_choice` response with playable alternatives, not a fabricated belief.
- `401` for no authentication; use the same non-disclosing `404` for nonowner and absent BAR; `400` for malformed context; `409` for incompatible version/operation where appropriate; `413` for oversized bodies; `5xx` for storage failures without private text in logs. Explain errors in the UI. The client must be able to cancel without creating a BAR or committing a life action.
- Retrying the same operation key must return the same logical proposal or safe typed conflict, not duplicate records. Recheck the repository's established idempotency and CSRF/origin protections rather than inventing incompatible security. Follow existing security boundaries for all server actions.

### 4. Encounter occurrence and reports

Provide an action contract equivalent to `start(proposalId) → occurrenceId`, `choose(occurrenceId, choiceId) → fictional event + perceptible effect`, and `finish/pause(occurrenceId)`. Validate allowed transitions and actor ownership on the server wherever state matters. The selected encounter must have at least two genuine actions leading to distinct visible/audible consequences; it can offer a decline/stop. The original BAR remains the same BAR, not an automatic new capture.

If the player explicitly reports a feeling or chooses a next life action, store it separately from `SelectionTrace`'s predicted EA route and fictional results. A separately authorized `appendUpdate(barId, occurrenceId, playerWords)` adds provenance without silently rewriting the earlier account, subject to deletion/revocation policy. Never infer completion, improvement, confidence, relationship health or consent from gameplay.

### 5. Player-facing journey

- At the Nook's recognizable stand or object, select a kept BAR; show its actual words and what context is used. Offer selectable ways to express what is stuck and optional own words. Make it possible to choose none/unknown, back out or play without saving the new context.
- Build at least two source-grounded return variants whose objectives, rules or responses genuinely differ based on the selected context. For example, one may discover a clue (`gathering-hidden-deposit-clues`, atlas covered); another may listen or offer a phrase with an NPC response (`narrative-service-as-response`, covered). Both must be authored and play-tested, not merely a changed caption. Their exact binding is a design proposal until reviewed. Keep optional challenge/combat available as a future scoped variant.
- Keep third-person movement, click-to-interact and camera drag separate, with accessible alternatives and clear visible feedback. A recorded card/deck capability and an intentionally captured BAR are different objects. No pre-approval of generated quests.
- The player can return to their Nook with their BAR, decline to capture anything new, and review provenance. A life action is only one optional expression.

## Verification matrix

| Boundary | Required proof |
| --- | --- |
| Client → API | Explicit capture/return, field validation, no action on cancel, bounded inputs, safe error and retry behavior. |
| Owner scope | Real database test for owner, second player, shared recipient, public BAR and absent ID. Private context never appears through direct detail, list, share, export, metadata or logs. Review deletion and historical retention. |
| Persistence | Save → reload → select same ID → return with new context; no duplicate BAR on retries. Inspect exact stored fields and their visibility. |
| Gameplay | Authenticated browser walkthrough in a disposable environment: click/drag separation, discoverability, two distinct player actions and world responses, pass/stop/retry, returned BAR identity and a genuinely changed encounter. |
| EA/ontology | Tests for five desired satisfaction states, unknown/current separation, six beliefs plus none, valid optional moves and predicted-versus-reported separation. Preserve atlas fit and conditions in trace. |
| Human review | Attribute six-Face and production reviews; observe a representative player before claiming clarity, enjoyment or emotional effect. Synthetic/mocked tests are not player testing. |

## Handoff rules

At each checkpoint record: source and branch head, API and schema version, completed and remaining work, commands/tests and results, unresolved board decisions, concrete blocker with evidence, and the next executable action. Update the public-in-repo API documentation when the actual implementation changes; this plan alone does not constitute an implemented API. Preserve the user's privacy and existing branch edits; never print credentials or raw personal intake in logs.
