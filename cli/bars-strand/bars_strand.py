#!/usr/bin/env python3
"""
BARS Strand CLI - Development-time strand management tool

This CLI tool provides strand management capabilities for bars-engine:
- Create, list, update, and delete strands
- Link strands to GitHub issues
- Configure fork-space boundaries
- Multi-provider API configuration
- JSON output for automation

Usage:
    bars-strand create <name> --description "..." --type feature
    bars-strand list [--status active] [--type feature]
    bars-strand show <name>
    bars-strand update <name> --status completed
    bars-strand delete <name>
    bars-strand link <name> <issue-url>
    bars-strand config --provider anthropic
    bars-strand config --check
"""

import click
import yaml
import json
import os
import builtins
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import sys


# Version
__version__ = "1.1.0"


# Strand data directory
STRANDS_DIR = Path(".strands")


# Config file
CONFIG_FILE = Path(".bars-strand.yml")


# Strand types
STRAND_TYPES = ["feature", "bugfix", "experiment", "research", "refactor", "docs"]


# Strand statuses
STRAND_STATUSES = ["active", "paused", "completed", "archived"]


# API providers
API_PROVIDERS = ["anthropic", "openai", "openai-compatible"]


class ConfigManager:
    """Manages API configuration for BARS Strand."""

    def __init__(self, config_path: Optional[Path] = None):
        """Initialize config manager.

        Args:
            config_path: Path to configuration file. If None, uses .bars-strand.yml
        """
        self.config_path = config_path or CONFIG_FILE
        self._config = None

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file.

        Returns:
            Configuration dictionary
        """
        if self._config is not None:
            return self._config

        if not self.config_path.exists():
            return self._default_config()

        with open(self.config_path) as f:
            config = yaml.safe_load(f) or {}

        # Expand environment variables
        config = self._expand_env_vars(config)

        self._config = config
        return config

    def save_config(self, config: Dict[str, Any]):
        """Save configuration to file.

        Args:
            config: Configuration dictionary
        """
        with open(self.config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)

        self._config = config

    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "api": {
                "default_provider": "anthropic",
                "anthropic": {
                    "api_key": "${ANTHROPIC_API_KEY}",
                    "model": "claude-sonnet-4-5-20250929-v1:0",
                    "max_tokens": 8192,
                    "temperature": 0.7,
                }
            },
            "defaults": {
                "type": "feature",
                "status": "active",
                "fork_space": {
                    "allowed_paths": ["src/", "tests/"],
                    "excluded_paths": ["**/__pycache__/", "*.pyc"],
                    "file_patterns": ["*.py", "*.md", "*.json"],
                }
            },
            "repository": {
                "root": ".",
                "strands_dir": ".strands",
            }
        }

    def _expand_env_vars(self, obj: Any) -> Any:
        """Recursively expand environment variables in config.

        Args:
            obj: Object to process (dict, list, str, or other)

        Returns:
            Object with environment variables expanded
        """
        if isinstance(obj, builtins.dict):
            return {k: self._expand_env_vars(v) for k, v in obj.items()}
        elif isinstance(obj, builtins.list):
            return [self._expand_env_vars(item) for item in obj]
        elif isinstance(obj, builtins.str) and obj.startswith("${") and obj.endswith("}"):
            env_var = obj[2:-1]
            return os.environ.get(env_var, obj)
        else:
            return obj

    def get_provider_config(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get configuration for a specific provider.

        Args:
            provider: Provider name. If None, uses default provider.

        Returns:
            Provider configuration dictionary
        """
        config = self.load_config()

        if provider is None:
            provider = config.get("api", {}).get("default_provider", "anthropic")

        provider_config = config.get("api", {}).get(provider, {})

        if not provider_config:
            raise ValueError(f"No configuration found for provider: {provider}")

        return provider_config

    def set_provider(self, provider: str):
        """Set the default provider.

        Args:
            provider: Provider name
        """
        if provider not in API_PROVIDERS:
            raise ValueError(f"Invalid provider: {provider}. Must be one of: {', '.join(API_PROVIDERS)}")

        config = self.load_config()

        if "api" not in config:
            config["api"] = {}

        config["api"]["default_provider"] = provider

        self.save_config(config)

    def check_config(self) -> Dict[str, Any]:
        """Check configuration for issues.

        Returns:
            Dictionary with check results
        """
        results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "info": [],
        }

        try:
            config = self.load_config()
        except Exception as e:
            results["valid"] = False
            results["errors"].append(f"Failed to load config: {e}")
            return results

        # Check for default provider
        default_provider = config.get("api", {}).get("default_provider")
        if not default_provider:
            results["errors"].append("No default provider set")
            results["valid"] = False
        else:
            results["info"].append(f"Default provider: {default_provider}")

        # Check provider configuration
        if default_provider:
            try:
                provider_config = self.get_provider_config()

                # Check for API key
                api_key = provider_config.get("api_key", "")
                if not api_key or api_key.startswith("${"):
                    env_var = api_key[2:-1] if api_key.startswith("${") else ""
                    results["errors"].append(
                        f"API key not set for {default_provider}. "
                        f"Set environment variable: {env_var or default_provider.upper() + '_API_KEY'}"
                    )
                    results["valid"] = False
                else:
                    results["info"].append(f"API key configured for {default_provider}")

                # Check for model
                model = provider_config.get("model")
                if not model:
                    results["warnings"].append(f"No model specified for {default_provider}")
                else:
                    results["info"].append(f"Model: {model}")

            except Exception as e:
                results["errors"].append(f"Provider config error: {e}")
                results["valid"] = False

        return results


