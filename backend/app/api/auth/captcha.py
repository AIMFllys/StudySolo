"""Captcha challenge and verification routes."""

import hashlib
import hmac
import os
import time

from fastapi import APIRouter, HTTPException

from app.models.user import CaptchaVerifyRequest

router = APIRouter()

CAPTCHA_SECRET = os.getenv("CAPTCHA_SECRET", "studysolo-captcha-2026")
_PIECE_L = 42
_PIECE_R = 9
_L = _PIECE_L + _PIECE_R * 2 + 3
_CANVAS_W = 320
_CAPTCHA_TOLERANCE = 6


def _s32(x: int) -> int:
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def _u32(x: int) -> int:
    return x & 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    return _s32(_s32(a) * _s32(b))


def _mulberry32(seed: int):
    state = [seed]

    def _next() -> float:
        state[0] = _s32(state[0])
        state[0] = _s32(state[0] + 0x6D2B79F5)
        a = state[0]
        t = _imul(a ^ (_u32(a) >> 15), _s32(1 | a))
        imul_r = _imul(_s32(t ^ (_u32(t) >> 7)), _s32(61 | t))
        t = _s32(_s32(t + imul_r) ^ t)
        return _u32(t ^ (_u32(t) >> 14)) / 4294967296

    return _next


def _compute_target_x(seed: int) -> int:
    rng = _mulberry32(seed)
    min_val = _L + 10
    max_val = _CANVAS_W - _L - 10
    return int(min_val + rng() * (max_val - min_val))


def verify_captcha_token(token: str) -> bool:
    """Verify slider captcha token issued by this backend."""
    try:
        parts = token.split(":", 1)
        if len(parts) != 2:
            return False
        ts_str, provided_hmac = parts
        ts = int(ts_str)
        if abs(time.time() - ts) > 300:
            return False
        expected = hmac.new(
            CAPTCHA_SECRET.encode(),
            ts_str.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, provided_hmac)
    except Exception:
        return False


@router.post("/captcha-challenge")
async def generate_captcha_challenge():
    """Generate a puzzle challenge for the frontend slider captcha."""
    seed = int.from_bytes(os.urandom(4), "big") % 100000
    target_x = _compute_target_x(seed)
    ts = str(int(time.time()))
    payload = f"{seed}:{target_x}:{ts}"
    sig = hmac.new(CAPTCHA_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    challenge = f"{seed}:{ts}:{sig}"
    return {"seed": seed, "challenge": challenge}


@router.post("/captcha-token")
async def verify_captcha_and_issue_token(body: CaptchaVerifyRequest):
    """Verify the user puzzle answer and return a signed verification token."""
    parts = body.challenge.split(":")
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="无效的验证挑战")

    seed_str, ts_str, provided_sig = parts
    try:
        seed = int(seed_str)
        ts = int(ts_str)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="无效的验证挑战") from exc

    if abs(time.time() - ts) > 300:
        raise HTTPException(status_code=400, detail="验证已过期，请刷新重试")

    target_x = _compute_target_x(seed)
    payload = f"{seed}:{target_x}:{ts_str}"
    expected_sig = hmac.new(CAPTCHA_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise HTTPException(status_code=400, detail="无效的验证挑战")

    if abs(body.x - target_x) > _CAPTCHA_TOLERANCE:
        raise HTTPException(status_code=400, detail="拼合不准确，请重试")

    token_ts = str(int(time.time()))
    token_hmac = hmac.new(
        CAPTCHA_SECRET.encode(),
        token_ts.encode(),
        hashlib.sha256,
    ).hexdigest()
    return {"token": f"{token_ts}:{token_hmac}"}
