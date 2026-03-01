# Spec: Certification Quest Vibeulon Payoff Visibility

## Purpose

Ensure the BB_Moves_ShowUp node (last step before sign-up) clearly mentions earning starter vibeulons, so testers see the payoff before committing. Reported in cert-two-minute-ride-v1 STEP_4: "currently no visible vibeulon payoff."

## Root cause

The Bruised Banana CYOA node BB_Moves_ShowUp (or equivalent) may not include copy about earning starter vibeulons. The certification quest expects this copy to be visible.

## User story

**As a tester**, I want to see that I'll earn starter vibeulons before I sign up, so I understand the immediate reward for participating.

**Acceptance**: Reaching the last step before sign-up (BB_Moves_ShowUp or equivalent) shows copy mentioning earning starter vibeulons.

## Functional requirements

- **FR1**: The Bruised Banana flow node immediately before sign-up MUST include copy about earning starter vibeulons (e.g. "Complete sign-up to receive X starter vibeulons").
- **FR2**: This applies to the campaign story content (Twine/CYOA), not the certification quest itself.
- **FR3**: If the campaign is seeded from a different source, ensure that source includes the payoff copy.

## Non-functional requirements

- Update campaign seed or Twine story content.
- Certification quest STEP_4 verifies this; no cert quest changes needed if campaign is fixed.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl (cert-two-minute-ride-v1 STEP_4)
- Bruised Banana campaign: campaign ref bruised-banana, BB_Moves_ShowUp node
- Campaign seed: check scripts or CMS for campaign content
