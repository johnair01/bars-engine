# Tasks: Strand Process — Integrate or Deprecate

## Phase 1: Decide

- [x] T1: Run the collision check: conflicts and rebase fixes on `BACKLOG.md`, `prisma/schema.prisma`, `package.json` over the last 60 days
- [x] T2: Wendell rules per goal (spec.md table), on the consult call, and says what the CLI was used for
- [x] T3: Record the ruling and date in `plan.md`

## Phase 2: Execute (ruling: B; T6a to T8a are skipped)

- [x] T4: Grep inbound references for every file in the plan's file-impact list

```bash
grep -rn "BARS_STRAND\|bars-strand\|create-strand\|strand-results" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
```

- [x] T5: Copy anything worth keeping from `strand-results/` into the relevant spec folders
- [x] T6: Delete the CLI docs, config, test and skill listed in plan.md
- [x] T6b: Retire the backend consult scripts (`scripts/strand-consult-*.ts`, `strand:consult*` and `strand:invitation` npm scripts); kept `compost:strand-consults` (archives history) and `backend/app/strand/` (product)
- [x] T7: Remove the "BARS Strand System" section from `CLAUDE.md`; update `.cursorrules`
- [x] T8: Rename "strand" to "consult" in `docs/STRAND_TO_SPEC_KIT.md` and `docs/AGENT_WORKFLOWS.md`; keep the script names
- [x] T9: Comment the legacy name at `prisma/schema.prisma:389`
- [x] T10: `npm run build` and `npm run check`
- [x] T11: Start a fresh session in the repo and confirm it begins work without a strand prompt
- [x] T12: Mark the backlog row Done and run `npm run backlog:seed`

## Phase 2 (option A, if chosen)

- [ ] T6a: Define the spec front-matter fields (status, issue link, work boundary) in the spec-kit skill
- [ ] T7a: Migrate the five `.strands/*.yaml` files into their spec folders
- [ ] T8a: Remove the CLI as in option B
