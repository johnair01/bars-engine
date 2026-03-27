#!/usr/bin/env python3
"""
Execute deep linking provenance system design strand.

This script composes and executes a multi-agent investigation using the DODO
strand system from code/claude local-mcp branch.

Usage:
    uv run python execute_deep_linking_strand.py
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
    """Compose and execute the deep linking strand."""

    # Load seed
    seed_path = Path(__file__).parent / "SEED_deep_linking_provenance_system.yaml"
    print(f"📖 Loading seed from {seed_path}")

    with open(seed_path) as f:
        import yaml
        seed = yaml.safe_load(f)

    print("\n🎭 Problem statement:")
    print(f"   {seed['problem'].strip()[:200]}...")

    print("\n🎯 Goal:")
    print(f"   {seed['goal'].strip()[:200]}...")

    print("\n👥 Expected agents:")
    for agent in seed['agents']:
        print(f"  - {agent}")

    # Execute using compose_and_execute
    print("\n🚀 Composing and executing strand...")
    print("=" * 80)

    # Format problem with goal and deliverables in context
    full_context = seed.get('context', {})
    full_context['goal'] = seed['goal']
    full_context['requested_agents'] = seed['agents']  # Specify the agents we want
    full_context['expected_deliverables'] = seed.get('expected_deliverables', {})
    full_context['acceptance_criteria'] = seed.get('acceptance_criteria', {})
    full_context['working_directory'] = str(Path.cwd())

    result = await compose_and_execute(
        problem=f"{seed['problem']}\n\n**Required agents**: {', '.join(seed['agents'])}",
        context=full_context,
        force_adhoc=True,  # Use adhoc since we're specifying exact agents
    )

    # Save results
    result_dir = Path.cwd() / "strand-results"
    result_dir.mkdir(exist_ok=True)

    result_file = result_dir / f"STRAND_deep_linking_{result.strand_id}.json"

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

    # Check for artifacts
    if hasattr(result, 'artifacts') and result.artifacts:
        print(f"\n📦 Artifacts generated: {len(result.artifacts)}")
        for artifact in result.artifacts[:5]:
            print(f"  - {artifact}")

    print("\n✨ Next steps:")
    print("  1. Review the results JSON for detailed findings")
    print("  2. Check for generated artifacts and deliverables")
    print("  3. Use findings to populate the design document")
    print("  4. Continue with plan mode to finalize design")


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
