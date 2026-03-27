# BARS Strand CLI

Command-line interface for managing BARS Strands in bars-engine.

## Installation

**Requirements**: Python 3.12+ and uv

```bash
cd ~/code/bars-engine

# Create virtual environment with Python 3.12
uv venv .venv --python 3.12

# Install dependencies
uv pip install -r cli/bars-strand/requirements.txt

# Make executable
chmod +x cli/bars-strand/bars_strand.py
```

## Usage

### Create a strand

```bash
uv run python cli/bars-strand/bars_strand.py create my-feature --description "Implement user authentication" --type feature
```

### List strands

```bash
# List all strands
uv run python cli/bars-strand/bars_strand.pylist

# Filter by status
uv run python cli/bars-strand/bars_strand.pylist --status active

# Filter by type
uv run python cli/bars-strand/bars_strand.pylist --type feature

# JSON output
uv run python cli/bars-strand/bars_strand.pylist --json
```

### Show strand details

```bash
uv run python cli/bars-strand/bars_strand.pyshow my-feature
```

### Update strand

```bash
# Update status
uv run python cli/bars-strand/bars_strand.pyupdate my-feature --status completed

# Update description
uv run python cli/bars-strand/bars_strand.pyupdate my-feature --description "Updated description"
```

### Link to GitHub issue

```bash
uv run python cli/bars-strand/bars_strand.pylink my-feature https://github.com/johnair01/bars-engine/issues/21
```

### Delete strand

```bash
uv run python cli/bars-strand/bars_strand.pydelete my-feature
```

## Strand Types

- `feature` - New feature development
- `bugfix` - Bug fixes
- `experiment` - Experimental work
- `research` - Research and investigation
- `refactor` - Code refactoring
- `docs` - Documentation work

## Strand Statuses

- `active` - Currently being worked on
- `paused` - Temporarily paused
- `completed` - Work completed
- `archived` - Archived for reference

## Fork-Space Configuration

Each strand includes a fork-space configuration that defines file access boundaries:

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

## Data Storage

Strands are stored as YAML files in `.strands/` directory at the repository root.

## See Also

- [BARS Strand Guide](../../docs/BARS_STRAND_GUIDE.md) - Complete user guide
- [GitHub Issue #21](https://github.com/johnair01/bars-engine/issues/21) - Implementation details
