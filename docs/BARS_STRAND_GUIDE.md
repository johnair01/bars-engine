# BARS Strand System Guide

Complete guide to using the BARS Strand system for development-time context management.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Concepts](#concepts)
- [Usage](#usage)
- [Fork-Space Configuration](#fork-space-configuration)
- [Claude Integration](#claude-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The BARS Strand system provides development-time tools for managing work contexts (strands) in bars-engine. Each strand represents a unit of work with its own fork-space configuration, metadata, and links to external tracking systems.

### What is a Strand?

A **strand** is a development context that:
- Tracks a specific piece of work (feature, bugfix, experiment, etc.)
- Defines file access boundaries (fork-space)
- Links to GitHub issues for traceability
- Maintains status and metadata
- Enables context switching without losing work state

### Key Features

- **CLI Tool**: Command-line interface for all strand operations
- **Claude Plugin**: Natural language interface via Claude Desktop
- **Fork-Space**: Configurable file access boundaries
- **Issue Linking**: Connect strands to GitHub issues
- **JSON Output**: Automation-friendly output format
- **Status Tracking**: Monitor strand lifecycle

---

## Installation

### Prerequisites

- Python 3.12 or higher
- uv (Python package manager)
- Git
- Claude Desktop (optional, for plugin)

### Step 1: Install CLI Tool

```bash
# Navigate to repository
cd ~/code/bars-engine

# Create virtual environment with Python 3.12
uv venv .venv --python 3.12

# Install dependencies
uv pip install -r cli/bars-strand/requirements.txt

# Make executable
chmod +x cli/bars-strand/bars_strand.py

# Verify installation
uv run python cli/bars-strand/bars_strand.py --version
```

### Step 2: Create Strands Directory

```bash
# From repository root
cd ~/code/bars-engine
mkdir -p .strands
echo '*.yaml' > .strands/.gitignore
```

### Step 3: Install Claude Plugin (Optional)

The Claude plugin is already in place at `.claude/plugins/bars-strand/`.

Restart Claude Desktop to load the plugin.

---

## Quick Start

### Create Your First Strand

```bash
# Create a feature strand
uv run python cli/bars-strand/bars_strand.pycreate user-auth \
  --description "Implement user authentication system" \
  --type feature \
  --status active

# Link to GitHub issue
uv run python cli/bars-strand/bars_strand.pylink user-auth https://github.com/johnair01/bars-engine/issues/21

# View details
uv run python cli/bars-strand/bars_strand.pyshow user-auth
```

### List Active Strands

```bash
# List all strands
uv run python cli/bars-strand/bars_strand.pylist

# Filter by status
uv run python cli/bars-strand/bars_strand.pylist --status active

# Filter by type
uv run python cli/bars-strand/bars_strand.pylist --type feature
```

### Update Strand Status

```bash
# Mark as completed
uv run python cli/bars-strand/bars_strand.pyupdate user-auth --status completed

# Add description
uv run python cli/bars-strand/bars_strand.pyupdate user-auth --description "Authentication system complete with OAuth2"
```

---

## Concepts

### Strand Types

| Type | Purpose | Example |
|------|---------|---------|
| `feature` | New feature development | User authentication, API endpoints |
| `bugfix` | Bug fixes | Memory leak, validation error |
| `experiment` | Experimental work | New algorithm, performance test |
| `research` | Research and investigation | Library evaluation, architecture study |
| `refactor` | Code refactoring | Extract service, simplify logic |
| `docs` | Documentation work | API docs, user guide |

### Strand Statuses

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `active` | Currently being worked on | Daily active development |
| `paused` | Temporarily paused | Blocked, waiting for input |
| `completed` | Work completed | Feature merged, bug fixed |
| `archived` | Archived for reference | No longer relevant, historical |

### Fork-Space

**Fork-space** defines the scope of files a strand can access. This prevents accidental modifications outside the strand's intended work area.

Default fork-space configuration:
```yaml
fork_space:
  allowed_paths:
    - src/
    - tests/
  excluded_paths:
    - "**/__pycache__/"
    - "*.pyc"
  file_patterns:
    - "*.py"
    - "*.md"
    - "*.json"
```

---

## Usage

### Creating Strands

```bash
# Basic creation
uv run python cli/bars-strand/bars_strand.pycreate my-feature --description "My feature description"

# Specify type and status
uv run python cli/bars-strand/bars_strand.pycreate my-bugfix \
  --description "Fix validation error" \
  --type bugfix \
  --status active

# JSON output for automation
uv run python cli/bars-strand/bars_strand.pycreate my-experiment \
  --description "Test new algorithm" \
  --type experiment \
  --json
```

### Listing Strands

```bash
# List all strands
uv run python cli/bars-strand/bars_strand.pylist

# Filter by status
uv run python cli/bars-strand/bars_strand.pylist --status active
uv run python cli/bars-strand/bars_strand.pylist --status completed

# Filter by type
uv run python cli/bars-strand/bars_strand.pylist --type feature
uv run python cli/bars-strand/bars_strand.pylist --type bugfix

# Combine filters
uv run python cli/bars-strand/bars_strand.pylist --status active --type feature

# JSON output
uv run python cli/bars-strand/bars_strand.pylist --json
```

### Viewing Strand Details

```bash
# Show full details
uv run python cli/bars-strand/bars_strand.pyshow my-feature

# JSON output
uv run python cli/bars-strand/bars_strand.pyshow my-feature --json
```

Output includes:
- Name, type, status
- Description
- Created/updated timestamps
- Linked GitHub issues
- Fork-space configuration
- Custom metadata

### Updating Strands

```bash
# Update status
uv run python cli/bars-strand/bars_strand.pyupdate my-feature --status completed

# Update description
uv run python cli/bars-strand/bars_strand.pyupdate my-feature --description "New description"

# Multiple updates
uv run python cli/bars-strand/bars_strand.pyupdate my-feature \
  --status paused \
  --description "Waiting for API changes"

# JSON output
uv run python cli/bars-strand/bars_strand.pyupdate my-feature --status completed --json
```

### Linking to GitHub Issues

```bash
# Link to issue
uv run python cli/bars-strand/bars_strand.pylink my-feature https://github.com/johnair01/bars-engine/issues/21

# Verify link
uv run python cli/bars-strand/bars_strand.pyshow my-feature

# JSON output
uv run python cli/bars-strand/bars_strand.pylink my-feature https://github.com/johnair01/bars-engine/issues/21 --json
```

### Deleting Strands

```bash
# Delete with confirmation
uv run python cli/bars-strand/bars_strand.pydelete my-feature

# Confirm with 'y' when prompted
```

**Warning**: Deletion is permanent. Strand data cannot be recovered.

---

## Fork-Space Configuration

Fork-space defines file access boundaries for a strand. Each strand's fork-space is stored in its YAML configuration.

### Configuration Structure

```yaml
fork_space:
  allowed_paths:
    - src/features/
    - tests/features/
  excluded_paths:
    - "**/__pycache__/"
    - "*.pyc"
    - "*.log"
  file_patterns:
    - "*.py"
    - "*.md"
    - "*.json"
  max_depth: 5
  read_only_paths:
    - docs/
    - README.md
```

### Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `allowed_paths` | List[str] | Paths relative to repo root that strand can access |
| `excluded_paths` | List[str] | Paths to exclude even if in allowed_paths |
| `file_patterns` | List[str] | Glob patterns for files strand can modify |
| `max_depth` | int | Maximum directory depth from allowed_paths roots |
| `read_only_paths` | List[str] | Paths strand can read but not modify |

### Validation Rules

1. All paths must be relative to repository root
2. `allowed_paths` cannot be empty
3. `excluded_paths` must be subsets of `allowed_paths`
4. No path can escape repository root (no `../..` patterns)
5. Paths must exist or be valid for creation

### Fork-Space Templates

The CLI includes predefined templates for common patterns:

**Feature Template**:
```yaml
allowed_paths:
  - src/features/<feature_name>/
  - tests/features/<feature_name>/
file_patterns:
  - "*.py"
  - "*.md"
```

**Bugfix Template**:
```yaml
allowed_paths:
  - src/
  - tests/
file_patterns:
  - "*.py"
read_only_paths:
  - docs/
```

**Experiment Template**:
```yaml
allowed_paths:
  - experiments/<experiment_name>/
file_patterns:
  - "*"
```

### Modifying Fork-Space

Fork-space is configured during strand creation and stored in the strand's YAML file.

To modify fork-space, edit the strand's YAML file:
```bash
# Edit strand configuration
vim .strands/my-feature.yaml

# Or use your preferred editor
code .strands/my-feature.yaml
```

Future versions may include CLI commands for fork-space management.

---

## Claude Integration

The BARS Strand plugin enables natural language strand management in Claude Desktop.

### Available Commands

**Create Strand**:
```
Create a strand called "user-auth" for implementing user authentication as a feature
```

**List Strands**:
```
List all active strands
Show me all feature strands
What strands are currently paused?
```

**Show Details**:
```
Show me details about the user-auth strand
```

**Update Strand**:
```
Mark the user-auth strand as completed
Update the description of user-auth to "Complete authentication system"
```

**Link to Issue**:
```
Link the user-auth strand to https://github.com/johnair01/bars-engine/issues/21
```

**Delete Strand**:
```
Delete the user-auth strand
```

### Plugin Architecture

The Claude plugin wraps the `bars-strand` CLI tool via subprocess execution. All strand data is managed by the CLI and stored in `.strands/` directory.

The plugin translates natural language requests into CLI commands, making strand management conversational.

---

## Best Practices

### Strand Naming

- Use lowercase with hyphens: `user-auth`, `fix-validation-error`
- Keep names short but descriptive
- Avoid spaces and special characters
- Use consistent naming patterns within teams

### Strand Lifecycle

1. **Create** strand when starting new work
2. **Link** to GitHub issue for traceability
3. **Update** status as work progresses
4. **Complete** when work is merged/deployed
5. **Archive** when no longer relevant

### Fork-Space Design

- Start with narrow scope, expand if needed
- Use read-only paths for reference materials
- Exclude generated files and caches
- Document rationale in strand description

### Git Integration

**Recommended workflow**:
```bash
# Create strand
uv run python cli/bars-strand/bars_strand.pycreate feature-x --description "..." --type feature

# Create git branch
git checkout -b feature-x

# Do work...
git add .
git commit -m "feat: Implement feature X"

# Mark strand as completed
uv run python cli/bars-strand/bars_strand.pyupdate feature-x --status completed

# Merge branch
git checkout main
git merge feature-x
```

### CI/CD Integration

**GitHub Actions Example**:
```yaml
# .github/workflows/strand-check.yml
name: Strand Status Check
on: [push, pull_request]
jobs:
  check-strands:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check strand status
        run: |
          python cli/bars-strand/bars_strand.py list --status active --json
```

---

## Troubleshooting

### CLI Installation Issues

**Problem**: `ModuleNotFoundError: No module named 'click'`

**Solution**:
```bash
cd cli/bars-strand
pip install -r requirements.txt
```

**Problem**: `Permission denied` when running `bars-strand`

**Solution**:
```bash
chmod +x cli/bars-strand/bars_strand.py
```

### Strand Not Found

**Problem**: `Error: Strand 'my-feature' not found`

**Solution**:
- Verify strand exists: `uv run python cli/bars-strand/bars_strand.pylist`
- Check spelling of strand name
- Ensure you're in the repository root

### Plugin Not Loading

**Problem**: Claude plugin not appearing in Claude Desktop

**Solution**:
1. Verify plugin.json is valid: `jq . .claude/plugins/bars-strand/plugin.json`
2. Restart Claude Desktop
3. Check Claude Desktop logs for errors

### JSON Output Parsing

**Problem**: JSON output contains error messages

**Solution**:
- Check command exit code: `echo $?` (0 = success)
- Parse stderr separately from stdout
- Use `--json` flag for structured output

### Fork-Space Validation

**Problem**: Fork-space configuration rejected

**Solution**:
- Verify all paths are relative to repo root
- Check for typos in path names
- Ensure allowed_paths is not empty
- Remove any `../` patterns

---

## Advanced Usage

### Automation Scripts

**List active feature strands**:
```bash
#!/bin/bash
uv run python cli/bars-strand/bars_strand.pylist --status active --type feature --json | jq -r '.[].name'
```

**Auto-create strand from branch**:
```bash
#!/bin/bash
BRANCH=$(git branch --show-current)
if [[ $BRANCH == feature/* ]]; then
  STRAND_NAME=${BRANCH#feature/}
  uv run python cli/bars-strand/bars_strand.pycreate "$STRAND_NAME" \
    --description "Branch: $BRANCH" \
    --type feature \
    --status active
fi
```

### JSON API

All commands support `--json` flag for structured output:

```bash
# Create strand and capture output
OUTPUT=$(uv run python cli/bars-strand/bars_strand.pycreate my-feature --description "..." --json)
STRAND_NAME=$(echo "$OUTPUT" | jq -r '.name')
CREATED_AT=$(echo "$OUTPUT" | jq -r '.created_at')

# List and filter with jq
uv run python cli/bars-strand/bars_strand.pylist --json | jq '.[] | select(.status == "active")'
```

---

## See Also

- [CLI README](../cli/bars-strand/README.md) - CLI-specific documentation
- [Plugin README](../.claude/plugins/bars-strand/README.md) - Plugin usage guide
- [GitHub Issue #21](https://github.com/johnair01/bars-engine/issues/21) - Implementation details
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) - Implementation summary

---

*BARS Strand System - Version 1.0.0*
*Last Updated: 2026-03-27*
