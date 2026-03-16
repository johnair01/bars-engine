# Six-Face Analysis: Asset Management, BAR Upload, Walkable Sprites

**Feature scope:** (1) Upload BARs; (2) Sprites that walk over a Gathertown-style experience.

**Purpose:** Run the asset management spec through each Game Master face before drafting the spec. Each face asks different questions and surfaces different risks, opportunities, and design constraints.

**Reference:** [.agent/context/game-master-sects.md](../../.agent/context/game-master-sects.md), [game-master-face-moves/spec.md](../game-master-face-moves/spec.md)

---

## Shaman (Earth — Mythic threshold, belonging, ritual)

**Lens:** Belonging, ritual space, bridge between worlds.

### Questions

- How does asset upload become a **ritual** rather than a chore? (e.g. naming a BAR before upload, a moment of intention)
- Does the spatial map feel like a **threshold** — a place players cross into, not just a UI?
- What **belonging** does a player feel when their avatar walks the map? (identity, presence, "I am here")
- Is there a ritual moment before entering the spatial lobby? (e.g. "Enter the space" as a choice, not auto-load)

### Risks

- Treating assets as cold storage; losing the mythic layer.
- Spatial map as pure utility; no sense of crossing into a shared space.

### Opportunities

- BAR upload as "offering" — player contributes to the collective.
- First step onto the map as a ritual: "You enter the Conclave."

### Design implications

- Consider a brief "Enter space" or "Name your intention" before first spatial load.
- BAR upload flow: optional "intention" or "offering" field before submit.
- Avatar presence on map = belonging; ensure player sees self and others.

---

## Challenger (Fire — Proving ground, action, edge)

**Lens:** Action, edge, lever.

### Questions

- What **challenge** does asset upload or spatial navigation pose? (quality bar? validation? time limit?)
- Is walking the map **action** or passive? (clicks, movement, interactions)
- What **edge** does the spatial experience create? (proximity triggers? encounters? "You're ready" moments?)
- Does BAR upload have a **proving ground** — e.g. admin review, community vote, energy cost?

### Risks

- Making everything frictionless; no stakes, no edge.
- Spatial map as decorative; no meaningful actions or challenges.

### Opportunities

- BAR upload: challenge = "Is this worthy of the collective?" (review, curation).
- Spatial: proximity-based encounters, "approach another player" as action.
- Movement as energy cost or cooldown (optional lever).

### Design implications

- Define at least one "challenge" in each flow: BAR upload (curation/review?), spatial (encounter?).
- Movement should feel intentional, not passive scrolling.
- Consider: what happens when two avatars meet?

---

## Regent (Lake — Order, structure, roles, rules)

**Lens:** Roles, rules, collective tool.

### Questions

- Who can upload BARs? (admin only? players? instance owners?)
- What **roles** govern asset access? (viewer, contributor, steward, admin)
- What **rules** govern the spatial map? (one avatar per player? room capacity? movement rules?)
- How does the asset registry **order** the chaos of user uploads? (taxonomy, tags, pools)

### Risks

- No clear roles → permission confusion, abuse.
- No rules for spatial behavior → griefing, clutter.

### Opportunities

- Asset roles: `creator`, `steward`, `viewer` — who can edit/delete.
- Spatial rules: room capacity, movement speed, collision.
- BAR lifecycle: draft → review → published (Regent declares period).

### Design implications

- Define roles for BAR upload (who, when, where).
- Define spatial rules (movement, collision, room limits).
- Asset taxonomy: type (bar_attachment | sprite | tile), pool (efa | dojo | discovery | gameboard), owner.

---

## Architect (Heaven — Blueprint, strategy, project)

**Lens:** Blueprint, strategy, advantage.

### Questions

- What is the **blueprint** for asset storage? (single registry? layered by type? Vercel Blob vs public/ vs DB?)
- How does the spatial map **link to the graph**? (room → node; teleporter → edge)
- What **strategy** does a unified asset model enable? (reuse, versioning, provenance)
- How do walkable sprites **extend** the existing avatar system? (portrait busts → top-down spritesheets)

### Risks

- Ad-hoc storage; no coherent model; duplication.
- Spatial map disconnected from quest/campaign graph.

### Opportunities

