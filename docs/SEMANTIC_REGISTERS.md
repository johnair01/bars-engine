# Semantic registers (ARDS)

**Canonical spec:** [.specify/specs/asset-register-design-system/spec.md](../.specify/specs/asset-register-design-system/spec.md) (Asset Register Design System).

This page is the **entry point** for contributors and forks: what each register means, format, and where tokens/code live. Forks replace assets **per register** (see spec § Forkability Architecture).

## One table

| # | Register | Question | Primary format / contract | Token / code anchor |
|---|----------|----------|----------------------------|------------------------|
| 1 | **Cosmic** | Who is this archetype in mythic form? | 1024×1024 RGBA PNG (40 nation×archetype) | `src/lib/ui/card-art-registry.ts`, `ELEMENT_TOKENS` palettes |
| 2 | **Provenance stamp** | Where did this BAR come from? | 24×24 nation sigil + 16×16 archetype mark (13 assets) | `.specify/specs/provenance-stamp-system/spec.md`, future `resolveProvenanceStamp()` |
| 3 | **Portrait** | Who at human scale? | Layered 64×64 parts + Register 3 crop/vignette | `Avatar.tsx` (`register3` + `element`), `register-portrait.ts`, `IntentAgentPanel`, `TradePanel` |
| 4 | **Walk sprite** | Who in motion? | 512×64 sheets, base + nation + archetype layers | `getWalkableSpriteUrl`, `nation-element.ts` (nation → `ELEMENT_TOKENS.frame`), lobby YAML |
| 5 | **Frame / Chrome** | What state and move? | Altitude + stage via CSS; 24×24 **move icons** (4 PNGs) | `ALTITUDE_TOKENS`, `STAGE_TOKENS`, `public/icons/moves/*.png` (+ `npm run assets:move-icons`), `src/lib/ui/move-icons.ts` |
| 6 | **Zone / Texture** | What kind of space? | Tileable 64×64 dark textures | `SURFACE_TOKENS.bgBase`, `src/lib/ui/zone-surfaces.ts`, `public/textures/zone-{vault,lobby,quest}.png`, `npm run assets:zone-textures` |
| 7 | **Ceremony / Effect** | What just happened? | CSS animations tinted by element | `elementCssVars()`, `ELEMENT_TOKENS` |

## One paragraph per register

**Cosmic** — Full-bleed identity art: one illustration per nation+archetype pairing. Establishes palette and silhouette for everything below it.

**Provenance stamp** — Small two-part seal (nation glyph + archetype mark) on BAR/quest corners so creative genealogy survives trades. Spec’d separately; not all marks exist in repo yet.

**Portrait** — Conversation-scale face: layered sprite parts (`getAvatarPartSpecs`) in a circular frame; Register 3 adds `object-position: center 15%` on layers and an element-colored ring via `registerPortraitShellStyle` when `Avatar` is used with `register3` + `element`. **IntentAgentPanel** and **TradePanel** use this pattern for lobby/trade faces.

**Walk sprite** — Composited lobby avatar: neutral base, nation color layer, archetype silhouette; same `AvatarConfig` keys as portrait. **Nation body** placeholder tints in `scripts/generate-nation-placeholders.ts` follow `ELEMENT_TOKENS[element].frame` via `NATION_KEY_TO_ELEMENT` in `nation-element.ts`.

**Frame / Chrome** — Card chrome encodes **altitude** (dissatisfied / neutral / satisfied) and **stage** (seed / growing / composted) via tokens; four **move** icons (Wake / Clean / Grow / Show) complete the grammar for badges and compasses.

**Zone / Texture** — Ambient room identity: subtle tileable backgrounds so Vault, lobby, and quest spaces read differently without relying only on flat black. Three shipped assets (64×64 RGBA, tileable): `zone-vault.png` (grain), `zone-lobby.png` (faint grid), `zone-quest.png` (crosshatch). Regenerate with `npm run assets:zone-textures` (`scripts/generate-zone-textures.ts`). Surfaces use `zoneBackgroundStyle()` in `src/lib/ui/zone-surfaces.ts` (base color `SURFACE_TOKENS.bgBase`, `background-repeat: repeat`). **Hand** uses `HandZoneLayout` (`/hand/quests/*` → quest texture; otherwise vault). **Lobby** and related full-screen shells use the lobby texture.

**Ceremony / Effect** — Short-lived feedback (trade complete, BAR landed): element-colored motion, driven by tokens rather than bespoke images.

## Where to see registers come together (integration)

The **BAR lobby world** already has **five walkable rooms** (four nation homerooms + Card Club), seeded by `scripts/seed-bar-lobby-world.ts` and reachable at `/lobby` and `/lobby/[roomSlug]`. Floors are **placeholder color blocks** in Pixi today; as ARDS assets land (walk layers, zone textures, ceremony, etc.), **these rooms are the intended first surface** to validate behavior and feel the stack — see the spec section *Integration surface — BAR lobby world* in [.specify/specs/asset-register-design-system/spec.md](../.specify/specs/asset-register-design-system/spec.md).

## Related

- **Implementation tasks:** [.specify/specs/asset-register-design-system/tasks.md](../.specify/specs/asset-register-design-system/tasks.md)
- **Card tokens (annotated):** `src/lib/ui/card-tokens.ts`
- **Cosmic surfaces wiring:** `.specify/specs/card-art-surface-integration/spec.md`
