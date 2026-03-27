# BARS Strand Plugin for Claude Desktop

Claude Desktop plugin for managing BARS Strands through natural language.

## Features

- Create strands with natural language
- List and filter strands by status or type
- Update strand status and metadata
- Link strands to GitHub issues
- Check API configuration
- All operations wrapped around the bars-strand CLI tool

## Quick Setup

### 1. Install CLI Dependencies

```bash
cd ~/code/bars-engine
uv pip install -r cli/bars-strand/requirements.txt
```

### 2. Configure API Access

```bash
# Initialize configuration
uv run python cli/bars-strand/bars_strand.py config init

# Set your API key (choose one)
export ANTHROPIC_API_KEY=your-api-key-here
# OR
export OPENAI_API_KEY=your-api-key-here

# Add to shell profile for persistence
echo 'export ANTHROPIC_API_KEY=your-api-key-here' >> ~/.zshrc
```

### 3. Verify Setup

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

### 4. Restart Claude Desktop

The plugin will automatically load from `.claude/plugins/bars-strand/`.

## Available Skills

### create-strand

Create a new strand with a name, description, and type.

**Examples**:
```
Create a strand called "user-auth" for implementing user authentication as a feature

Create a bugfix strand named "fix-validation" to fix validation errors in the signup form

Create an experiment strand called "perf-test" to test new caching approach
```

**Parameters**:
- `name`: Unique identifier (lowercase-with-hyphens)
- `description`: What this strand is for
- `type`: feature, bugfix, experiment, research, refactor, docs (default: feature)

### list-strands

List all strands, optionally filtered by status or type.

**Examples**:
```
List all active strands
Show me all feature strands
What strands are currently paused?
List completed bugfixes
Show all strands
```

**Filters**:
- `status`: active, paused, completed, archived
- `type`: feature, bugfix, experiment, research, refactor, docs

### show-strand

Show detailed information about a specific strand.

**Examples**:
```
Show me details about the user-auth strand
What's the status of the perf-test strand?
Tell me about the fix-validation strand
```

### update-strand

Update strand status or description.

**Examples**:
```
Mark the user-auth strand as completed
Pause the perf-test strand
Update the description of user-auth to "Complete user authentication system with OAuth2"
Set user-auth to active status
```

**Updates**:
- `status`: active, paused, completed, archived
- `description`: New description text

### link-strand-to-issue

Link a strand to a GitHub issue for traceability.

**Examples**:
```
Link the user-auth strand to https://github.com/johnair01/bars-engine/issues/21
Connect fix-validation to issue https://github.com/johnair01/bars-engine/issues/42
```

### delete-strand

Permanently delete a strand.

**Examples**:
```
Delete the user-auth strand
Remove the test-strand strand
```

**Warning**: This action is permanent and cannot be undone.

### check-strand-config

Check the BARS Strand configuration for issues.

**Examples**:
```
Check the strand configuration
Verify my strand setup
Is the strand system configured correctly?
```

## Troubleshooting

### Plugin Not Loading

**Problem**: Skills don't appear in Claude Desktop

**Solution**:
1. Verify plugin.json is valid: `jq . .claude/plugins/bars-strand/plugin.json`
2. Restart Claude Desktop completely (quit and reopen)
3. Check Claude Desktop logs for errors

### API Configuration Errors

**Problem**: Commands fail with "API key not set" error

**Solution**:
```bash
# Set your API key
export ANTHROPIC_API_KEY=your-api-key-here

# Check configuration
uv run python cli/bars-strand/bars_strand.py config check

# If issues persist, reinitialize
uv run python cli/bars-strand/bars_strand.py config init
```

**Problem**: "No configuration found for provider"

**Solution**:
```bash
# Initialize configuration
uv run python cli/bars-strand/bars_strand.py config init

# Set API key
export ANTHROPIC_API_KEY=your-api-key-here

# Verify
uv run python cli/bars-strand/bars_strand.py config check
```

### CLI Commands Failing

**Problem**: Commands fail with import errors

**Solution**:
```bash
# Install dependencies
cd cli/bars-strand
uv pip install -r requirements.txt

# Verify installation
uv run python bars_strand.py --version
```

**Problem**: Permission denied errors

**Solution**:
```bash
chmod +x cli/bars-strand/bars_strand.py
```

## API Provider Configuration

The BARS Strand system supports multiple API providers:

### Anthropic (Default)

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

Get your key: https://console.anthropic.com/

### OpenAI

```bash
# Set API key
export OPENAI_API_KEY=your-api-key-here

# Change provider
uv run python cli/bars-strand/bars_strand.py config set-provider openai
```

Get your key: https://platform.openai.com/api-keys

### Budget Models (DeepSeek, Qwen, etc.)

For cost-effective models via Together AI, DeepSeek, or self-hosted:

```bash
# Edit .bars-strand.yml to configure provider
# See .bars-strand.yml.example for examples

export OPENAI_COMPATIBLE_API_KEY=your-api-key-here
uv run python cli/bars-strand/bars_strand.py config set-provider openai_compatible
```

See the [BARS Strand Guide](../../docs/BARS_STRAND_GUIDE.md) for complete configuration examples.

## Architecture

This plugin wraps the `bars-strand` CLI tool via subprocess execution. All strand data is managed by the CLI tool and stored in `.strands/` directory as YAML files.

The plugin acts as a natural language interface, translating conversational requests into CLI commands.

**Data Flow**:
```
Claude Desktop Plugin
        ↓
Natural Language Request
        ↓
CLI Command Translation
        ↓
bars_strand.py Execution
        ↓
Strand YAML Files (.strands/)
```

## See Also

- [BARS Strand CLI](../../cli/bars-strand/README.md) - CLI-specific documentation
- [BARS Strand Guide](../../docs/BARS_STRAND_GUIDE.md) - Complete user guide
- [GitHub Issue #21](https://github.com/johnair01/bars-engine/issues/21) - Implementation details
- [Configuration Example](../../.bars-strand.yml.example) - Configuration file template

---

*BARS Strand Plugin - Version 1.1.0*
*Last Updated: 2026-03-26*
