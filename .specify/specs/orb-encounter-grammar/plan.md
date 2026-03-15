# Plan: Orb Encounter Grammar v0
### Architect + Regent + Diplomat Implementation Plan

---

## Agent Roles

| Agent | Domain |
|-------|--------|
| **Architect** | Schema, API routes, encounter compiler, seed library, Scene DSL mapping, type system |
| **Regent** | GM face authority validation, artifact emission legality, world response consequence rules, encounter coherence |
| **Diplomat** | Interpretation UX, player choice rendering, relationship_update artifact, empathic response copy for Diplomat/Sage faces |

---

## Dependency Order

```
OEG-1: DB models (5 tables) + types
        ↓
OEG-2: GM Face Modifier seed + service
        ↓
OEG-3: Encounter Seed library (3 seeds × v0)
        ↓
OEG-4: Encounter compiler (seed + vector + GM face → grammar + Scene DSL)
        ↓
OEG-5: POST /api/orb-encounters/generate
        ↓
OEG-6: POST /api/orb-encounters/:id/resolve + artifact emission
        ↓
OEG-7: POST /api/orb-encounters/preview (authoring tool)
        ↓
OEG-8: Player-facing encounter UI
```

---

## OEG-1: DB Models + Types
**Owner: Architect**

### Schema additions

```prisma
model OrbEncounterSeed {
  id               String  @id @default(cuid())
  contextType      String  // mundane function: commuting | waiting | preparing | working | resting
  anomalyType      String  // unexpected_voice | impossible_pattern | npc_appearance
  contactType      String  // question | invitation | challenge | witness | signal
  decisionType     String  // interpretive | relational | courage | curiosity | boundary
  artifactAffinities String @default("[]") // JSON: ArtifactType[]
  allowedVectors   String  @default("[]") // JSON: e.g. ["fear:dissatisfied->fear:neutral"]

  @@map("orb_encounter_seeds")
}

model GmFaceModifier {
  id                    String @id @default(cuid())
  face                  String @unique // shaman|challenger|regent|architect|diplomat|sage
  anomalyStyle          String // numinous|provocative|official|patterned|social|subtle
  contactVoice          String // JSON descriptor
  interpretationPressure String // low|medium|high
  responseStyle         String // JSON descriptor
  artifactAffinity      String // primary artifact type preference

  @@map("gm_face_modifiers")
}

model OrbEncounter {
  id          String   @id @default(cuid())
  playerId    String
  seedId      String
  campaignId  String?
  gmFace      String   // shaman|challenger|regent|architect|diplomat|sage
  vector      String   // e.g. "fear:dissatisfied→fear:neutral"
  grammar     String   // JSON: 7-phase grammar object
  sceneDsl    String   // JSON: compiled Scene DSL
  status      String   @default("active") // active|resolved|abandoned
  createdAt   DateTime @default(now())

  player      Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  resolution  OrbEncounterResolution?
  artifacts   OrbArtifactEmission[]

  @@index([playerId, status])
  @@map("orb_encounters")
}

model OrbEncounterResolution {
  id            String   @id @default(cuid())
  encounterId   String   @unique
  playerId      String
  choiceId      String
  worldResponse String   // JSON
  resolvedAt    DateTime @default(now())

  encounter OrbEncounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  @@map("orb_encounter_resolutions")
}

model OrbArtifactEmission {
  id          String   @id @default(cuid())
  encounterId String
  type        String   // BAR | quest_hook | vibeulon | relationship_update | memory_entry
  payload     String   // JSON
  emittedAt   DateTime @default(now())

  encounter OrbEncounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  @@index([encounterId])
  @@map("orb_artifact_emissions")
}
```

Add to Player: `orbEncounters OrbEncounter[]`

### Types (`src/lib/orb-encounter/types.ts`)

```ts
export type GmFace = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
export type AnomalyType = 'unexpected_voice' | 'impossible_pattern' | 'npc_appearance'

export interface EncounterGrammar {
  context: { situation: string; mundane_function: string }
  anomaly: { description: string; style: string }
  contact: { voice: string; invitation: string }
  interpretation: { prompt: string; options: string[] }
  decision: { choices: Array<{ id: string; label: string; type: string }> }
  world_response: { by_choice: Record<string, string> }
  continuation: { artifact_affinities: string[]; next_scene_hint: string }
}
```

