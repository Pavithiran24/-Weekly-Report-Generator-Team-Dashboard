from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.routers import auth, dashboard, projects, reports, users


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    _seed_roles()
    yield


def _seed_roles() -> None:
    """Seed the default roles into the database if they don't exist."""
    # Import here to avoid circular imports at module load time
    from app.models.role import Role  # noqa: F401 — ensure model is loaded

    db: Session = SessionLocal()
    try:
        for role_name in ("member", "manager"):
            from app.models.role import Role

            exists = db.query(Role).filter(Role.name == role_name).first()
            if not exists:
                db.add(Role(name=role_name))
        db.commit()
    finally:
        db.close()


app = FastAPI(
    title="Weekly Report Generator & Team Dashboard API",
    description=(
        "REST API for managing weekly team reports, projects, and analytics. "
        "Supports role-based access control with 'member' and 'manager' roles."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(reports.router)
app.include_router(dashboard.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["root"])
def root() -> dict:
    return {"message": "Weekly Report API"}
