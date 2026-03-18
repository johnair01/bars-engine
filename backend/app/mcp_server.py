"""
MCP server exposing the six Game Master faces as tools for Cursor AI.

Run with: uv run python -m app.mcp_server
Or: npm run mcp:serve (from repo root)

Cursor config: .cursor/mcp.json with bars-agents pointing to this module.
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastmcp import FastMCP

from app.agents._deps import AgentDeps
from app.agents.architect import (
    architect_agent,
    architect_compile_agent,
    deterministic_architect_compile,
    deterministic_architect_draft,
)
from app.agents.challenger import challenger_agent, deterministic_challenger_proposal
from app.agents.diplomat import diplomat_agent, deterministic_diplomat_guidance
from app.agents.regent import regent_agent, deterministic_regent_assessment
from app.agents.sage import sage_agent, deterministic_sage_response
from app.agents.shaman import shaman_agent, deterministic_shaman_reading
from app.config import settings
from app.database import async_session_factory
from app.strand.runner import run_strand

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP(
    name="bars-agents",
    instructions=(
        "Game Master agents for BARS Engine. The six faces are: shaman, regent, challenger, architect, diplomat, sage. "
        "Sage is the integration/synthesis agent — use sage_consult for meta, coordination, or cross-cutting questions. "
        "Do not confuse these with Cursor's mcp_task subagents (evaluator, contrarian, etc.). For BARS domain work, use these tools."
    ),
)


def _run_async(coro):
    """Run async coroutine from sync context."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


async def _with_session(coro_fn):
    """Run coroutine with a DB session. Session stays open for the duration."""
    async with async_session_factory() as session:
        deps = AgentDeps(db=session, player_id=None, instance_id=None, iching_context=None)
        return await coro_fn(deps)


