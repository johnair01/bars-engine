# Book OS v0 (Full Spec)
## Retrieval-Grounded Agentic Editorial System for Bars-engine

---

## 1. Purpose

Book OS is a governed editorial system for producing long-form writing with AI while preserving:
- Voice fidelity
- Canon integrity
- Structural coherence
- Instructional clarity

It replaces conversational memory with deterministic reconstruction via retrieval + agents.

---

## 2. Core Principle

The system MUST reconstruct context each time.

Never rely on:
- chat history
- model memory
- vague style prompts

Always rely on:
- retrieved source excerpts
- canon rules
- style constraints
- approved sections

---

## 3. System Components

1. Book Projects
2. Source Library
3. Retrieval Engine
4. Agent Pipeline
5. Section Ledger
6. Approval System
7. Provenance Tracking

---

## 4. Data Model (Expanded)

### BookProject
- id
- title
- description
- status
- voice_profile_id
- canon_profile_id
- style_profile_id
- created_at
- updated_at

---

### SourceDocument
- id
- book_project_id
- title
- source_type
- raw_text
- trust_level
- created_at

---

### SourceExcerpt
- id
- source_document_id
- excerpt_text
- semantic_tags
- retrieval_priority
- canonical_weight
- style_weight
- teaching_weight

---

### Section
- id
- book_project_id
- title
- goal
- reader_transformation_goal
- status
- section_type
- current_draft_text
- approved_text
- must_define
- must_not_repeat
- depends_on_sections

---

### CanonRule
- id
- rule_type
- rule_text
- priority

---

### StyleRule
- id
- rule_type
- rule_text
- severity

---

### AgentProfile
- id
- name
- role_type
- system_prompt
- constraints

---

### AgentRun
- id
- section_id
- agent_profile_id
- input_payload
- output_payload
- created_at

---

### ApprovalEvent
- id
- section_id
- approved_text
- promoted_to_canon
- promoted_to_style_reference
- created_at

---

## 5. Agent System

### Archivist
Purpose:
- Retrieve relevant excerpts

Output:
- Voice anchors
- Canon anchors
- Teaching anchors
- Continuity anchors

---

### Canon Keeper
Purpose:
- Maintain truth

Output:
- Canon brief
- Definitions
- Constraints
- Ambiguities

---

### Style Guardian
Purpose:
- Enforce voice

Output:
- Style brief
- Banned patterns
- Drift warnings

---

### Drafter
Purpose:
- Write section

Rules:
- Must ground in retrieved content
- Must respect canon + style

---

### Red Team
Purpose:
- Break draft

Checks:
- hallucination
- repetition
- drift
- weak teaching

---

### Integrator
Purpose:
- Decide next step

Options:
- approve
- revise
- re-retrieve
- clarify canon

---

## 6. Workflow

1. Section creation
2. Retrieval
3. Canon brief
4. Style brief
5. Draft
6. Critique
7. Integration
8. Approval

---

## 7. Retrieval System

### Sources
- prior books
- approved sections
- style guides
- canon docs
- notes

---

### Priority
1. approved sections
2. authored work
3. exemplars
4. style/canon
5. notes

---

### Pack Composition
- voice anchors
- canon anchors
- teaching anchors
- continuity anchors

---

## 8. Approval Rules

Only approved text becomes:
- future retrieval context
- canon
- style exemplar

Draft text is never promoted.

---

## 9. API Design

POST /book-projects  
POST /source-documents  
POST /sections  

POST /sections/:id/retrieve  
POST /sections/:id/canon  
POST /sections/:id/style  
POST /sections/:id/draft  
POST /sections/:id/critique  
POST /sections/:id/integrate  
POST /sections/:id/approve  

GET /sections/:id/provenance  
GET /projects/:id/ledger  

---

## 10. MVP Scope

Required:
- project creation
- source import
- excerpt chunking
- section system
- retrieval
- draft
- critique
- approval

---

## 11. UI Concepts

### Dashboard
- section progress
- unresolved canon
- source health

### Section View
- brief
- retrieval pack
- draft
- critique
- approval history

---

## 12. Implementation Phases

Phase 1:
- schema
- CRUD

Phase 2:
- retrieval

Phase 3:
- agents (canon/style/draft)

Phase 4:
- critique + approval

Phase 5:
- provenance + ledger

---

## 13. Risks

- Over-complexity → keep pipeline fixed
- Bad retrieval → enforce short excerpts
- Drift → strict approval rules
- Bloat → optimize for throughput

---

## 14. Acceptance Criteria

- system retrieves relevant excerpts
- draft reflects source material
- critique identifies real issues
- approved text reused correctly

---

## 15. GM Face Mapping

- Shaman → resonance
- Challenger → critique
- Regent → canon
- Architect → structure
- Diplomat → coherence
- Sage → integration

---

## 16. Final Principle

This is not an AI writing tool.

This is a governed editorial system.

Continuity > generation.
