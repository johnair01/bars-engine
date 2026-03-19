# Tasks: Charge → 321 Flow Interruption

## Phase 1: Diagnosis

- [x] Run strand consult: `npm run strand:consult:flow-interruption`
- [x] Trace Quest path: Shadow321Form → createQuestFrom321Metadata → /hand?quest=
- [x] Trace BAR path: Shadow321Form → /create-bar?from321=1
- [x] Trace daemon path: GrowFromBar → growDaemonFromBar → /daemons
- [x] Trace artifact path: GrowFromBar → growArtifactFromBar → /growth-scene/[id]
- [x] Identify save-without-notify vs wiring: Fuel System had router.refresh() only; others lacked toast feedback

## Phase 2: Fixes

- [x] Add sonner toast library + Toaster in layout
- [x] Shadow321Form: toast success/error for Turn into Quest, Create BAR, Fuel System, Skip
- [x] Shadow321Form: Fuel System now redirects to / (was router.refresh() only)
- [x] GrowFromBar: toast success/error for Quest, Daemon, Artifact (replaced alert)
- [x] Shadow321Runner: toast + redirect to /hand?quest= for Quest; toast + redirect for Fuel System, Create BAR

## Phase 3: Design Docs

- [x] Add "UX: Major Flows Cannot Be Interrupted" to FOUNDATIONS.md
- [x] Define flow completion contract (destination, success notification, or explicit error)

## Phase 4: Instrumentation

- [ ] Lightweight logging at critical decision points (future)
