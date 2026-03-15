# Plan: Growth Scene Generator v0
### Architect + Regent + Diplomat Implementation Plan

---

## Agent Roles

| Agent | Domain |
|-------|--------|
| **Architect** | Schema, API routes, Scene DSL compiler, scene selection wiring, type system |
| **Regent** | Artifact emission validation, NPC verb authorization, campaign phase gating |
| **Diplomat** | Player-facing card rendering, choice UX, relationship_update artifact, emotional state feedback |

---

## Dependency Order

```
GSG-1: GrowthScene DB model + Scene DSL type
        ↓
GSG-2: Scene generator service (selectScene → DSL compiler)
        ↓
GSG-3: POST /api/growth-scenes/generate
        ↓
GSG-4: POST /api/growth-scenes/resolve (+ artifact emission)
        ↓
GSG-5: Player-facing card UI (/growth-scene/[id])
        ↓
GSG-6: NPC verb wiring (growth scene → NPC action)
```

---

## GSG-1: GrowthScene DB Model + Scene DSL Type
**Owner: Architect**

### Schema additions (`prisma/schema.prisma`)

```prisma
model GrowthScene {
  id            String   @id @default(cuid())
  playerId      String
  vector        String   // e.g. "fear:dissatisfied→fear:neutral"
  templateId    String
  sceneDsl      String   // JSON: Scene DSL object
  status        String   @default("active") // active|resolved|abandoned
  choiceMade    String?
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?

  player    Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  artifacts GrowthSceneArtifact[]

  @@index([playerId, status])
  @@map("growth_scenes")
}

model GrowthSceneArtifact {
  id         String   @id @default(cuid())
  sceneId    String
  type       String   // BAR | quest_hook | vibeulon | relationship_update | memory_entry
  payload    String   // JSON
  emittedAt  DateTime @default(now())

  scene GrowthScene @relation(fields: [sceneId], references: [id], onDelete: Cascade)

  @@index([sceneId])
  @@map("growth_scene_artifacts")
}
```

### Types (`src/lib/growth-scene/types.ts`)

```ts
export interface SceneDsl {
  scene_id: string
  vector: string
  cards: Array<{ text: string }>
  choices: string[]
}

export type ArtifactType = 'BAR' | 'quest_hook' | 'vibeulon' | 'relationship_update' | 'memory_entry'

export interface SceneArtifact {
  type: ArtifactType
  payload: Record<string, unknown>
}
```

---

## GSG-2: Scene Generator Service
**Owner: Architect**

### `src/lib/growth-scene/generator.ts`

```ts
generateScene(playerId, opts?) → Promise<{ scene: GrowthScene; dsl: SceneDsl }>
```

Logic:
1. Get player alchemy state (`getPlayerAlchemyState`)
2. Compute vector: `${channel}:${altitude}→${channel}:${nextAltitude}`
3. Select template via `selectScene(playerId, opts)`
4. Compile SceneDsl from template (cards from situation/friction/invitation, choices from template.choices)
5. Persist GrowthScene record

---

## GSG-3: POST /api/growth-scenes/generate
**Owner: Architect**

Route: `src/app/api/growth-scenes/generate/route.ts`

- Auth: requires `bars_player_id` cookie
- Calls `generateScene(playerId)`
- Returns `{ scene_id, vector, scene_dsl }`

---

## GSG-4: POST /api/growth-scenes/resolve
**Owner: Architect (structure) + Regent (artifact validation)**

Route: `src/app/api/growth-scenes/resolve/route.ts`

Logic:
1. Load GrowthScene + template
2. Validate choice against template.choices
3. Determine if choice isGrowth → advance altitude via `advancePlayerAltitude`
4. Emit artifacts based on choice + template artifact_affinities
5. Mark scene resolved, set choiceMade
6. Return `{ emotional_state_update, artifacts_emitted, npc_actions }`

Regent gate: artifact emission must not bypass campaign phase or mint vibeulons outside alchemy rules.

---

## GSG-5: Player-Facing Card UI
**Owner: Diplomat**

Page: `src/app/growth-scene/[id]/page.tsx`
Component: `src/app/growth-scene/[id]/GrowthSceneRunner.tsx`

- Renders Scene DSL cards sequentially (card stage pattern, same as orientation)
- Final card renders choice buttons
- On choice: POST to `/api/growth-scenes/resolve`
- Shows artifact emission feedback (vibeulon awarded, BAR seeded, etc.)
- Emotional state progress bar (altitude indicator)

---

## GSG-6: NPC Verb Wiring
**Owner: Regent + Architect**

After scene resolution, if an active NPC constitution has `deepen_scene` or `affirm_player` in `can_initiate`:
- Select NPC via `listNpcConstitutions({ status: 'active' })`
- Create NpcAction with appropriate verb
- Return in `npc_actions` response field

This is additive — scene works without NPC wiring, NPC enriches it.

---

## Implementation Order Summary

| Phase | Owner | Deliverable |
|-------|-------|-------------|
| GSG-1 | Architect | GrowthScene + GrowthSceneArtifact schema |
| GSG-2 | Architect | generateScene() service |
| GSG-3 | Architect | generate API route |
| GSG-4 | Architect + Regent | resolve API route + artifact emission |
| GSG-5 | Diplomat | GrowthSceneRunner UI |
| GSG-6 | Regent + Architect | NPC verb wiring |
