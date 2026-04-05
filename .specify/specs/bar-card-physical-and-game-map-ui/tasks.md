# Tasks: BAR Card Physical Feel + Attachments + Game Map UI

## Phase 1: BAR Physical Feel (no schema)

- [ ] **1.1** BarCard: Add `reception` variant—animate slide-in + scale when first mounted.
- [ ] **1.2** BarCard: Refine front (title + one-line "what to do") vs back (full description).
- [ ] **1.3** BAR detail page: Card-first layout; move tags/share history below card.

## Phase 2: BAR Attachments

- [ ] **2.1** Add `BarMedia` model to Prisma: barId, blobUrl, kind, sortOrder, createdAt.
- [ ] **2.2** Run `npm run db:sync`.
- [ ] **2.3** Create upload API route (Vercel Blob).
- [ ] **2.4** BAR create/edit: Add "Add photo" / "Add file" UI.
- [ ] **2.5** BarCardData: Extend with attachments; map from BarMedia.
- [ ] **2.6** BarCard back: Render attachment grid (images thumbnails, files as links).

## Phase 3: Game Map UI

- [ ] **3.1** Game map: Use `min-h-dvh` or `h-dvh` for full viewport.
- [ ] **3.2** Reduce padding on mobile: `p-2 sm:p-4 md:p-6`.
- [ ] **3.3** Lobby cards: Compact on mobile (`p-3 sm:p-5`).
- [ ] **3.4** Add bottom-right spacer (e.g. `pb-16 pr-16`) for future WASD.
- [ ] **3.5** Ensure no vertical scroll for 4-lobby grid on mobile.

## Phase 4: Virtual WASD (deferred)

- [ ] **4.1** Create `VirtualWASD` component (fixed bottom-right).
- [ ] **4.2** Create `useKeyboardNav` hook (W/A/S/D, arrows).
- [ ] **4.3** Integrate with avatar navigation when that exists.
