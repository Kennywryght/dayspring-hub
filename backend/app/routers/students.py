# app/routers/students.py
from fastapi import APIRouter, HTTPException
from app.database import supabase

router = APIRouter(prefix="/classes/code", tags=["Students List"])

@router.get("/{code}/students/")
async def list_students_by_class_code(code: str):
    # Find class
    class_res = supabase.table("class_codes").select("class_id, active").eq("code", code.upper().strip()).eq("active", True).execute()
    if not class_res.data:
        raise HTTPException(status_code=404, detail="Class not found")
    class_id = class_res.data[0]["class_id"]
    
    # Get students in this class (via class_enrollments)
    students_res = supabase.table("students").select("id, display_name, avatar_emoji").eq("class_id", class_id).execute()
    return students_res.data