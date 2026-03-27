"""
Tests for BARS Strand CLI

Test coverage:
- Strand creation with various parameters
- Listing and filtering operations
- Status updates and metadata changes
- Issue linking functionality
- Error handling and edge cases
- JSON output validation
"""

import pytest
import json
import yaml
from pathlib import Path
from click.testing import CliRunner
import sys
import tempfile
import shutil

# Add CLI module to path
sys.path.insert(0, str(Path(__file__).parent.parent / "cli" / "bars-strand"))

from bars_strand import cli, StrandManager


@pytest.fixture
def temp_repo():
    """Create temporary repository for testing."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def runner():
    """Click CLI test runner."""
    return CliRunner()


@pytest.fixture
def manager(temp_repo):
    """Strand manager with temporary repository."""
    return StrandManager(temp_repo)


class TestStrandManager:
    """Test StrandManager class."""

    def test_create_strand(self, manager, temp_repo):
        """Test strand creation."""
        config = manager.create_strand(
            name="test-strand",
            description="Test description",
            strand_type="feature",
            status="active"
        )

        assert config["name"] == "test-strand"
        assert config["description"] == "Test description"
        assert config["type"] == "feature"
        assert config["status"] == "active"
        assert "created_at" in config
        assert "updated_at" in config

        # Verify file was created
        strand_file = temp_repo / ".strands" / "test-strand.yaml"
        assert strand_file.exists()

    def test_create_duplicate_strand(self, manager):
        """Test creating duplicate strand raises error."""
        manager.create_strand("test-strand", "Description")

        with pytest.raises(ValueError, match="already exists"):
            manager.create_strand("test-strand", "Description")

    def test_create_invalid_type(self, manager):
        """Test creating strand with invalid type."""
        with pytest.raises(ValueError, match="Invalid strand type"):
            manager.create_strand("test-strand", "Description", strand_type="invalid")

    def test_create_invalid_status(self, manager):
        """Test creating strand with invalid status."""
        with pytest.raises(ValueError, match="Invalid status"):
            manager.create_strand("test-strand", "Description", status="invalid")

    def test_list_strands_empty(self, manager):
        """Test listing strands when none exist."""
        strands = manager.list_strands()
        assert strands == []

    def test_list_strands(self, manager):
        """Test listing multiple strands."""
        manager.create_strand("strand-1", "Description 1", strand_type="feature")
        manager.create_strand("strand-2", "Description 2", strand_type="bugfix")
        manager.create_strand("strand-3", "Description 3", strand_type="feature", status="completed")

        strands = manager.list_strands()
        assert len(strands) == 3

    def test_list_strands_filter_status(self, manager):
        """Test filtering strands by status."""
        manager.create_strand("strand-1", "Description", status="active")
        manager.create_strand("strand-2", "Description", status="completed")

        active_strands = manager.list_strands(status_filter="active")
        assert len(active_strands) == 1
        assert active_strands[0]["name"] == "strand-1"

    def test_list_strands_filter_type(self, manager):
        """Test filtering strands by type."""
        manager.create_strand("strand-1", "Description", strand_type="feature")
        manager.create_strand("strand-2", "Description", strand_type="bugfix")

        feature_strands = manager.list_strands(type_filter="feature")
        assert len(feature_strands) == 1
        assert feature_strands[0]["name"] == "strand-1"

    def test_load_strand(self, manager):
        """Test loading strand configuration."""
        manager.create_strand("test-strand", "Description")
        config = manager.load_strand("test-strand")

        assert config["name"] == "test-strand"
        assert config["description"] == "Description"

    def test_load_nonexistent_strand(self, manager):
        """Test loading nonexistent strand raises error."""
        with pytest.raises(FileNotFoundError, match="not found"):
            manager.load_strand("nonexistent")

    def test_update_strand_status(self, manager):
        """Test updating strand status."""
        manager.create_strand("test-strand", "Description", status="active")
        config = manager.update_strand("test-strand", status="completed")

        assert config["status"] == "completed"
        assert "updated_at" in config

    def test_update_strand_description(self, manager):
        """Test updating strand description."""
        manager.create_strand("test-strand", "Original description")
        config = manager.update_strand("test-strand", description="Updated description")

        assert config["description"] == "Updated description"

    def test_update_strand_metadata(self, manager):
        """Test updating strand metadata."""
        manager.create_strand("test-strand", "Description")
        config = manager.update_strand("test-strand", metadata={"key": "value"})

        assert config["metadata"]["key"] == "value"

    def test_update_nonexistent_strand(self, manager):
        """Test updating nonexistent strand raises error."""
        with pytest.raises(FileNotFoundError, match="not found"):
            manager.update_strand("nonexistent", status="completed")

    def test_delete_strand(self, manager, temp_repo):
        """Test deleting strand."""
        manager.create_strand("test-strand", "Description")
        strand_file = temp_repo / ".strands" / "test-strand.yaml"
        assert strand_file.exists()

        manager.delete_strand("test-strand")
        assert not strand_file.exists()

    def test_delete_nonexistent_strand(self, manager):
        """Test deleting nonexistent strand raises error."""
        with pytest.raises(FileNotFoundError, match="not found"):
            manager.delete_strand("nonexistent")

    def test_link_issue(self, manager):
        """Test linking strand to GitHub issue."""
        manager.create_strand("test-strand", "Description")
        config = manager.link_issue("test-strand", "https://github.com/org/repo/issues/1")

        assert "https://github.com/org/repo/issues/1" in config["linked_issues"]

    def test_link_issue_duplicate(self, manager):
        """Test linking same issue twice doesn't duplicate."""
        manager.create_strand("test-strand", "Description")
        manager.link_issue("test-strand", "https://github.com/org/repo/issues/1")
        config = manager.link_issue("test-strand", "https://github.com/org/repo/issues/1")

        assert len(config["linked_issues"]) == 1


