# Plan: Charge capture — personal move commitment

Implement per [.specify/specs/charge-capture-personal-move-commitment/spec.md](./spec.md).

**Alignment:** [SAGE_ARCHITECT_CONSULT.md](./SAGE_ARCHITECT_CONSULT.md) — capture=intent, 321=refinement; Architect event→Instance binding; Sage vibeulon metadata-first.

## Phase 0 — Audit (read-only)

- [ ] Trace **321** outputs: `Metadata321`, `fuelSystemFrom321`, `awakenDaemonFrom321`, `stashQuestWizardPrefillFrom321` — list fields; where `moveType` could attach.
- [ ] Trace **quest unpack** / grammar: `moveType` on `CustomBar` vs quest grammar packet.
- [ ] Note **Partiful** touchpoints (if any in repo) or add `docs/PARTIFUL_HOOKS.md` stub.

## Phase 1 — Data + generator

- [ ] Extend `CreateChargeBarPayload` + `createChargeBar` `inputs` JSON: `personal_move` (`wake_up` | `clean_up` | `grow_up` | `show_up`). Default policy per spec open questions.
- [ ] Update `ChargeBarInput` / [`generateQuestSuggestions`](../../src/lib/charge-quest-generator/generator.ts): **primary** suggestion = templates for **chosen move**; optional secondary suggestions use emotion bias or same-move variants.
- [ ] Update [`generateQuestSuggestionsFromCharge`](../../src/actions/charge-capture.ts) to pass parsed `personal_move` into generator.

## Phase 2 — UI

- [ ] [`ChargeCaptureForm`](../../src/components/charge-capture/ChargeCaptureForm.tsx): four-move picker (or step after emotion) + accessibility.
- [ ] [`TransitionCeremony`](../../src/components/charge-capture/TransitionCeremony.tsx): optional line showing **personal move** + Kotter (copy from Voice Style Guide).
- [ ] Align [`ChargeExploreFlow`](../../src/components/charge-capture/ChargeExploreFlow.tsx) copy with actual behavior (no “choose move” promise unless implemented).

## Phase 3 — 321 + campaign + economy metadata

- [ ] When 321 is launched from charge (`chargeBarId`), pass **personal_move** into session/sessionStorage as needed for quest wizard + fuel.
- [ ] Quest creation from 321: ensure **placement** can target **active instance** / `campaignRef` (reuse [quest-placement](../../src/actions/quest-placement.ts), [BBMT](../../src/actions/campaign-milestone-guidance.ts) guidance).
- [ ] Vibeulon / daemon: add `personal_move` to **metadata** on mint (schema-permitting); document if no DB migration in v1.

## Verification

- Unit tests: `generateQuestSuggestions` with fixed charge + `personal_move` → deterministic first suggestion move.
- Manual: capture → explore → created quest `moveType` matches chosen move.
