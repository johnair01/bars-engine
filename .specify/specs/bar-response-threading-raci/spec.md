# Spec: BAR Response + Threading Model v0 (RACI)

## Purpose

Give BARs a formal response model: players declare *intent* when responding (take_quest, consult, witness, accountable, observe), those intents map to RACI roles, and responses can thread two levels deep (BAR → response → reply). Downstream specs (GB: Quest Stewardship, GC: Eligibility Engine, GH: Event Engine) all consume this model.

## Problem statement

`BarResponse` already exists (`join | curious | witness | offer_help | ...`) but:
- No **formal intent** aligned with RACI vocabulary
- No **RACI role** stored on the response
- No **threading** (responses to responses, max depth 2)
- No `getBarThread` or `getBarRoles` query functions

## Conceptual model

| Intent | RACI Role | Meaning |
|--------|-----------|---------|
| `take_quest` | Responsible | I will do this |
| `accountable` | Accountable | I own the outcome |
| `consult` | Consulted | I have input; include me |
| `witness` | Informed | Keep me in the loop |
| `observe` | Informed | Passive; acknowledge only |
| `offer_help` | Consulted | I can help if needed |
| `join` | Responsible | I'm participating actively |
| `decline` | — | Explicit opt-out; no RACI |

## Schema additions (BarResponse)

```
intent           String?   // take_quest | accountable | consult | witness | observe | offer_help | join | decline
raciRole         String?   // Responsible | Accountable | Consulted | Informed (derived from intent on create)
parentResponseId String?   // self-referential for depth-1 threads
depth            Int       @default(0)  // 0 = direct BAR response; 1 = reply to response; max 2
```

## API contract

### `respondToBar(input)`
- Creates or updates a `BarResponse` for the current player on `barId`
- Accepts `responseType`, optional `intent`, optional `message`, optional `parentResponseId`
- Derives `raciRole` from `intent` using `intentToRaciRole()`
- Enforces `depth ≤ 1` (max 2 levels: 0 and 1)
- Returns `{ success: true; responseId: string }`

### `getBarThread(barId)`
- Returns the BAR + all direct responses (depth 0) each with their replies (depth 1)
- Structure: `{ bar, responses: Array<{ response, responder, replies: Array<{ response, responder }> }> }`

### `getBarRoles(barId)`
- Returns RACI-mapped participants: `{ Responsible[], Accountable[], Consulted[], Informed[] }`
- Derived from all depth-0 responses with non-null `raciRole`

## Non-goals (v0)
- UI components (API-first)
- Notifications on response (future)
- Depth > 2 threading
