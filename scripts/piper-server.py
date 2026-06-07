#!/usr/bin/env python3
"""
piper-server.py — local Piper TTS server for MET Platform listening exercises.

Requirements:
  pip install piper-tts

Download a voice model first. Piper voices require TWO files:
  1. the .onnx model
  2. the matching .onnx.json config

Good English starting points for listening variety from voices.json:
  - US woman: en_US-lessac-medium or en_US-amy-medium
  - US man:   en_US-ryan-medium or en_US-hfc_male-medium
  - UK woman: en_GB-southern_english_female-low
  - UK man:   en_GB-northern_english_male-medium

Listen first:
  https://rhasspy.github.io/piper-samples

Download voices:
  https://huggingface.co/rhasspy/piper-voices/tree/main

Example — en_US lessac medium (~60 MB):
  python -c "
  from huggingface_hub import hf_hub_download
  hf_hub_download('rhasspy/piper-voices', 'en/en_US/lessac/medium/en_US-lessac-medium.onnx', local_dir='piper-models')
  hf_hub_download('rhasspy/piper-voices', 'en/en_US/lessac/medium/en_US-lessac-medium.onnx.json', local_dir='piper-models')
  "

Example — en_US ryan medium:
  python -c "
  from huggingface_hub import hf_hub_download
  hf_hub_download('rhasspy/piper-voices', 'en/en_US/ryan/medium/en_US-ryan-medium.onnx', local_dir='piper-models')
  hf_hub_download('rhasspy/piper-voices', 'en/en_US/ryan/medium/en_US-ryan-medium.onnx.json', local_dir='piper-models')
  "
  (or download the .onnx + .onnx.json from https://huggingface.co/rhasspy/piper-voices)

Usage:
  python scripts/piper-server.py --model piper-models/en/en_US/lessac/medium/en_US-lessac-medium.onnx
  python scripts/piper-server.py --model piper-models/en/en_US/ryan/medium/en_US-ryan-medium.onnx

The server listens on http://localhost:5050 by default.
  POST /tts  Content-Type: application/json  { "text": "Hello world" }  → audio/wav
"""

import argparse
import io
import json
import wave
from http.server import BaseHTTPRequestHandler, HTTPServer

from piper import PiperVoice

voice = None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress per-request log noise

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != '/tts':
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            text = json.loads(body).get('text', '').strip()
        except Exception:
            self.send_response(400)
            self.end_headers()
            return

        if not text:
            self.send_response(400)
            self.end_headers()
            return

        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav_out:
            voice.synthesize(text, wav_out)
        audio = buf.getvalue()

        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'audio/wav')
        self.send_header('Content-Length', str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)


def main():
    parser = argparse.ArgumentParser(description='Piper TTS local server')
    parser.add_argument('--model', required=True, help='Path to .onnx voice model')
    parser.add_argument('--port', type=int, default=5050)
    args = parser.parse_args()

    global voice
    print(f'Loading model: {args.model}')
    voice = PiperVoice.load(args.model)
    print(f'Piper TTS ready  →  http://localhost:{args.port}')
    print('Press Ctrl+C to stop.\n')
    HTTPServer(('localhost', args.port), Handler).serve_forever()


if __name__ == '__main__':
    main()
