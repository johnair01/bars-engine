#!/usr/bin/env python3
"""
Execute implementation strand for BARS strand system (Issue #21).

This strand implements GitHub issue #21 through 5 phases:
1. Requirements Analysis & Architecture Design
2. CLI Implementation
3. Plugin Implementation
4. Integration & Testing
5. Final Synthesis & Validation

Deliverables:
- CLI tool (cli/bars-strand/)
- Claude plugin (.claude/plugins/bars-strand/)
- Tests (tests/test_bars_strand_cli.py)
- Documentation (docs/BARS_STRAND_GUIDE.md)
- Implementation summary (IMPLEMENTATION_SUMMARY.md)
"""

import asyncio
import json
import yaml
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime, UTC

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "claude" / "he360-dodo"))

from he360_dodo import get_agent_factory
from pydantic import BaseModel


class AgentSpec(BaseModel):
    """Agent specification from seed."""
    name: str
    agent_type: str
    role: str
    temperature: float
    instructions: str
    previous_agents: List[str] = []


class PhaseSpec(BaseModel):
    """Phase specification from seed."""
    name: str
    duration_estimate: str
    temperature: float
    agents: List[AgentSpec]


async def execute_implementation_strand(seed_path: Path, output_dir: Path):
    """Execute implementation strand from seed specification."""

    # Load seed
    print(f"📖 Loading seed from {seed_path}")
    with open(seed_path) as f:
        seed = yaml.safe_load(f)

    # Initialize agent factory
    factory = get_agent_factory()

    # Prepare execution context
    context = seed.get('context', {})
    context['strand_id'] = seed['metadata']['strand_id']
    context['github_issue'] = seed['metadata']['github_issue']
    context['execution_started'] = datetime.now(UTC).isoformat()

    # Track all findings
    all_findings = {}

    # Execute phases
    phases = []
    for phase_id in ['phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5']:
        phase_data = seed.get(phase_id)
        if not phase_data:
            continue

        phase_spec = PhaseSpec(
            name=phase_data['name'],
            duration_estimate=phase_data['duration_estimate'],
            temperature=phase_data['temperature'],
            agents=[
                AgentSpec(**agent_data)
                for agent_data in phase_data['agents']
            ]
        )
        phases.append((phase_id, phase_spec))

    print(f"\n🧵 Executing {len(phases)} phases with {sum(len(p[1].agents) for p in phases)} agents\n")

    # Execute each phase
    for phase_id, phase_spec in phases:
        print(f"\n{'='*80}")
        print(f"📍 PHASE: {phase_spec.name}")
        print(f"⏱️  Duration estimate: {phase_spec.duration_estimate}")
        print(f"👥 Agents: {len(phase_spec.agents)}")
        print(f"{'='*80}\n")

        phase_findings = {}

        # Execute agents in phase
        for i, agent_spec in enumerate(phase_spec.agents, 1):
            print(f"\n[{i}/{len(phase_spec.agents)}] 🤖 {agent_spec.name} ({agent_spec.agent_type}, {agent_spec.role})")
            print(f"    Temperature: {agent_spec.temperature}")

            # Get previous agent findings if specified
            previous_findings = {}
            if agent_spec.previous_agents:
                # Check if referring to whole phase
                if len(agent_spec.previous_agents) == 1 and agent_spec.previous_agents[0].startswith('phase_'):
                    prev_phase_id = agent_spec.previous_agents[0]
                    prev_phase_match = [p for p in phases if p[0] == prev_phase_id]
                    if prev_phase_match:
                        prev_phase_agents = prev_phase_match[0][1].agents
                        for prev_agent in prev_phase_agents:
                            if prev_agent.name in all_findings:
                                previous_findings[prev_agent.name] = all_findings[prev_agent.name]
                else:
                    # Specific agents
                    for prev_agent_name in agent_spec.previous_agents:
                        if prev_agent_name in all_findings:
                            previous_findings[prev_agent_name] = all_findings[prev_agent_name]

            # Build message with instructions and context
            message_parts = [agent_spec.instructions]

            # Add strand context
            message_parts.append("\n\n## Strand Context\n")
            message_parts.append(f"Repository: {context.get('bars_repo_path', 'N/A')}")
            message_parts.append(f"\nGitHub Issue: {context.get('github_issue_21', 'N/A')}")
            message_parts.append(f"\nDeliverables: {', '.join(seed.get('context', {}).get('output_artifacts', []))}")

            # Add previous findings if any
            if previous_findings:
                message_parts.append("\n\n## Previous Agent Findings\n")
                for prev_name, prev_findings in previous_findings.items():
                    message_parts.append(f"\n### {prev_name}\n")
                    if isinstance(prev_findings, dict):
                        message_parts.append(json.dumps(prev_findings, indent=2))
                    else:
                        message_parts.append(str(prev_findings))

            message = "\n".join(message_parts)

            # Create agent
            try:
                agent = factory.create_agent(
                    archetype_name=agent_spec.agent_type,
                    model_settings_override={
                        "model": "claude-sonnet-4-5",
                        "temperature": agent_spec.temperature
                    }
                )

                # Execute agent
                result = await agent.run(message)

                # Extract findings
                if hasattr(result, 'data'):
                    findings = result.data
                elif hasattr(result, 'output'):
                    findings = result.output
                else:
                    findings = str(result)

                # Store findings
                phase_findings[agent_spec.name] = findings
                all_findings[agent_spec.name] = findings

                print(f"    ✅ Complete")

                # Preview findings (truncated)
                findings_str = json.dumps(findings, indent=2) if isinstance(findings, dict) else str(findings)
                preview = findings_str[:200] + "..." if len(findings_str) > 200 else findings_str
                print(f"    📝 Findings preview: {preview}")

            except Exception as e:
                error_msg = f"Failed: {str(e)}"
                print(f"    ❌ {error_msg}")
                phase_findings[agent_spec.name] = {"error": error_msg}
                all_findings[agent_spec.name] = {"error": error_msg}

        print(f"\n✅ Phase '{phase_spec.name}' complete\n")

    # Save results
    context['execution_completed'] = datetime.now(UTC).isoformat()

    result = {
        "metadata": seed['metadata'],
        "context": context,
        "findings": all_findings,
        "execution_summary": {
            "total_phases": len(phases),
            "total_agents": sum(len(p[1].agents) for p in phases),
            "successful_agents": len([f for f in all_findings.values() if not isinstance(f, dict) or 'error' not in f]),
            "failed_agents": len([f for f in all_findings.values() if isinstance(f, dict) and 'error' in f])
        }
    }

    # Save to output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    result_file = output_dir / f"STRAND_IMPLEMENTATION_{seed['metadata']['strand_id']}_{timestamp}.json"

    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2, default=str)

    print(f"\n{'='*80}")
    print(f"✅ Strand execution complete!")
    print(f"{'='*80}")
    print(f"\n📊 Execution Summary:")
    print(f"   Total phases: {result['execution_summary']['total_phases']}")
    print(f"   Total agents: {result['execution_summary']['total_agents']}")
    print(f"   Successful: {result['execution_summary']['successful_agents']}")
    print(f"   Failed: {result['execution_summary']['failed_agents']}")
    print(f"\n💾 Results saved to: {result_file}")

    # Extract deliverables if artificers generated them
    extract_deliverables(all_findings, Path(context.get('bars_repo_path', '.')).expanduser())

    return result


