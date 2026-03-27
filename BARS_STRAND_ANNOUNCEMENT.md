# 🎉 BARS Strand System - Now Production Ready!

The BARS Strand system is ready for team use! Strands help you track development work with isolated contexts, GitHub issue linking, and status management.

## What Are Strands?

**Strands** are isolated work contexts that track your development tasks:
- **Fork-space boundaries** - Define which files you're working in
- **GitHub issue linking** - Connect work to issue tracking
- **Status tracking** - active → paused → completed → archived
- **Natural language interface** - Use Claude Desktop to manage strands

Think of them as lightweight feature branches with metadata.

## 5-Minute Setup

```bash
# 1. Install dependencies
cd ~/code/bars-engine
uv pip install -r cli/bars-strand/requirements.txt

# 2. Initialize configuration
uv run python cli/bars-strand/bars_strand.py config init

# 3. Set your API key
export ANTHROPIC_API_KEY=your-api-key-here
echo 'export ANTHROPIC_API_KEY=your-api-key-here' >> ~/.zshrc

# 4. Verify setup
uv run python cli/bars-strand/bars_strand.py config check

# 5. Create your first strand
uv run python cli/bars-strand/bars_strand.py create my-feature \
  --description "Implement user authentication" \
  --type feature

# Done! 🎊
```

## What's New in v1.1.0

### Multi-Provider API Support
Work with your preferred AI provider:
- **Anthropic (Claude)** - Default, recommended
- **OpenAI (GPT)** - Alternative commercial provider
- **Budget Models** - DeepSeek ($0.10/1M), Qwen ($0.05-0.10/1M), self-hosted

### Configuration Management
New commands make setup easy:
```bash
bars-strand config init        # Create config file
bars-strand config check       # Validate setup
bars-strand config set-provider openai  # Change provider
```

### Better Error Messages
Clear guidance when something's wrong:
```
Error: API key not set for anthropic
Set environment variable: ANTHROPIC_API_KEY
```

### Proactive Claude Suggestions
Claude now suggests creating strands when you start new work!

### Comprehensive Documentation
- Quick Start guide (you're reading it!)
- API configuration for all providers
- Budget model examples with costs
- Enhanced troubleshooting

## Quick Commands

```bash
# Create strand
uv run python cli/bars-strand/bars_strand.py create <name> \
  --description "..." --type feature

# List active work
uv run python cli/bars-strand/bars_strand.py list --status active

# Show details
uv run python cli/bars-strand/bars_strand.py show <name>

# Mark completed
uv run python cli/bars-strand/bars_strand.py update <name> --status completed

# Link to issue
uv run python cli/bars-strand/bars_strand.py link <name> \
  https://github.com/johnair01/bars-engine/issues/123
```

## Claude Desktop Integration

Talk to Claude naturally:

```
Create a strand called "user-auth" for implementing authentication as a feature
List all active strands
Show me details about user-auth
Mark user-auth as completed
Link user-auth to https://github.com/johnair01/bars-engine/issues/21
```

Restart Claude Desktop after setup to enable the plugin.

## Example Workflow

```bash
# 1. Create strand
uv run python cli/bars-strand/bars_strand.py create fix-validation \
  --description "Fix signup form validation" --type bugfix

# 2. Link to GitHub issue
uv run python cli/bars-strand/bars_strand.py link fix-validation \
  https://github.com/johnair01/bars-engine/issues/42

# 3. Create git branch
git checkout -b fix-validation

# 4. Do your work
git add .
git commit -m "fix: Validation errors in signup form"

# 5. Mark completed
uv run python cli/bars-strand/bars_strand.py update fix-validation --status completed

# 6. Merge
git checkout main
git merge fix-validation
```

## API Provider Options

### Anthropic (Default)
```bash
export ANTHROPIC_API_KEY=your-api-key
```
**Get key**: https://console.anthropic.com/

### OpenAI
```bash
export OPENAI_API_KEY=your-api-key
uv run python cli/bars-strand/bars_strand.py config set-provider openai
```
**Get key**: https://platform.openai.com/api-keys

### Budget Models (Optional)

Save money with budget-friendly models:

**DeepSeek-V3** ($0.10/1M tokens):
```yaml
# Edit .bars-strand.yml
openai_compatible:
  api_key: ${DEEPSEEK_API_KEY}
  base_url: https://api.deepseek.com/v1
  model: deepseek-chat
```

**Qwen2.5-Coder-32B** via Together AI ($0.05-0.10/1M):
```yaml
# Edit .bars-strand.yml
openai_compatible:
  api_key: ${TOGETHER_API_KEY}
  base_url: https://api.together.xyz/v1
  model: Qwen/Qwen2.5-Coder-32B-Instruct
```

See `.bars-strand.yml.example` for more options.

## Strand Types

Choose the right type for your work:
- `feature` - New functionality
- `bugfix` - Fix existing issues
- `experiment` - Proof-of-concept
- `research` - Investigation
- `refactor` - Code improvement
- `docs` - Documentation

## Documentation

- **Quick Reference**: `BARS_STRAND_QUICK_REFERENCE.md`
- **Full Guide**: `docs/BARS_STRAND_GUIDE.md`
- **Config Example**: `.bars-strand.yml.example`
- **Plugin README**: `.claude/plugins/bars-strand/README.md`

## Troubleshooting

### "API key not set" error
```bash
export ANTHROPIC_API_KEY=your-api-key-here
uv run python cli/bars-strand/bars_strand.py config check
```

### "ModuleNotFoundError: No module named 'click'"
```bash
cd cli/bars-strand
uv pip install -r requirements.txt
```

### Plugin not loading in Claude Desktop
1. Verify: `jq . .claude/plugins/bars-strand/plugin.json`
2. Restart Claude Desktop completely

### Need help?
- Check: `docs/BARS_STRAND_GUIDE.md` (Troubleshooting section)
- Ask in: [team channel]
- File issue: https://github.com/johnair01/bars-engine/issues

## Why Use Strands?

✅ **Context isolation** - Clear boundaries for your work
✅ **Traceability** - Link work to GitHub issues
✅ **Status tracking** - Know what's active, paused, or done
✅ **Team visibility** - Everyone sees what's in progress
✅ **Natural language** - Manage via Claude Desktop
✅ **Budget-friendly** - Use affordable AI providers

## Get Started Now

```bash
# 5-minute setup (seriously!)
cd ~/code/bars-engine
uv pip install -r cli/bars-strand/requirements.txt
uv run python cli/bars-strand/bars_strand.py config init
export ANTHROPIC_API_KEY=your-api-key-here
uv run python cli/bars-strand/bars_strand.py config check

# Create your first strand
uv run python cli/bars-strand/bars_strand.py create my-first-strand \
  --description "Learning the strand system" --type experiment

# You're ready! 🚀
```

## Questions?

- 📖 **Read the guide**: `docs/BARS_STRAND_GUIDE.md`
- 🔍 **Check examples**: `.bars-strand.yml.example`
- 💬 **Ask for help**: [team channel]
- 🐛 **Report issues**: GitHub issue #21

---

**Version**: 1.1.0
**Status**: ✅ Production Ready
**Closes**: GitHub Issue #21

Happy coding! 🎉
