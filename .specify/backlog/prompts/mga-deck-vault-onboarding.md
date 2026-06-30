# Spec Kit Prompt: MGA — Deck → Hand → Vault → Onboarding

## Role
You are a Spec Kit agent fixing the *Mastering the Game of Allyship* front door: the Allyship Deck intake, the Hand/Vault, and onboarding.

## Objective
Make the Allyship Deck → BAR → Hand → Vault loop work for a single individual practitioner. Fix the broken "Send to BARS" intake (capture-then-signup for logged-out users), replace the Conclave login costume with plain MGA auth, and redesign the Vault around the five moves (adding Open Up) as a freely-navigable set of rooms.

## Prompt (API-First)
> Implement per [.specify/specs/mga-deck-vault-onboarding/spec.md](../../specs/mga-deck-vault-onboarding/spec.md). **API-first**: lock `sendDeckCardToBars(input): Promise<SendDeckCardResult>`, `claimPendingDeckBar(token)`, and `signupMga/loginMga` signatures before UI. Ship in four slices (intake fix → MGA auth → Vault five-move redesign → Open Up room + verification quest).

## Requirements
- **Surfaces**: `/deck` (SendToBarsButton, Hand modal + NOW link), `/signup` + `/login`, `/vault` (five-move dashboard, declutter), `/vault/open-up`, NOW home.
- **Mechanics**: logged-out capture stashes a signed pending intent → MGA signup → claim into account + Hand. Logged-in capture creates a ready-to-practice BAR (no seed ceremony) in the Hand. Vault = five navigable move-rooms; Open Up = non-destructive felt-sense doorway.
- **Persistence**: likely none for slices 1–3 (reuse `CustomBar`, signed cookie). Slice 4 felt-sense note: reuse existing journal field if possible, else `FeltSenseNote` model + migration.
- **API**: `sendDeckCardToBars` (revised), `claimPendingDeckBar` (new), `signupMga`/`loginMga` (new). All Server Actions.
- **Verification**: `cert-mga-deck-vault-onboarding-v1` quest walks deck→signup→hand→vault.

## Checklist (API-First Order)
- [ ] API contracts defined in spec ✔ (see spec § API Contracts)
- [ ] If Prisma schema changes (Slice 4 only): § Persisted data in spec; migrate dev task in tasks.md; migration SQL committed with schema
- [ ] Server Actions implemented before UI
- [ ] UI wired to actions
- [ ] `npm run build` + `npm run check` per slice

## Deliverables
- [x] .specify/specs/mga-deck-vault-onboarding/spec.md
- [x] .specify/specs/mga-deck-vault-onboarding/plan.md
- [x] .specify/specs/mga-deck-vault-onboarding/tasks.md
