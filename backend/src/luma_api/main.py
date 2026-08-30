from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles

from luma_spikes.config import load_project_environment
from luma_spikes.pdf import MAX_PDF_BYTES, PDF_SIGNATURE

load_project_environment()

app = FastAPI(title="LUMA", version="0.1.0")


@app.get("/api/v1/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/api/v1/spike/upload")
async def upload_spike(file: UploadFile) -> dict[str, str | int]:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Only PDF uploads are supported.")

    size = 0
    signature = b""
    while data := await file.read(64 * 1024):
        if not signature:
            signature = data[: len(PDF_SIGNATURE)]
        size += len(data)
        if size > MAX_PDF_BYTES:
            raise HTTPException(status_code=413, detail="The PDF exceeds 20 MB.")

    if signature != PDF_SIGNATURE:
        raise HTTPException(status_code=415, detail="The file is not a valid PDF.")

    display_name = Path((file.filename or "upload.pdf").replace("\\", "/")).name
    return {
        "filename": display_name,
        "size_bytes": size,
        "status": "accepted",
    }


_default_frontend_dist = Path(__file__).resolve().parents[3] / "frontend" / "dist"
_frontend_dist = Path(os.getenv("LUMA_FRONTEND_DIST", _default_frontend_dist))
if _frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")

