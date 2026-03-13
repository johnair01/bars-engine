"""Test fixtures for agent tests.

Blocks real API calls and provides mock DB session.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic_ai import models

from app.database import get_db
from app.main import app


@pytest.fixture(autouse=True)
def block_real_api_calls():
    """Prevent any real LLM API calls during tests."""
    models.ALLOW_MODEL_REQUESTS = False
    yield
    models.ALLOW_MODEL_REQUESTS = True


@pytest.fixture(autouse=True)
def mock_db():
    """Override the DB dependency with a mock so tests don't need PostgreSQL.

    The mock session's execute() returns a MagicMock (not AsyncMock)
    so that .scalars().all() works synchronously as SQLAlchemy expects.
    """
    mock_session = AsyncMock()

    # execute() is async, but the result object methods are sync
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_result.scalar_one_or_none.return_value = None
    mock_result.scalar.return_value = 0
    mock_result.all.return_value = []
    mock_session.execute.return_value = mock_result

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    yield mock_session
    app.dependency_overrides.pop(get_db, None)
