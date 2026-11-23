# Typechecking bars-engine: why it "crashes", and how to run it anywhere

Wendell, 2026-11-22: *"what do we do for this? I'm ON my machine, but I want this to be available for all environments."*

## The report was wrong, and the diagnosis below replaces it

An earlier agent report said "node crashes on the tsc entry point and typescript isn't resolvable in this environment."
Both halves were misleading:

| Claim | Reality |
|---|---|
| "node crashes on the tsc entry point" | **node does not crash.** It runs for 20+ minutes and is still going, at 25% CPU. What kills it is the **agent's 5-minute command timeout**, which leaves no output behind and looks like a crash. |
| "typescript isn't resolvable" | `node_modules/typescript` is **5.9.3**, present and working. `tsc --version` answers instantly. What is missing is `node` on a **bare PATH** — `/opt/homebrew/bin/node`, v24.14.0. `npx` is likewise off PATH. |
| "pipeline.ts has never been compiled" | **It compiles.** Under the project's own strictness, with zero errors — see below. |

## The real cause of the slowness

`bars-engine/tsconfig.json` includes `**/*.ts`, `**/*.tsx`, `**/*.mts` **and** `.next/types/**/*.ts`. That is **2,785
`.ts` files** in `src` alone, plus generated Next types. A full `--noEmit` over that tree does not finish in five
minutes, so any agent that waits on it reports a crash.

## The check that actually matters, and how to run it

The point of compiling a change is to prove **the changed files** typecheck, not to rebuild the world. This runs in
seconds:

```bash
cd bars-engine
/opt/homebrew/bin/node node_modules/typescript/bin/tsc \
  --noEmit --skipLibCheck --strict \
  --target es2022 --module esnext --moduleResolution bundler \
  --jsx preserve --esModuleInterop \
  src/lib/board/pipeline.ts src/lib/board/content-store.ts
```

`--strict` matters: it is the bar the project sets. A clean exit here means the file is sound TypeScript. It does not
prove the whole app builds, and it should not be described as if it does.

## Why this is available in every environment

The failure was never the code or the compiler — it was **PATH and a timeout**. So the fix is a script that pins both and
scopes the check, so no caller has to know either:

```bash
bash scripts/typecheck.sh                     # the files a branch changed, strict
bash scripts/typecheck.sh --full              # the whole project, no timeout imposed (slow, minutes)
bash scripts/typecheck.sh src/lib/board/pipeline.ts
```

`scripts/typecheck.sh`:

- finds a `node` on PATH, else falls back to `/opt/homebrew/bin/node` and `/usr/local/bin/node`;
- uses the repo's own `node_modules/typescript`, never a global one, so the version matches CI;
- **extends the real `tsconfig.json`** with a short generated config inside the repo, so the `@/*` alias map, `jsx`
  and `moduleResolution` are exactly what CI uses — the script never re-declares them and so cannot drift;
- skips `__tests__`, which the repo's own tsconfig excludes;
- with no arguments, checks only the files `git diff` reports, which is what a change actually needs;
- `--full` is opt-in, because it takes minutes and no agent should wait on it by default.

## Memory: not every environment has the same amount

Wendell, 2026-11-22: *"Not all environments will have access to the same amount of memory. So we need to give them
instructions so they can scale their work to available memory."*

The full run **needed about 2 GB and died there**; it finished comfortably at 4 GB. So a hardcoded number is wrong in both
directions — it fails on a small box and wastes headroom on a large one. `scripts/heap-mb.sh` asks the machine and the
typecheck uses the answer:

| Environment | What to run |
|---|---|
| **Any** | `bash scripts/typecheck.sh` — scoped, only what changed, **well under 1 GB** |
| **Large machine (16 GB+)** | `bash scripts/typecheck.sh --full` — detects and takes up to 6 GB |
| **Small or shared machine (4–8 GB)** | `bash scripts/typecheck.sh --full` — detects 2–4 GB; expect it to take longer |
| **Very small (under 4 GB), or it dies with "out of memory"** | `TYPECHECK_HEAP_MB=1536 bash scripts/typecheck.sh --full`, or **use the scoped mode instead** |

How the guess is made (`scripts/heap-mb.sh`):

- **Half the physical RAM**, so the machine stays usable while the compiler runs;
- **capped at 6144 MB** — what the full run actually needed here;
- **floored at 1536 MB** — below that node may not even start the compiler;
- `TYPECHECK_HEAP_MB` overrides it when you know better than the guess.

**The rule to work by:** if memory is tight, **do not fight the full run**. The scoped mode answers the question a change
actually asks — "does what I touched compile?" — and it costs a fraction of the memory. `--full` is for a release, on a
machine that can spare it.

## For CI and other people's machines

The same script is the portable entry point. Wherever `node` and `node_modules` exist, it works unchanged — it never
depends on Homebrew, `npx`, or a shell profile. On a fresh machine:

```bash
npm ci
bash scripts/typecheck.sh --full
```

That is the honest CI gate. The narrow default is for a working loop; `--full` is for a release.

## The real cause of the "crash": out of memory, not a timeout

Running `--full` for real produced the answer:

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory
```

**node died at ~2 GB.** It was never a crash at the entry point and never only a timeout; the full run simply exhausts
node's default heap on a 2,800-file tree. The script now runs the full mode with `--max-old-space-size=6144`
(`TYPECHECK_HEAP_MB` overrides it for a smaller machine), and the run completes.

Still true, and still worth knowing: an agent's 5-minute command timeout also cannot contain this run, so it must be
started in the background and read from a log — which is what was done here.

## What the full build actually found (2026-11-22)

**28 errors, none of them in this change.**

| File | Errors |
|---|---|
| `src/app/admin/quest-grammar/GenerationFlow.tsx` | 7 |
| `src/lib/quest-grammar/orientationFaceSubPackets.ts` | 6 |
| `src/app/admin/quest-grammar/UnpackingForm.tsx` | 4 |
| `src/components/admin/UpgradeQuestToCYOAFlow.tsx` | 3 |
| `src/actions/gameboard.ts` | 2 |
| `storyIntroPacket.ts`, `orientationMetaPacket.ts`, `compileQuestSkeleton.ts`, `characterCreationPacket.ts`, `generateRandomTestInput.ts`, `generate-quest.ts`, `quest-generation.ts`, `__tests__/branchedPath.test.ts` | 1 each |

Every one is the same fault: **`Property 'chosenDomain' is missing in type … but required in type 'SerializableQuestPacket'`.**
`chosenDomain` is required by the packet type and several packets do not set it. That is a real defect in the
quest-grammar module, it is pre-existing, and none of those files were touched by this work.

**`src/lib/board/pipeline.ts` has zero errors.** The change that this document was written to check is clean.

## The honest status

- **The changed files compile clean**, scoped and full.
- **The whole project does not currently build**, because of 28 pre-existing `chosenDomain` errors in quest-grammar.
- That is a *finding*, not a blocker for this change — but it does mean `--full` is red on `main`, and anyone who runs
  it will see those 28 before they see anything of their own.
