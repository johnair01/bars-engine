#!/usr/bin/env python3
"""
Execute Master of Friendship Phase 2: Code Audit & Query Migration.

This script composes and executes a multi-agent investigation using the DODO
strand system to audit codebase and plan query pattern updates.

Usage:
    cd ~/code/claude/he360-dodo
    uv run python ~/code/bars-engine/execute_master_of_friendship_phase2.py
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

# Add he360-dodo to path
DODO_PATH = Path.home() / "code" / "claude" / "he360-dodo"
sys.path.insert(0, str(DODO_PATH))

try:
    from he360_dodo.composition import compose_and_execute
except ImportError as e:
    print(f"Error: Cannot import DODO modules from {DODO_PATH}")
    print(f"Details: {e}")
    print("\nMake sure you're in the local-mcp branch:")
    print("  cd ~/code/claude/he360-dodo")
    print("  git checkout local-mcp")
    sys.exit(1)


async def main() -> None:
    """Compose and execute the Master of Friendship Phase 2 strand."""

    # Load seed
    seed_path = Path.home() / "code" / "bars-engine" / "strand-results" / "seeds" / "SEED_master-of-friendship-phase2.yaml"
    print(f"📖 Loading seed from {seed_path}")

    with open(seed_path) as f:
        import yaml
        seed = yaml.safe_load(f)

    print("\n🎴 Master of Friendship - Phase 2: Code Audit & Query Migration")
    print(f"   {seed['metadata']['description']}")

    print("\n❓ Problem:")
    print(f"   {seed['problem']['statement'][:200]}...")

    print("\n👥 Expected agents:")
    for agent_type, agents in seed['agents'].items():
        print(f"  {agent_type}:")
        for agent in agents:
            print(f"    - {agent}")

    # Execute using compose_and_execute
    print("\n🚀 Composing and executing strand...")
    print("=" * 80)

    # Format problem with context
    full_context = {
        'context': seed['problem']['context'],
        'constraints': seed['problem']['constraints'],
        'research_questions': seed.get('research_questions', []),
        'expected_outcomes': seed['expected_outcomes'],
        'files_to_modify': seed['files_to_modify'],
        'files_to_reference': seed['files_to_reference'],
        'implementation_phases': seed['implementation_phases'],
        'working_directory': str(Path.home() / "code" / "bars-engine")
    }

    # Specify requested agents
    requested_agents = seed['agents']['primary'] + seed['agents']['supporting']
    full_context['requested_agents'] = requested_agents

    result = await compose_and_execute(
        problem=seed['problem']['statement'],
        context=full_context,
        force_adhoc=True,  # Use adhoc since we're specifying exact agents
    )

    # Save results
    result_dir = Path.home() / "code" / "bars-engine" / "strand-results" / "active"
    result_dir.mkdir(exist_ok=True, parents=True)

    result_file = result_dir / f"STRAND_master-of-friendship-phase2_{result.strand_id}.json"

    # Convert Pydantic model to dict
    result_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()

    with open(result_file, "w") as f:
        json.dump(result_dict, f, indent=2, default=str)

    print("\n" + "=" * 80)
    print(f"\n✅ Strand execution complete!")
    print(f"\n📊 Results saved to: {result_file}")

    # Print summary
    print("\n📋 Summary:")
    print(f"   Strand ID: {result.strand_id}")
    print(f"   Status: {result.status}")

    # Print synthesis preview
    if hasattr(result, 'findings') and result.findings:
        print("\n🔍 Agent findings captured:")
        for agent_name in result.findings.keys():
            print(f"  ✓ {agent_name}")

    print("\n✨ Next steps:")
    print("  1. Review strand results JSON")
    print("  2. Examine code audit findings")
    print("  3. Review query pattern migration guide")
    print("  4. Execute code changes in Phase 3")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Strand execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Error executing strand: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
