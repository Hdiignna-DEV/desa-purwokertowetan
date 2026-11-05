import sys
from pathlib import Path

# Entry point Vercel Serverless Function: memakai FastAPI dari folder backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from server import app  # noqa: E402,F401
