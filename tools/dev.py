#!/usr/bin/env python3
"""FastAPI(8000) + Vite(5173) 를 같이 켠다."""
import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NODE = Path("/tmp/node-v22.14.0-darwin-arm64/bin")
env = os.environ.copy()
if NODE.exists():
    env["PATH"] = str(NODE) + os.pathsep + env.get("PATH", "")

uv = shutil.which("uvicorn", path=env["PATH"]) or str(Path.home() / "Library/Python/3.9/bin/uvicorn")
procs = []

def stop(*_):
    for p in procs:
        p.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)

api = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "server.main:app", "--reload", "--port", "8000"],
    cwd=ROOT, env=env,
)
procs.append(api)
web = subprocess.Popen(["npm", "run", "dev"], cwd=ROOT / "app", env=env)
procs.append(web)
print("  API  http://127.0.0.1:8000")
print("  WEB  http://127.0.0.1:5173")
api.wait()
