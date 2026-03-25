"""Tests for strand BAR creator resolution (agent hand vs arbitrary first player)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.strand.creator import STRAND_AGENT_PLAYER_NAME, resolve_strand_creator_id


def _mock_session_for_rows(rows: list[str | None]):
    """rows: list of single-id results per execute call, or None for empty."""
    session = AsyncMock()
    calls = {"i": 0}

    async def execute(_stmt):
        i = calls["i"]
        calls["i"] += 1
        r = MagicMock()
        if i < len(rows) and rows[i] is not None:
            if isinstance(rows[i], list):
                r.scalars.return_value.all.return_value = rows[i]
            else:
                r.scalar_one_or_none.return_value = rows[i]
        else:
            r.scalar_one_or_none.return_value = None
            r.scalars.return_value.all.return_value = []
        return r

    session.execute = AsyncMock(side_effect=execute)
    return session


@pytest.mark.asyncio
async def test_resolve_env_id_valid():
    session = _mock_session_for_rows(["env-player-id"])
    with patch("app.strand.creator.settings") as s:
        s.strand_creator_player_id = "env-player-id"
        out = await resolve_strand_creator_id(session)
    assert out == "env-player-id"


@pytest.mark.asyncio
async def test_resolve_env_id_missing_player():
    session = _mock_session_for_rows([None])
    with patch("app.strand.creator.settings") as s:
        s.strand_creator_player_id = "missing-id"
        with pytest.raises(RuntimeError, match="does not match any Player"):
            await resolve_strand_creator_id(session)


@pytest.mark.asyncio
async def test_resolve_lookup_agent_by_name():
    session = _mock_session_for_rows([["lookup-id"]])
    with patch("app.strand.creator.settings") as s:
        s.strand_creator_player_id = ""
        out = await resolve_strand_creator_id(session)
    assert out == "lookup-id"


@pytest.mark.asyncio
async def test_resolve_duplicate_agents_errors():
    session = _mock_session_for_rows([["a", "b"]])
    with patch("app.strand.creator.settings") as s:
        s.strand_creator_player_id = ""
        with pytest.raises(RuntimeError, match="Multiple Players"):
            await resolve_strand_creator_id(session)


@pytest.mark.asyncio
async def test_resolve_not_configured():
    session = _mock_session_for_rows([[]])
    with patch("app.strand.creator.settings") as s:
        s.strand_creator_player_id = ""
        with pytest.raises(RuntimeError, match="Strand creator Player not configured"):
            await resolve_strand_creator_id(session)


def test_strand_agent_name_matches_seed():
    assert STRAND_AGENT_PLAYER_NAME == "BARS Strand Agent"
