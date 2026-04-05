# Prompt: Reflective Data Privacy + Shareability Model v0

**Use this prompt when implementing data privacy infrastructure and API-first policy contracts.**

## Context

We need infrastructure to preserve people's data skillfully and deftly. The model defines data classes, visibility levels, identity layers, derived artifact rules, agent access boundaries, provenance rules, and consent controls—enabling appropriate sharing while protecting personal data.

## Prompt text

> Implement the Reflective Data Privacy + Shareability Model spec per [.specify/specs/reflective-data-privacy-shareability/spec.md](../specs/reflective-data-privacy-shareability/spec.md). API-first: define TypeScript types and Zod schemas for DataClass, VisibilityLevel, IdentityLayer, policies, provenance, consent. Create policy service (getDataClass, getVisibilityPolicy, getAgentAccessPolicy). Add visibility enforcement helper. Integrate provenance recording for derived artifacts. Defer consent store to v1 unless required.

## Checklist

- [ ] Phase 1: Contracts and types (types.ts, Zod schemas, index export)
- [ ] Phase 2: Policy service (policies.ts, record type → data class mapping)
- [ ] Phase 3: Visibility enforcement (checkVisibility helper, integrate in one route)
- [ ] Phase 4: Provenance helpers (recordProvenance, extend completionEffects)
- [ ] Phase 5: Consent store (optional; document API contract)
- [ ] Phase 6: Agent access boundaries (requireAgentAccess guard, role mapping)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/reflective-data-privacy-shareability/spec.md](../../specs/reflective-data-privacy-shareability/spec.md)
- Plan: [.specify/specs/reflective-data-privacy-shareability/plan.md](../../specs/reflective-data-privacy-shareability/plan.md)
- Tasks: [.specify/specs/reflective-data-privacy-shareability/tasks.md](../../specs/reflective-data-privacy-shareability/tasks.md)
