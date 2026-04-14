# Plan: Bruised Banana donation demo BAR

## Dependencies

- Existing BAR delivery to non-users (invite BAR, event-invite patterns, public bar routes).  
- Shadow **321** runner and copy/theming pipeline.  
- Instance **donation URLs** and campaign-scoped CTA patterns.  
- Wiki: `/wiki/...` public pages; optional shared strip component for donate + return-to-demo.

## Phases (outline — detail after Section 6 tasks)

1. **Content + IA** — Finalize Section 6 deliverables; lock wiki face mapping.  
2. **BAR template** — Single campaign BAR (or generator template) with structured sections and links.  
3. **Experience wiring** — Charge → 321 → optional signup/BAR; ephemeral handling pre-auth.  
4. **Wiki** — Face-aligned pages or sections + donate strip + back link.  
5. **Telemetry** — Events for terminal states (including explicit no / not yet / ambiguous leave) without contradicting privacy copy.

## Open questions

- Re-entry: fresh demo each visit vs single anonymous session cookie (Regent + Architect).  
- Exact donate URL source per environment (instance Stripe, etc.).
