"""Runtime guard stores for strand execution safety (rate-limit + idempotency)."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
from collections import deque
from typing import Protocol

from fastapi import HTTPException

try:
    from redis.asyncio import from_url as redis_from_url
except Exception:  # pragma: no cover - optional dependency in some environments
    redis_from_url = None


class RuntimeGuardStore(Protocol):
    async def enforce_rate_limit(self, actor_key: str, *, window_seconds: int, max_requests: int) -> None: ...

    async def idempotency_replay_or_mark_inflight(
        self,
        *,
        key: str,
        fingerprint: str,
        ttl_seconds: int,
        lock_seconds: int,
    ) -> dict | None: ...

    async def idempotency_store_success(
        self,
        *,
        key: str,
        fingerprint: str,
        result: dict,
        ttl_seconds: int,
    ) -> None: ...

    async def idempotency_clear_inflight(self, *, key: str) -> None: ...
    async def reset_for_tests(self) -> None: ...


class MemoryRuntimeGuardStore:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._rate_buckets: dict[str, deque[float]] = {}
        self._idempotency_cache: dict[str, tuple[float, str, dict]] = {}
        self._idempotency_inflight: dict[str, str] = {}

    async def enforce_rate_limit(self, actor_key: str, *, window_seconds: int, max_requests: int) -> None:
        now = time.monotonic()
        window = max(window_seconds, 1)
        limit = max(max_requests, 1)
        async with self._lock:
            bucket = self._rate_buckets.get(actor_key)
            if bucket is None:
                bucket = deque()
                self._rate_buckets[actor_key] = bucket
            while bucket and (now - bucket[0]) > window:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(status_code=429, detail="Strand rate limit exceeded")
            bucket.append(now)

    async def idempotency_replay_or_mark_inflight(
        self,
        *,
        key: str,
        fingerprint: str,
        ttl_seconds: int,
        lock_seconds: int,
    ) -> dict | None:
        now = time.monotonic()
        ttl = max(ttl_seconds, 1)
        async with self._lock:
            stale = [k for k, (ts, _, _) in self._idempotency_cache.items() if (now - ts) > ttl]
            for stale_key in stale:
                self._idempotency_cache.pop(stale_key, None)

            cached = self._idempotency_cache.get(key)
            if cached:
                _, cached_fingerprint, cached_result = cached
                if cached_fingerprint != fingerprint:
                    raise HTTPException(status_code=409, detail="Idempotency-Key reuse with different payload")
                return cached_result

            inflight_fingerprint = self._idempotency_inflight.get(key)
            if inflight_fingerprint:
                if inflight_fingerprint != fingerprint:
                    raise HTTPException(status_code=409, detail="Idempotency-Key already processing a different payload")
                raise HTTPException(status_code=409, detail="Idempotency-Key request is already in progress")

            self._idempotency_inflight[key] = fingerprint
            return None

    async def idempotency_store_success(
        self,
        *,
        key: str,
        fingerprint: str,
        result: dict,
        ttl_seconds: int,
    ) -> None:
        now = time.monotonic()
        async with self._lock:
            self._idempotency_inflight.pop(key, None)
            self._idempotency_cache[key] = (now, fingerprint, result)

    async def idempotency_clear_inflight(self, *, key: str) -> None:
        async with self._lock:
            self._idempotency_inflight.pop(key, None)

    async def reset_for_tests(self) -> None:
        async with self._lock:
            self._rate_buckets.clear()
            self._idempotency_cache.clear()
            self._idempotency_inflight.clear()


class RedisRuntimeGuardStore:
    def __init__(self, *, redis_url: str, key_prefix: str) -> None:
        if redis_from_url is None:
            raise RuntimeError("Redis runtime store requested but redis package is not installed")
        self._redis = redis_from_url(redis_url, decode_responses=True)
        self._prefix = key_prefix.strip() or "bars:strands"

    def _token(self, value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]

    def _rate_key(self, actor_key: str, window_seconds: int, bucket: int) -> str:
        token = self._token(actor_key)
        return f"{self._prefix}:rl:{window_seconds}:{bucket}:{token}"

    def _idem_data_key(self, key: str) -> str:
        return f"{self._prefix}:idem:data:{self._token(key)}"

    def _idem_lock_key(self, key: str) -> str:
        return f"{self._prefix}:idem:lock:{self._token(key)}"

    async def enforce_rate_limit(self, actor_key: str, *, window_seconds: int, max_requests: int) -> None:
        window = max(window_seconds, 1)
        limit = max(max_requests, 1)
        bucket = int(time.time() // window)
        redis_key = self._rate_key(actor_key, window, bucket)
        count = await self._redis.incr(redis_key)
        if count == 1:
            await self._redis.expire(redis_key, window + 5)
        if count > limit:
            raise HTTPException(status_code=429, detail="Strand rate limit exceeded")

    async def idempotency_replay_or_mark_inflight(
        self,
        *,
        key: str,
        fingerprint: str,
        ttl_seconds: int,
        lock_seconds: int,
    ) -> dict | None:
        data_key = self._idem_data_key(key)
        lock_key = self._idem_lock_key(key)
        cached_raw = await self._redis.get(data_key)
        if cached_raw:
            cached = json.loads(cached_raw)
            cached_fingerprint = cached.get("fingerprint")
            if cached_fingerprint != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key reuse with different payload")
            return cached.get("result")

        lock_ttl = max(lock_seconds, 1)
        locked = await self._redis.set(lock_key, fingerprint, nx=True, ex=lock_ttl)
        if locked:
            return None

        cached_raw = await self._redis.get(data_key)
        if cached_raw:
            cached = json.loads(cached_raw)
            cached_fingerprint = cached.get("fingerprint")
            if cached_fingerprint != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key reuse with different payload")
            return cached.get("result")

        inflight_fingerprint = await self._redis.get(lock_key)
        if inflight_fingerprint and inflight_fingerprint != fingerprint:
            raise HTTPException(status_code=409, detail="Idempotency-Key already processing a different payload")
        raise HTTPException(status_code=409, detail="Idempotency-Key request is already in progress")

    async def idempotency_store_success(
        self,
        *,
        key: str,
        fingerprint: str,
        result: dict,
        ttl_seconds: int,
    ) -> None:
        data_key = self._idem_data_key(key)
        lock_key = self._idem_lock_key(key)
        ttl = max(ttl_seconds, 1)
        payload = json.dumps({"fingerprint": fingerprint, "result": result}, separators=(",", ":"))
        async with self._redis.pipeline(transaction=True) as pipe:
            pipe.set(data_key, payload, ex=ttl)
            pipe.delete(lock_key)
            await pipe.execute()

    async def idempotency_clear_inflight(self, *, key: str) -> None:
        await self._redis.delete(self._idem_lock_key(key))

    async def reset_for_tests(self) -> None:
        return
