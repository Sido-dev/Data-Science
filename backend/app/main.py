import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from .database import engine, Base
from .routers import workspace

# V2 uses separate tables. Historical learning data remains in the database.
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Data Science Learning Workspace", version="2.0.0")
origins = [s.strip() for s in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://data-science-topaz.vercel.app").split(",") if s.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                   allow_methods=["GET", "POST", "PUT"],
                   allow_headers=["Authorization", "Content-Type", "X-Admin-Key"])

@app.middleware("http")
async def no_cache_private(request: Request, call_next):
    # Reject oversized requests early. The streaming guard also covers chunked uploads.
    if request.method in ("POST", "PUT"):
        total = 0
        chunks = []
        async for chunk in request.stream():
            total += len(chunk)
            if total > 2_000_000:
                return JSONResponse({"detail": "Request is too large."}, status_code=413)
            chunks.append(chunk)
        request._body = b"".join(chunks)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.url.path.startswith("/api/v2/"):
        response.headers["Cache-Control"] = "no-store"
    return response

# The legacy email-only login and unprotected user-ID endpoints are deliberately
# not mounted. They must not expose private learning data on a public deployment.
app.include_router(workspace.router, prefix="/api/v2")

@app.get("/")
def health():
    return {"service": "Data Science Learning Workspace", "version": "2.0.0", "ok": True}
