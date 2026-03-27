# BARS Strand System Guide

Complete guide to using the BARS Strand system for development-time context management.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [API Configuration](#api-configuration)
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
- **Multi-Provider Support**: Work with Anthropic, OpenAI, or budget models
- **Fork-Space**: Configurable file access boundaries
- **Issue Linking**: Connect strands to GitHub issues
- **JSON Output**: Automation-friendly output format
- **Status Tracking**: Monitor strand lifecycle

---

## Quick Start

### 5-Minute Setup

```bash
# 1. Navigate to repository
cd ~/code/bars-engine

# 2. Install CLI dependencies
uv pip install -r cli/bars-strand/requirements.txt

# 3. Initialize configuration
uv run python cli/bars-strand/bars_strand.py config init

# 4. Set your API key (choose one)
export ANTHROPIC_API_KEY=your-api-key-here
# OR
export OPENAI_API_KEY=your-api-key-here

# 5. Verify setup
uv run python cli/bars-strand/bars_strand.py config check

# 6. Create your first strand
uv run python cli/bars-strand/bars_strand.py create my-feature \
  --description "Implement user authentication" \
  --type feature
```

That's it! You're ready to use strands.

---

## Installation

### Prerequisites

- Python 3.12 or higher
- uv (Python package manager)
- Git
- Claude Desktop (optional, for plugin)
- API key from one of:
  - [Anthropic](https://console.anthropic.com/)
  - [OpenAI](https://platform.openai.com/api-keys)
  - Budget providers (DeepSeek, Together AI, etc.)

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

### Step 2: Configure API Access

```bash
# Initialize configuration file
uv run python cli/bars-strand/bars_strand.py config init

# This creates .bars-strand.yml in your repository root
```

### Step 3: Set API Key

Choose your provider and set the corresponding environment variable:

**Anthropic (Claude)**:
```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

**OpenAI**:
```bash
export OPENAI_API_KEY=your-api-key-here
```

**Budget Models** (DeepSeek, Qwen, etc.):
```bash
export OPENAI_COMPATIBLE_API_KEY=your-api-key-here
```

Add to your shell profile (~/.zshrc, ~/.bashrc) to persist:
```bash
echo 'export ANTHROPIC_API_KEY=your-api-key-here' >> ~/.zshrc
```

### Step 4: Verify Setup

```bash
uv run python cli/bars-strand/bars_strand.py config check
```

You should see:
```
Configuration:
  ℹ Default provider: anthropic
  ℹ API key configured for anthropic
  ℹ Model: claude-sonnet-4-5-20250929-v1:0

✓ Configuration is valid
```

### Step 5: Install Claude Plugin (Optional)

The Claude plugin is already in place at `.claude/plugins/bars-strand/`.

Restart Claude Desktop to load the plugin.

---

## API Configuration

### Configuration File

The `.bars-strand.yml` file controls API settings. Create it with:

```bash
uv run python cli/bars-strand/bars_strand.py config init
```

### Supported Providers

#### 1. Anthropic (Claude)

Default configuration for Claude models:

```yaml
api:
  default_provider: anthropic
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
    model: claude-sonnet-4-5-20250929-v1:0
    max_tokens: 8192
    temperature: 0.7
```

**Get API Key**: https://console.anthropic.com/

#### 2. OpenAI (GPT)

Configuration for OpenAI models:

```yaml
api:
  default_provider: openai
  openai:
    api_key: ${OPENAI_API_KEY}
    model: gpt-4-turbo-preview
    max_tokens: 4096
    temperature: 0.7
```

**Get API Key**: https://platform.openai.com/api-keys

#### 3. Budget Models (OpenAI-Compatible)

For cost-effective models via HuggingFace, Together AI, vLLM, etc.:

**DeepSeek-V3** ($0.10/1M tokens):
```yaml
api:
  default_provider: openai_compatible
  openai_compatible:
    api_key: ${DEEPSEEK_API_KEY}
    base_url: https://api.deepseek.com/v1
    model: deepseek-chat
    max_tokens: 8192
    temperature: 0.7
```

**Qwen2.5-Coder-32B** via Together AI ($0.05-0.10/1M):
```yaml
api:
  default_provider: openai_compatible
  openai_compatible:
    api_key: ${TOGETHER_API_KEY}
    base_url: https://api.together.xyz/v1
    model: Qwen/Qwen2.5-Coder-32B-Instruct
    max_tokens: 8192
    temperature: 0.7
```

**Self-Hosted (vLLM/SGLang)**:
```yaml
api:
  default_provider: openai_compatible
  openai_compatible:
    api_key: your-local-api-key
    base_url: http://localhost:8000/v1
    model: your-model-name
    max_tokens: 8192
    temperature: 0.7
```

### Configuration Commands

**Initialize config**:
```bash
uv run python cli/bars-strand/bars_strand.py config init
```

**Check configuration**:
```bash
uv run python cli/bars-strand/bars_strand.py config check
```

**Change provider**:
```bash
uv run python cli/bars-strand/bars_strand.py config set-provider openai
```

**Show configuration** (API keys redacted):
```bash
uv run python cli/bars-strand/bars_strand.py config show
```

### Environment Variables

API keys are set via environment variables:

| Provider | Environment Variable |
|----------|---------------------|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |
| OpenAI-Compatible | `OPENAI_COMPATIBLE_API_KEY` |

Set permanently in your shell profile:
```bash
# ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY=your-api-key-here
export OPENAI_API_KEY=your-openai-key-here
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
    - "*.ts"
    - "*.tsx"
    - "*.md"
    - "*.json"
```

---

## Usage

### Creating Strands

```bash
# Basic creation
uv run python cli/bars-strand/bars_strand.py create my-feature \
  --description "My feature description"

# Specify type and status
uv run python cli/bars-strand/bars_strand.py create my-bugfix \
  --description "Fix validation error" \
  --type bugfix \
  --status active

# JSON output for automation
uv run python cli/bars-strand/bars_strand.py create my-experiment \
  --description "Test new algorithm" \
  --type experiment \
  --json
```

### Listing Strands

```bash
# List all strands
uv run python cli/bars-strand/bars_strand.py list

# Filter by status
uv run python cli/bars-strand/bars_strand.py list --status active
uv run python cli/bars-strand/bars_strand.py list --status completed

# Filter by type
uv run python cli/bars-strand/bars_strand.py list --type feature
uv run python cli/bars-strand/bars_strand.py list --type bugfix

# Combine filters
uv run python cli/bars-strand/bars_strand.py list --status active --type feature

# JSON output
uv run python cli/bars-strand/bars_strand.py list --json
```

### Viewing Strand Details

```bash
# Show full details
uv run python cli/bars-strand/bars_strand.py show my-feature

# JSON output
uv run python cli/bars-strand/bars_strand.py show my-feature --json
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
uv run python cli/bars-strand/bars_strand.py update my-feature --status completed

# Update description
uv run python cli/bars-strand/bars_strand.py update my-feature \
  --description "New description"

# Multiple updates
uv run python cli/bars-strand/bars_strand.py update my-feature \
  --status paused \
  --description "Waiting for API changes"

# JSON output
uv run python cli/bars-strand/bars_strand.py update my-feature \
  --status completed --json
```

### Linking to GitHub Issues

```bash
# Link to issue
uv run python cli/bars-strand/bars_strand.py link my-feature \
  https://github.com/johnair01/bars-engine/issues/21

# Verify link
uv run python cli/bars-strand/bars_strand.py show my-feature

# JSON output
uv run python cli/bars-strand/bars_strand.py link my-feature \
  https://github.com/johnair01/bars-engine/issues/21 --json
```

### Deleting Strands

```bash
# Delete with confirmation
uv run python cli/bars-strand/bars_strand.py delete my-feature

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
    - "*.ts"
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
  - "*.ts"
  - "*.md"
```

**Bugfix Template**:
```yaml
allowed_paths:
  - src/
  - tests/
file_patterns:
  - "*.py"
  - "*.ts"
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
uv run python cli/bars-strand/bars_strand.py create feature-x \
  --description "..." --type feature

# Create git branch
git checkout -b feature-x

# Do work...
git add .
git commit -m "feat: Implement feature X"

# Mark strand as completed
uv run python cli/bars-strand/bars_strand.py update feature-x --status completed

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

### API Configuration Issues

**Problem**: `API key not set` error

**Solution**:
```bash
# Set your API key environment variable
export ANTHROPIC_API_KEY=your-api-key-here

# Verify it's set
echo $ANTHROPIC_API_KEY

# Check configuration
uv run python cli/bars-strand/bars_strand.py config check
```

**Problem**: `No configuration found for provider`

**Solution**:
```bash
# Initialize configuration
uv run python cli/bars-strand/bars_strand.py config init

# Check configuration
uv run python cli/bars-strand/bars_strand.py config check
```

**Problem**: Wrong provider configured

**Solution**:
```bash
# Change provider
uv run python cli/bars-strand/bars_strand.py config set-provider anthropic

# Or edit .bars-strand.yml directly
vim .bars-strand.yml
```

### CLI Installation Issues

**Problem**: `ModuleNotFoundError: No module named 'click'`

**Solution**:
```bash
cd cli/bars-strand
uv pip install -r requirements.txt
```

**Problem**: `Permission denied` when running bars-strand

**Solution**:
```bash
chmod +x cli/bars-strand/bars_strand.py
```

### Strand Not Found

**Problem**: `Error: Strand 'my-feature' not found`

**Solution**:
- Verify strand exists: `uv run python cli/bars-strand/bars_strand.py list`
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
uv run python cli/bars-strand/bars_strand.py list \
  --status active --type feature --json | jq -r '.[].name'
```

**Auto-create strand from branch**:
```bash
#!/bin/bash
BRANCH=$(git branch --show-current)
if [[ $BRANCH == feature/* ]]; then
  STRAND_NAME=${BRANCH#feature/}
  uv run python cli/bars-strand/bars_strand.py create "$STRAND_NAME" \
    --description "Branch: $BRANCH" \
    --type feature \
    --status active
fi
```

### JSON API

All commands support `--json` flag for structured output:

```bash
# Create strand and capture output
OUTPUT=$(uv run python cli/bars-strand/bars_strand.py create my-feature \
  --description "..." --json)
STRAND_NAME=$(echo "$OUTPUT" | jq -r '.name')
CREATED_AT=$(echo "$OUTPUT" | jq -r '.created_at')

# List and filter with jq
uv run python cli/bars-strand/bars_strand.py list --json | \
  jq '.[] | select(.status == "active")'
```

---

## See Also

- [CLI README](../cli/bars-strand/README.md) - CLI-specific documentation
- [Plugin README](../.claude/plugins/bars-strand/README.md) - Plugin usage guide
- [GitHub Issue #21](https://github.com/johnair01/bars-engine/issues/21) - Implementation details
- [Example Configuration](.bars-strand.yml.example) - Configuration file template

---

*BARS Strand System - Version 1.1.0*
*Last Updated: 2026-03-26*
