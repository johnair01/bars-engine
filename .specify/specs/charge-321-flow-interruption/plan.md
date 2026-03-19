# Plan: Charge → 321 Flow Interruption

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — run `npm run strand:consult:flow-interruption` to refresh.

## Phases

(To be refined from STRAND_CONSULT synthesis.)

1. **Diagnose** — For each branch (Quest, BAR, daemon, artifact): save-without-notify vs wiring
2. **Fix** — Add explicit feedback per branch; ensure completion contract
3. **Document** — Add "major flows can't be interrupted" to design docs
4. **Instrument** — Identify which flows complete (logging, completion markers)
