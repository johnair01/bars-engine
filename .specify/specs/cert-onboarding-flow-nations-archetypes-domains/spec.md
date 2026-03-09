# Spec: Onboarding Flow Nations, Archetypes, Domains, and First Quest (Certification Feedback)

## Purpose

Fix Bruised Banana onboarding flow issues reported in cert-onboarding-flow-completion-v1: remove [[Continue]] artifacts, add nation/archetype explanation paths, explain the 4 domains with links, and build out the first quest stub.

## Root cause

- **[[Continue|The Work]] artifacts**: Body text still shows Twine link syntax instead of buttons.
- **Nation/Archetype paths**: Choosing a nation/archetype should branch to an explanation path with loop-back; currently lacks explanation flow.
- **Domain explanations**: The 4 allyship domains need one-sentence summaries and links (wiki or modal) to explain them.
- **First quest stub**: Placeholder "First Quest Stub" / TODO still present; needs real first-quest surfacing.

## User story

**As a player** in the Bruised Banana onboarding, I want clean button-based navigation, explanations for nations and archetypes before committing, domain summaries with links, and a real first quest after onboarding, so I understand my choices and have a clear next step.

## Functional requirements

- **FR1**: Remove [[Continue|...]] and similar Twine link artifacts from body text; use buttons for navigation.
- **FR2**: Nation choice → branch to nation explanation path; loop back to nation choice if player doesn't want that nation.
- **FR3**: Archetype choice → same pattern: explanation path, loop back.
- **FR4**: Add one-sentence summary for each of the 4 allyship domains; link to wiki page or open in modal.
- **FR5**: Replace "First Quest Stub" with real first-quest surfacing (e.g. Strengthen, Invite, Offer, Share, Contribute, Submit feedback).

## Reference

- Feedback source: .feedback/cert_feedback.jsonl
- Quest: cert-onboarding-flow-completion-v1, passage: STEP_1
- Related: [onboarding-flow-completion](../onboarding-flow-completion/spec.md), [dashboard-orientation-flow](../dashboard-orientation-flow/spec.md)
