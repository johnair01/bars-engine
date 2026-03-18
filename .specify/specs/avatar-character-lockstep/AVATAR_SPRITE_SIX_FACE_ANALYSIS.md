# Avatar + Character Lock-Step: Six-Face Analysis

**Date**: 2026-03-17  
**Methodology**: Six Game Master faces via Cursor subagents (Shaman→explore, Regent→evaluator, Challenger→contrarian, Architect→generalPurpose, Diplomat→simplifier, Sage→evaluator)  
**Note**: bars-agents MCP was unavailable; Cursor mcp_task subagents were used as proxies for each face.

---

## Executive Summary

**Highest-leverage path**: Unify `avatarConfig` as the single source of truth, add lock-step avatar preview to Character Creator, and use **pre-made layered assets + LPC hybrid** for sprite generation. Avoid runtime AI generation for now. The main gap is integration, not new systems. avatarConfig, character creation, and walkable format are in place.

**North Star Metric**: % of players who see a character-derived avatar (portrait or walkable) within 60 seconds of completing character creation.

---

## 1. Current State

### Avatar System (BARS Engine)

- **Layer stack**: base → nation_body → archetype_outfit → nation_accent → archetype_accent (64×64 PNG, transparent)
- **avatar-parts.ts**: `getUnlockedLayersForNode` maps BB campaign nodes to layers; `getAvatarPartSpecs` derives part specs from `avatarConfig`
- **Display points**: Dashboard, Conclave space (walkable), Build Your Character (Twine), CampaignReader (BB only)
- **Missing**: Character Creator (10+ phases, no avatar), onboarding/profile (dropdowns only), character share card

### Character Creation Flows

| Flow | Avatar? | Notes |
|------|---------|-------|
| onboarding/profile | No | Nation + archetype dropdowns |
| character-creator | No | Discovery → archetype → nation → story; text-only |
| Bruised Banana campaign | Yes | `getUnlockedLayersForNode` + OnboardingAvatarPreview |
| Character share card | No | Archetype + moves only |

### Gathertown Clone (eweren/gather.town)

- **Assets**: `assets/sprites`, `assets/images`, `assets/map`
- **Sprite format**: Aseprite (.aseprite) + JSON export + PNG; `characters` subfolder
- **Approach**: Single sprite per character (cat.png, crosshair.png); no composable layers
- **Size**: 32×32 typical for Gathertown (BARS uses 64×64)

### Sprite Generation Options (Researched)

| Option | Source | Fit for BARS |
|--------|--------|--------------|
| Pre-made layered | Current | High — matches PartLayer model |
| AI (DALL-E, prompts) | docs/SPRITE_ASSETS.md | Low — layer alignment issues |
| LPC 4wall.ai | Modular, CC-BY-SA | High — designed for stacking |
| Procedural/cellular | GitHub projects | Medium — for tiles, not avatars |
| SpriteForge photo-to-sprite | 2025 | Low — single image, no layers |

---

## 2. Shaman (Explore) — Emotional & Hidden Leverage Points

**Lens**: Emotional states, hidden aspects, belonging, ritual, identity

### Emotional Beats Lock-Step Avatar Would Create

1. **Ritual of becoming** — Each choice adds a visible layer. Avatar is a mirror of the journey, not a final badge.
2. **"I am being found"** — Archetype reveal + outfit layer together: "This is who I am" is both text and image.
3. **Anticipation and payoff** — Progressive reveal (base → nation → archetype → accents) creates small rewards at each step.
4. **Belonging before entry** — Seeing your character before entering the Conclave: "I already have a place here."
5. **Shareable identity** — The character card becomes a visual identity, not just a list of moves and answers.

### Shaman Insights