@mcp.tool()
def sage_consult(question: str) -> str:
    """Consult the Sage meta-agent for integrated guidance. Routes to specialist agents based on the question."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_sage_response(question)
            return json.dumps({"synthesis": out.synthesis, "deterministic": True})
        try:
            result = await sage_agent.run(question, deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Sage AI failed, using deterministic fallback", exc_info=True)
            out = deterministic_sage_response(question)
            return json.dumps({"synthesis": out.synthesis, "error": str(e), "deterministic": True})

    return _run_async(_with_session(_run))


@mcp.tool()
def architect_draft(narrative_lock: str, quest_grammar: str = "epiphany_bridge") -> str:
    """Generate a quest draft from a narrative lock. quest_grammar: epiphany_bridge or kotter."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            draft = deterministic_architect_draft(narrative_lock, quest_grammar)
            return draft.model_dump_json()
        try:
            result = await architect_agent.run(
                f"Design a quest for: {narrative_lock}\nGrammar: {quest_grammar}",
                deps=deps,
            )
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Architect AI failed", exc_info=True)
            draft = deterministic_architect_draft(narrative_lock, quest_grammar)
            return draft.model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def architect_compile(unpacking_answers_json: str, quest_grammar: str = "epiphany_bridge") -> str:
    """Compile a quest from unpacking answers. unpacking_answers_json: JSON object of answers."""
    async def _run(deps: AgentDeps):
        try:
            answers = json.loads(unpacking_answers_json)
        except json.JSONDecodeError:
            return json.dumps({"error": "Invalid JSON for unpacking_answers"})
        if not settings.openai_api_key:
            out = deterministic_architect_compile(answers, quest_grammar)
            return json.dumps({"overview": out.overview, "node_texts": out.node_texts, "deterministic": True})
        try:
            prompt = f"Compile a quest from these unpacking answers: {json.dumps(answers)}\nGrammar: {quest_grammar}"
            result = await architect_compile_agent.run(prompt, deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Architect compile failed", exc_info=True)
            out = deterministic_architect_compile(answers, quest_grammar)
            return json.dumps({"overview": out.overview, "node_texts": out.node_texts, "deterministic": True})

    return _run_async(_with_session(_run))


@mcp.tool()
def architect_analyze_chunk(chunk_text: str, domain_hint: str | None = None) -> str:
    """Analyze a text chunk for quest extraction. Used for book analysis."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            draft = deterministic_architect_draft(chunk_text[:500], "epiphany_bridge")
            return draft.model_dump_json()
        try:
            hint = f" Domain hint: {domain_hint}" if domain_hint else ""
            result = await architect_agent.run(
                f"Extract quest(s) from this chunk:{hint}\n\n{chunk_text[:4000]}",
                deps=deps,
            )
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Architect analyze failed", exc_info=True)
            draft = deterministic_architect_draft(chunk_text[:500], "epiphany_bridge")
            return draft.model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def challenger_propose(context: str = "") -> str:
    """Propose moves from the Challenger. context: optional quest/player context."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_challenger_proposal()
            return out.model_dump_json()
        try:
            result = await challenger_agent.run(context or "What moves are available?", deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Challenger failed", exc_info=True)
            return deterministic_challenger_proposal().model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def shaman_read(context: str = "") -> str:
    """Get an emotional alchemy reading from the Shaman. context: optional player/state context."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_shaman_reading(context or "current state")
            return out.model_dump_json()
        try:
            result = await shaman_agent.run(context or "Read the current emotional state.", deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Shaman failed", exc_info=True)
            return deterministic_shaman_reading(context or "current state").model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def shaman_identify(free_text: str) -> str:
    """Identify nation/archetype from free text via the Shaman."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_shaman_reading(free_text)
            return out.model_dump_json()
        try:
            result = await shaman_agent.run(f"Identify from: {free_text}", deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Shaman identify failed", exc_info=True)
            return deterministic_shaman_reading(free_text).model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def regent_assess(instance_id: str = "default") -> str:
    """Assess campaign state from the Regent. instance_id: campaign instance to assess."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_regent_assessment(instance_id)
            return out.model_dump_json()
        try:
            result = await regent_agent.run(
                f"Assess campaign instance: {instance_id}",
                deps=deps,
            )
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Regent failed", exc_info=True)
            return deterministic_regent_assessment(instance_id).model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def diplomat_guide(context: str = "") -> str:
    """Get community guidance from the Diplomat. context: optional player/instance context."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_diplomat_guidance()
            return out.model_dump_json()
        try:
            result = await diplomat_agent.run(context or "Community guidance.", deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Diplomat failed", exc_info=True)
            return deterministic_diplomat_guidance().model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def diplomat_bridge(narrative_text: str, move_type: str | None = None) -> str:
    """Bridge narrative through the Diplomat. move_type: optional WAVE move."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_diplomat_guidance()
            return out.model_dump_json()
        try:
            prompt = f"Bridge narrative: {narrative_text}"
            if move_type:
                prompt += f"\nMove type: {move_type}"
            result = await diplomat_agent.run(prompt, deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Diplomat bridge failed", exc_info=True)
            return deterministic_diplomat_guidance().model_dump_json()

    return _run_async(_with_session(_run))


@mcp.tool()
def strand_run(subject: str, strand_type: str = "diagnostic") -> str:
    """Run a multi-agent strand investigation. subject: problem to investigate. strand_type: diagnostic (default), research, content, backlog, etc. Returns strandBarId and outputBarIds."""
    async def _run():
        async with async_session_factory() as session:
            result = await run_strand(session, strand_type, subject)
            return json.dumps(result)

    return _run_async(_run())


@mcp.tool()
def diplomat_refine_copy(target_type: str, current_copy: str, context: str = "") -> str:
    """Refine copy through the Diplomat. target_type: e.g. quest_title, description."""
    async def _run(deps: AgentDeps):
        if not settings.openai_api_key:
            out = deterministic_diplomat_guidance()
            return out.model_dump_json()
        try:
            prompt = f"Refine {target_type}: {current_copy}"
            if context:
                prompt += f"\nContext: {context}"
            result = await diplomat_agent.run(prompt, deps=deps)
            return result.output.model_dump_json()
        except Exception as e:
            logger.warning("Diplomat refine failed", exc_info=True)
            return deterministic_diplomat_guidance().model_dump_json()

    return _run_async(_with_session(_run))


if __name__ == "__main__":
    mcp.run()
