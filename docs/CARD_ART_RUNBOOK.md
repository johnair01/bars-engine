# BARS Engine — Card Art Runbook

> Governance document for the 40 canonical card art images (5 nations × 8 playbooks).
> Produced from a six-face GM council deliberation (Shaman/Challenger/Regent/Architect/Diplomat/Sage).

---

## Who This Document Is For

| Role | What you need to do |
|------|---------------------|
| **Fork admin (default)** | Nothing. Images are committed to `public/card-art/`. You inherit them. |
| **Fork admin (custom aesthetic)** | Run the Custom Path below. One API key, no LoRA training. |
| **Primary maintainer** | Run the three-phase Maintainer Path to regenerate canonical images. |

---

## Default Fork Path — No API Required

The 40 canonical images are committed to `public/card-art/` in the repository.
Fork admins inherit them automatically when they clone or fork the project.

To verify your local copy is complete:

```bash
npx tsx scripts/generate-card-art.ts --dry-run
```

This prints all 40 pairings and marks which files exist. No API key needed.

If images are missing (e.g. you forked before they were committed), follow the
Custom Path below to generate your own set.

---

## Maintainer Path — Canonical Image Generation (3 Phases)

> Run this when regenerating the canonical set committed to the repo.
> Requires fal.ai account + OpenAI account.

### Prerequisites

```bash
# Install additional dependencies (not in default devDependencies)
npm install --save-dev @fal-ai/client archiver @types/archiver

# Add to .env.local:
OPENAI_API_KEY=sk-...        # for Phase 1 (reference generation)
FAL_KEY=...                  # for Phase 2 (LoRA training) + Phase 3 (generation)
# FAL_LORA_URL is set after Phase 2 completes
```

---

### Phase 1 — Generate LoRA Training References

Generate 10 reference images using gpt-image-1 that will define the style LoRA.
These images are committed to `docs/card-art-references/` so future maintainers
inherit them without needing to regenerate.

```bash
# Preview what will be generated
npx tsx scripts/generate-card-art.ts --generate-references --dry-run

# Generate (costs ~$0.50 in OpenAI credits, ~2 minutes)
npx tsx scripts/generate-card-art.ts --generate-references
```

**Output:** `docs/card-art-references/ref-01-*.png` through `ref-10-*.png`

**After Phase 1:** Commit the reference images to the repo:
```bash
git add docs/card-art-references/
git commit -m "chore(card-art): add LoRA training reference images"
```

---

### Phase 2 — Train Style LoRA

Train a Flux style LoRA on fal.ai using the reference images.
This costs approximately $2 and takes 3–5 minutes.

```bash
# Preview the training plan
npx tsx scripts/generate-card-art.ts --train-lora --dry-run

# Train (costs ~$2 on fal.ai)
npx tsx scripts/generate-card-art.ts --train-lora
```

**Output:** The script prints a `FAL_LORA_URL` value.

**After Phase 2:** Add the LoRA URL to `.env.local`:
```bash
FAL_LORA_URL=https://fal.run/...
```

The LoRA URL is a permanent fal.ai artifact. It does not expire.
Add it to your team's shared secrets / deployment env as well.

---

### Phase 3 — Generate Canonical 40 Images

Generate all 40 images using Flux Dev + the style LoRA.
Each image uses a deterministic seed (index × 1000 + 42000) — the same
input always produces the same output, so individual cards can be regenerated
without affecting others.

```bash
# Preview with seed and LoRA info
npx tsx scripts/generate-card-art.ts --generate --dry-run

# Generate all 40 (costs ~$0.40 on fal.ai, ~5 minutes)
npx tsx scripts/generate-card-art.ts --generate

# Regenerate a single element
npx tsx scripts/generate-card-art.ts --generate --element=fire

# Regenerate a single card
npx tsx scripts/generate-card-art.ts --generate --element=fire --playbook=bold-heart --force
```

**Output:** `public/card-art/{nationKey}-{playbookKey}.png` (40 files)

**After Phase 3:** Commit and push:
```bash
git add public/card-art/
git commit -m "chore(card-art): regenerate canonical 40 images (Flux + LoRA)"
git push
```

---

## Custom Aesthetic Path — Ideogram (Fork Admins)

For fork admins who want imagery that reflects their own community's visual
identity rather than inheriting the canonical art.

**Why Ideogram for this path:**
- `color_palette` is a first-class API parameter — element hex values from
  `card-tokens.ts` are enforced at generation time, not just described in text
- `seed` parameter means deterministic output — two admins following the same
  steps get comparable results
- No LoRA training step — lower barrier for non-developer GMs
- One new API key (`IDEOGRAM_API_KEY`)

### Prerequisites

```bash
# Add to .env.local:
IDEOGRAM_API_KEY=...    # get at https://ideogram.ai/manage-api
```

No additional npm packages required.

### Generate

```bash
# Preview with palette info
npx tsx scripts/generate-card-art.ts --custom --dry-run

# Generate all 40 (costs ~$0.40 on Ideogram)
npx tsx scripts/generate-card-art.ts --custom

# Filter by element or playbook
npx tsx scripts/generate-card-art.ts --custom --element=fire
```

**Output:** `public/card-art/{nationKey}-{playbookKey}.png`

**Note on style:** Ideogram's `ANIME` style type is the closest available handle
to the 8-bit Taoist cultivation aesthetic. The generated images will look
different from the canonical Flux + LoRA images — this is expected for a
custom aesthetic fork. The element color palettes will be consistent across
all 40 images.

---

## Seed Strategy

All generation modes use deterministic seeds:

```
seed = 42000 + (index × 1000)
```

Where `index` is the 0-based position of the entry in `CARD_ART_REGISTRY`.
This means:
- Every card has a unique, stable seed
- Regenerating card N does not affect card N+1
- A maintainer can share seed values and others can reproduce the same image
  (given the same LoRA and model version)

---

## Troubleshooting

| Problem | Resolution |
|---------|-----------|
| `@fal-ai/client not installed` | `npm install --save-dev @fal-ai/client` |
| `archiver not installed` | `npm install --save-dev archiver @types/archiver` |
| `FAL_LORA_URL not set` | Run Phase 2 (`--train-lora`) and add the printed URL to `.env.local` |
| `< 4 reference images` | Run Phase 1 (`--generate-references`) first |
| Image looks wrong / off-style | Use `--force` to regenerate that card: `--element=X --playbook=Y --force` |
| Ideogram wrong aesthetic | ANIME is the closest style type; consider adjusting prompts in `card-art-registry.ts` |
| gpt-image-1 rate limit | Add `--delay-ms=15000` to slow Phase 1 generation |

---

## File Map

| Path | Purpose |
|------|---------|
| `public/card-art/` | Committed canonical images — inherited by all forks |
| `docs/card-art-references/` | LoRA training reference images — committed by maintainer |
| `src/lib/ui/card-art-registry.ts` | 40-entry registry with prompts, `ELEMENT_PALETTE_HINTS` |
| `scripts/generate-card-art.ts` | Admin CLI — all four generation paths |
| `src/lib/ui/card-tokens.ts` | Token source — palette hex values referenced by prompts |

---

*This runbook reflects the six-face GM council decision (2026-03-21). Update this
document when the generation pipeline changes.*
