# Tasks: Orb Encounter Grammar v0

## OEG-1: DB Models + Types (Architect)

- [ ] Add `OrbEncounterSeed`, `GmFaceModifier`, `OrbEncounter`, `OrbEncounterResolution`, `OrbArtifactEmission` to `prisma/schema.prisma`
- [ ] Add Player relation: `orbEncounters OrbEncounter[]`
- [ ] Run `npm run db:sync`
- [ ] Create `src/lib/orb-encounter/types.ts` with `GmFace`, `AnomalyType`, `EncounterGrammar`

## OEG-2: GM Face Modifier Seed + Service (Regent)

- [ ] Create `seed-gm-face-modifiers.json` with all 6 face modifier records
- [ ] Create `scripts/seed-gm-face-modifiers.ts` + add `"seed:gm-face-modifiers"` to `package.json`
- [ ] Create `src/lib/orb-encounter/gm-face.ts` with `getGmFaceModifier` + `applyModulation`

## OEG-3: Encounter Seed Library (Architect)

- [ ] Create `seed-orb-encounters.json` with 3 seeds (unexpected_voice, impossible_pattern, npc_appearance for fear:dissatisfied→fear:neutral)
- [ ] Create `scripts/seed-orb-encounter-seeds.ts` + add `"seed:orb-encounter-seeds"` to `package.json`

## OEG-4: Encounter Compiler (Architect)

- [ ] Create `src/lib/orb-encounter/compiler.ts` with `compileEncounter(seed, vector, gmFace, context)`
- [ ] Map all 7 grammar phases to Scene DSL card structure

## OEG-5: Generate API Route (Architect)

- [ ] Create `src/app/api/orb-encounters/generate/route.ts` (POST)
- [ ] Auth: `bars_player_id` cookie
- [ ] Returns full response schema with encounter_id, grammar, scene_dsl, artifact_affinities

## OEG-6: Resolve Route + Artifact Emission (Architect + Regent)

- [ ] Create `src/app/api/orb-encounters/[id]/resolve/route.ts` (POST)
- [ ] Validate choice_id against decision choices
- [ ] Apply world_response for choice
- [ ] Regent gate on artifact emission legality
- [ ] Emit OrbArtifactEmission records
- [ ] Advance altitude if isGrowth choice
- [ ] Return state_updates + artifacts_emitted + next_scene

## OEG-7: Preview Route (Architect)

- [ ] Create `src/app/api/orb-encounters/preview/route.ts` (POST)
- [ ] Admin-only (check admin role)
- [ ] Returns modulated encounters for each requested GM face without persistence

## OEG-8: Player-Facing Encounter UI (Diplomat)

- [ ] Create `src/app/orb-encounter/[id]/page.tsx` (auth-gated)
- [ ] Create `src/app/orb-encounter/[id]/OrbEncounterRunner.tsx`
  - [ ] Sequential card reveal: context → anomaly → contact → interpretation → decision
  - [ ] Interpretive choice buttons (styled to feel weighty, not action-game)
  - [ ] World response reveal after choice
  - [ ] Artifact/continuation feedback at end
  - [ ] Respect GM face tone (Diplomat/Sage: quieter; Challenger: higher pressure)

## Verification

- [ ] fear:dissatisfied + architect face generates valid encounter
- [ ] Same seed + challenger face produces distinct tone/pressure
- [ ] Player choice resolves encounter and emits artifact
- [ ] Preview endpoint returns 3 modulated encounters without persisting
- [ ] Run `npm run build` + `npm run check`
