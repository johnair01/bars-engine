# Tasks: OpenGSD Workflow Migration

Phased, revertable. Do not start a phase's removal steps until the prior phase's
parity is verified. `[x]` = done.

## Phase 0 — Decision & feasibility
- [x] Record adopt-and-migrate decision (`spec.md`).
- [x] Spike GSD Browser in sandbox: installs + runs; **Chromium binary missing**
      blocks the CDP daemon. (`gsd-browser 0.1.29`, `daemon exited during startup`.)
- [ ] Owner confirms scope/sequencing of this spec.

## Phase 1 — GSD Browser (net-new, no risk to existing flows)
- [ ] Provision headless Chromium for the runtime(s) that will run it:
      `npx playwright install --with-deps chromium` (or distro chromium), wired
      into a session-start / CI setup step.
- [ ] `GSD_BROWSER_DEBUG=1 gsd-browser navigate https://example.com` — confirm the
      daemon starts once Chromium is present.
- [ ] Boot the MTGOA app (`cd mtgoa-game && npm run dev`) and capture a baseline:
      `gsd-browser navigate http://localhost:5173/#l1-priya`
      `gsd-browser screenshot --out .gsd-artifacts/priya-baseline.png`
      `gsd-browser accessibility-tree --out .gsd-artifacts/priya-a11y.json`
- [ ] Add `verify:ui` npm script (boot app → capture → diff).
- [ ] Wire visual-diff into the `UI_COVENANT` loop (element=color, altitude=border,
      stage=density); demo: an intentional color change must surface a diff.

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
