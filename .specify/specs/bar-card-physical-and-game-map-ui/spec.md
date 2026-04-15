# Spec: BAR Card Physical Feel + Image/File Attachments + Game Map UI

## Purpose

1. **BAR page & card**: Make BARs feel like receiving a physical card; support photo/file uploads as part of BARs.
2. **Game map (Conclave map)**: Eliminate white space, fit fully on mobile, extensible for virtual WASD avatar navigation.

Design decisions are guided by the **Six Game Master Faces** (canonical: Shaman, Challenger, Regent, Architect, Diplomat, Sage). Reference: `.agent/context/game-master-sects.md`, `src/lib/quest-grammar/types.ts`.

---

## Part A: BAR Card — Physical Feel & Attachments

### Current State

- **BarCard** (`src/components/bar-card/BarCard.tsx`): Poker-card proportions (2.5:3.5), paper texture, charge glow, flip variant.
- **BAR detail** (`/bars/[id]`): BarCard + tags, share history, send form, charge routing.
- **CustomBar** schema: No image/photo field. `BarAttachment` exists but links BAR→entity (bar-to-bar, bar-to-quest), not BAR→uploaded file.
- **BarCardData**: title, description, type, chargeType, creatorName, createdAt.

### GM Face Analysis — BAR as Physical Card

| Face | Role | Mission | Design Questions | Recommendations |
|------|------|---------|------------------|-----------------|
| **Shaman** | Mythic threshold | Belonging, ritual space, bridge between worlds | Does the card feel like it *belongs* in your hand? Is receiving it a ritual moment? | **Reception ritual**: Animate card "arrival" (slide-in, subtle scale). Receiving a BAR = crossing a threshold. Consider envelope/package metaphor before reveal. |
| **Challenger** | Proving ground | Action, edge, lever | Is the card actionable? Does it invite you to *do* something? | **Action-forward front**: Title + one-line "what to do" on front. Back holds detail. Physical cards have weight—show "stakes" (reward, charge type) at a glance. |
| **Regent** | Order, structure | Roles, rules, collective tool | Who created it? What rules govern it? | **Creator stamp**: Subtle creator mark (avatar, nation). Tags as "official" categories. Share history = lineage. |
| **Architect** | Blueprint | Strategy, project, advantage | How does it fit the system? What's the structure? | **Extensible schema**: Add `BarMedia` or `BarAttachment` for images/files. Store in Vercel Blob or similar. Card layout: front = minimal, back = full content + attachments. |
| **Diplomat** | Weave | Relational field, care, connector | Who can see it? Who sent it? Connection between people. | **Relational cues**: "From [name]" on back. Share note visible. Attachments (photos) = personal touch—creator's handwriting, their photo. |
| **Sage** | Whole | Integration, emergence, flow | Does the whole cohere? Is the card part of a larger flow? | **Flow context**: "Part of [thread/campaign]" when applicable. Attachments integrate into the card—not bolted on. |

### Physical Card Design Principles

1. **Reception moment** (Shaman): First view = card arriving. Not a static box.
2. **Front = hook, back = depth** (Challenger): Front: title + one action. Back: full description, creator, attachments.
3. **Tactile cues** (Regent): Paper texture (existing), subtle shadow, maybe slight tilt on hover. Edge treatment by charge type.
4. **Attachments as part of the card** (Architect, Diplomat): Photos/files live *on* the card (back), not in a separate section. Like a polaroid taped to a postcard.
5. **Handwriting / personal** (Diplomat): Optional: allow creator to add a "note" that feels handwritten (font choice, or future: actual handwriting capture).

### Photo/File Upload — Schema & UX

**Schema options** (Architect lens):

- **Option A**: New `BarMedia` model — `barId`, `url` (Vercel Blob), `kind` (image | file), `sortOrder`, `createdAt`.
- **Option B**: Extend `BarAttachment` — add `fileUrl`, `fileKind` when `targetEntityType = 'bar'` and `targetEntityId = barId` (self-attachment). Reuse existing model.
- **Option C**: JSON on CustomBar — `attachmentsJson` storing `[{url, kind, name}]`. Simpler, no migration, but less queryable.

**Recommendation**: Option A (`BarMedia`) — clear ontology, supports multiple images/files per BAR, easy to query and display.

**Upload flow** (Challenger, Diplomat):

- Create BAR → optional "Add photo" / "Add file" during or after creation.
- Camera capture on mobile (take picture of physical BAR).
- File picker for existing images/PDFs.
- Display: Grid on card back, below description. Tap to expand.

**Physical BAR capture** (Shaman, Challenger):

- "Take a photo of a physical BAR" — user photographs a handwritten card, sticky note, etc.
- Image becomes the BAR's primary visual; OCR optional (future) to extract title/description.
- This bridges physical ↔ digital — ritual of capturing something real.

---

## Part B: Game Map (Conclave Map) UI

### Current State

