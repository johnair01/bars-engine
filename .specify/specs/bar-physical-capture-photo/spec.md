# Spec: BAR Physical Capture & Photo Experience

## Purpose

Align the digital BAR experience with physical BARs (cards, paper, drawings). Physical BARs have a front and back; photos are often misoriented; capture should accept text OR photo as first-class input.

**Source**: Emergent production feedback (Mar 2026).

**Practice**: Deftness Development — spec kit first, API-first.

## Current State

- **Charge capture**: Text-only (summary, emotion, intensity, satisfaction). No photo at capture time.
- **BAR photos**: Added later via BarPhotoForm on BAR detail page. Optional. No front/back distinction.
- **Asset model**: Flat list; `customBarId`, `url`, `mimeType`, `metadataJson`. No side, no rotation.
- **BAR wallet/detail**: Single primary image or content; no flip UI.

## User Stories

### P1: Photo rotation (orientation fix)

**As a player**, when I upload a photo of a physical BAR, I can rotate it so it displays in the correct orientation.

**Acceptance**: On BAR detail and in wallet, each photo has a rotate control (90° CW). Rotation persists (stored in asset metadata or applied on save). At least rotate to fix upside-down or sideways uploads.

### P2: Text OR photo at capture

**As a player**, when I capture a charge, I can enter text OR upload a photo (or both). Photos are first-class, not an optional add-on.

**Acceptance**: Capture flow offers: (1) text input, (2) photo upload, or (3) both. At least one required. Photo can be the primary content; BAR created with photo attached immediately. No "add photo later" as the only path for photo-first capture.

### P3: Physical BAR = front + back (flip UI)

**As a player**, when I have a BAR that represents a physical card, I see both sides (front and back) in my wallet. I can flip between them.

**Acceptance**: BAR supports exactly 2 photo slots: front, back. Capture and upload flows distinguish front vs back. BAR wallet/detail shows a FLIP UI (card flip animation or toggle) to view front and back. When only one side exists, show it; back can be empty initially.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Asset side** | Add `side` to Asset: `front` \| `back` \| null (legacy = treat as front). One front + one back per BAR. |
| **Rotation** | Store `rotationDegrees` (0, 90, 180, 270) in `metadataJson`. Apply via CSS transform on display. No server-side image rewrite for v0. |
| **Capture flow** | Extend `createChargeBar` to accept optional `photoFile` (or FormData with file). If photo provided, create Asset with `side: 'front'` at creation. Text still required OR photo required (at least one). |
| **Flip UI** | Card-style flip: click/tap to flip, CSS 3D transform. Front = first asset with side=front; back = first with side=back. |

## Schema Changes

- **Asset**: Add `side` enum column: `front` \| `back` \| null. Default null for legacy.
- **Asset metadataJson**: Support `{ rotationDegrees?: number, intention?: string }`.

## Non-Goals (this spec)

- Server-side image transformation (resize, crop)
- More than 2 sides per BAR
- Video or audio capture

## Dependencies

- [bars-ui-overhaul](../bars-ui-overhaul/spec.md) — BARs as cards, talisman receive
- [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) — if exists
- `src/actions/charge-capture.ts`, `src/actions/assets.ts`, `src/components/bars/BarPhotoForm.tsx`