- **Asset model:** `Asset` (id, type, url, metadataJson, ownerId) — one registry for BAR attachments, sprites, tiles.
- **Spatial–graph link:** MapRoom.graphNodeId (existing); teleporter → ThreadQuest or passage.
- **Sprite extension:** Add `walkableSpritesheetUrl` to avatar config; layer on top of portrait for map view.

### Design implications

- Draft Asset schema or extend existing patterns (Book, sprite paths) into a coherent model.
- Document spatial → graph mapping (room, teleporter, encounter).
- Sprite format spec: spritesheet dimensions, frame layout, directions (N/S/E/W).

---

## Diplomat (Wind — Weave, relational field, care)

**Lens:** Relational field, care, connector.

### Questions

- How do BARs **connect** players? (shared artifacts, marketplace, "Player X also contributed")
- How does the spatial map support **connection**? (see others, approach, proximity chat?)
- What **care** does the system show for contributors? (attribution, visibility, reward)
- Does asset upload create **invitation**? (e.g. "Share this BAR with your campaign")

### Risks

- Assets as isolated; no relational dimension.
- Spatial map as solo experience; no sense of "we're here together."

### Opportunities

- BAR attribution: creator, stewards, "inspired by."
- Spatial: show other players' avatars; optional "wave" or "approach" interaction.
- Shared assets: campaign-level BAR pool; instance-level tiles.

### Design implications

- BAR metadata: creatorId, sharedWithInstanceId, attribution.
- Spatial: multiplayer presence (other avatars visible); consider lightweight presence (no full real-time initially).
- Asset sharing: who can see/use this BAR?

---

## Sage (Mountain — Wise trickster, integration, flow)

**Lens:** Integration, emergence, flow.

### Questions

- How do BAR upload, spatial map, and walkable sprites **integrate**? (one flow or three separate features?)
- What **emerges** when players upload BARs and walk a shared map? (collective content, social proof, encounters)
- Where does the **flow** break? (upload fails, map doesn't load, sprites don't render)
- What **paradox** must we hold? (curation vs openness; structure vs emergence)

### Risks

- Three disconnected features; no emergent whole.
- Over-specifying; killing emergence.

### Opportunities

- **Unified metaphor:** "The Conclave" = space where BARs are offered and avatars walk. Upload and spatial are one world.
- **Emergence:** Proximity + BAR content → suggested connections (Diplomat); encounters in space (Challenger).
- **Flow:** Upload → review → published → appears in library/market; avatar → map → room → graph node.

### Design implications

- Name the integrated experience (e.g. "Conclave space," "Gathering hall").
- Map the flow: BAR upload → ? → spatial visibility; avatar → map → encounter.
- Hold the paradox: structure (Regent) enables emergence (Sage).

---

## Synthesis: Cross-Face Themes

| Theme | Faces | Implication |
|-------|-------|-------------|
| **Ritual + Challenge** | Shaman, Challenger | Upload and entry have weight; not frictionless utility |
| **Roles + Blueprint** | Regent, Architect | Clear roles, coherent asset model, spatial–graph link |
| **Connection + Integration** | Diplomat, Sage | BARs and avatars exist in a shared world; presence matters |
| **Belonging + Order** | Shaman, Regent | Rules create safety; ritual creates meaning |
| **Edge + Flow** | Challenger, Sage | Stakes without rigidity; structure enables emergence |

---

## Recommended Spec Angles (from this analysis)

1. **Asset model:** Unified or layered? (Architect) Roles for upload/view/edit. (Regent)
2. **BAR upload:** Ritual moment? (Shaman) Challenge/curation? (Challenger) Attribution? (Diplomat)
3. **Spatial map:** Entry ritual? (Shaman) Movement rules? (Regent) Proximity/encounters? (Challenger, Diplomat)
4. **Walkable sprites:** Extend avatar system (Architect); format spec (Architect); presence = belonging (Shaman)
5. **Integration:** One metaphor (Sage); flow diagram (Sage)

---

## Next Step

Use this analysis to inform the spec. Prioritize:
- **Must-have:** Asset model, roles, spatial–graph link, sprite format
- **Should-have:** Ritual/challenge in upload, multiplayer presence
- **Could-have:** Proximity encounters, BAR sharing between players
