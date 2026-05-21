from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import bcrypt

router = APIRouter(prefix="/students", tags=["Student Management"])

class StudentCreate(BaseModel):
    student_number: str
    password: str
    display_name: str
    grade: Optional[str] = None
    class_id: str   # teacher must provide this

@router.get("/")
async def list_students(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    if class_id not in current_user.get("class_ids", []):
        raise HTTPException(status_code=403, detail="Not your class")
    result = supabase.table("students").select("id, student_number, display_name, grade").eq("class_id", class_id).execute()
    return result.data

@router.post("/")
async def add_student(data: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers")
    if data.class_id not in current_user.get("class_ids", []):
        raise HTTPException(status_code=403, detail="Not your class")
    
    # Check unique student_number
    existing = supabase.table("students").select("id").eq("student_number", data.student_number).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Student number already exists")
    
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    result = supabase.table("students").insert({
        "student_number": data.student_number,
        "password_hash": password_hash,
        "display_name": data.display_name,
        "grade": data.grade,
        "class_id": data.class_id
    }).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to add student")