1. **Hidden ritual gap**: Character-creator is framed as ritual ("the archetype finds you") but has no visible ritual object. The avatar is the missing ritual artifact.
2. **Belonging is visual before textual**: An avatar that appears as they choose nation and archetype makes belonging concrete.
3. **Archetype reveal underused**: Showing the archetype outfit layer at that moment would anchor the revelation in the body.
4. **Shareable card hides identity**: Adding the avatar to the character card would make sharing feel like presenting a character, not a form.
5. **Two paths, one ritual**: BB campaign and character-creator are separate paths to the same identity. Unifying them with a shared avatar ritual would make both paths feel like the same rite of passage.

---

## 3. Architect (Design) — Phase → Layer Mapping

**Lens**: Quest design, strategy, versatile design

### Phase → Layer Mapping (Character Creator)

| Phase | base | nation_body | archetype_outfit | nation_accent | archetype_accent |
|-------|------|-------------|------------------|---------------|------------------|
| landing, discovery | ✓ | | | | |
| archetype_reveal … archetype_moves | ✓ | | ✓ | | |
| nation_discovery | ✓ | ✓ | ✓ | | |
| nation_moves | ✓ | ✓ | ✓ | ✓ | |
| story_community … complete | ✓ | ✓ | ✓ | ✓ | ✓ |

**Note**: Character Creator resolves archetype before nation, so avatar builds: base → archetype_outfit → nation_body → nation_accent → archetype_accent.

### Unification: `getUnlockedLayersForProgress`

Introduce a source-agnostic function:

```ts
type ProgressSource = 'bb' | 'character-creator' | 'onboarding-profile'

function getUnlockedLayersForProgress(
  source: ProgressSource,
  state: ProgressState,
  nodeId?: string  // for BB: currentNodeId
): PartLayer[]
```

### Implementation Options

| Option | Scope | Effort | Notes |
|--------|--------|--------|-------|
| **Minimal** | Character Creator only | ~1 day | Add phase-based unlock; avatar preview in Character Creator |
| **Medium** | BB + Character Creator | ~2–3 days | Single `getUnlockedLayersForProgress`; shared avatar preview component |
| **Full** | BB + Character Creator + Profile | ~4–5 days | Profile becomes progressive (domain, moves) |

**Recommendation**: Option B (Medium) — unify BB and Character Creator with one mapping, keep profile as-is for now.

---

## 4. Regent (Evaluator) — Sprite Generation Options

**Lens**: Structures, systems, assessment, optimization

### Evaluation Matrix

| Option | Cost | Consistency | Customization | Lock-Step | Map Integration |
|--------|------|-------------|---------------|-----------|-----------------|
| (A) Pre-made layered | Low | High | Medium | High | High |
| (B) AI generation | High | Low | High | Low | Medium |
| (C) LPC 4wall.ai | Low-Med | High | Med-High | High | High |
| (D) Procedural | Low | Medium | Low-Med | Medium | Medium |
| (E) Photo-to-sprite | Medium | Low | High | Low | Low |

### Regent Recommendations (Ranked)

1. **Double down on (A) + (C) hybrid** — Use LPC as base layer and nation/archetype overlays. Highest leverage: better visuals without structural change.
2. **Keep (A) as primary path** — Finish avatar-overwrite-transparency fix and ship the current layered system.
3. **Add (B) as optional override** — Use `sprite_url` for AI-generated avatars in non-critical contexts only.
4. **Explore (D) for tiles, not avatars** — Procedural for terrain/objects; keep avatars as layered assets.
5. **Defer (E)** — Photo-to-sprite is a separate feature; does not fit layered model.

---

## 5. Challenger (Contrarian) — What If We're Wrong?

**Lens**: Boundaries, narratives, skeptical

### Five "What if we're wrong?" Questions

| # | Question | Alternative framing |
|---|----------|---------------------|
| 1 | Is lock-step actually highest leverage? | Avatar as **reward/reveal** after character creation |
| 2 | Is 64×64 composable the right constraint? | **32×32 or smaller**; single coherent sprite over layered complexity |
| 3 | Does AI generation create uncanny valley for cozy? | **Human-curated coherence**; AI only where variation is acceptable |
| 4 | Must avatar be required? | Avatar as **optional** or **separate mini-game** |
| 5 | Whose story does the avatar tell? | **Player-authored discovery** vs. system-authored construction |

