# Tasks: Core Game Loop Audit — remediations

Recommended order: H1 → H3 → H2 → H6 → H4 → H5. Each slice ends with
`npm run build` + `npm run check` and (for UX) a `cert-*` verification quest.

## H1 — TTV tasks become BARs  (CGL1)
- [ ] H1.1 Schema: `TapTheVeinTask.barId String?`; migration `add_ttv_task_bar_link` (DB-free `migrate diff`; commit SQL + schema; regenerate client).
- [ ] H1.2 `commitTask` also creates a linked `CustomBar` (type `bar`, maturity `captured`), stores `barId`, idempotent on `barId`.
- [ ] H1.3 `upgradeTaskToQuest` → `growQuestFromBar(task.barId)` (real quest, not status-only).
- [ ] H1.4 `TaskCard` links to `/bars/{barId}`; TTV tasks appear in the BAR system.
- [ ] H1.5 Verification quest `cert-ttv-bar-bridge-v1`.

## H3 — 3·2·1 from a BAR  (CGL3)
- [ ] H3.1 Add a `321` action on `/bars/[id]` → `/shadow/321?chargeBarId={id}&returnTo=/bars/{id}`.
- [ ] H3.2 Same on the charge card (`ChargeBarCard`).
- [ ] H3.3 Verification quest `cert-bar-321-launch-v1`.

## H2 — unified "all my BARs" view  (CGL2)
- [ ] H2.1 Aggregate view (bar + charge + quest + seed) with type/maturity filters, reusing existing `list*` actions.
- [ ] H2.2 Wire it as the BAR landing from VAULT.
- [ ] H2.3 Verification quest `cert-all-bars-view-v1`.

## H6 — inline tune  (CGL6)
- [ ] H6.1 Fold tune fields into inline edit on `/bars/[id]`.
- [ ] H6.2 Verification quest `cert-inline-tune-v1`.

## H4 — charge an existing BAR  (CGL4) — needs model decision first
- [ ] H4.1 Decide: `intensity` meter on `CustomBar` vs charge→BAR link (default: extend `intensity`).
- [ ] H4.2 "Add charge" affordance on tune; surface charge level on the BAR.
- [ ] H4.3 Verification quest `cert-bar-charge-v1`.

## H5 — daemon hub  (CGL5) — graduate to its own spec
- [ ] H5.1 Spec the hub: visibility of non-owned daemons + what "connect" grants.
- [ ] H5.2 `/daemons` discovery/hub + connect/summon.
- [ ] H5.3 Verification quest `cert-daemon-hub-v1`.
