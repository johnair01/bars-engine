# Page Audit & Self-Healing

Audit all Next.js routes for broken pages and use the GM Face framework to heal them. No MCP required.

---

## Page Audit Script

### Prerequisites

- Dev server running: `npm run dev`
- Database synced (for dynamic routes): `npm run db:sync`

### Usage

```bash
npm run audit:pages
```

Options:

- `--base URL` — Base URL (default: http://localhost:3000)
- `--output FILE` — Write JSON report to file

```bash
npm run audit:pages -- --base http://localhost:3000 --output audit-report.json
```

### Interpreting Results

| Status | Meaning |
|--------|---------|
| ✓ 200 | Page loads OK |
| ? 307 | Redirect (often to login for auth-protected pages) |
| ✗ 4xx/5xx | Broken page |
| ERR | Fetch failed (timeout, connection refused) |

---

## Self-Healing (GM Face Framework)

After the audit, run the healing script to get GM Face–based recommendations:

```bash
npm run audit:pages -- --output audit-report.json
npm run heal:pages -- audit-report.json
```

The healing report maps each broken page to:

- **Primary GM Face** — Main lens for the fix
- **Secondary Faces** — Supporting perspectives
- **Healing actions** — Concrete steps
- **Face-specific questions** — Checklist for the agent

See **docs/SELF_HEALING_PAGES.md** for the full framework.

---

## Workflow

1. **Audit**: `npm run audit:pages -- --output audit-report.json`
2. **Heal**: `npm run heal:pages -- audit-report.json`
3. **Fix**: Apply recommendations using the GM Face checklist
4. **Re-audit**: `npm run audit:pages`

---

## ChatGPT ↔ Cursor Context Sharing

From the BARS Spec System: concept work happens in ChatGPT, implementation in Cursor.

1. **Export audit report**: `npm run audit:pages -- --output audit-report.json`
2. **Share the JSON** (or healing report) in ChatGPT for prioritization or spec drafting
3. **Create specs** in `.specify/specs/` from ChatGPT output
4. **Implement in Cursor** using the spec and GM Face healing actions
