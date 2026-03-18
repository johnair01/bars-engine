# Spec: 321 Suggest Name (Deterministic Grammar)

## Purpose

Provide an apt synthetic name for the shadow presence in the 321 flow faster than a blocked player would type one. Use a **deterministic 6-face name grammar** (MTG-style: Role + Description) so names resolve instantly without AI. Fix 404/token issues that caused the feature to hang or fail.

**Problem**: The AI-based Suggest Name (Shaman) never resolved — 404 or excessive tokens. Blocked players need a quick, sticky name suggestion.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Primary path | Deterministic grammar; no AI required |
| Name style | MTG-style: "The {Descriptor} {Role}" (e.g. The Artful Dodger, Deft Dealer) |
| 6-face vocab | Each Game Master sect contributes role + descriptor words |
| Selection | Hash input text to pick indices; same input = same name |
| AI path | Optional, gated; deterministic is default |
| Timeout | 15s client timeout so blocked players get clear error |

## 6-Face Name Grammar

| Face | Role words | Descriptor words |
|------|------------|------------------|
| Shaman | Oracle, Keeper, Guardian, Seer | Mythic, Earthbound, Ritual, Hidden |
| Challenger | Dodger, Walker, Edge, Blade | Deft, Bold, Penetrating, Relentless |
| Regent | Steward, Keeper, Architect, Order | Structured, Disciplined, Calm, Steady |
| Architect | Blueprint, Builder, Strategist | Precise, Clever, Systematic, Virtual |
| Diplomat | Connector, Weaver, Bridge | Quirky, Gentle, Penetrating, Subtle |
| Sage | Trickster, Integrator, Mountain | Wise, Emergent, Whole, Layered |

**Grammar pattern**: `The {Descriptor} {Role}`

## API Contracts

### POST /api/agents/shaman/suggest-shadow-name

**Input**:
```json
{
  "charge_description": "string",
  "mask_shape": "string"
}
```

**Output**:
```json
{
  "suggested_name": "string",
  "deterministic": true
}
```

**Behavior**: Always use deterministic grammar. Return in <100ms. No AI call by default.

## User Stories

### P1: Blocked player gets instant name suggestion

**As a** player stuck at "Give it a name", **I want** to click Suggest Name and get an evocative name immediately, **so** I can move on without typing.

**Acceptance**: Suggest Name returns in under 1s; same input yields same name; names follow Role + Description pattern.

### P2: Clear error when backend unavailable

**As a** player, **I want** a clear error (not infinite loading) when the backend is down or times out.

**Acceptance**: 15s timeout; user sees "Could not suggest name" or similar.

## Functional Requirements

- **FR1**: `deriveShadowName(chargeDescription, maskShape)` — deterministic, pure function
- **FR2**: Backend uses grammar as primary; no Shaman AI call by default
- **FR3**: Frontend: 15s timeout on suggestShadowName fetch
- **FR4**: Frontend: log status/url on fetch failure for debugging

## Non-Functional Requirements

- Deterministic: same input always yields same name
- Fast: grammar path <100ms
- No external API calls for default path

## References

- [321 Shadow Process spec](../321-shadow-process/spec.md)
- [Shadow321Runner](../../../src/app/shadow/321/Shadow321Runner.tsx)
- [Game Master Sects](../../../.agent/context/game-master-sects.md)
