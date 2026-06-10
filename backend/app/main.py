import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin, quiz
)

# ------------------------------------------------------------------
# Logging (optional – helps to see that the server is alive)
# ------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dayspring")

# ------------------------------------------------------------------
# Application
# ------------------------------------------------------------------
app = FastAPI(title="Dayspring Student Support Hub", version="1.0.0")

# ------------------------------------------------------------------
# CORS – reads allowed origins from environment variable
# ------------------------------------------------------------------
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "https://dayspring-hub.vercel.app,http://localhost:5173"
).split(",")

allow_origins = [origin.strip() for origin in cors_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Register all routers
# ------------------------------------------------------------------
routers = [
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin, quiz
]

for r in routers:
    app.include_router(r.router, prefix="/api/v1")

# ------------------------------------------------------------------
# Root health check
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok"}

# ------------------------------------------------------------------
# Startup event – friendly log
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Dayspring Student Support Hub is starting up")
    logger.info(f"Allowed origins: {allow_origins}")