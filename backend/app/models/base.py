from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase

try:
    from cuid2 import cuid_wrapper
    _cuid_generator = cuid_wrapper()
    def generate_cuid() -> str:
        return _cuid_generator()
except ImportError:
    import uuid
    def generate_cuid() -> str:
        return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass
