---
name: bars-strand-management
description: Manage BARS strands using the bars_strand.py CLI tool. Use to create, list, and update logical development strands.
---

# Skill: BARS Strand Management

Adaptation of the Claude Desktop BARS Strand plugin. Use the `bars_strand.py` CLI to manage isolated work contexts.

## Usage
All commands run via `uv run python cli/bars-strand/bars_strand.py`. Make sure your environment has dependencies installed (`uv pip install -r cli/bars-strand/requirements.txt`) and API keys configured (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`).

### Create a Strand
```bash
uv run python cli/bars-strand/bars_strand.py create <name> --description "<desc>" --type <type>
```
*Types*: feature, bugfix, experiment, research, refactor, docs

### List Strands
```bash
uv run python cli/bars-strand/bars_strand.py list
```
*Filters*: `--status active`, `--type feature`

### Show Details
```bash
uv run python cli/bars-strand/bars_strand.py show <name>
```

### Update a Strand
```bash
uv run python cli/bars-strand/bars_strand.py update <name> --status <status> --description "<desc>"
```
*Statuses*: active, paused, completed, archived

### Link to Issue
```bash
uv run python cli/bars-strand/bars_strand.py link <name> <issue_url>
```
