import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import (
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin, quiz
)
from app.redis_config import RedisClient

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

# If no origins are configured, allow all (fallback for development)
if not allow_origins:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ------------------------------------------------------------------
# Middleware to log requests and ensure CORS headers on errors
# ------------------------------------------------------------------
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Credentials": "true",
            }
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
# Health check with Redis status
# ------------------------------------------------------------------
@app.get("/api/v1/health")
async def health_check():
    redis_client = RedisClient()
    redis_status = redis_client.get_stats() if redis_client.is_connected() else {"connected": False}
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "cors_origins": allow_origins
    }

# ------------------------------------------------------------------
# CORS pre-flight handler (explicit OPTIONS handler)
# ------------------------------------------------------------------
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# ------------------------------------------------------------------
# Startup event – friendly log
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Dayspring Student Support Hub is starting up")
    logger.info(f"Allowed origins: {allow_origins}")
    
    # Test Redis connection
    redis_client = RedisClient()
    if redis_client.is_connected():
        logger.info("✅ Redis is connected and ready")
    else:
        logger.warning("⚠️ Redis is not connected - caching will be disabled")