class TestCLI:
    """Test CLI commands."""

    def test_version(self, runner):
        """Test version command."""
        result = runner.invoke(cli, ['--version'])
        assert result.exit_code == 0
        assert "version" in result.output.lower()

    def test_create_command(self, runner, temp_repo):
        """Test create command."""
        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'create', 'test-strand',
            '--description', 'Test description',
            '--type', 'feature'
        ])

        assert result.exit_code == 0
        assert "Created strand" in result.output

        # Verify strand was created
        strand_file = temp_repo / ".strands" / "test-strand.yaml"
        assert strand_file.exists()

    def test_create_command_json_output(self, runner, temp_repo):
        """Test create command with JSON output."""
        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'create', 'test-strand',
            '--description', 'Test description',
            '--json'
        ])

        assert result.exit_code == 0
        config = json.loads(result.output)
        assert config["name"] == "test-strand"
        assert config["description"] == "Test description"

    def test_list_command(self, runner, temp_repo):
        """Test list command."""
        # Create some strands
        manager = StrandManager(temp_repo)
        manager.create_strand("strand-1", "Description 1")
        manager.create_strand("strand-2", "Description 2")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'list'
        ])

        assert result.exit_code == 0
        assert "strand-1" in result.output
        assert "strand-2" in result.output

    def test_list_command_json_output(self, runner, temp_repo):
        """Test list command with JSON output."""
        manager = StrandManager(temp_repo)
        manager.create_strand("strand-1", "Description 1")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'list',
            '--json'
        ])

        assert result.exit_code == 0
        strands = json.loads(result.output)
        assert len(strands) == 1
        assert strands[0]["name"] == "strand-1"

    def test_list_command_with_filters(self, runner, temp_repo):
        """Test list command with filters."""
        manager = StrandManager(temp_repo)
        manager.create_strand("strand-1", "Description", status="active")
        manager.create_strand("strand-2", "Description", status="completed")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'list',
            '--status', 'active'
        ])

        assert result.exit_code == 0
        assert "strand-1" in result.output
        assert "strand-2" not in result.output

    def test_show_command(self, runner, temp_repo):
        """Test show command."""
        manager = StrandManager(temp_repo)
        manager.create_strand("test-strand", "Test description")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'show', 'test-strand'
        ])

        assert result.exit_code == 0
        assert "test-strand" in result.output
        assert "Test description" in result.output

    def test_show_command_json_output(self, runner, temp_repo):
        """Test show command with JSON output."""
        manager = StrandManager(temp_repo)
        manager.create_strand("test-strand", "Test description")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'show', 'test-strand',
            '--json'
        ])

        assert result.exit_code == 0
        config = json.loads(result.output)
        assert config["name"] == "test-strand"

    def test_update_command(self, runner, temp_repo):
        """Test update command."""
        manager = StrandManager(temp_repo)
        manager.create_strand("test-strand", "Description", status="active")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'update', 'test-strand',
            '--status', 'completed'
        ])

        assert result.exit_code == 0
        assert "Updated strand" in result.output

        # Verify update
        config = manager.load_strand("test-strand")
        assert config["status"] == "completed"

    def test_link_command(self, runner, temp_repo):
        """Test link command."""
        manager = StrandManager(temp_repo)
        manager.create_strand("test-strand", "Description")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'link', 'test-strand',
            'https://github.com/org/repo/issues/1'
        ])

        assert result.exit_code == 0
        assert "Linked strand" in result.output

        # Verify link
        config = manager.load_strand("test-strand")
        assert "https://github.com/org/repo/issues/1" in config["linked_issues"]

    def test_delete_command(self, runner, temp_repo):
        """Test delete command."""
        manager = StrandManager(temp_repo)
        manager.create_strand("test-strand", "Description")

        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'delete', 'test-strand'
        ], input='y\n')  # Confirm deletion

        assert result.exit_code == 0
        assert "Deleted strand" in result.output

        # Verify deletion
        assert not manager.strand_exists("test-strand")

    def test_error_handling_nonexistent_strand(self, runner, temp_repo):
        """Test error handling for nonexistent strand."""
        result = runner.invoke(cli, [
            '--repo-root', str(temp_repo),
            'show', 'nonexistent'
        ])

        assert result.exit_code == 1
        assert "not found" in result.output.lower()