- **Game map** (`/game-map`): 4 lobby cards (Library, EFA, Dojos, Gameboard) in a 2-column grid. `max-w-4xl mx-auto`, `p-4 sm:p-8 md:p-10`.
- **Map page** (`/map`): Story/Thread/Vibeulon maps using ReactFlow. Different use case.
- User intent: "Conclave map" likely = game-map (4 lobbies) or a future spatial map with avatars.

### GM Face Analysis — Game Map

| Face | Role | Mission | Design Questions | Recommendations |
|------|------|---------|------------------|-----------------|
| **Shaman** | Mythic threshold | Belonging, ritual space | Does the map feel like a *place* you belong? | **Spatial presence**: Map as a room/space, not a form. Lobbies as regions. Future: avatar in the space. |
| **Challenger** | Proving ground | Action, edge | Can you move? Is navigation clear? | **WASD-ready**: Virtual D-pad in bottom corner. Extensible: `useKeyboardNav` + on-screen controls. Action = "go there." |
| **Regent** | Order, structure | Roles, rules | What's the structure? Clear hierarchy? | **4 quadrants**: Library (Wake Up), EFA (Clean Up), Dojos (Grow Up), Gameboard (Show Up). No ambiguity. |
| **Architect** | Blueprint | Strategy, project | Does it scale? Fit all viewports? | **Mobile-first**: `min-h-dvh`, `h-dvh` or `100dvh` to fill viewport. No scroll on mobile for map itself. Lobbies as touch targets. |
| **Diplomat** | Weave | Relational | Who else is here? Connection? | **Future**: Avatars of other players in lobbies. "3 in Library." For now: clear entry points. |
| **Sage** | Whole | Integration, flow | Does the whole fit? Coherent? | **Single screen**: Map + controls in one view. No white space. Extensible to avatar + WASD without layout thrash. |

### Game Map UI Improvements

1. **Eliminate white space** (Architect, Sage):
   - Use `min-h-dvh` or `h-dvh` so map fills viewport.
   - Remove `max-w-4xl` or make it responsive: full width on mobile, constrained on desktop.
   - Reduce padding on mobile: `p-2 sm:p-4 md:p-6`.

2. **Fit fully on screen (mobile)** (Architect):
   - Grid: `grid-cols-2` on mobile, compact cards.
   - Card padding: `p-3 sm:p-5`.
   - Header: Collapsible or minimal on mobile.
   - Ensure no vertical scroll for the 4 lobbies.

3. **Extensible for virtual WASD** (Challenger, Architect):
   - Reserve bottom-right corner: `position: fixed; bottom: 1rem; right: 1rem;` for future D-pad.
   - Component: `VirtualWASD` or `VirtualDpad` — 4 buttons (up/down/left/right) or 5 (center = select).
   - Layout: Map content uses `padding-bottom` and `padding-right` so D-pad doesn't overlap.
   - Keyboard: `useEffect` with `keydown` for W/A/S/D or arrow keys. Shared with on-screen controls.
   - Avatar: Future—player position state, render avatar on map. For now, structure supports it.

4. **Conclave map vs game-map**:
   - If "conclave map" = game-map (4 lobbies): Apply above.
   - If "conclave map" = spatial avatar map: New component, same principles (fill screen, WASD-ready, no white space).

---

## Implementation Order

### Phase 1: BAR Physical Feel (no schema change)

- [ ] BarCard: Add "reception" animation (slide-in, subtle scale) when card first appears.
- [ ] BarCard: Refine front = hook (title + one-line action), back = full.
- [ ] BAR detail page: Card-first layout; tags, share history below.

### Phase 2: BAR Attachments (schema + upload)

- [ ] Add `BarMedia` model: barId, url, kind (image|file), sortOrder.
- [ ] Create upload API (Vercel Blob or similar).
- [ ] BAR create/edit: "Add photo" / "Add file" UI.
- [ ] BarCard back: Display attachment grid.
- [ ] Optional: Camera capture for "photo of physical BAR."

### Phase 3: Game Map UI

- [ ] Game map: `min-h-dvh`, reduce padding, full-width on mobile.
- [ ] Compact lobby cards on mobile.
- [ ] Reserve bottom-right for future D-pad (spacer or placeholder).
- [ ] Document `VirtualWASD` interface for future implementation.

### Phase 4: Virtual WASD (when avatar navigation exists)

- [ ] `VirtualWASD` component.
- [ ] Keyboard nav hook.
- [ ] Avatar position state + render.

---

## Reference

- Game Master Faces: `.agent/context/game-master-sects.md`
- BarCard: `src/components/bar-card/BarCard.tsx`
- BarCardData: `src/lib/bar-card-data.ts`
- BAR detail: `src/app/bars/[id]/page.tsx`
- Game map: `src/app/game-map/page.tsx`
- CustomBar schema: `prisma/schema.prisma`
- BarAttachment: `prisma/schema.prisma` (current: bar-to-entity links)
