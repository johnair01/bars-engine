# Copy violations inventory: Conclave / Instance / Campaign

**Purpose:** Repeatable audit so **player-facing** and **GPT-facing** copy stops conflating **Conclave (legacy rail)**, **Instance (ops container)**, and **Campaign (initiative / ref)**.  
**v1 scope:** Inventory + recommended phrase; **bulk code edit** is a **follow-up PR** (see [spec.md](./spec.md) D3).

---

## Canonical sources (read before “fixing”)

- [campaign-hub-spoke-landing-architecture § Conclave as legacy campaign entry](../campaign-hub-spoke-landing-architecture/spec.md#conclave-as-legacy-campaign-entry)  
- [GLOSSARY.md](./GLOSSARY.md)  
- [dashboard-orientation-flow](../dashboard-orientation-flow/spec.md) — `postSignupRedirect` conclave vs dashboard  

---

## Methodology

1. **Grep** (examples below); capture path + line.  
2. **Classify:**  
   - **P0** — Wrong permissions, money, or legal attribution.  
   - **P1** — Player confusion (onboarding, campaign entry).  
   - **P2** — Docs / internal specs only.  
3. **Recommend** replacement using **GLOSSARY** `term_id` phrases.  
4. **Do not** rename routes in this inventory pass unless security-critical.

### Commands (re-run quarterly)

```bash
rg -n "conclave" src/app --glob "*.tsx" | head -80
rg -n "Conclave" .specify docs --glob "*.md" | head -80
rg -n "campaign.*instance|instance.*campaign" src --glob "*.{tsx,ts}" | head -40
```

---

## Seed findings (non-exhaustive)

| Severity | Location | Issue | Recommended direction |
|----------|----------|-------|------------------------|
| P2 | `.specify/specs/campaign-onboarding-cyoa/spec.md` | Documents **Conclave convergence** vs campaign — **good**; use as template | Keep; link from glossary `conclave_rail` |
| P2 | `.specify/specs/attunement-translation/spec.md` | “Event/Conclave” for local vibeulons — **blurs** instance vs Conclave rail | Prefer **“instance-scoped event”** or **“campaign context”** per glossary |
| P1 | `src/app/hand/page.tsx` etc. | Redirects to `/conclave/guided` for **not ready** — **correct behavior** but copy may say “campaign” inconsistently | Audit **redirect reason strings** only |
| P2 | `.specify/specs/play-public-teaser-loop/spec.md` | Honest CTAs to `/conclave/guided` — document **choice** in plan | Align with CHS migration when ready |
| P2 | Multiple specs | “Welcome to conclave” admin bug mentions | Use **product name** vs **route** explicitly in fix |

**Note:** ~40+ `src` files reference `/conclave` — many are **legitimate redirects**. Violations are **semantic** (“Conclave **is** the campaign” vs “Conclave **is** one narrative **entry** to campaign/instance flows”).

---

## Open rows (fill as you triage)

| id | file | line (approx) | class | suggested fix |
|----|------|----------------|-------|---------------|
| — | — | — | — | Add rows during triage |

---

## Definition of done (inventory phase)

- [ ] At least **15** triaged rows **or** documented decision that grep hits are redirect-only and **non-violating**  
- [ ] P0 list empty or ticketed  
- [ ] Glossary updated if new canonical phrase emerges  
