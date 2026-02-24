# Specification: Twine Completion Hardening

## Overview
Stabilize the Twine Quest completion flow by fixing the empty "REQUIRED ACTION" UI component when no inputs exist, and resolving the database transaction deadlock caused by concurrent completion triggers.

## Target Audience
Players (who will experience a smooth end-of-quest UI) and Developers (who will no longer face transaction timeout errors).

## User Stories
1. **As a Player,** if a quest has no required input fields, I should not see an empty "REQUIRED ACTION" box. I should just see the end-of-story text and a button to continue.
2. **As a Player,** when I click "Continue Journey" at the end of a Twine quest, I should seamlessly return to the adventures list without triggering a transaction error.

## Functional Requirements
- **FR1 (UI Rendering):** The `PassageRenderer` must robustly evaluate whether `quest.inputs` actually contains fields to render.
- **FR2 (Completion State):** The system must distinguish between a Twine run that is actively completing versus one that has already been auto-completed by the passage transition.
- **FR3 (Action Prevention):** The "CONTINUE JOURNEY" button should not invoke the heavy `completeQuest` backend action if the quest is already marked completed by the auto-completion logic.

## Non-Functional Requirements
- Maintain code safety and existing validation logic in `quest-engine`.
