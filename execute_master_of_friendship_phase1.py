#!/usr/bin/env python3
"""
Execute Master of Friendship Phase 1: Schema Migration & DeckLibrary.

This script composes and executes a multi-agent investigation using the DODO
strand system.

Usage:
    uv run python execute_master_of_friendship_phase1.py
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
    print("  cd ~/code/claude")
    print("  git checkout local-mcp")
    sys.exit(1)


async def main() -> None:
    """Compose and execute the Master of Friendship Phase 1 strand."""

    # Load seed
    seed_path = Path(__file__).parent / "strand-results" / "seeds" / "SEED_master-of-friendship-phase1.yaml"
    print(f"📖 Loading seed from {seed_path}")

    with open(seed_path) as f:
        import yaml
        seed = yaml.safe_load(f)

    print("\n🎴 Master of Friendship - Phase 1: Schema Migration")
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
        'working_directory': str(Path.cwd())
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
    result_dir = Path.cwd() / "strand-results" / "active"
    result_dir.mkdir(exist_ok=True, parents=True)

    result_file = result_dir / f"STRAND_master-of-friendship-phase1_{result.strand_id}.json"

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
    print(f"   Total duration: {result.total_duration_seconds:.1f}s")

    # Print synthesis
    if result.synthesis:
        print("\n🎯 Synthesis:")
        print(f"   {result.synthesis[:500]}...")

    # Check for deliverables
    if hasattr(result, 'artifacts') and result.artifacts:
        print(f"\n📦 Deliverables generated: {len(result.artifacts)}")
        for artifact in result.artifacts[:5]:
            print(f"  - {artifact}")

    print("\n✨ Next steps:")
    print("  1. Review the results JSON for detailed findings")
    print("  2. Verify Prisma schema changes in prisma/schema.prisma")
    print("  3. Review migration script in prisma/migrations/")
    print("  4. Run `npx prisma validate` to verify schema")
    print("  5. Test migration on dev database")
    print("  6. Proceed to Phase 2: Deck seeding")


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