def extract_deliverables(findings: Dict[str, Any], repo_path: Path):
    """Extract implementation artifacts from agent findings."""
    print(f"\n📦 Extracting deliverables to {repo_path}")

    # Look for code artifacts from artificers
    artificer_findings = {
        name: content
        for name, content in findings.items()
        if 'artificer' in name.lower()
    }

    if not artificer_findings:
        print("   ⚠️  No artificer findings to extract")
        return

    # Try to extract structured artifacts
    for agent_name, content in artificer_findings.items():
        print(f"   📄 Processing {agent_name} output...")

        # If content is structured with file paths
        if isinstance(content, dict):
            if 'files' in content:
                for file_info in content['files']:
                    file_path = repo_path / file_info['path']
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    file_path.write_text(file_info['content'])
                    print(f"      ✅ Created {file_path}")

            # If content has specific artifact keys
            for key in ['cli_code', 'plugin_code', 'test_code', 'documentation']:
                if key in content:
                    print(f"      📝 Found {key} (manual extraction needed)")

        # If content is text that might contain code blocks
        elif isinstance(content, str):
            # Check for markdown code blocks
            if '```' in content:
                print(f"      📝 Found code blocks in {agent_name} (manual extraction needed)")

    print("\n   ℹ️  Review agent findings to extract any missed artifacts")


async def main():
    """Main execution entry point."""
    seed_path = Path(__file__).parent / "SEED_IMPLEMENT_BARS_STRAND_SYSTEM.yaml"
    output_dir = Path(__file__).parent / "strand-results" / "active"

    if not seed_path.exists():
        print(f"❌ Seed file not found: {seed_path}")
        return 1

    try:
        result = await execute_implementation_strand(seed_path, output_dir)

        print("\n🎯 Next steps:")
        print("1. Review strand results JSON for all agent findings")
        print("2. Extract any code artifacts that weren't auto-extracted")
        print("3. Install CLI: cd ~/code/bars-engine && pip install -e ./cli/")
        print("4. Test CLI: bars-strand --help")
        print("5. Commit deliverables to git with temporal anchor")

        return 0

    except Exception as e:
        print(f"\n❌ Strand execution failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
