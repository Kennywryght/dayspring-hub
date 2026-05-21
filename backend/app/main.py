import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin
)

app = FastAPI(title="Dayspring Student Support Hub", version="1.0.0")

# Dynamically read allowed origins from environment variable.
# Fallback includes your production Vercel URL and localhost for development.
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "https://dayspring-hub.vercel.app,http://localhost:5173"
).split(",")

# Strip whitespace from each origin
allow_origins = [origin.strip() for origin in cors_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
routers = [
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin
]
for r in routers:
    app.include_router(r.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok"}