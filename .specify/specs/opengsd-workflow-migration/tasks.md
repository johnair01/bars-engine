# Tasks: OpenGSD Workflow Migration

Phased, revertable. Do not start a phase's removal steps until the prior phase's
parity is verified. `[x]` = done.

## Phase 0 — Decision & feasibility
- [x] Record adopt-and-migrate decision (`spec.md`).
- [x] Spike GSD Browser in sandbox: installs + runs; **Chromium binary missing**
      blocks the CDP daemon. (`gsd-browser 0.1.29`, `daemon exited during startup`.)
- [ ] Owner confirms scope/sequencing of this spec.

## Phase 1 — GSD Browser (net-new, no risk to existing flows)
- [x] Provisioning script + browser resolution: `scripts/setup-gsd-browser.sh`
      (`resolve` / `--install` / `--check`); resolves macOS Chrome, real Linux
      binaries, or Playwright Chromium; `GSD_CHROME_PATH` override.
- [x] SessionStart hook (`.claude/settings.json`) runs `--check` — fast, non-fatal
      browser-readiness status on every web/CLI session.
- [x] Generic capture script: `scripts/gsd-ui-verify.sh <url> [out] [name]`
      (navigate → full-page PNG → accessibility-tree JSON).
- [ ] **BLOCKED in sandbox — egress policy.** Chromium cannot be installed here:
      `cdn.playwright.dev`, `dl.google.com`, `storage.googleapis.com` all return
      `host_not_allowed`; Ubuntu Noble `chromium-browser` is a snap shim (won't run
      headless). **To unblock:** allowlist `cdn.playwright.dev` in the env's network
      egress (then `scripts/setup-gsd-browser.sh --install`), OR run the capture on a
      machine with Chrome (e.g. macOS) where `setup-gsd-browser.sh` auto-resolves it.
- [ ] Capture the MTGOA baseline (run where Chrome is available):
      `cd mtgoa-game && npm run dev` then
      `scripts/gsd-ui-verify.sh http://localhost:5173/#l1-priya .gsd-artifacts priya-baseline`
      → produces `priya-baseline.png` + `priya-baseline.a11y.json`.
- [ ] Wire visual-diff into the `UI_COVENANT` loop (element=color, altitude=border,
      stage=density); demo: an intentional color change must surface a diff.
- [x] Add the MTGOA `verify:ui` npm script to the game package
      (`mtgoa-game/scripts/verify-ui.sh`: build → `vite preview` → GSD Browser
      capture → teardown) so it ships with the app. *(awaits a Chrome-reachable
      run to produce the first committed baseline.)*

## Phase 2 — GSD Pi pilot (parallel to bespoke; no removals)
- [ ] `npx @opengsd/gsd-pi@latest`; complete setup; select LLM provider (default to
      latest Claude per project guidance); document keys in `docs/ENV_AND_VERCEL.md`.
- [ ] Pick one existing `.specify/specs/*` kit; translate to GSD Pi
      milestones/slices/tasks; deliver it end-to-end via `/gsd`.
- [ ] Compare vs. Ouroboros: context fidelity, autonomy length, output quality.
      Record findings back in `spec.md` (Open Questions → resolved).

## Phase 3 — Cutover & compost (only after Phase 2 parity)
- [ ] Map BARS Strand fork-space boundaries → GSD git worktrees.
- [ ] Migrate `.agent/context/*` + `BACKLOG.md` into `.gsd/`.
- [ ] Translate remaining `.specify/` kits (or archive completed ones).
- [ ] Retire bespoke commands (`ooo *`, strand skills); **archive, don't delete**,
      `.specify/` until rollback window closes.
- [ ] Update `CLAUDE.md` + `docs/` to point workflow guidance at GSD.
- [ ] Preserve dual-track: verify non-AI delivery mode still first-class.

## Verification gates
- [ ] Phase 1: MTGOA baseline captured; intentional UI change flagged by visual diff.
- [ ] Phase 2: one feature shipped via GSD Pi with no bespoke fallback.
- [ ] Phase 3: existing specs still build (`npm run check`); non-AI flows unaffected.