---

## OEG-2: GM Face Modifier Seed + Service
**Owner: Regent**

Seed all 6 face modifiers via script `scripts/seed-gm-face-modifiers.ts`.

Service `src/lib/orb-encounter/gm-face.ts`:
```ts
getGmFaceModifier(face: GmFace) → Promise<GmFaceModifier>
applyModulation(grammar: EncounterGrammar, modifier: GmFaceModifier) → EncounterGrammar
```

Regent governs which face may be applied per campaign phase. Face selection is not player-controlled.

---

## OEG-3: Encounter Seed Library
**Owner: Architect**

File: `seed-orb-encounters.json` — 3 seeds for v0:
1. `unexpected_voice` / `fear:dissatisfied→fear:neutral`
2. `impossible_pattern` / `fear:dissatisfied→fear:neutral`
3. `npc_appearance` / `fear:dissatisfied→fear:neutral`

Each seed has base grammar text (un-modulated). Modulation applied at compile time.

Script: `scripts/seed-orb-encounter-seeds.ts` + `npm run seed:orb-encounter-seeds`

---

## OEG-4: Encounter Compiler
**Owner: Architect**

`src/lib/orb-encounter/compiler.ts`:

```ts
compileEncounter(seed, vector, gmFace, context) → { grammar: EncounterGrammar; sceneDsl: SceneDsl }
```

Mapping to Scene DSL (per spec §12):
- context → entry scene cards
- anomaly → reveal/rupture cards
- contact → dialogue/narrative cards
- interpretation → prompt cards
- decision → choice card
- world_response → response cards (keyed by choice)
- continuation → artifact/continue/handoff cards

---

## OEG-5: Generate API Route
**Owner: Architect**

`src/app/api/orb-encounters/generate/route.ts` (POST)

- Auth: `bars_player_id` cookie
- Selects seed matching emotional vector + anomaly type
- Applies GM face modulation
- Compiles grammar + Scene DSL
- Persists OrbEncounter
- Returns full response schema

---

## OEG-6: Resolve Route + Artifact Emission
**Owner: Architect (structure) + Regent (artifact gate)**

`src/app/api/orb-encounters/[id]/resolve/route.ts` (POST)

- Validate choice_id against encounter grammar decisions
- Apply world_response for choice
- Regent gate: artifact emission legality
- Emit OrbArtifactEmission records
- If vector is growth: `advancePlayerAltitude`
- Persist OrbEncounterResolution
- Return state_updates + artifacts_emitted + next_scene

---

## OEG-7: Preview Route
**Owner: Architect**

`src/app/api/orb-encounters/preview/route.ts` (POST)

- Takes encounter_seed + gm_faces array
- Returns modulated encounters for each face
- No persistence — authoring/tuning tool only
- Admin-only (check admin role)

---

## OEG-8: Player-Facing Encounter UI
**Owner: Diplomat**

Page: `src/app/orb-encounter/[id]/page.tsx`
Component: `src/app/orb-encounter/[id]/OrbEncounterRunner.tsx`

UX principles (per spec):
- Preserve mystery — do not over-explain the anomaly
- Presence before information
- Sequential card reveal (context → anomaly → contact → interpretation prompt → decision)
- Interpretive choice buttons (not action-game buttons)
- World response revealed after choice
- Artifact/continuation shown last

Diplomat governs the empathic tone of Diplomat/Sage face rendering.

---

## Implementation Order Summary

| Phase | Owner | Deliverable |
|-------|-------|-------------|
| OEG-1 | Architect | 5 DB models + types |
| OEG-2 | Regent | GM face modifier seed + service |
| OEG-3 | Architect | 3 encounter seeds (v0) |
| OEG-4 | Architect | Encounter compiler |
| OEG-5 | Architect | Generate API route |
| OEG-6 | Architect + Regent | Resolve route + artifact emission |
| OEG-7 | Architect | Preview route (admin) |
| OEG-8 | Diplomat | OrbEncounterRunner UI |

---

## Layering Principle (per spec §15.4)

```
Emotional Alchemy → growth direction
GM face → world style
Orb grammar → encounter form
Scene DSL → rendering
```

Keep these four layers distinct and independently testable.
