# Plan: BAR Physical Capture & Photo Experience

## Summary

Implement three emergent production needs: (1) rotate uploaded BAR photos to fix orientation, (2) text OR photo at capture (photos first-class), (3) front/back model with FLIP UI in BAR wallet.

## Implementation Order

### Phase 1: Schema and rotation

1. Add `side` to Asset (front | back | null); migration.
2. Extend `metadataJson` usage for `rotationDegrees`.
3. Add rotate control to BarPhotoForm and BAR detail; persist rotation in metadata.
4. Apply rotation via CSS transform when rendering BAR images.

### Phase 2: Capture accepts photo

5. Extend `createChargeBar` to accept FormData with optional `photoFile`.
6. If photo provided, create BAR + Asset(side: front) in one transaction.
7. Update ChargeCaptureForm: add photo upload option; at least text OR photo required.
8. Redirect to explore after capture when photo-first.

### Phase 3: Front/back and flip UI

9. BarPhotoForm: distinguish front vs back upload; enforce max 2 images (one per side).
10. Capture flow: when adding second photo, prompt for front/back.
11. Create BarFlipCard component: 3D flip animation, front/back display.
12. Integrate BarFlipCard into BAR wallet, BAR detail, and hand.

## File Impacts

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` — Asset.side |
| Edit | `src/actions/assets.ts` — uploadBarAttachment side param; rotateAsset |
| Edit | `src/actions/charge-capture.ts` — createChargeBar accept photo |
| Edit | `src/components/charge-capture/ChargeCaptureForm.tsx` — photo upload |
| Edit | `src/components/bars/BarPhotoForm.tsx` — rotate, front/back |
| Create | `src/components/bars/BarFlipCard.tsx` — flip UI |
| Edit | `src/app/bars/[id]/page.tsx` — use BarFlipCard |
| Edit | `src/app/hand/page.tsx` — use BarFlipCard for charge BARs |
| Edit | `src/app/bars/page.tsx` — card preview with flip hint |

## Verification

- [ ] Upload photo → rotate 90° → persists; displays correctly
- [ ] Capture with photo only → BAR created with front asset
- [ ] Capture with text + photo → both stored
- [ ] BAR with front+back → flip UI shows both sides
- [ ] BAR with front only → no flip; single side visible
- [ ] `npm run build` and `npm run check` pass
