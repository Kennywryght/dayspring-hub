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

# ==================== CLASSES ====================
@router.get("/classes/")
async def list_classes(admin=Depends(require_admin)):
    res = supabase.table("classes").select("*").execute()
    return res.data

@router.post("/classes/")
async def create_class(name: str, grade: Optional[str] = None, admin=Depends(require_admin)):
    data = {"name": name, "grade": grade}
    res = supabase.table("classes").insert(data).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(500, detail="Failed to create class")

@router.delete("/classes/{class_id}/")
async def delete_class(class_id: str, admin=Depends(require_admin)):
    supabase.table("classes").delete().eq("id", class_id).execute()
    return {"message": "Deleted"}

# ==================== SUBJECTS ====================
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

# ==================== TEACHERS ====================
@router.get("/teachers/")
async def list_teachers(admin=Depends(require_admin)):
    res = supabase.table("profiles").select("id, full_name").eq("role", "teacher").execute()
    return res.data

@router.post("/teachers/")
async def create_teacher(email: str, password: str, full_name: str, admin=Depends(require_admin)):
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
    supabase.table("profiles").insert({
        "id": user_id,
        "full_name": full_name,
        "role": "teacher"
    }).execute()
    return {"user_id": user_id, "email": email}

# ==================== PARENTS ====================
@router.get("/parents/")
async def list_parents(admin=Depends(require_admin)):
    res = supabase.table("profiles").select("id, full_name").eq("role", "parent").execute()
    return res.data

@router.post("/parents/")
async def create_parent(email: str, password: str, full_name: str, admin=Depends(require_admin)):
    try:
        auth_res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"role": "parent", "full_name": full_name}
        })
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    user_id = auth_res.user.id

    # Insert into profiles
    supabase.table("profiles").insert({
        "id": user_id,
        "full_name": full_name,
        "role": "parent"
    }).execute()

    # Ensure parents record exists
    supabase.table("parents").upsert({"profile_id": user_id}).execute()

    return {"user_id": user_id, "email": email}

# ==================== ASSIGN TEACHER TO CLASS ====================
@router.post("/assign/")
async def assign_teacher(class_id: str, teacher_id: str, subject_id: str, admin=Depends(require_admin)):
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
    try:
        res = supabase.table("class_teachers")\
            .select("*, classes!inner(name), profiles!inner(full_name), subjects!inner(name)")\
            .execute()
        return res.data
    except Exception:
        return []

# ==================== STUDENTS (ALL & UNASSIGNED) ====================
@router.get("/students/")
async def list_all_students(admin=Depends(require_admin)):
    res = supabase.table("students").select("id, student_number, display_name").execute()
    return res.data

@router.get("/students/unassigned/")
async def list_unassigned_students(admin=Depends(require_admin)):
    all_students = supabase.table("students").select("id, student_number, display_name").execute()
    linked = supabase.table("student_parents").select("student_id").execute()
    linked_ids = [row["student_id"] for row in linked.data] if linked.data else []
    unassigned = [s for s in all_students.data if s["id"] not in linked_ids]
    return unassigned

# ==================== LINK STUDENT TO PARENT ====================
@router.post("/link-student-parent/")
async def link_student_parent(
    student_id: str,
    parent_email: str,
    admin: dict = Depends(require_admin)
):
    # 1. Find parent auth user by email
    all_users = supabase.auth.admin.list_users()
    parent_user = None
    for u in all_users:
        if u.email == parent_email:
            parent_user = u
            break
    if not parent_user:
        raise HTTPException(404, detail="Parent with this email not found")

    # 2. Verify parent role
    profile_res = supabase.table("profiles")\
        .select("id, role")\
        .eq("id", parent_user.id)\
        .maybe_single()\
        .execute()
    if not profile_res.data or profile_res.data.get("role") != "parent":
        raise HTTPException(404, detail="User is not a parent")

    # 3. Get or create parent record
    parent_rec = supabase.table("parents")\
        .select("id")\
        .eq("profile_id", parent_user.id)\
        .maybe_single()\
        .execute()
    if not parent_rec.data:
        new_parent = supabase.table("parents").insert({"profile_id": parent_user.id}).execute()
        parent_id = new_parent.data[0]["id"]
    else:
        parent_id = parent_rec.data[0]["id"]

    # 4. Insert link
    try:
        supabase.table("student_parents").upsert({
            "student_id": student_id,
            "parent_id": parent_id
        }).execute()
    except Exception as e:
        raise HTTPException(400, detail="Could not link (maybe already linked)")

    return {"message": f"Student linked to parent {parent_email}"}


# ==================== STATS ====================
@router.get("/stats/")
async def stats(admin=Depends(require_admin)):
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