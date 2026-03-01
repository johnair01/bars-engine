# Prompt: Certification Feedback Stability

**Use when fixing the feedback form navigate-away bug.**

## Source

Certification feedback (cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1):

> When I go to add feedback the app moves to the dashboard while I'm in the middle of typing and losing any text I've put in

## Prompt text

> Fix the certification quest FEEDBACK passage so it does not navigate the user to the dashboard while typing. Investigate root cause (auth redirect, revalidation, layout) and ensure the feedback form stays stable. See [.specify/specs/cert-feedback-stability/spec.md](../../specs/cert-feedback-stability/spec.md).

## Reference

- Spec: [.specify/specs/cert-feedback-stability/spec.md](../../specs/cert-feedback-stability/spec.md)