class StrandManager:
    """Manages BARS Strands in the repository."""

    def __init__(self, repo_root: Optional[Path] = None, config_manager: Optional[ConfigManager] = None):
        """Initialize strand manager.

        Args:
            repo_root: Repository root directory. If None, uses current directory.
            config_manager: Configuration manager instance.
        """
        self.repo_root = repo_root or Path.cwd()
        self.config_manager = config_manager or ConfigManager()
        self.strands_dir = self.repo_root / STRANDS_DIR

    def ensure_strands_dir(self):
        """Ensure .strands directory exists."""
        self.strands_dir.mkdir(parents=True, exist_ok=True)

        # Create .gitignore if it doesn't exist
        gitignore = self.strands_dir / ".gitignore"
        if not gitignore.exists():
            gitignore.write_text("*.yaml\n")

    def get_strand_file(self, name: str) -> Path:
        """Get path to strand configuration file."""
        return self.strands_dir / f"{name}.yaml"

    def strand_exists(self, name: str) -> bool:
        """Check if strand exists."""
        return self.get_strand_file(name).exists()

    def load_strand(self, name: str) -> Dict[str, Any]:
        """Load strand configuration."""
        strand_file = self.get_strand_file(name)
        if not strand_file.exists():
            raise FileNotFoundError(f"Strand '{name}' not found")

        with open(strand_file) as f:
            return yaml.safe_load(f)

    def save_strand(self, name: str, config: Dict[str, Any]):
        """Save strand configuration."""
        self.ensure_strands_dir()
        strand_file = self.get_strand_file(name)

        with open(strand_file, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)

    def create_strand(
        self,
        name: str,
        description: str,
        strand_type: str = "feature",
        status: str = "active",
        fork_space: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new strand.

        Args:
            name: Strand identifier
            description: Human-readable description
            strand_type: Type of strand (feature, bugfix, experiment, etc.)
            status: Initial status (active, paused, completed, archived)
            fork_space: Fork-space configuration

        Returns:
            Strand configuration dictionary
        """
        if self.strand_exists(name):
            raise ValueError(f"Strand '{name}' already exists")

        if strand_type not in STRAND_TYPES:
            raise ValueError(f"Invalid strand type: {strand_type}")

        if status not in STRAND_STATUSES:
            raise ValueError(f"Invalid status: {status}")

        # Get defaults from config
        app_config = self.config_manager.load_config()
        defaults = app_config.get("defaults", {})

        config = {
            "name": name,
            "description": description,
            "type": strand_type,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "fork_space": fork_space or defaults.get("fork_space", {
                "allowed_paths": ["src/", "tests/"],
                "excluded_paths": ["**/__pycache__/", "*.pyc"],
                "file_patterns": ["*.py", "*.md", "*.json"],
            }),
            "linked_issues": [],
            "metadata": {}
        }

        self.save_strand(name, config)
        return config

    def list_strands(
        self,
        status_filter: Optional[str] = None,
        type_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all strands with optional filtering.

        Args:
            status_filter: Filter by status
            type_filter: Filter by type

        Returns:
            List of strand configurations
        """
        if not self.strands_dir.exists():
            return []

        strands = []
        for strand_file in self.strands_dir.glob("*.yaml"):
            try:
                with open(strand_file) as f:
                    config = yaml.safe_load(f)

                # Apply filters
                if status_filter and config.get("status") != status_filter:
                    continue
                if type_filter and config.get("type") != type_filter:
                    continue

                strands.append(config)
            except Exception as e:
                click.echo(f"Warning: Failed to load {strand_file}: {e}", err=True)

        return sorted(strands, key=lambda s: s.get("created_at", ""), reverse=True)

    def update_strand(
        self,
        name: str,
        status: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Update strand configuration.

        Args:
            name: Strand identifier
            status: New status
            description: New description
            metadata: Additional metadata to merge

        Returns:
            Updated strand configuration
        """
        config = self.load_strand(name)

        if status:
            if status not in STRAND_STATUSES:
                raise ValueError(f"Invalid status: {status}")
            config["status"] = status

        if description:
            config["description"] = description

        if metadata:
            if "metadata" not in config:
                config["metadata"] = {}
            config["metadata"].update(metadata)

        config["updated_at"] = datetime.now(timezone.utc).isoformat()

        self.save_strand(name, config)
        return config

    def delete_strand(self, name: str):
        """Delete a strand.

        Args:
            name: Strand identifier
        """
        strand_file = self.get_strand_file(name)
        if not strand_file.exists():
            raise FileNotFoundError(f"Strand '{name}' not found")

        strand_file.unlink()

    def link_issue(self, name: str, issue_url: str) -> Dict[str, Any]:
        """Link strand to a GitHub issue.

        Args:
            name: Strand identifier
            issue_url: GitHub issue URL

        Returns:
            Updated strand configuration
        """
        config = self.load_strand(name)

        if "linked_issues" not in config:
            config["linked_issues"] = []

        if issue_url not in config["linked_issues"]:
            config["linked_issues"].append(issue_url)

        config["updated_at"] = datetime.now(timezone.utc).isoformat()

        self.save_strand(name, config)
        return config


@click.group()
@click.version_option(version=__version__)
@click.option('--repo-root', type=click.Path(exists=True, file_okay=False), help="Repository root directory")
@click.option('--config', 'config_path', type=click.Path(), help="Configuration file path")
@click.pass_context
def cli(ctx, repo_root, config_path):
    """BARS Strand CLI - Development-time strand management tool"""
    ctx.ensure_object(dict)

    config_manager = ConfigManager(Path(config_path) if config_path else None)
    ctx.obj['config_manager'] = config_manager
    ctx.obj['manager'] = StrandManager(
        Path(repo_root) if repo_root else None,
        config_manager
    )


@cli.command()
@click.argument('name')
@click.option('--description', required=True, help="Strand description")
@click.option('--type', 'strand_type', type=click.Choice(STRAND_TYPES), default='feature', help="Strand type")
@click.option('--status', type=click.Choice(STRAND_STATUSES), default='active', help="Initial status")
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def create(ctx, name, description, strand_type, status, output_json):
    """Create a new strand"""
    manager = ctx.obj['manager']

    try:
        config = manager.create_strand(name, description, strand_type, status)

        if output_json:
            click.echo(json.dumps(config, indent=2))
        else:
            click.echo(f"✓ Created strand: {name}")
            click.echo(f"  Type: {strand_type}")
            click.echo(f"  Status: {status}")
            click.echo(f"  Description: {description}")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--status', type=click.Choice(STRAND_STATUSES), help="Filter by status")
@click.option('--type', 'strand_type', type=click.Choice(STRAND_TYPES), help="Filter by type")
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def list(ctx, status, strand_type, output_json):
    """List all strands"""
    manager = ctx.obj['manager']

    try:
        strands = manager.list_strands(status, strand_type)

        if output_json:
            click.echo(json.dumps(strands, indent=2))
        else:
            if not strands:
                click.echo("No strands found")
                return

            click.echo(f"Found {len(strands)} strand(s):\n")
            for strand in strands:
                click.echo(f"  {strand['name']} ({strand.get('status', 'unknown')})")
                click.echo(f"    Type: {strand.get('type', 'unknown')}")
                click.echo(f"    Description: {strand.get('description', 'N/A')}")
                if strand.get('linked_issues'):
                    click.echo(f"    Issues: {', '.join(strand['linked_issues'])}")
                click.echo()

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('name')
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def show(ctx, name, output_json):
    """Show detailed strand information"""
    manager = ctx.obj['manager']

    try:
        config = manager.load_strand(name)

        if output_json:
            click.echo(json.dumps(config, indent=2))
        else:
            click.echo(f"Strand: {config['name']}")
            click.echo(f"  Type: {config.get('type', 'unknown')}")
            click.echo(f"  Status: {config.get('status', 'unknown')}")
            click.echo(f"  Description: {config.get('description', 'N/A')}")
            click.echo(f"  Created: {config.get('created_at', 'N/A')}")
            click.echo(f"  Updated: {config.get('updated_at', 'N/A')}")

            if config.get('linked_issues'):
                click.echo(f"  Linked issues:")
                for issue in config['linked_issues']:
                    click.echo(f"    - {issue}")

            if config.get('fork_space'):
                click.echo(f"  Fork-space:")
                fork_space = config['fork_space']
                if fork_space.get('allowed_paths'):
                    click.echo(f"    Allowed paths: {', '.join(fork_space['allowed_paths'])}")
                if fork_space.get('file_patterns'):
                    click.echo(f"    File patterns: {', '.join(fork_space['file_patterns'])}")

    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('name')
@click.option('--status', type=click.Choice(STRAND_STATUSES), help="Update status")
@click.option('--description', help="Update description")
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def update(ctx, name, status, description, output_json):
    """Update strand properties"""
    manager = ctx.obj['manager']

    try:
        config = manager.update_strand(name, status, description)

        if output_json:
            click.echo(json.dumps(config, indent=2))
        else:
            click.echo(f"✓ Updated strand: {name}")
            if status:
                click.echo(f"  Status: {status}")
            if description:
                click.echo(f"  Description: {description}")

    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('name')
@click.confirmation_option(prompt="Are you sure you want to delete this strand?")
@click.pass_context
def delete(ctx, name):
    """Delete a strand"""
    manager = ctx.obj['manager']

    try:
        manager.delete_strand(name)
        click.echo(f"✓ Deleted strand: {name}")

    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('name')
@click.argument('issue_url')
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def link(ctx, name, issue_url, output_json):
    """Link strand to a GitHub issue"""
    manager = ctx.obj['manager']

    try:
        config = manager.link_issue(name, issue_url)

        if output_json:
            click.echo(json.dumps(config, indent=2))
        else:
            click.echo(f"✓ Linked strand '{name}' to issue:")
            click.echo(f"  {issue_url}")

    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.group()
def config():
    """Manage API configuration"""
    pass


@config.command('init')
@click.pass_context
def config_init(ctx):
    """Initialize configuration file"""
    config_manager = ctx.obj['config_manager']

    if config_manager.config_path.exists():
        if not click.confirm(f"Configuration file {config_manager.config_path} already exists. Overwrite?"):
            click.echo("Aborted.")
            return

    config = config_manager._default_config()
    config_manager.save_config(config)

    click.echo(f"✓ Created configuration file: {config_manager.config_path}")
    click.echo("\nNext steps:")
    click.echo("  1. Set your API key environment variable:")
    click.echo("     export ANTHROPIC_API_KEY=your-api-key")
    click.echo("  2. Verify configuration:")
    click.echo("     bars-strand config check")


@config.command('check')
@click.pass_context
def config_check(ctx):
    """Check configuration for issues"""
    config_manager = ctx.obj['config_manager']

    results = config_manager.check_config()

    # Print info messages
    if results["info"]:
        click.echo("Configuration:")
        for info in results["info"]:
            click.echo(f"  ℹ {info}")
        click.echo()

    # Print warnings
    if results["warnings"]:
        click.echo(click.style("Warnings:", fg='yellow'))
        for warning in results["warnings"]:
            click.echo(click.style(f"  ⚠ {warning}", fg='yellow'))
        click.echo()

    # Print errors
    if results["errors"]:
        click.echo(click.style("Errors:", fg='red'))
        for error in results["errors"]:
            click.echo(click.style(f"  ✗ {error}", fg='red'))
        click.echo()

    # Print status
    if results["valid"]:
        click.echo(click.style("✓ Configuration is valid", fg='green'))
    else:
        click.echo(click.style("✗ Configuration has errors", fg='red'))
        sys.exit(1)


@config.command('set-provider')
@click.argument('provider', type=click.Choice(API_PROVIDERS))
@click.pass_context
def config_set_provider(ctx, provider):
    """Set the default API provider"""
    config_manager = ctx.obj['config_manager']

    try:
        config_manager.set_provider(provider)
        click.echo(f"✓ Set default provider to: {provider}")

        # Check if provider is configured
        results = config_manager.check_config()
        if not results["valid"]:
            click.echo(click.style("\n⚠ Provider configuration has issues:", fg='yellow'))
            for error in results["errors"]:
                click.echo(click.style(f"  {error}", fg='yellow'))

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@config.command('show')
@click.option('--json', 'output_json', is_flag=True, help="Output JSON")
@click.pass_context
def config_show(ctx, output_json):
    """Show current configuration"""
    config_manager = ctx.obj['config_manager']

    try:
        config = config_manager.load_config()

        if output_json:
            click.echo(json.dumps(config, indent=2))
        else:
            # Redact API keys
            config_display = config.copy()
            if "api" in config_display:
                for provider_config in config_display["api"].values():
                    if isinstance(provider_config, dict) and "api_key" in provider_config:
                        api_key = provider_config["api_key"]
                        if api_key and not api_key.startswith("${"):
                            provider_config["api_key"] = api_key[:8] + "..." if len(api_key) > 8 else "***"

            click.echo(yaml.dump(config_display, default_flow_style=False, sort_keys=False))

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli(obj={})
