# Piper local TTS service

Local fallback TTS for the vv-method-platform. Runs Piper neural TTS entirely
on your machine — no cloud keys, no per-call cost. Used by `api/tts.js` as the
last-resort provider when ElevenLabs / OpenAI / Deepgram / CambAI all fail or
are unconfigured. **Only reachable in local development** — Vercel production
does not call this service.

## Why local only

Piper's `libritts-high` model is ~130 MB. Vercel serverless functions cap at
50 MB (250 MB Pro), so the deployed `/api/tts.js` cannot host the model.
Local Piper keeps the production deployment unchanged while giving you a
guaranteed fallback during development.

## Setup

1. **Install Python deps**

   ```powershell
   cd piper-service
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Add the model**

   Copy the LibriTTS model you downloaded into `models/`:

   ```powershell
   Copy-Item "$env:USERPROFILE\Downloads\en_US-libritts-high.onnx"      models\
   Copy-Item "$env:USERPROFILE\Downloads\en_US-libritts-high.onnx.json" models\
   ```

3. **Wire Vercel dev to use Piper fallback**

   In the Platform root (parent of this folder), add to `.env.local`:

   ```
   PIPER_LOCAL_URL=http://localhost:8000
   ```

   `api/tts.js` reads this and tries Piper last in the provider chain.
   When unset (production), the Piper provider is skipped entirely.

4. **Run Piper**

   ```powershell
   .venv\Scripts\python app.py
   ```

   First launch loads the .onnx (cold start ~3–8 s depending on CPU). Subsequent
   `/synthesize` calls return audio in <500 ms for short sentences.

5. **Smoke test**

   ```powershell
   curl -X POST http://localhost:8000/synthesize `
     -H "Content-Type: application/json" `
     -d '{\"text\":\"Hello world\",\"gender\":\"female\"}' `
     -o test.wav
   ```

   Open `test.wav` — you should hear a female voice. Try `gender:male` too.

## Endpoints

| Method | Path          | Body / Query                                  | Response            |
|--------|---------------|-----------------------------------------------|---------------------|
| POST   | `/synthesize` | `{ "text": "...", "gender": "female"\|"male", "speaker_id"?: 60 }` | `audio/wav` bytes |
| GET    | `/voices`     | —                                             | `{ female, male, all[], count }` |
| GET    | `/healthz`    | —                                             | `{ status, model, speakers }`     |

## Choosing voices

The LibriTTS model has **904 speakers**. `GET /voices` returns the full mapping.
Defaults (overridable via env):

- `PIPER_DEFAULT_FEMALE=60` — clear female voice
- `PIPER_DEFAULT_MALE=25` — measured male voice

To preview alternatives, pass `speaker_id` directly:

```powershell
curl -X POST http://localhost:8000/synthesize `
  -H "Content-Type: application/json" `
  -d '{\"text\":\"Testing\",\"speaker_id\":15}' -o preview.wav
```

Speaker IDs map to LibriTTS speaker codes (e.g. `p22`, `p2531`) listed in the
`.onnx.json` `speaker_id_map`. Pick any two you like and set them as defaults.

## How Vercel falls back

In `api/tts.js`, providers run in this order:

1. ElevenLabs
2. Deepgram
3. CambAI
4. OpenAI
5. **Piper local** (only when `PIPER_LOCAL_URL` is set)

If a higher provider throws (missing key, network error, quota), the service
moves to the next. Piper is the safety net — works even if every cloud key is
empty. Production deployments don't set `PIPER_LOCAL_URL` so they stop at #4.

## Troubleshooting

- **`Piper model not found`** — put the .onnx and .onnx.json in `piper-service/models/` or set `PIPER_MODEL_PATH`.
- **`espeak-ng` errors** — `piper-tts` bundles espeak-ng on Linux/macOS; on Windows install it via `choco install espeak-ng` or run inside WSL.
- **Slow first call** — the model loads lazily on first `/synthesize`. Subsequent calls reuse the in-memory `PiperVoice`.
- **Cold start memory** — ~600 MB RAM. Use Python 3.11+ for best onnxruntime perf.
