# Backlog prompt: BB-APR26 — Bruised Banana Apr 4–5 residency (ops + QA + comms)

**Status:** Backlog row **[x] Done** — keep this file as a rerun template if you do another dated drop.

**Backlog ID:** BB-APR26 · **Priority:** 1.16.2 · **Spec kit:** [.specify/specs/campaign-hub-spoke-landing-architecture/](../specs/campaign-hub-spoke-landing-architecture/)

## Goal

Execute the **party/residency throughput** work that is **mostly QA, Twine/portal copy, and Partiful ops** — not new hub architecture. Close checklist items in [TEST_PLAN_PARTY_AND_INTAKE.md §7](../specs/campaign-hub-spoke-landing-architecture/TEST_PLAN_PARTY_AND_INTAKE.md) and mirror [tasks.md](../specs/campaign-hub-spoke-landing-architecture/tasks.md) (section *Apr 2026 residency — ops & QA*).

## Do this in order

1. **§1 Preconditions** (staging, then production before each publish)  
   - Migrate / schema: `campaignHubState` present  
   - Active BB instance: `campaignRef: bruised-banana`  
   - `npm run seed:portal-adventure` (or equivalent); hub “Enter CYOA →” not stuck on seed hint  
   - Logged-in test player opens `/campaign/hub?ref=bruised-banana`

2. **§2 + §6 Playtest & smoke**  
   - Full §2 script (~25 min, `ref=bruised-banana`)  
   - Incognito: `/event` (Apr 4/5 visible for BB), `/invite/bb-event-invite-apr26`, hub URL above  
   - **File issues** for any blocker; link from test plan or BB-APR26 notes

3. **Portal copy pass**  
   - Tune portal + room passages for **Apr 4** (public, high energy) vs **Apr 5** (collaborator curiosity) per test plan §3

4. **Partiful**  
   - Copy source: [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../docs/events/bruised-banana-apr-2026-partiful-copy.md)  
   - **Apr 4 EOD PT:** Event 1 live; include **`/event`** (or `#apr-4`) in body/confirmation  
   - **Apr 5 EOD PT:** Event 2 live; include **`/event#apr-5`**; optional `/invite/bb-event-invite-apr26`

5. **Optional:** `sage_consult` / strand with test plan **§0** locked decisions for tone on invite copy

## Done when

- [x] All §7 checkboxes you own are checked (or explicitly deferred with reason)  
- [x] `tasks.md` BB26-* rows updated  
- [x] BB-APR26 row in [BACKLOG.md](BACKLOG.md) flipped to **[x] Done** when the org agrees drops shipped

## References

- [EVENT_INVITE_BAR_CYOA_MVP.md](../specs/campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md)  
- [STRAND_CONSULT_BRUISED_BANANA.md](../specs/campaign-hub-spoke-landing-architecture/STRAND_CONSULT_BRUISED_BANANA.md)
