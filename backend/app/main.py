from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth_teacher, auth_student, auth_parent,
    materials, assignments, submissions,
    announcements, students_crud, parent,
    admin, teacher, auth_admin
)

app = FastAPI(title="Dayspring Student Support Hub", version="1.0.0")

# CORS – allow your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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