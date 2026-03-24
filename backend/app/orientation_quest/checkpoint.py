"""Orientation Quest — Checkpoint Persistence Service (Python / SQLAlchemy).

This module provides:
  1. OrientationSessionRecord — SQLAlchemy model for the `orientation_sessions` table.
  2. CheckpointName           — Enum of the six named session-level transitions.
  3. CheckpointService        — CRUD + state-transition helpers (sync SQLAlchemy).

Companion to the TypeScript persistence layer:
  src/lib/orientation-quest/checkpoint.ts   — pure helpers + type definitions
  src/actions/orientation-checkpoint.ts     — Next.js server actions (front-end writes)

The Python checkpoint service is used by:
  - challenger.py agent: backfill/review and SLA-fallback autonomous proposal generation.
  - Any Python pipeline that needs to read or write orientation session state.

Design rules (from constraints):
  - Python 3.14+ on WSL.
  - Use uv (not pip) for dependencies.
  - No caching layer: each DB read is a fresh query.
  - All six checkpoint transitions are supported; SESSION_CLOSE is also the
    SLA fallback path (the agent calls close_session() to mark the packet closed
    when the player abandonment threshold is exceeded).
  - abandonedAt is SET ONLY by mark_abandoned() — never by normal checkpoint writes.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from enum import StrEnum

from sqlalchemy import DateTime, Index, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.models.base import Base, generate_cuid
from app.orientation_quest.models import (
    FaceSubPacketState,
    GameMasterFace,
    OrientationMetaPacket,
    SessionState,
    SubmissionPath,
)

# ---------------------------------------------------------------------------
# Named checkpoints (mirrors TypeScript CheckpointName)
# ---------------------------------------------------------------------------


class CheckpointName(StrEnum):
    """Six session-level transitions that trigger a DB upsert.

    Values mirror the TypeScript CheckpointName union in checkpoint.ts exactly
    so that records written by either runtime are interchangeable.
    """

    SESSION_INIT = "SESSION_INIT"
    """Meta-packet created; all sub-packets start as 'pending'."""

    FACE_ENTER = "FACE_ENTER"
    """Player opened a face path (pending → in_progress)."""

    PAYLOAD_PATCH = "PAYLOAD_PATCH"
    """Player answered a beat node; payload field(s) updated."""

    FACE_SUBMIT = "FACE_SUBMIT"
    """Player submitted a proposal from a face (in_progress → complete)."""

    FACE_SKIP = "FACE_SKIP"
    """Player skipped a face path (→ skipped)."""

    SESSION_CLOSE = "SESSION_CLOSE"
    """Session closed by the player or SLA fallback (→ closed)."""


# ---------------------------------------------------------------------------
# SQLAlchemy model — orientation_sessions table
# ---------------------------------------------------------------------------


class OrientationSessionRecord(Base):
    """SQLAlchemy model for `orientation_sessions`.

    Mirrors the Prisma model defined in prisma/schema.prisma.
    All column names use the camelCase identifiers required by Prisma/PostgreSQL
    (mapped via the first positional argument to mapped_column).
    """

    __tablename__ = "orientation_sessions"
    __table_args__ = (
        UniqueConstraint("packetId", name="orientation_sessions_packetId_key"),
        Index("ix_orientation_sessions_player", "playerId"),
        Index("ix_orientation_sessions_state", "sessionState"),
        Index("ix_orientation_sessions_player_state", "playerId", "sessionState"),
        Index("ix_orientation_sessions_player_checkpoint_at", "playerId", "checkpointAt"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_cuid)

    packet_id: Mapped[str] = mapped_column(
        "packetId", String, nullable=False, unique=True,
        comment="Maps 1-to-1 to OrientationMetaPacket.packetId",
    )
    player_id: Mapped[str] = mapped_column(
        "playerId", String, nullable=False,
        comment="Owning player — FK to players.id (cascade enforced by DB, not SA here)",
    )
    session_state: Mapped[str] = mapped_column(
        "sessionState", String, nullable=False, default="active",
        comment="active | submitted | closed | abandoned",
    )
    submission_path: Mapped[str] = mapped_column(
        "submissionPath", String, nullable=False,
        comment="player_direct | player_assisted | admin_authored | ai_autonomous",
    )
    packet_json: Mapped[str] = mapped_column(
        "packetJson", Text, nullable=False,
        comment="Full OrientationMetaPacket serialised as JSON",
    )
    last_checkpoint: Mapped[str] = mapped_column(
        "lastCheckpoint", String, nullable=False, default="SESSION_INIT",
        comment="Most recent CheckpointName value",
    )
    checkpoint_at: Mapped[datetime] = mapped_column(
        "checkpointAt", DateTime(timezone=True),
        server_default=func.now(), nullable=False,
        comment="Timestamp of the most recent checkpoint write",
    )
    checkpoint_node_id: Mapped[str | None] = mapped_column(
        "checkpointNodeId", String, nullable=True, default=None,
        comment="Quest node ID when checkpoint was written (null for session-level checkpoints)",
    )
    abandoned_at: Mapped[datetime | None] = mapped_column(
        "abandonedAt", DateTime(timezone=True), nullable=True, default=None,
        comment="Set when session is marked abandoned by SLA fallback; null otherwise",
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime(timezone=True),
        server_default=func.now(), nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime(timezone=True),
        server_default=func.now(), onupdate=func.now(), nullable=False,
    )

    # ------------------------------------------------------------------
    # Python-level helpers (not mapped columns)
    # ------------------------------------------------------------------

    def to_meta_packet(self) -> OrientationMetaPacket:
        """Deserialise packet_json back to an OrientationMetaPacket Pydantic model.

        Raises:
            ValueError: if packet_json is empty or malformed.
        """
        if not self.packet_json:
            raise ValueError(
                f"OrientationSessionRecord {self.id}: packet_json is empty — "
                "cannot deserialise."
            )
        data = json.loads(self.packet_json)
        return OrientationMetaPacket.model_validate(data)


# ---------------------------------------------------------------------------
# Default abandonment threshold
# ---------------------------------------------------------------------------

DEFAULT_ABANDONMENT_THRESHOLD = timedelta(hours=24)
"""Sessions with sessionState='active' and checkpointAt older than this are
considered abandoned.  Mirrors ABANDONMENT_THRESHOLD_MS in checkpoint.ts."""


# ---------------------------------------------------------------------------
# CheckpointService — CRUD and state-transition helpers
# ---------------------------------------------------------------------------


class CheckpointService:
    """Synchronous service layer for orientation session checkpoint persistence.

    Intended to be instantiated per-request (or per-agent-call) with a live
    SQLAlchemy ``Session`` from the caller's DB pool.

    All methods that mutate DB state call ``session.flush()`` (not ``commit()``)
    so the caller controls transaction boundaries.  Wrap calls in a ``with``
    block on the engine or pass a session from the FastAPI DI system.

    Example::

        with Session(engine) as db:
            svc = CheckpointService(db)
            record = svc.init_session(
                packet_id="oq_abc123",
                player_id="player_cuid",
                submission_path=SubmissionPath.PLAYER_DIRECT,
            )
            db.commit()
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Serialisation helpers (static)
    # ------------------------------------------------------------------

    @staticmethod
    def serialize_packet(packet: OrientationMetaPacket) -> str:
        """Serialise an OrientationMetaPacket to the compact JSON string stored in packetJson."""
        return packet.model_dump_json()

    @staticmethod
    def deserialize_packet(json_str: str) -> OrientationMetaPacket:
        """Deserialise the JSON string from packetJson back to an OrientationMetaPacket."""
        data = json.loads(json_str)
        return OrientationMetaPacket.model_validate(data)

    # ------------------------------------------------------------------
    # Low-level fetch helpers
    # ------------------------------------------------------------------

    def get_by_packet_id(self, packet_id: str) -> OrientationSessionRecord | None:
        """Return the session record for a given packetId, or None if not found."""
        return (
            self._db.query(OrientationSessionRecord)
            .filter(OrientationSessionRecord.packet_id == packet_id)
            .first()
        )

    def get_by_packet_id_or_raise(self, packet_id: str) -> OrientationSessionRecord:
        """Return the session record or raise ValueError if not found."""
        record = self.get_by_packet_id(packet_id)
        if record is None:
            raise ValueError(
                f"OrientationSession not found for packetId={packet_id!r}"
            )
        return record

    def get_active_sessions_for_player(
        self, player_id: str
    ) -> list[OrientationSessionRecord]:
        """Return all active (sessionState='active') sessions for a player,
        ordered by most recent checkpointAt."""
        return (
            self._db.query(OrientationSessionRecord)
            .filter(
                OrientationSessionRecord.player_id == player_id,
                OrientationSessionRecord.session_state == "active",
            )
            .order_by(OrientationSessionRecord.checkpoint_at.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Checkpoint writes — one method per named checkpoint
    # ------------------------------------------------------------------

    def init_session(
        self,
        packet_id: str,
        player_id: str,
        submission_path: SubmissionPath,
        packet: OrientationMetaPacket | None = None,
        *,
        enabled_faces: list[GameMasterFace] | None = None,
    ) -> OrientationSessionRecord:
        """Create a new orientation session record at the SESSION_INIT checkpoint.

        If ``packet`` is not supplied a fresh OrientationMetaPacket is constructed
        from (packet_id, player_id, submission_path, enabled_faces).

        If a record already exists for ``packet_id`` it is returned unchanged
        (idempotent — safe for retries).

        Args:
            packet_id:       Caller-supplied cuid for the session.
            player_id:       DB player ID.
            submission_path: Which co-creation path is operative.
            packet:          Pre-built packet (optional).
            enabled_faces:   Subset of faces to include (only when packet=None).

        Returns:
            The newly created OrientationSessionRecord.
        """
        existing = self.get_by_packet_id(packet_id)
        if existing is not None:
            return existing

        if packet is None:
            packet = OrientationMetaPacket.create_new(
                packet_id=packet_id,
                player_id=player_id,
                submission_path=submission_path,
                enabled_faces=enabled_faces,
            )

        now = datetime.now(UTC)
        record = OrientationSessionRecord(
            id=generate_cuid(),
            packet_id=packet_id,
            player_id=player_id,
            session_state=SessionState.ACTIVE.value,
            submission_path=submission_path.value,
            packet_json=self.serialize_packet(packet),
            last_checkpoint=CheckpointName.SESSION_INIT.value,
            checkpoint_at=now,
            checkpoint_node_id=None,
            abandoned_at=None,
        )
        self._db.add(record)
        self._db.flush()
        return record

    def _upsert_checkpoint(
        self,
        packet_id: str,
        packet: OrientationMetaPacket,
        checkpoint: CheckpointName,
        current_node_id: str | None = None,
    ) -> OrientationSessionRecord:
        """Internal: upsert the session record at the named checkpoint.

        Fetches the existing record (must exist), updates all mutable fields,
        flushes.  Raises ValueError if no record exists for packet_id.

        Args:
            packet_id:       Natural key for the session.
            packet:          The current (post-transition) OrientationMetaPacket.
            checkpoint:      The transition that triggered this write.
            current_node_id: Quest node the player is at (null for session-level checkpoints).
        """
        record = self.get_by_packet_id_or_raise(packet_id)

        # SESSION_INIT and SESSION_CLOSE are session-level: node is null
        is_session_level = checkpoint in (
            CheckpointName.SESSION_INIT,
            CheckpointName.SESSION_CLOSE,
        )
        node_id = None if is_session_level else current_node_id

        record.session_state = packet.session_state.value
        record.submission_path = packet.submission_path.value
        record.packet_json = self.serialize_packet(packet)
        record.last_checkpoint = checkpoint.value
        record.checkpoint_at = datetime.now(UTC)
        record.checkpoint_node_id = node_id
        # abandonedAt is NEVER reset by normal checkpoint writes

        self._db.flush()
        return record

    def enter_face(
        self,
        packet_id: str,
        face: GameMasterFace,
        current_node_id: str | None = None,
    ) -> tuple[OrientationMetaPacket, OrientationSessionRecord]:
        """Transition the named face from 'pending' → 'in_progress'; persist at FACE_ENTER.

        No-op on state (but still upserts) when the sub-packet is already
        in_progress, complete, or skipped.

        Returns:
            (updated_packet, updated_record) — both post-transition.
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        packet = self.deserialize_packet(record.packet_json)

        sub = packet.get_sub_packet(face)
        if sub is not None and sub.state == FaceSubPacketState.PENDING:
            # Transition pending → in_progress
            updated_subs = dict(packet.face_sub_packets)
            from copy import copy
            updated_sub = copy(sub)
            updated_sub.state = FaceSubPacketState.IN_PROGRESS
            updated_subs[face] = updated_sub
            packet = packet.model_copy(
                update={
                    "face_sub_packets": updated_subs,
                    "active_face": face,
                    "updated_at": datetime.now(UTC),
                }
            )
        else:
            # Still update activeFace and timestamp even if state is not changing
            packet = packet.model_copy(
                update={
                    "active_face": face,
                    "updated_at": datetime.now(UTC),
                }
            )

        updated_record = self._upsert_checkpoint(
            packet_id, packet, CheckpointName.FACE_ENTER, current_node_id
        )
        return packet, updated_record

    def patch_payload(
        self,
        packet_id: str,
        face: GameMasterFace,
        patch: dict,
        current_node_id: str | None = None,
    ) -> tuple[OrientationMetaPacket, OrientationSessionRecord]:
        """Deep-merge ``patch`` into the face sub-packet payload; persist at PAYLOAD_PATCH.

        Deep-merge rules (mirror TypeScript applyPayloadPatch):
          - Top-level scalars: patch wins.
          - bar_integration: sub-field merge (REGENT + DIPLOMAT coexist).
          - quest_usage: sub-field merge (REGENT + SAGE coexist).
          - Arrays: replaced entirely by patch value when present.
          - parent_move_id: set once; ignored in patch if already present.

        Returns:
            (updated_packet, updated_record)
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        packet = self.deserialize_packet(record.packet_json)

        sub = packet.get_sub_packet(face)
        if sub is None:
            return packet, record  # face not enabled; no-op

        existing = sub.payload
        existing_data = existing.model_dump()

        # Deep-merge bar_integration
        if "bar_integration" in patch and patch["bar_integration"] is not None:
            existing_bar = existing_data.get("bar_integration") or {}
            patch["bar_integration"] = {**existing_bar, **patch["bar_integration"]}

        # Deep-merge quest_usage
        if "quest_usage" in patch and patch["quest_usage"] is not None:
            existing_qu = existing_data.get("quest_usage") or {}
            patch["quest_usage"] = {**existing_qu, **patch["quest_usage"]}

        # parent_move_id: set once only
        if "parent_move_id" in patch:
            if existing_data.get("parent_move_id") is not None:
                patch.pop("parent_move_id")

        merged = {**existing_data, **patch}

        from app.orientation_quest.models import FaceSubPacketPayload
        new_payload = FaceSubPacketPayload.model_validate(merged)

        from copy import copy
        updated_sub = copy(sub)
        updated_sub.payload = new_payload

        updated_subs = dict(packet.face_sub_packets)
        updated_subs[face] = updated_sub

        packet = packet.model_copy(
            update={
                "face_sub_packets": updated_subs,
                "updated_at": datetime.now(UTC),
            }
        )

        updated_record = self._upsert_checkpoint(
            packet_id, packet, CheckpointName.PAYLOAD_PATCH, current_node_id
        )
        return packet, updated_record

    def submit_face(
        self,
        packet_id: str,
        face: GameMasterFace,
        quest_proposal_id: str,
        current_node_id: str | None = None,
    ) -> tuple[OrientationMetaPacket, OrientationSessionRecord]:
        """Mark face as complete with questProposalId; persist at FACE_SUBMIT.

        Also advances sessionState to 'submitted' when at least one face is complete.

        Returns:
            (updated_packet, updated_record)
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        packet = self.deserialize_packet(record.packet_json)

        sub = packet.get_sub_packet(face)
        if sub is None:
            return packet, record

        now = datetime.now(UTC)
        from copy import copy
        updated_sub = copy(sub)
        updated_sub.state = FaceSubPacketState.COMPLETE
        updated_sub.quest_proposal_id = quest_proposal_id
        updated_sub.submitted_at = now

        updated_subs = dict(packet.face_sub_packets)
        updated_subs[face] = updated_sub

        # Advance sessionState to 'submitted' when at least one face is complete
        any_complete = any(
            sp.state == FaceSubPacketState.COMPLETE
            for sp in updated_subs.values()
        )
        new_state = (
            SessionState.CLOSED
            if packet.session_state == SessionState.CLOSED
            else (SessionState.SUBMITTED if any_complete else packet.session_state)
        )

        packet = packet.model_copy(
            update={
                "face_sub_packets": updated_subs,
                "session_state": new_state,
                "updated_at": now,
            }
        )

        updated_record = self._upsert_checkpoint(
            packet_id, packet, CheckpointName.FACE_SUBMIT, current_node_id
        )
        return packet, updated_record

    def skip_face(
        self,
        packet_id: str,
        face: GameMasterFace,
    ) -> tuple[OrientationMetaPacket, OrientationSessionRecord]:
        """Mark face as skipped; persist at FACE_SKIP.

        Returns:
            (updated_packet, updated_record)
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        packet = self.deserialize_packet(record.packet_json)

        sub = packet.get_sub_packet(face)
        if sub is None:
            return packet, record

        from copy import copy
        updated_sub = copy(sub)
        updated_sub.state = FaceSubPacketState.SKIPPED

        updated_subs = dict(packet.face_sub_packets)
        updated_subs[face] = updated_sub

        packet = packet.model_copy(
            update={
                "face_sub_packets": updated_subs,
                "updated_at": datetime.now(UTC),
            }
        )

        updated_record = self._upsert_checkpoint(
            packet_id, packet, CheckpointName.FACE_SKIP
        )
        return packet, updated_record

    def close_session(
        self,
        packet_id: str,
    ) -> tuple[OrientationMetaPacket, OrientationSessionRecord]:
        """Set sessionState to 'closed' and clear activeFace; persist at SESSION_CLOSE.

        Returns:
            (updated_packet, updated_record)
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        packet = self.deserialize_packet(record.packet_json)

        packet = packet.model_copy(
            update={
                "session_state": SessionState.CLOSED,
                "active_face": None,
                "updated_at": datetime.now(UTC),
            }
        )

        updated_record = self._upsert_checkpoint(
            packet_id, packet, CheckpointName.SESSION_CLOSE
        )
        return packet, updated_record

    # ------------------------------------------------------------------
    # Abandonment management (SLA fallback path)
    # ------------------------------------------------------------------

    def is_abandoned(
        self,
        record: OrientationSessionRecord,
        threshold: timedelta = DEFAULT_ABANDONMENT_THRESHOLD,
        now: datetime | None = None,
    ) -> bool:
        """Return True when the active session has been inactive beyond the threshold.

        A session that is 'submitted' or 'closed' is complete — not abandoned.
        A session with an explicit abandonedAt stamp is already marked abandoned.

        Args:
            record:    OrientationSessionRecord from the DB.
            threshold: Inactivity threshold (default 24 h).
            now:       Reference time (default: datetime.now(utc)).
        """
        if record.session_state in ("submitted", "closed"):
            return False
        if record.abandoned_at is not None:
            return True
        reference = now or datetime.now(UTC)
        checkpoint_dt = record.checkpoint_at
        if checkpoint_dt.tzinfo is None:
            checkpoint_dt = checkpoint_dt.replace(tzinfo=UTC)
        return (reference - checkpoint_dt) > threshold

    def mark_abandoned(
        self,
        packet_id: str,
        now: datetime | None = None,
    ) -> OrientationSessionRecord:
        """Stamp abandonedAt on a session that has exceeded the inactivity threshold.

        This is the ONLY path that sets abandonedAt.  Normal checkpoint writes
        never touch this field.

        Also closes the packet (sessionState → closed, activeFace → None).

        Args:
            packet_id: Natural key for the session.
            now:       Reference time for the abandonedAt stamp (default: utc now).

        Returns:
            The updated OrientationSessionRecord.
        """
        record = self.get_by_packet_id_or_raise(packet_id)
        reference = now or datetime.now(UTC)

        # Close the packet state
        try:
            packet = self.deserialize_packet(record.packet_json)
            packet = packet.model_copy(
                update={
                    "session_state": SessionState.CLOSED,
                    "active_face": None,
                    "updated_at": reference,
                }
            )
            record.packet_json = self.serialize_packet(packet)
        except Exception:
            # Even if packet JSON is corrupt, still mark the record abandoned
            pass

        record.session_state = "abandoned"
        record.abandoned_at = reference
        record.checkpoint_at = reference
        record.last_checkpoint = CheckpointName.SESSION_CLOSE.value
        self._db.flush()
        return record

    # ------------------------------------------------------------------
    # Convenience: find or create session for a player + path
    # ------------------------------------------------------------------

    def find_resumable_session(
        self,
        player_id: str,
        submission_path: SubmissionPath | None = None,
        threshold: timedelta = DEFAULT_ABANDONMENT_THRESHOLD,
    ) -> OrientationSessionRecord | None:
        """Find the most recent resumable (active, non-abandoned) session for a player.

        Optionally filter by submission_path.

        A session is resumable when:
          - sessionState == 'active'
          - abandonedAt is null
          - checkpointAt is within the threshold window

        Returns the most recently checkpointed qualifying session, or None.
        """
        query = (
            self._db.query(OrientationSessionRecord)
            .filter(
                OrientationSessionRecord.player_id == player_id,
                OrientationSessionRecord.session_state == "active",
                OrientationSessionRecord.abandoned_at.is_(None),
            )
        )
        if submission_path is not None:
            query = query.filter(
                OrientationSessionRecord.submission_path == submission_path.value
            )

        records = query.order_by(OrientationSessionRecord.checkpoint_at.desc()).all()
        now = datetime.now(UTC)
        for record in records:
            if not self.is_abandoned(record, threshold, now):
                return record
        return None
