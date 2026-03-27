# BARS Strand Plugin for Claude Desktop

Claude Desktop plugin for managing BARS Strands through natural language.

## Features

- Create strands with natural language
- List and filter strands
- Update strand status and metadata
- Link strands to GitHub issues
- All operations wrapped around the bars-strand CLI tool

## Installation

The plugin is automatically loaded when located in `.claude/plugins/bars-strand/`.

Restart Claude Desktop after modifying plugin files.

## Available Skills

### create-strand

Create a new strand with a name, description, and type.

**Example**:
```
Create a strand called "user-auth" for implementing user authentication as a feature
```

### list-strands

List all strands, optionally filtered by status or type.

**Examples**:
```
List all active strands
Show me all feature strands
What strands are currently paused?
```

### show-strand

Show detailed information about a specific strand.

**Example**:
```
Show me details about the user-auth strand
```

### update-strand

Update strand status or description.

**Examples**:
```
Mark the user-auth strand as completed
Update the description of user-auth to "Complete user authentication system"
```

### link-strand-to-issue

Link a strand to a GitHub issue.

**Example**:
```
Link the user-auth strand to https://github.com/johnair01/bars-engine/issues/21
```

### delete-strand

Delete a strand.

**Example**:
```
Delete the user-auth strand
```

## Requirements

- bars-strand CLI tool installed (see `cli/bars-strand/README.md`)
- Python 3.7+ with dependencies (click, pyyaml, colorama)

## Architecture

This plugin wraps the `bars-strand` CLI tool via subprocess execution. All strand data is managed by the CLI tool and stored in `.strands/` directory.

The plugin acts as a convenience layer, translating natural language requests into CLI commands.

## Troubleshooting

### Plugin not loading

1. Verify plugin.json is valid JSON
2. Restart Claude Desktop
3. Check Claude Desktop logs for errors

### Commands failing

1. Verify bars-strand CLI is installed: `python cli/bars-strand/bars_strand.py --version`
2. Check CLI dependencies: `pip list | grep -E "(click|pyyaml|colorama)"`
3. Test CLI directly: `python cli/bars-strand/bars_strand.py list`

## See Also

- [BARS Strand CLI](../../cli/bars-strand/README.md)
- [BARS Strand Guide](../../docs/BARS_STRAND_GUIDE.md)
- [GitHub Issue #21](https://github.com/johnair01/bars-engine/issues/21)
