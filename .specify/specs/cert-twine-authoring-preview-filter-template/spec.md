# Spec: Twine Authoring Preview, Filter, and Template (Certification Feedback)

## Purpose

Improve the Twine authoring admin experience based on cert-twine-authoring-ir-v1 feedback. Add in-editor preview, filtering on the Twine story page, and template support so authors can pull in existing story structures easily.

## Root cause

- **Preview**: Authors must leave the editor to validate their work; no way to test from the edit pane.
- **Filter**: Twine story page lacks filtering; hard to find specific stories.
- **Template**: No way to set a story as a template or pull in a structure; authors start from scratch.

## User story

**As an admin** (Twine author), I want to preview my story from the edit pane, filter stories on the Twine page, and use or create templates, so I can validate work in-context and reuse proven structures.

## Functional requirements

- **FR1**: Add a preview/test control in the Twine edit pane that opens an inline or modal preview of the story without leaving the editor.
- **FR2**: Add filtering on the Twine story list page (e.g. by status, campaign, tags, search).
- **FR3**: Allow marking a Twine story as a template; allow creating a new story from a template (pull in structure).

## Reference

- Feedback source: .feedback/cert_feedback.jsonl
- Quest: cert-twine-authoring-ir-v1, passage: STEP_4
- Related: [twine-authoring-ir](../twine-authoring-ir/spec.md)
