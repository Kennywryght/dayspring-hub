from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import bcrypt

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- Verify super_admin role ---
async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# --- Classes ---
@router.get("/classes/")
async def list_classes(admin=Depends(require_admin)):
    res = supabase.table("classes").select("*").execute()
    return res.data

@router.post("/classes/")
async def create_class(name: str, grade: Optional[str] = None, admin=Depends(require_admin)):
    # teacher_id is no longer required
    data = {"name": name, "grade": grade}
    res = supabase.table("classes").insert(data).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(500, detail="Failed to create class")

@router.delete("/classes/{class_id}/")
async def delete_class(class_id: str, admin=Depends(require_admin)):
    supabase.table("classes").delete().eq("id", class_id).execute()
    return {"message": "Deleted"}

# --- Subjects ---
@router.get("/subjects/")
async def list_subjects(admin=Depends(require_admin)):
    res = supabase.table("subjects").select("*").execute()
    return res.data

@router.post("/subjects/")
async def create_subject(name: str, admin=Depends(require_admin)):
    res = supabase.table("subjects").insert({"name": name}).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(500, detail="Failed to create subject")

# --- Teachers ---
@router.get("/teachers/")
async def list_teachers(admin=Depends(require_admin)):
    # Return profiles with role 'teacher'
    res = supabase.table("profiles").select("id, full_name").eq("role", "teacher").execute()
    return res.data

@router.post("/teachers/")
async def create_teacher(email: str, password: str, full_name: str, admin=Depends(require_admin)):
    # Create auth user
    try:
        auth_res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"role": "teacher", "full_name": full_name}
        })
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    user_id = auth_res.user.id
    # Create profile
    supabase.table("profiles").insert({
        "id": user_id,
        "full_name": full_name,
        "role": "teacher"
    }).execute()
    return {"user_id": user_id, "email": email}

# --- Assign teacher to class with subject ---
@router.post("/assign/")
async def assign_teacher(class_id: str, teacher_id: str, subject_id: str, admin=Depends(require_admin)):
    # Check if assignment already exists
    existing = supabase.table("class_teachers")\
        .select("id")\
        .eq("class_id", class_id)\
        .eq("teacher_id", teacher_id)\
        .eq("subject_id", subject_id)\
        .execute()
    if existing.data:
        raise HTTPException(400, detail="Already assigned")
    res = supabase.table("class_teachers").insert({
        "class_id": class_id,
        "teacher_id": teacher_id,
        "subject_id": subject_id
    }).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(500, detail="Failed to assign")

@router.get("/assignments/")
async def list_assignments(admin=Depends(require_admin)):
    # Fetch assignments with joined data (handle missing tables gracefully)
    try:
        res = supabase.table("class_teachers")\
            .select("*, classes!inner(name), profiles!inner(full_name), subjects!inner(name)")\
            .execute()
        return res.data
    except Exception:
        return []   # return empty if tables don't exist yet

# --- Stats ---
@router.get("/stats/")
async def stats(admin=Depends(require_admin)):
    # These counts may fail if tables don't exist; we'll wrap them safely
    try:
        classes = supabase.table("classes").select("id", count="exact").execute()
        students = supabase.table("students").select("id", count="exact").execute()
        teachers = supabase.table("profiles").select("id", count="exact").eq("role", "teacher").execute()
        materials = supabase.table("materials").select("id", count="exact").execute()
        return {
            "classes": classes.count if hasattr(classes, 'count') else 0,
            "students": students.count if hasattr(students, 'count') else 0,
            "teachers": teachers.count if hasattr(teachers, 'count') else 0,
            "materials": materials.count if hasattr(materials, 'count') else 0
        }
    except Exception:
        return {"classes": 0, "students": 0, "teachers": 0, "materials": 0}