"""Tests for backend/app/orientation_quest/checkpoint.py

Tests the CheckpointService, OrientationSessionRecord model, and all six named
checkpoint transitions using an in-memory SQLite database (no PostgreSQL required).

Run with:
    cd backend && uv run pytest tests/test_orientation_quest/test_checkpoint.py -v

Design notes:
  - Uses SQLite in-memory DB (SQLAlchemy declarative + create_all).
  - Each test function gets a fresh, isolated Session via the `db_session` fixture.
  - No mocking of LLM or external services needed — these are pure persistence tests.
  - Mirrors the acceptance criteria in Sub-AC 4b: every checkpoint transition persists
    the correct state to the DB.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.orientation_quest.checkpoint import (
    DEFAULT_ABANDONMENT_THRESHOLD,
    CheckpointName,
    CheckpointService,
    OrientationSessionRecord,
)
from app.orientation_quest.models import (
    FaceSubPacketState,
    GameMasterFace,
    OrientationMetaPacket,
    SessionState,
    SubmissionPath,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def engine():
    """In-memory SQLite engine — creates ONLY the orientation_sessions table.

    We cannot call Base.metadata.create_all() because other models use
    PostgreSQL-specific types (JSONB) that SQLite's DDL compiler cannot handle.
    Instead we create a minimal MetaData containing only OrientationSessionRecord.
    """
    from sqlalchemy import MetaData
    eng = create_engine("sqlite:///:memory:", echo=False)
    # Build a minimal metadata with only the OrientationSessionRecord table
    minimal_meta = MetaData()
    OrientationSessionRecord.__table__.to_metadata(minimal_meta)
    minimal_meta.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db_session(engine):
    """Fresh, auto-rolled-back SQLAlchemy session for each test."""
    with Session(engine) as session:
        yield session
        session.rollback()


@pytest.fixture()
def svc(db_session) -> CheckpointService:
    return CheckpointService(db_session)


def _make_packet_id(suffix: str = "001") -> str:
    return f"oq_test_{suffix}"


def _make_player_id(suffix: str = "001") -> str:
    return f"player_test_{suffix}"


# ---------------------------------------------------------------------------
# 1. SESSION_INIT — create a new session record
# ---------------------------------------------------------------------------


class TestSessionInit:
    def test_creates_record(self, svc: CheckpointService):
        record = svc.init_session(
            packet_id=_make_packet_id("init_a"),
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        assert record.id is not None
        assert record.packet_id == _make_packet_id("init_a")
        assert record.player_id == _make_player_id()
        assert record.session_state == SessionState.ACTIVE.value
        assert record.submission_path == SubmissionPath.PLAYER_DIRECT.value
        assert record.last_checkpoint == CheckpointName.SESSION_INIT.value
        assert record.checkpoint_node_id is None
        assert record.abandoned_at is None

    def test_idempotent_on_duplicate_packet_id(self, svc: CheckpointService):
        """Second call with the same packetId returns existing record."""
        pid = _make_packet_id("init_b")
        r1 = svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        r2 = svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        assert r1.id == r2.id, "second call returns same record (idempotent)"

    def test_packet_json_is_valid(self, svc: CheckpointService):
        record = svc.init_session(
            packet_id=_make_packet_id("init_c"),
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        packet = record.to_meta_packet()
        assert isinstance(packet, OrientationMetaPacket)
        assert len(packet.face_sub_packets) == 6
        assert all(
            sp.state == FaceSubPacketState.PENDING
            for sp in packet.face_sub_packets.values()
        )

    def test_all_submission_paths(self, svc: CheckpointService):
        for i, path in enumerate(SubmissionPath):
            record = svc.init_session(
                packet_id=_make_packet_id(f"init_path_{i}"),
                player_id=_make_player_id(),
                submission_path=path,
            )
            assert record.submission_path == path.value


# ---------------------------------------------------------------------------
# 2. FACE_ENTER checkpoint
# ---------------------------------------------------------------------------


class TestFaceEnter:
    def _create_session(self, svc: CheckpointService, suffix: str) -> str:
        pid = _make_packet_id(suffix)
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        return pid

    def test_pending_to_in_progress(self, svc: CheckpointService):
        pid = self._create_session(svc, "enter_a")
        packet, record = svc.enter_face(pid, GameMasterFace.SHAMAN)

        assert packet.face_sub_packets[GameMasterFace.SHAMAN].state == FaceSubPacketState.IN_PROGRESS
        assert packet.active_face == GameMasterFace.SHAMAN
        assert record.last_checkpoint == CheckpointName.FACE_ENTER.value
        assert record.session_state == SessionState.ACTIVE.value  # not yet submitted

    def test_node_id_persisted(self, svc: CheckpointService):
        pid = self._create_session(svc, "enter_b")
        node_id = "orient_shaman_shaman_intro"
        _, record = svc.enter_face(pid, GameMasterFace.SHAMAN, current_node_id=node_id)
        assert record.checkpoint_node_id == node_id

    def test_no_regression_when_already_in_progress(self, svc: CheckpointService):
        pid = self._create_session(svc, "enter_c")
        svc.enter_face(pid, GameMasterFace.CHALLENGER)
        packet, _ = svc.enter_face(pid, GameMasterFace.CHALLENGER)
        assert (
            packet.face_sub_packets[GameMasterFace.CHALLENGER].state
            == FaceSubPacketState.IN_PROGRESS
        )

    def test_other_faces_remain_pending(self, svc: CheckpointService):
        pid = self._create_session(svc, "enter_d")
        packet, _ = svc.enter_face(pid, GameMasterFace.REGENT)
        for face in GameMasterFace:
            if face != GameMasterFace.REGENT:
                assert packet.face_sub_packets[face].state == FaceSubPacketState.PENDING

    def test_packet_json_updated_in_db(self, svc: CheckpointService):
        pid = self._create_session(svc, "enter_e")
        svc.enter_face(pid, GameMasterFace.ARCHITECT)
        record = svc.get_by_packet_id_or_raise(pid)
        restored = record.to_meta_packet()
        assert (
            restored.face_sub_packets[GameMasterFace.ARCHITECT].state
            == FaceSubPacketState.IN_PROGRESS
        )


# ---------------------------------------------------------------------------
# 3. PAYLOAD_PATCH checkpoint
# ---------------------------------------------------------------------------


class TestPayloadPatch:
    def _setup(self, svc: CheckpointService, suffix: str) -> str:
        pid = _make_packet_id(suffix)
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.enter_face(pid, GameMasterFace.SHAMAN)
        return pid

    def test_scalar_field_written(self, svc: CheckpointService):
        pid = self._setup(svc, "patch_a")
        packet, record = svc.patch_payload(
            pid, GameMasterFace.SHAMAN, {"description": "A ritual crossing"}
        )
        assert packet.face_sub_packets[GameMasterFace.SHAMAN].payload.description == "A ritual crossing"
        assert record.last_checkpoint == CheckpointName.PAYLOAD_PATCH.value

    def test_bar_integration_deep_merge(self, svc: CheckpointService):
        pid = self._setup(svc, "patch_b")
        # Regent adds creates_bar + bar_timing
        svc.patch_payload(
            pid, GameMasterFace.SHAMAN,
            {"bar_integration": {"creates_bar": True, "bar_timing": "pre_action"}},
        )
        # Diplomat adds bar_prompt_template (should NOT clobber existing fields)
        packet, _ = svc.patch_payload(
            pid, GameMasterFace.SHAMAN,
            {"bar_integration": {"bar_prompt_template": "Reflect on the relational field…"}},
        )
        bi = packet.face_sub_packets[GameMasterFace.SHAMAN].payload.bar_integration
        assert bi is not None
        assert bi.creates_bar is True, "creates_bar preserved after diplomat patch"
        assert bi.bar_timing == "pre_action", "bar_timing preserved after diplomat patch"
        assert bi.bar_prompt_template == "Reflect on the relational field…"

    def test_quest_usage_deep_merge(self, svc: CheckpointService):
        pid = self._setup(svc, "patch_c")
        svc.patch_payload(
            pid, GameMasterFace.SHAMAN,
            {"quest_usage": {"quest_stage": "reflection", "is_required_for_full_arc": True}},
        )
        packet, _ = svc.patch_payload(
            pid, GameMasterFace.SHAMAN,
            {"quest_usage": {"suggested_follow_up_moves": ["observe", "name"]}},
        )
        qu = packet.face_sub_packets[GameMasterFace.SHAMAN].payload.quest_usage
        assert qu is not None
        assert qu.quest_stage == "reflection", "quest_stage (regent) preserved after sage patch"
        assert qu.is_required_for_full_arc is True, "is_required_for_full_arc preserved"
        assert qu.suggested_follow_up_moves == ["observe", "name"]

    def test_parent_move_id_set_once(self, svc: CheckpointService):
        pid = self._setup(svc, "patch_d")
        svc.patch_payload(pid, GameMasterFace.SHAMAN, {"parent_move_id": "observe"})
        packet, _ = svc.patch_payload(
            pid, GameMasterFace.SHAMAN, {"parent_move_id": "name"}
        )
        assert (
            packet.face_sub_packets[GameMasterFace.SHAMAN].payload.parent_move_id == "observe"
        ), "parent_move_id cannot be overwritten once set"

    def test_node_id_persisted(self, svc: CheckpointService):
        pid = self._setup(svc, "patch_e")
        _, record = svc.patch_payload(
            pid, GameMasterFace.SHAMAN,
            {"description": "test"},
            current_node_id="orient_shaman_shaman_description",
        )
        assert record.checkpoint_node_id == "orient_shaman_shaman_description"


# ---------------------------------------------------------------------------
# 4. FACE_SUBMIT checkpoint
# ---------------------------------------------------------------------------


class TestFaceSubmit:
    def _setup(self, svc: CheckpointService, suffix: str) -> str:
        pid = _make_packet_id(suffix)
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.enter_face(pid, GameMasterFace.SHAMAN)
        return pid

    def test_state_transitions_to_complete(self, svc: CheckpointService):
        pid = self._setup(svc, "submit_a")
        packet, record = svc.submit_face(pid, GameMasterFace.SHAMAN, "qp_001")
        sp = packet.face_sub_packets[GameMasterFace.SHAMAN]
        assert sp.state == FaceSubPacketState.COMPLETE
        assert sp.quest_proposal_id == "qp_001"
        assert sp.submitted_at is not None
        assert record.last_checkpoint == CheckpointName.FACE_SUBMIT.value

    def test_session_state_advances_to_submitted(self, svc: CheckpointService):
        pid = self._setup(svc, "submit_b")
        packet, record = svc.submit_face(pid, GameMasterFace.SHAMAN, "qp_002")
        assert packet.session_state == SessionState.SUBMITTED
        assert record.session_state == SessionState.SUBMITTED.value

    def test_multiple_face_submits(self, svc: CheckpointService):
        pid = _make_packet_id("submit_c")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.enter_face(pid, GameMasterFace.SHAMAN)
        svc.enter_face(pid, GameMasterFace.CHALLENGER)
        svc.submit_face(pid, GameMasterFace.SHAMAN, "qp_003a")
        packet, record = svc.submit_face(pid, GameMasterFace.CHALLENGER, "qp_003b")
        assert packet.face_sub_packets[GameMasterFace.SHAMAN].state == FaceSubPacketState.COMPLETE
        assert packet.face_sub_packets[GameMasterFace.CHALLENGER].state == FaceSubPacketState.COMPLETE
        assert packet.session_state == SessionState.SUBMITTED

    def test_closed_state_not_overwritten(self, svc: CheckpointService):
        pid = self._setup(svc, "submit_d")
        svc.close_session(pid)
        packet, _ = svc.submit_face(pid, GameMasterFace.SHAMAN, "qp_004")
        assert packet.session_state == SessionState.CLOSED, "closed state preserved"


# ---------------------------------------------------------------------------
# 5. FACE_SKIP checkpoint
# ---------------------------------------------------------------------------


class TestFaceSkip:
    def test_state_transitions_to_skipped(self, svc: CheckpointService):
        pid = _make_packet_id("skip_a")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        packet, record = svc.skip_face(pid, GameMasterFace.DIPLOMAT)
        assert packet.face_sub_packets[GameMasterFace.DIPLOMAT].state == FaceSubPacketState.SKIPPED
        assert record.last_checkpoint == CheckpointName.FACE_SKIP.value
        assert record.checkpoint_node_id is None, "FACE_SKIP has no node ID"

    def test_other_faces_unaffected(self, svc: CheckpointService):
        pid = _make_packet_id("skip_b")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        packet, _ = svc.skip_face(pid, GameMasterFace.SAGE)
        for face in GameMasterFace:
            if face != GameMasterFace.SAGE:
                assert packet.face_sub_packets[face].state == FaceSubPacketState.PENDING


# ---------------------------------------------------------------------------
# 6. SESSION_CLOSE checkpoint
# ---------------------------------------------------------------------------


class TestSessionClose:
    def test_session_state_closed(self, svc: CheckpointService):
        pid = _make_packet_id("close_a")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        packet, record = svc.close_session(pid)
        assert packet.session_state == SessionState.CLOSED
        assert record.session_state == SessionState.CLOSED.value
        assert record.last_checkpoint == CheckpointName.SESSION_CLOSE.value
        assert record.checkpoint_node_id is None

    def test_active_face_cleared_on_close(self, svc: CheckpointService):
        pid = _make_packet_id("close_b")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.enter_face(pid, GameMasterFace.REGENT)
        packet, _ = svc.close_session(pid)
        assert packet.active_face is None, "activeFace cleared on session close"


# ---------------------------------------------------------------------------
# 7. Abandonment detection
# ---------------------------------------------------------------------------


class TestAbandonmentDetection:
    def _create_record(
        self,
        svc: CheckpointService,
        suffix: str,
        checkpoint_at: datetime,
    ) -> OrientationSessionRecord:
        pid = _make_packet_id(suffix)
        record = svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        # Manually set the checkpointAt to simulate an old session
        record.checkpoint_at = checkpoint_at
        return record

    def test_fresh_session_not_abandoned(self, svc: CheckpointService, db_session):
        now = datetime.now(UTC)
        fresh = self._create_record(svc, "aband_a", checkpoint_at=now)
        assert not svc.is_abandoned(fresh, now=now), "fresh session is NOT abandoned"

    def test_stale_session_is_abandoned(self, svc: CheckpointService):
        old = datetime.now(UTC) - DEFAULT_ABANDONMENT_THRESHOLD - timedelta(seconds=1)
        record = self._create_record(svc, "aband_b", checkpoint_at=old)
        assert svc.is_abandoned(record), "stale active session IS abandoned"

    def test_submitted_session_never_abandoned(self, svc: CheckpointService):
        old = datetime.now(UTC) - DEFAULT_ABANDONMENT_THRESHOLD - timedelta(seconds=1)
        record = self._create_record(svc, "aband_c", checkpoint_at=old)
        record.session_state = "submitted"
        assert not svc.is_abandoned(record), "submitted session is never abandoned"

    def test_mark_abandoned_sets_flag(self, svc: CheckpointService):
        old = datetime.now(UTC) - DEFAULT_ABANDONMENT_THRESHOLD - timedelta(seconds=1)
        pid = _make_packet_id("aband_d")
        record = svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        record.checkpoint_at = old
        abandoned_record = svc.mark_abandoned(pid)
        assert abandoned_record.abandoned_at is not None, "abandonedAt is set"
        assert abandoned_record.session_state == "abandoned", "sessionState is 'abandoned'"

    def test_mark_abandoned_closes_packet(self, svc: CheckpointService):
        pid = _make_packet_id("aband_e")
        svc.init_session(
            packet_id=pid,
            player_id=_make_player_id(),
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.enter_face(pid, GameMasterFace.ARCHITECT)  # set activeFace
        abandoned_record = svc.mark_abandoned(pid)
        packet = abandoned_record.to_meta_packet()
        assert packet.active_face is None, "activeFace cleared when abandoned"
        assert packet.session_state == SessionState.CLOSED


# ---------------------------------------------------------------------------
# 8. find_resumable_session
# ---------------------------------------------------------------------------


class TestFindResumableSession:
    def test_finds_active_session(self, svc: CheckpointService):
        player = _make_player_id("resume_001")
        pid = _make_packet_id("resume_a")
        svc.init_session(
            packet_id=pid,
            player_id=player,
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        found = svc.find_resumable_session(player, SubmissionPath.PLAYER_DIRECT)
        assert found is not None
        assert found.packet_id == pid

    def test_returns_none_for_unknown_player(self, svc: CheckpointService):
        found = svc.find_resumable_session("player_unknown_xyz")
        assert found is None

    def test_returns_none_for_closed_session(self, svc: CheckpointService):
        player = _make_player_id("resume_002")
        pid = _make_packet_id("resume_b")
        svc.init_session(
            packet_id=pid,
            player_id=player,
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.close_session(pid)
        found = svc.find_resumable_session(player)
        assert found is None

    def test_filters_by_submission_path(self, svc: CheckpointService):
        player = _make_player_id("resume_003")
        pid_direct = _make_packet_id("resume_c1")
        pid_admin = _make_packet_id("resume_c2")
        svc.init_session(
            packet_id=pid_direct, player_id=player,
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        svc.init_session(
            packet_id=pid_admin, player_id=player,
            submission_path=SubmissionPath.ADMIN_AUTHORED,
        )
        found_direct = svc.find_resumable_session(player, SubmissionPath.PLAYER_DIRECT)
        found_admin = svc.find_resumable_session(player, SubmissionPath.ADMIN_AUTHORED)
        assert found_direct is not None and found_direct.submission_path == SubmissionPath.PLAYER_DIRECT.value
        assert found_admin is not None and found_admin.submission_path == SubmissionPath.ADMIN_AUTHORED.value


# ---------------------------------------------------------------------------
# 9. Serialization helpers
# ---------------------------------------------------------------------------


class TestSerialization:
    def test_round_trip(self, svc: CheckpointService):
        packet = OrientationMetaPacket.create_new(
            packet_id="oq_rt_001",
            player_id="player_rt",
            submission_path=SubmissionPath.PLAYER_DIRECT,
        )
        json_str = CheckpointService.serialize_packet(packet)
        restored = CheckpointService.deserialize_packet(json_str)
        assert restored.packet_id == packet.packet_id
        assert restored.player_id == packet.player_id
        assert restored.session_state == packet.session_state
        assert len(restored.face_sub_packets) == len(packet.face_sub_packets)

    def test_invalid_json_raises(self):
        with pytest.raises(Exception):
            CheckpointService.deserialize_packet("not valid json {{{")
