# Spec: Admin Mobile Readiness

## Purpose

Ensure all post-launch admin updates (instance config, donation progress, Kotter stage, feature flags, player management) can be done from the app on mobile. The residency team will be on vacation after launch with only a phone and Cursor web app; admin must be fully usable on mobile without terminal access.

**Broader vision**: Admin console as the single source of truth for campaign operations; no reliance on scripts or env edits for routine post-launch changes.

## Conceptual Model (Game Language)

- **WHERE**: The fundraiser instance (Bruised Banana) is the campaign context. Admin configures instances, Kotter stage, and donation progress.
- **Energy**: Vibeulons — admin mints/transfers for players; no `prompt()` dialogs that fail on mobile.
- **Personal throughput**: Admin editing = Show Up (contribute to the campaign) by keeping the fundraiser running from anywhere.

## User Stories

### P1: Edit existing instance without re-entering everything (high priority)
**As an admin on mobile**, I want an "Edit" button per instance that opens a pre-filled form, so I can update goal, currentAmount, Stripe URLs, or campaign copy without retyping all fields.

**Acceptance**: On Admin → Instances, each instance has an "Edit" action. Clicking it opens a modal or inline form with all fields pre-filled from the instance. Save updates the instance. No need to re-enter slug, name, or other unchanged fields.

### P2: Quick donation progress update (high priority)
**As an admin on mobile**, I want to update the fundraiser progress bar (currentAmount, optionally goalAmount) from the event page or instance list, so I can reflect offline donations without opening the full instance form.

**Acceptance**: 
- On `/event` (admin only): a compact "Update progress" control near the progress bar with currentAmount and goalAmount inputs. Save updates the active instance.
- On Admin → Instances: each instance has a quick "Update $X" or similar that opens a small form for currentAmount (and optionally goalAmount). Save updates that instance.

### P3: Mint and transfer vibeulons without prompt() (high priority)
**As an admin on mobile**, I want inline input fields for mint amount and transfer target/amount in the player editor, so I can mint or transfer vibeulons without relying on `prompt()` which is unreliable on mobile.

**Acceptance**: In Admin → Players → [player] → AdminPlayerEditor modal:
- Mint: number input + "Mint" button (no `prompt()`)
- Transfer: target player select (or search) + amount input + "Transfer" button (no `prompt()`)

### P4: Verification quest (required for UX features)
**As an admin**, I want a certification quest that walks through the mobile-admin flows, so I can verify the admin console works on mobile before launch.

**Acceptance**: Verification quest `cert-admin-mobile-readiness-v1` seeded by `npm run seed:cert:cyoa`. Narrative: preparing the residency team to manage the Bruised Banana Fundraiser from anywhere. Steps: edit instance (prefill), update donation progress, mint vibeulons via inline input. Required per Spec Kit skill for UI features.

## Functional Requirements

- **FR1**: Admin Instances page MUST provide an "Edit" action per instance that opens a form (modal or inline) with all fields pre-filled from the instance. Save MUST call `upsertInstance` with instance `id` so the update path is used.
- **FR2**: `upsertInstance` update path (when `id` is set) MUST include `storyBridgeCopy` and `campaignRef` so full instance edit is possible.
- **FR3**: Server action `updateInstanceFundraise(instanceId, { currentAmountCents?, goalAmountCents? })` MUST exist. Admin-only. Updates Instance with provided fields.
- **FR4**: Event page (admin only) MUST show a compact "Update progress" form (currentAmount, goalAmount). Submit calls `updateInstanceFundraise` for the active instance.
- **FR5**: Admin Instances list MUST show a quick "Update progress" control per instance (opens small form for currentAmount, goalAmount). Submit calls `updateInstanceFundraise`.
- **FR6**: AdminPlayerEditor MUST replace `prompt()` for mint with an inline number input + "Mint" button. Submit calls `adminMintVibulons`.
- **FR7**: AdminPlayerEditor MUST replace `prompt()` for transfer with inline inputs: target player (select or search), amount. Submit calls `adminTransferVibulons`.
- **FR8**: Verification quest `cert-admin-mobile-readiness-v1` MUST be seeded by `npm run seed:cert:cyoa`. Walks through: edit instance, update progress, mint via inline input. Narrative ties to Bruised Banana Fundraiser.

## Non-functional Requirements

- Touch targets: Primary admin buttons MUST have minimum 44px touch target (e.g. `min-h-[44px]` or `py-3`) for mobile.
- Modals: Admin modals MUST use `max-h-[90vh] overflow-y-auto` for scroll on small screens.
- Numeric inputs: Use `inputMode="decimal"` or `inputMode="numeric"` for amount fields.

## Out of Scope (v1)

- Schema changes (require `npm run db:sync` — terminal only).
- Seed scripts (require terminal). Document that `seed:cert:cyoa`, `seed:party`, `seed:onboarding` should be run before launch.
- Env var changes (Stripe keys, etc.) — Vercel dashboard or terminal.

## Reference

- Instance actions: [src/actions/instance.ts](../../src/actions/instance.ts)
- Admin Instances: [src/app/admin/instances/page.tsx](../../src/app/admin/instances/page.tsx)
- Event page: [src/app/event/page.tsx](../../src/app/event/page.tsx)
- AdminPlayerEditor: [src/components/admin/AdminPlayerEditor.tsx](../../src/components/admin/AdminPlayerEditor.tsx)
- Event campaign editor: [.specify/specs/event-page-campaign-editor/spec.md](../event-page-campaign-editor/spec.md)
