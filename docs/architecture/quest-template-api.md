# Quest Template API

## Purpose

Define the API surface for the quest template extraction engine. The engine is callable independent of UI. Endpoints may be implemented as HTTP routes or service-layer functions; contracts are defined at the service boundary.

---

## 1. Service Contracts

### 1.1 Extract Templates

**Operation:** Run template extraction on a corpus or subset.

**Contract:** `extractTemplates(params): Promise<ExtractResult>`

**Request:**

```json
{
  "mode": "propose_candidates",
  "book_filters": ["handbook_intro", "bruised_banana"],
  "campaign_filters": ["bruised-banana"],
  "pass_number": 1,
  "min_confidence": 0.6,
  "min_cluster_size": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mode | string | Yes | `analyze_only` \| `propose_candidates` |
| book_filters | string[] | No | Limit to source books |
| campaign_filters | string[] | No | Limit to campaigns |
| pass_number | number | No | Normalization pass to use |
| min_confidence | number | No | Minimum confidence for candidates (0–1) |
| min_cluster_size | number | No | Minimum quests per cluster (default 2) |

**Response:**

```json
{
  "extraction_id": "ext_abc123",
  "mode": "propose_candidates",
  "summary": {
    "quests_analyzed": 45,
    "clusters_found": 8,
    "candidates_created": 5,
    "outliers_count": 3
  },
  "candidates": [
    {
      "template_id": "linear_onboarding_v1",
      "template_family": "linear_onboarding",
      "confidence_score": 0.86,
      "match_count": 12,
      "source_books": ["handbook_intro", "bruised_banana"],
      "approval_status": "candidate"
    }
  ],
  "outliers": [
    {
      "quest_id": "broken_flow_v1",
      "source_book": "extraction_test",
      "reason": "no_matching_cluster"
    }
  ]
}
```

---

### 1.2 List Templates

**Operation:** List templates and/or candidate templates with filters.

**Contract:** `listTemplates(params): Promise<TemplateSummary[]>`

**Request (query params or body):**

| Param | Type | Description |
|-------|------|-------------|
| approval_status | string | `candidate` \| `under_review` \| `approved` \| `rejected` \| `deprecated` |
| template_family | string | Filter by family |
| source_book | string | Filter by source book |
| min_confidence | number | Minimum confidence |
| limit | number | Max results (default 50) |
| offset | number | Pagination offset |

**Response:** Array of `TemplateSummary`:

```json
[
  {
    "template_id": "linear_onboarding_v1",
    "template_name": "Linear Onboarding",
    "template_family": "linear_onboarding",
    "confidence_score": 0.86,
    "match_count": 12,
    "approval_status": "approved",
    "created_at": "2025-03-06T12:00:00Z"
  }
]
```

---

### 1.3 Get Template

**Operation:** Return one template or candidate template by ID.

**Contract:** `getTemplate(templateId: string): Promise<TemplateDetail | null>`

**Response:**

```json
{
  "template_id": "linear_onboarding_v1",
  "template_name": "Linear Onboarding",
  "template_family": "linear_onboarding",
  "description": "Short linear flow: intro → prompt → action → completion",
  "approval_status": "approved",
  "confidence_score": 0.86,
  "match_count": 12,
  "source_quest_ids": ["q1", "q2", "q3"],
  "source_books": ["handbook_intro", "bruised_banana"],
  "extraction_pass": "pass-01",
  "node_pattern": ["introduction", "prompt", "choice", "action", "completion"],
  "action_pattern": ["continue", "signup"],
  "bar_pattern": "no_BAR",
  "completion_pattern": "node_reached",
  "constraints": [],
  "placeholders": [
    { "key": "welcome_copy", "type": "string", "description": "Welcome message" }
  ],
  "example_quest_ids": ["orientation_welcome_v2", "campaign_join_v1"],
  "created_at": "2025-03-06T12:00:00Z",
  "updated_at": "2025-03-06T12:00:00Z"
}
```

---

### 1.4 Approve Template

**Operation:** Promote a candidate template to approved.

**Contract:** `approveTemplate(templateId: string, metadata: ApproveMetadata): Promise<ApproveResult>`

**Request:**

```json
{
  "reviewer_id": "admin_123",
  "review_notes": "Pattern validated; suitable for onboarding generation",
  "tags": ["onboarding", "linear"]
}
```

**Response:**

```json
{
  "success": true,
  "template_id": "linear_onboarding_v1",
  "approval_status": "approved"
}
```

**Errors:** Template not in `candidate` or `under_review`; template not found.

---

### 1.5 Reject Template

**Operation:** Reject a candidate template.

**Contract:** `rejectTemplate(templateId: string, reason: string): Promise<RejectResult>`

**Request:**

```json
{
  "reason": "Overfits to handbook_intro; not generalizable",
  "reviewer_id": "admin_123"
}
```

**Response:**

```json
{
  "success": true,
  "template_id": "linear_onboarding_v1",
  "approval_status": "rejected"
}
```

---

### 1.6 Get Extraction Report

**Operation:** Return a summary report of extracted patterns.

**Contract:** `getExtractionReport(extractionId?: string): Promise<ExtractionReport>`

**Response:**

```json
{
  "extraction_id": "ext_abc123",
  "extracted_at": "2025-03-06T12:00:00Z",
  "top_template_families": [
    { "family": "linear_onboarding", "count": 12, "avg_confidence": 0.86 },
    { "family": "reflection_bar_completion", "count": 5, "avg_confidence": 0.72 }
  ],
  "recurring_node_patterns": [
    { "pattern": "introduction→prompt→action→completion", "count": 12 },
    { "pattern": "introduction→reflection→BAR_capture→completion", "count": 5 }
  ],
  "recurring_action_patterns": [
    { "pattern": "continue→signup", "count": 8 },
    { "pattern": "choose→create_BAR→confirm", "count": 5 }
  ],
  "unresolved_outliers": [
    { "quest_id": "broken_flow_v1", "source_book": "extraction_test" }
  ],
  "review_recommendations": [
    {
      "template_id": "linear_onboarding_v1",
      "recommendation": "approve",
      "reason": "High confidence; stable across books"
    }
  ]
}
```

---

## 2. HTTP Route Mapping (Optional)

If implemented as HTTP API:

| Method | Path | Service |
|--------|------|---------|
| POST | /api/quest-templates/extract | extractTemplates |
| GET | /api/quest-templates | listTemplates |
| GET | /api/quest-templates/:id | getTemplate |
| POST | /api/quest-templates/:id/approve | approveTemplate |
| POST | /api/quest-templates/:id/reject | rejectTemplate |
| GET | /api/quest-templates/report | getExtractionReport |

---

## 3. Error Responses

| Code | Meaning |
|------|---------|
| 404 | Template not found |
| 400 | Invalid request (e.g., invalid mode, missing required fields) |
| 409 | Template not in approvable state |
| 500 | Extraction or internal error |

---

## 4. References

- [quest-template-extraction-engine.md](quest-template-extraction-engine.md)
