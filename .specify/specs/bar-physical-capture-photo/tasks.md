# Tasks: BAR Physical Capture & Photo Experience

## Phase 1: Schema and rotation

- [ ] **1.1** Add `side` to Asset model: `String?` (front | back | null); migration
- [ ] **1.2** Document metadataJson usage: `rotationDegrees`, `intention`
- [ ] **1.3** Add `rotateAsset(assetId, degrees)` server action — update metadataJson.rotationDegrees
- [ ] **1.4** BarPhotoForm: add rotate button per image; call rotateAsset on click
- [ ] **1.5** BAR detail + wallet: apply `transform: rotate(Xdeg)` when rendering images with rotation
- [ ] **1.6** Run db:sync; create migration

## Phase 2: Capture accepts photo

- [ ] **2.1** Extend `createChargeBar` to accept optional `photoFile` (FormData or base64)
- [ ] **2.2** When photo provided: create BAR + Asset(side: front) in transaction
- [ ] **2.3** ChargeCaptureForm: add photo upload option (file input or camera)
- [ ] **2.4** Validation: at least text OR photo required (not both empty)
- [ ] **2.5** Photo-first capture: redirect to explore; show BAR with front asset

## Phase 3: Front/back and flip UI

- [x] **3.1** BarPhotoForm: enforce front/back — one front, one back max; upload UI labels side
- [x] **3.2** When BAR has 0 assets: add front. When 1: add back. When 2: replace or edit.
- [x] **3.3** Create BarFlipCard component: 3D flip on click; front/back faces
- [x] **3.4** BAR detail page: use BarFlipCard when both sides exist; single image otherwise
- [x] **3.5** Hand page: charge BARs use BarFlipCard; flip hint on hover
- [x] **3.6** /bars list: card preview shows front; back on hover/flip if available

## Verification

- [ ] Manual: upload photo → rotate → persists
- [ ] Manual: capture with photo only
- [ ] Manual: capture with text + photo
- [ ] Manual: BAR with front+back → flip UI
- [ ] `npm run build` and `npm run check` pass
