# BARS Strand System - Quick Reference

**TL;DR**: Isolated work contexts with file boundaries, issue tracking, and status management.

## 5-Minute Setup

```bash
# Install
cd ~/code/bars-engine
uv pip install -r cli/bars-strand/requirements.txt

# Configure
uv run python cli/bars-strand/bars_strand.py config init
export ANTHROPIC_API_KEY=your-api-key-here
echo 'export ANTHROPIC_API_KEY=your-api-key-here' >> ~/.zshrc

# Verify
uv run python cli/bars-strand/bars_strand.py config check

# Create first strand
uv run python cli/bars-strand/bars_strand.py create my-feature \
  --description "Your work" --type feature
```

## Common Commands

```bash
# Create strand
uv run python cli/bars-strand/bars_strand.py create <name> \
  --description "..." --type feature

# List strands
uv run python cli/bars-strand/bars_strand.py list
uv run python cli/bars-strand/bars_strand.py list --status active
uv run python cli/bars-strand/bars_strand.py list --type bugfix

# Show details
uv run python cli/bars-strand/bars_strand.py show <name>

# Update status
uv run python cli/bars-strand/bars_strand.py update <name> --status completed

# Link to issue
uv run python cli/bars-strand/bars_strand.py link <name> \
  https://github.com/owner/repo/issues/123

# Delete
uv run python cli/bars-strand/bars_strand.py delete <name>
```

## Configuration Commands

```bash
# Initialize config
uv run python cli/bars-strand/bars_strand.py config init

# Check config
uv run python cli/bars-strand/bars_strand.py config check

# Change provider
uv run python cli/bars-strand/bars_strand.py config set-provider openai

# Show config
uv run python cli/bars-strand/bars_strand.py config show
```

## Strand Types

- `feature` - New functionality
- `bugfix` - Fix existing issues
- `experiment` - Proof-of-concept
- `research` - Investigation
- `refactor` - Code improvement
- `docs` - Documentation

## Strand Statuses

- `active` - Currently working
- `paused` - Blocked/waiting
- `completed` - Finished
- `archived` - Historical reference

## Claude Desktop Integration

Natural language commands:

```
Create a strand called "user-auth" for implementing authentication as a feature
List all active strands
Show me details about the user-auth strand
Mark user-auth as completed
Link user-auth to https://github.com/owner/repo/issues/21
Delete the test-strand strand
Check the strand configuration
```

## API Providers

### Anthropic (Default)
```bash
export ANTHROPIC_API_KEY=your-api-key
```
Get key: https://console.anthropic.com/

### OpenAI
```bash
export OPENAI_API_KEY=your-api-key
uv run python cli/bars-strand/bars_strand.py config set-provider openai
```
Get key: https://platform.openai.com/api-keys

### Budget Models
```bash
# Edit .bars-strand.yml for provider-specific settings
export OPENAI_COMPATIBLE_API_KEY=your-api-key
uv run python cli/bars-strand/bars_strand.py config set-provider openai_compatible
```

**Budget Options**:
- DeepSeek-V3: $0.10/1M tokens
- Qwen2.5-Coder-32B: $0.05-0.10/1M tokens (Together AI)
- Self-hosted: vLLM/SGLang

## Troubleshooting

**Missing API Key**:
```bash
export ANTHROPIC_API_KEY=your-api-key-here
uv run python cli/bars-strand/bars_strand.py config check
```

**Import Errors**:
```bash
cd cli/bars-strand
uv pip install -r requirements.txt
```

**Plugin Not Loading**:
- Verify: `jq . .claude/plugins/bars-strand/plugin.json`
- Restart Claude Desktop completely

**Config Issues**:
```bash
uv run python cli/bars-strand/bars_strand.py config init
```

## File Structure

```
.bars-strand.yml          # Configuration file
.strands/                 # Strand data directory
  ├── .gitignore         # Ignores *.yaml
  ├── my-feature.yaml    # Individual strand files
  └── my-bugfix.yaml
```

## JSON Output (Automation)

Add `--json` flag to any command:

```bash
uv run python cli/bars-strand/bars_strand.py list --json | jq '.[].name'
uv run python cli/bars-strand/bars_strand.py show my-feature --json | jq '.status'
```

## Best Practices

1. **Create strand before starting work**
2. **Link to GitHub issue immediately**
3. **Update status as work progresses**
4. **Use descriptive names** (lowercase-with-hyphens)
5. **Mark completed when merged**

## Documentation

- **Full Guide**: `docs/BARS_STRAND_GUIDE.md`
- **Config Example**: `.bars-strand.yml.example`
- **Plugin README**: `.claude/plugins/bars-strand/README.md`
- **GitHub Issue**: johnair01/bars-engine#21

## Example Workflow

```bash
# 1. Create strand
uv run python cli/bars-strand/bars_strand.py create fix-validation \
  --description "Fix signup form validation" --type bugfix

# 2. Link to issue
uv run python cli/bars-strand/bars_strand.py link fix-validation \
  https://github.com/johnair01/bars-engine/issues/42

# 3. Create git branch
git checkout -b fix-validation

# 4. Do work...
git add .
git commit -m "fix: Validation errors in signup form"

# 5. Mark completed
uv run python cli/bars-strand/bars_strand.py update fix-validation --status completed

# 6. Merge
git checkout main
git merge fix-validation
```

---

**Quick Help**: `uv run python cli/bars-strand/bars_strand.py --help`
**Version**: 1.1.0
