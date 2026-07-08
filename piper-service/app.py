"""
Piper TTS local micro-service.

POST /synthesize  { text, gender: "female"|"male", speaker_id?: int }
  -> audio/wav bytes

GET  /healthz
GET  /voices      -> { female: <id>, male: <id>, all: [...] }

Defaults use known LibriTTS speakers:
  female -> 60 (Elizabeth)  — clear female voice
  male   -> 25 (p339)       — measured male voice
Override per-request with `speaker_id`. Speaker-id list read from the .onnx.json.
"""

from __future__ import annotations

import io
import json
import os
import wave
from pathlib import Path
from threading import Lock
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response
from piper import PiperVoice, SynthesisConfig

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = os.environ.get("PIPER_MODEL_PATH", str(MODELS_DIR / "en_US-libritts-high.onnx"))
MODEL_JSON_PATH = os.environ.get("PIPER_MODEL_JSON_PATH", MODEL_PATH + ".json")

DEFAULT_FEMALE_ID = int(os.environ.get("PIPER_DEFAULT_FEMALE", "60"))
DEFAULT_MALE_ID = int(os.environ.get("PIPER_DEFAULT_MALE", "25"))

MAX_TEXT_LEN = int(os.environ.get("PIPER_MAX_TEXT_LEN", "5000"))

app = FastAPI(title="Piper TTS local", version="1.0.0")

_voice: Optional[PiperVoice] = None
_voice_lock = Lock()
_speaker_ids: dict[str, int] = {}
_all_speakers: list[str] = []


def _load_voice() -> PiperVoice:
    global _voice
    if _voice is not None:
        return _voice
    with _voice_lock:
        if _voice is not None:
            return _voice
        if not Path(MODEL_PATH).exists():
            raise RuntimeError(
                f"Piper model not found at {MODEL_PATH}. "
                f"Place en_US-libritts-high.onnx in piper-service/models/ "
                f"or set PIPER_MODEL_PATH."
            )
        _voice = PiperVoice.load(MODEL_PATH, config_path=MODEL_JSON_PATH)
        return _voice


def _load_speaker_ids() -> None:
    global _speaker_ids, _all_speakers
    if _speaker_ids:
        return
    cfg_path = Path(MODEL_JSON_PATH)
    if not cfg_path.exists():
        return
    try:
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        sid_map = cfg.get("speaker_id_map", {}) or {}
        _speaker_ids = {str(k): int(v[0]) if isinstance(v, list) else int(v) for k, v in sid_map.items()}
        _all_speakers = sorted(_speaker_ids.keys())
    except Exception as e:
        print(f"[piper] failed to parse speaker_id_map: {e}")


def _resolve_speaker(gender: str, speaker_id: Optional[int]) -> int:
    if speaker_id is not None:
        return int(speaker_id)
    g = (gender or "").lower().strip()
    if g == "male":
        return DEFAULT_MALE_ID
    return DEFAULT_FEMALE_ID


def _synthesize_wav(text: str, speaker_id: int) -> bytes:
    voice = _load_voice()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        voice.synthesize_wav(
            text,
            wav,
            syn_config=SynthesisConfig(speaker_id=speaker_id),
        )
    return buf.getvalue()


@app.get("/healthz")
def healthz():
    try:
        _load_voice()
        _load_speaker_ids()
        return {"status": "ok", "model": Path(MODEL_PATH).name, "speakers": len(_all_speakers)}
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


@app.get("/voices")
def voices():
    _load_speaker_ids()
    return {
        "female": DEFAULT_FEMALE_ID,
        "male": DEFAULT_MALE_ID,
        "all": _all_speakers,
        "count": len(_all_speakers),
    }


@app.post("/synthesize")
async def synthesize(req: Request):
    try:
        body = await req.json()
    except Exception:
        body = {}
    text = str(body.get("text", "")).strip()
    gender = str(body.get("gender", "female")).lower().strip()
    speaker_id_raw = body.get("speaker_id")

    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text'.")
    if len(text) > MAX_TEXT_LEN:
        raise HTTPException(status_code=400, detail=f"Text exceeds {MAX_TEXT_LEN} chars.")

    if gender not in ("female", "male"):
        gender = "female"

    speaker_id = None
    if speaker_id_raw is not None:
        try:
            speaker_id = int(speaker_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="'speaker_id' must be an integer.")

    try:
        sid = _resolve_speaker(gender, speaker_id)
        wav_bytes = _synthesize_wav(text, sid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Piper synthesis failed: {e}")

    return Response(content=wav_bytes, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("PIPER_HOST", "0.0.0.0")
    port = int(os.environ.get("PIPER_PORT", "8000"))
    _load_speaker_ids()
    print(f"[piper] model: {MODEL_PATH}")
    print(f"[piper] defaults: female={DEFAULT_FEMALE_ID} male={DEFAULT_MALE_ID}")
    print(f"[piper] listening on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
