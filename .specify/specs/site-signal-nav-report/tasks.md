# Tasks — Site signal nav report

- [x] **T1** Define Zod schema + max lengths in `src/lib/feedback/site-signal-schema.ts` (include formatting helper for persisted `feedback` string).
- [x] **T2** Implement `POST /api/feedback/site-signal` with auth, same-origin validation, JSONL append (`questId: system-feedback`, `passageName: Site signal (nav)`).
- [x] **T3** Build `SiteSignalModal` client component: capture `pageUrl`, `pathname`, `search`, `hash`, `documentTitle` on open; submit JSON to API; error/success UI.
- [x] **T4** Update `NavBar`: warning control next to Exit; open modal when authenticated; keyboard + focus basics.
- [x] **T5** Unauthenticated behavior per spec decision (hide vs login prompt).
- [ ] **T6** Manual smoke: submit from two routes; verify one line in `.feedback/cert_feedback.jsonl` with expected `passageName`.
- [ ] **T7** Run `npm run build` + `npm run check` (fix any issues in touched files).
- [x] **T8** (Optional) Triage doc / skill one-liner for `Site signal (nav)` filter.