### Bottom Line

The current design optimizes for **immediate feedback** and **flexibility**. A contrarian path optimizes for **narrative payoff**, **simplicity**, and **player agency**. The "wrong" problem might be: we're solving "how to show avatar during creation" instead of "when does showing the avatar matter most?"

---

## 6. Diplomat (Simplifier) — Community Clarity

**Lens**: Community, relationships, clarifies and connects

### Simplest Mental Model

*"Your choices become your look."*

- Nation → body/clothing (who you belong to)
- Archetype → outfit/accent (how you show up)
- Domain → when the accent unlocks (where you act)

### Sprite Pipeline for Contributors

```
Choices (nation, archetype) → avatarConfig JSON → layered PNGs → Avatar component
                                    ↓
                    public/sprites/parts/{layer}/{key}.png
```

**One rule**: Keys = slugified names (`"The Bold Heart"` → `bold-heart`). Same key everywhere.

### The One Thing to Get Right

**One source of truth for identity.** Avatar is not a separate system. It is a **view** of `nationId` + `archetypeId` (+ optional domain). All entry points write to those fields; avatar reads from them.

---

## 7. Sage (Synthesis) — Integrated Recommendation

**Lens**: Integration, synthesis, emergence

### Top 3 Prioritized Actions

| # | Action | Impact |
|---|--------|--------|
| **1** | **Unify avatarConfig as map gate** — In Lobby/World, gate on `avatarConfig` instead of `spriteUrl`. If avatarConfig exists, derive walkable URL via `getWalkableSpriteUrl`; if not, show SpriteSelector or redirect to Build Your Character. | High |
| **2** | **Wire pixi-room to render walkable sprites** — Load `Sprite` textures from `getWalkableSpriteUrl(config)` for player and agents instead of `Graphics` rectangles. | High |
| **3** | **Procedural nation–archetype walkable sprites** — Run `derive-base-sprites.ts` (or equivalent) to generate walkable sprites for active nation–archetype pairs. | Medium |

### Avatar + Character Lock-Step (UX)

- **Character Creator**: Add `CharacterCreatorAvatarPreview` with phase-based unlock. Use `getUnlockedLayersForProgress('character-creator', state)`.
- **Unify**: `getUnlockedLayersForProgress(source, state, nodeId)` as single source of truth for BB and Character Creator.
- **Profile**: Keep dropdown-only for now; Option C can follow if profile becomes a guided flow.

### Sprite Generation (Assets)

- **Primary**: Pre-made layered assets (current) + LPC 4wall.ai hybrid for base layer.
- **Avoid**: Runtime AI sprite generation until format and UX are stable.
- **Defer**: Photo-to-sprite; procedural for avatars.

---

## 8. Gathertown Clone Learnings

- **eweren/gather.town**: Uses Aseprite (.aseprite) + JSON + PNG; single sprites per character; `assets/sprites/characters` folder
- **BARS difference**: Composable layers (base, nation, archetype) vs. single sprite; 64×64 vs. 32×32
- **Takeaway**: Gathertown's simplicity (single sprite per character) is easier to author but less flexible. BARS's layered approach supports nation×archetype combos without N×M assets. Lock-step works with layered: each choice unlocks a layer.

---

## 9. References

- [avatar-parts.ts](../../src/lib/avatar-parts.ts) — `getUnlockedLayersForNode`, `getAvatarPartSpecs`
- [docs/SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md) — Layer layout, AI prompts, LPC
- [Character Creator design](../../.specify/specs/strand-system-bars/AVATAR_CHARACTER_LOCKSTEP_DESIGN.md) — Architect phase→layer mapping
- [eweren/gather.town](https://github.com/eweren/gather.town) — assets/sprites, assets/map
- [LPC 4wall.ai](https://lpc.4wall.ai/) — Modular generator
