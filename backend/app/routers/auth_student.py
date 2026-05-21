from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import supabase
from app.config import JWT_SECRET, JWT_ALGORITHM
from jose import jwt
import bcrypt
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth/student", tags=["Student Auth"])

class StudentLogin(BaseModel):
    student_number: str
    password: str

@router.post("/login/")
async def student_login(data: StudentLogin):
    # Fetch student
    student_res = supabase.table("students").select("id, password_hash, display_name, class_id, grade").eq("student_number", data.student_number).execute()
    if not student_res.data:
        raise HTTPException(status_code=401, detail="Invalid student number or password")
    student = student_res.data[0]

    # Verify password
    stored_hash = student["password_hash"].encode('utf-8')
    if not bcrypt.checkpw(data.password.encode('utf-8'), stored_hash):
        raise HTTPException(status_code=401, detail="Invalid student number or password")

    # Generate JWT
    payload = {
        "sub": student["id"],
        "role": "student",
        "class_id": student["class_id"],
        "display_name": student["display_name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": student["id"],
            "role": "student",
            "display_name": student["display_name"],
            "class_id": student["class_id"],
            "grade": student.get("grade")
        }
    }