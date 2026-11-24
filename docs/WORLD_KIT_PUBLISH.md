# World-kit publish contract

Answers the four gates of 2026-11-23/24 (wkp-contract-dojo-identity, -kit-validation, -gate-evidence; wa-world-kit-missing-gate).
Code: `src/lib/world-kit/` (gate, auth), `src/app/api/world-kit/publish/route.ts`, `world-kit/cli.mjs`.

**Route.** `POST /api/world-kit/publish` is the one engine addition. Body `{files: {world.yaml, world.md, conditions.yaml, obstacles.yaml, npcs.yaml}, portraits: [{name, base64}]}`. `?dryRun=1` returns the same findings and stores no kit.

**Author.** `Authorization: Bearer <token>`. `WORLD_KIT_TOKENS` on the engine is an admin-issued JSON map `{token: playerId}`; the token lives in `WORLD_KIT_TOKEN` on the author's machine, never in the kit folder. No token or an unknown player: 401. Variable unset: 503.

**Kit rules (ids are stable).** Errors refuse: `missing-file`, `empty-file`, `file-too-large`, `invalid-file`, `invalid-yaml`, `world-not-a-map`, `missing-kit-id`, `bad-kit-id` (3-64 lowercase letters, digits, hyphens), `missing-name`, `missing-version`, `wrong-shape`, `missing-directory`, `invalid-portraits`, `too-many-portraits` (24), `bad-portrait-name`, `duplicate-portrait`, `empty-portrait`, `portrait-too-large` (512 KB), `not-a-png`. Warnings pass: `unknown-file`, `no-portraits`. A finding is `{id, kind, file, message}`.

**Visible state.**
- Accepted, or accepted with warnings: one `WorldKit` row per (author, kit id) with `visibility: "author"`. Republish updates the row in place and never duplicates it. Response 200, `outcome` is `created` or `updated`.
- Rejected: no `WorldKit` row is created or changed. Response 422 with the findings. A `WorldKitAttempt` row keeps the findings as diagnostics.
- Dry run: 200 or 422, `outcome: "checked"` or `"rejected"`, a diagnostics row only.

**CLI.** `world-kit validate <dir>` is the offline copy and may pass a kit the engine rejects. `world-kit publish <dir> [--engine <url>] [--dry] [--json]` calls the engine gate (default `WORLD_KIT_ENGINE` or `http://localhost:3000`). Exit 0 on acceptance, 1 on rejection or a refused token, 2 on usage, 3 when the engine is unreachable.

**Not built.** Promotion beyond the author's dojo, reading kits back into the dojo UI, and WorldKit deletion.
