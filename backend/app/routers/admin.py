from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import bcrypt
import logging

logger = logging.getLogger(__name__)

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
    # Delete class_teachers assignments first
    supabase.table("class_teachers").delete().eq("class_id", class_id).execute()
    # Unassign students (set class_id to null)
    students = supabase.table("students").select("id").eq("class_id", class_id).execute()
    for s in students.data:
        supabase.table("students").update({"class_id": None}).eq("id", s["id"]).execute()
    # Delete the class
    supabase.table("classes").delete().eq("id", class_id).execute()
    return {"message": "Deleted"}

@router.put("/classes/{class_id}/")
async def update_class(class_id: str, name: str, grade: str = None, admin=Depends(require_admin)):
    data = {"name": name}
    if grade: data["grade"] = grade
    supabase.table("classes").update(data).eq("id", class_id).execute()
    return {"message": "Updated"}

# ==================== DETAILED CLASSES ====================
@router.get("/classes/detailed/")
async def list_classes_detailed(admin=Depends(require_admin)):
    try:
        classes = supabase.table("classes").select("*").execute()
        result = []
        for c in classes.data:
            assignments = supabase.table("class_teachers").select("*, profiles(full_name), subjects(name)").eq("class_id", c["id"]).execute()
            teachers = []
            for a in assignments.data:
                teachers.append({"teacher_name": a.get("profiles", {}).get("full_name", "Unknown"), "subject_name": a.get("subjects", {}).get("name", "Unknown")})
            students = supabase.table("students").select("id, display_name, student_number").eq("class_id", c["id"]).execute()
            linked = supabase.table("student_parents").select("student_id").execute()
            linked_ids = [row["student_id"] for row in linked.data] if linked.data else []
            student_list = []
            for s in students.data:
                student_list.append({"id": s["id"], "display_name": s["display_name"], "student_number": s["student_number"], "has_parent": s["id"] in linked_ids})
            result.append({"id": c["id"], "name": c["name"], "grade": c.get("grade"), "teachers": teachers, "students": student_list})
        return result
    except Exception as e:
        logger.error(f"Error fetching detailed classes: {e}")
        return []

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

@router.delete("/subjects/{subject_id}/")
async def delete_subject(subject_id: str, admin=Depends(require_admin)):
    supabase.table("subjects").delete().eq("id", subject_id).execute()
    return {"message": "Deleted"}

@router.put("/subjects/{subject_id}/")
async def update_subject(subject_id: str, name: str, admin=Depends(require_admin)):
    supabase.table("subjects").update({"name": name}).eq("id", subject_id).execute()
    return {"message": "Updated"}

# ==================== TEACHERS ====================
@router.get("/teachers/")
async def list_teachers(admin=Depends(require_admin)):
    res = supabase.table("profiles").select("id, full_name").eq("role", "teacher").execute()
    return res.data

@router.post("/teachers/")
async def create_teacher(email: str, password: str, full_name: str, admin=Depends(require_admin)):
    try:
        auth_res = supabase.auth.admin.create_user({"email": email, "password": password, "email_confirm": True, "user_metadata": {"role": "teacher", "full_name": full_name}})
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    user_id = auth_res.user.id
    supabase.table("profiles").insert({"id": user_id, "full_name": full_name, "role": "teacher"}).execute()
    return {"user_id": user_id, "email": email}

@router.delete("/teachers/{teacher_id}/")
async def delete_teacher(teacher_id: str, admin=Depends(require_admin)):
    # Remove class_teachers assignments
    supabase.table("class_teachers").delete().eq("teacher_id", teacher_id).execute()
    # Update classes that reference this teacher
    supabase.table("classes").update({"teacher_id": None}).eq("teacher_id", teacher_id).execute()
    # Delete profile
    supabase.table("profiles").delete().eq("id", teacher_id).execute()
    return {"message": "Deleted"}

@router.put("/teachers/{teacher_id}/")
async def update_teacher(teacher_id: str, full_name: str, admin=Depends(require_admin)):
    supabase.table("profiles").update({"full_name": full_name}).eq("id", teacher_id).execute()
    return {"message": "Updated"}

@router.get("/teachers/detailed/")
async def list_teachers_detailed(admin=Depends(require_admin)):
    try:
        teachers = supabase.table("profiles").select("id, full_name").eq("role", "teacher").execute()
        result = []
        for t in teachers.data:
            email = None
            try:
                user = supabase.auth.admin.get_user_by_id(t["id"])
                if user and user.user: email = user.user.email
            except Exception as e: logger.warning(f"Could not get email for teacher {t['id']}: {e}")
            assignments = supabase.table("class_teachers").select("*, classes(name), subjects(name)").eq("teacher_id", t["id"]).execute()
            classes = []
            for a in assignments.data:
                try:
                    students = supabase.table("students").select("id").eq("class_id", a["class_id"]).execute()
                    student_count = len(students.data) if students.data else 0
                except Exception: student_count = 0
                classes.append({"class_name": a.get("classes", {}).get("name", "Unknown"), "subject_name": a.get("subjects", {}).get("name", "Unknown"), "student_count": student_count})
            result.append({"id": t["id"], "full_name": t["full_name"], "email": email or "N/A", "classes": classes})
        return result
    except Exception as e:
        logger.error(f"Error fetching detailed teachers: {e}")
        return []

# ==================== PARENTS ====================
@router.get("/parents/")
async def list_parents(admin=Depends(require_admin)):
    res = supabase.table("profiles").select("id, full_name").eq("role", "parent").execute()
    return res.data

@router.post("/parents/")
async def create_parent(email: str, password: str, full_name: str, admin=Depends(require_admin)):
    try:
        auth_res = supabase.auth.admin.create_user({"email": email, "password": password, "email_confirm": True, "user_metadata": {"role": "parent", "full_name": full_name}})
    except Exception as e:
        raise HTTPException(400, detail=str(e))
    user_id = auth_res.user.id
    supabase.table("profiles").insert({"id": user_id, "full_name": full_name, "role": "parent"}).execute()
    existing_parent = supabase.table("parents").select("id").eq("profile_id", user_id).execute()
    if not existing_parent.data:
        supabase.table("parents").insert({"profile_id": user_id}).execute()
    return {"user_id": user_id, "email": email}

@router.delete("/parents/{parent_id}/")
async def delete_parent(parent_id: str, admin=Depends(require_admin)):
    parent_rec = supabase.table("parents").select("id").eq("profile_id", parent_id).execute()
    if parent_rec.data:
        supabase.table("student_parents").delete().eq("parent_id", parent_rec.data[0]["id"]).execute()
        supabase.table("parents").delete().eq("profile_id", parent_id).execute()
    supabase.table("profiles").delete().eq("id", parent_id).execute()
    return {"message": "Deleted"}

@router.put("/parents/{parent_id}/")
async def update_parent(parent_id: str, full_name: str, admin=Depends(require_admin)):
    supabase.table("profiles").update({"full_name": full_name}).eq("id", parent_id).execute()
    return {"message": "Updated"}

@router.get("/parents/detailed/")
async def list_parents_detailed(admin=Depends(require_admin)):
    try:
        parents = supabase.table("profiles").select("id, full_name").eq("role", "parent").execute()
        result = []
        for p in parents.data:
            email = None
            try:
                user = supabase.auth.admin.get_user_by_id(p["id"])
                if user and user.user: email = user.user.email
            except Exception as e: logger.warning(f"Could not get email for parent {p['id']}: {e}")
            students = []
            try:
                parent_rec = supabase.table("parents").select("id").eq("profile_id", p["id"]).execute()
                if parent_rec.data:
                    parent_db_id = parent_rec.data[0]["id"]
                    links = supabase.table("student_parents").select("student_id").eq("parent_id", parent_db_id).execute()
                    for link in links.data:
                        student = supabase.table("students").select("id, display_name, student_number, class_id").eq("id", link["student_id"]).single().execute()
                        if student.data:
                            class_name = "No class"
                            try:
                                class_data = supabase.table("classes").select("name").eq("id", student.data["class_id"]).single().execute()
                                if class_data.data: class_name = class_data.data["name"]
                            except Exception: pass
                            students.append({"id": student.data["id"], "display_name": student.data["display_name"], "student_number": student.data["student_number"], "class_name": class_name})
            except Exception as e: logger.warning(f"Error getting students for parent {p['id']}: {e}")
            result.append({"id": p["id"], "full_name": p["full_name"], "email": email or "N/A", "students": students})
        return result
    except Exception as e:
        logger.error(f"Error fetching detailed parents: {e}")
        return []

# ==================== ASSIGN TEACHER TO CLASS ====================
@router.post("/assign/")
async def assign_teacher(class_id: str, teacher_id: str, subject_id: str, admin=Depends(require_admin)):
    existing = supabase.table("class_teachers").select("id").eq("class_id", class_id).eq("teacher_id", teacher_id).eq("subject_id", subject_id).execute()
    if existing.data:
        raise HTTPException(400, detail="Already assigned")
    res = supabase.table("class_teachers").insert({"class_id": class_id, "teacher_id": teacher_id, "subject_id": subject_id}).execute()
    if res.data: return res.data[0]
    raise HTTPException(500, detail="Failed to assign")

@router.delete("/assign/{assignment_id}/")
async def unassign_teacher(assignment_id: str, admin=Depends(require_admin)):
    supabase.table("class_teachers").delete().eq("id", assignment_id).execute()
    return {"message": "Unassigned"}

@router.get("/assignments/")
async def list_assignments(admin=Depends(require_admin)):
    try:
        res = supabase.table("class_teachers").select("*, classes!inner(name), profiles!inner(full_name), subjects!inner(name)").execute()
        return res.data
    except Exception: return []

# ==================== STUDENTS ====================
@router.get("/students/")
async def list_all_students(admin=Depends(require_admin)):
    res = supabase.table("students").select("id, student_number, display_name, class_id").execute()
    return res.data

@router.get("/students/unassigned/")
async def list_unassigned_students(admin=Depends(require_admin)):
    all_students = supabase.table("students").select("id, student_number, display_name").execute()
    linked = supabase.table("student_parents").select("student_id").execute()
    linked_ids = [row["student_id"] for row in linked.data] if linked.data else []
    unassigned = [s for s in all_students.data if s["id"] not in linked_ids]
    return unassigned

@router.delete("/students/{student_id}/")
async def delete_student(student_id: str, admin=Depends(require_admin)):
    supabase.table("student_parents").delete().eq("student_id", student_id).execute()
    supabase.table("submissions").delete().eq("student_id", student_id).execute()
    supabase.table("student_responses").delete().eq("student_id", student_id).execute()
    supabase.table("students").delete().eq("id", student_id).execute()
    return {"message": "Deleted"}

@router.put("/students/{student_id}/")
async def update_student(student_id: str, display_name: str = None, student_number: str = None, class_id: str = None, admin=Depends(require_admin)):
    data = {}
    if display_name: data["display_name"] = display_name
    if student_number: data["student_number"] = student_number
    if class_id: data["class_id"] = class_id
    if data: supabase.table("students").update(data).eq("id", student_id).execute()
    return {"message": "Updated"}

# ==================== LINK/UNLINK STUDENT TO PARENT ====================
@router.post("/link-student-parent/")
async def link_student_parent(student_id: str, parent_id: str, admin: dict = Depends(require_admin)):
    try:
        logger.info(f"Linking student {student_id} to parent {parent_id}")
        student = supabase.table("students").select("id").eq("id", student_id).execute()
        if not student.data: raise HTTPException(404, detail="Student not found")
        profile = supabase.table("profiles").select("id, role, full_name").eq("id", parent_id).eq("role", "parent").execute()
        if not profile.data: raise HTTPException(404, detail="Parent not found or user is not a parent")
        parent_rec = supabase.table("parents").select("id").eq("profile_id", parent_id).execute()
        if not parent_rec.data:
            new_parent = supabase.table("parents").insert({"profile_id": parent_id}).execute()
            if new_parent.data: parent_db_id = new_parent.data[0]["id"]
            else: raise HTTPException(500, detail="Failed to create parent record")
        else: parent_db_id = parent_rec.data[0]["id"]
        existing_link = supabase.table("student_parents").select("id").eq("student_id", student_id).eq("parent_id", parent_db_id).execute()
        if existing_link.data: raise HTTPException(400, detail="Student is already linked to this parent")
        link_result = supabase.table("student_parents").insert({"student_id": student_id, "parent_id": parent_db_id}).execute()
        if not link_result.data: raise HTTPException(500, detail="Failed to create link")
        logger.info(f"Successfully linked student {student_id} to parent {parent_id}")
        return {"message": "Student linked to parent successfully"}
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error linking student to parent: {str(e)}")
        raise HTTPException(500, detail=f"Internal server error: {str(e)}")

@router.delete("/unlink-student-parent/")
async def unlink_student_parent(student_id: str, parent_id: str, admin=Depends(require_admin)):
    parent_rec = supabase.table("parents").select("id").eq("profile_id", parent_id).execute()
    if parent_rec.data:
        supabase.table("student_parents").delete().eq("student_id", student_id).eq("parent_id", parent_rec.data[0]["id"]).execute()
    return {"message": "Unlinked"}

# ==================== STATS ====================
@router.get("/stats/")
async def stats(admin=Depends(require_admin)):
    try:
        classes = supabase.table("classes").select("id", count="exact").execute()
        students = supabase.table("students").select("id", count="exact").execute()
        teachers = supabase.table("profiles").select("id", count="exact").eq("role", "teacher").execute()
        materials = supabase.table("materials").select("id", count="exact").execute()
        return {
            "classes": classes.count if hasattr(classes, 'count') else len(classes.data),
            "students": students.count if hasattr(students, 'count') else len(students.data),
            "teachers": teachers.count if hasattr(teachers, 'count') else len(teachers.data),
            "materials": materials.count if hasattr(materials, 'count') else len(materials.data)
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return {"classes": 0, "students": 0, "teachers": 0, "materials": 0}
    
    
# ==================== SOFT DELETE & RESTORE ====================
@router.put("/soft-delete/")
async def soft_delete_entity(type: str, id: str, admin=Depends(require_admin)):
    """Mark an entity as deleted (soft delete)"""
    table_map = {"class": "classes", "subject": "subjects", "teacher": "profiles", "parent": "profiles", "student": "students"}
    table = table_map.get(type)
    if not table: raise HTTPException(400, detail="Invalid type")
    supabase.table(table).update({"deleted": True, "deleted_at": "now()"}).eq("id", id).execute()
    return {"message": f"{type} marked as deleted"}

@router.put("/restore/")
async def restore_entity(type: str, id: str, admin=Depends(require_admin)):
    """Restore a soft-deleted entity"""
    table_map = {"class": "classes", "subject": "subjects", "teacher": "profiles", "parent": "profiles", "student": "students"}
    table = table_map.get(type)
    if not table: raise HTTPException(400, detail="Invalid type")
    supabase.table(table).update({"deleted": False, "deleted_at": None}).eq("id", id).execute()
    return {"message": f"{type} restored"}

@router.get("/deleted/")
async def list_deleted(admin=Depends(require_admin)):
    """Get all soft-deleted entities"""
    deleted = []
    for table in ["classes", "subjects", "students"]:
        res = supabase.table(table).select("id, name, deleted_at").eq("deleted", True).execute()
        for r in res.data: deleted.append({**r, "type": table[:-1]})
    for table in ["profiles"]:
        res = supabase.table(table).select("id, full_name, role, deleted_at").eq("deleted", True).execute()
        for r in res.data: deleted.append({"id": r["id"], "name": r.get("full_name", ""), "type": r.get("role", "unknown"), "deleted_at": r.get("deleted_at")})
    return deleted

@router.post("/create-student/")
async def create_student(student_number: str, password: str, display_name: str, class_id: str = None, admin=Depends(require_admin)):
    data = {"student_number": student_number, "password": password, "display_name": display_name}
    if class_id: data["class_id"] = class_id
    res = supabase.table("students").insert(data).execute()
    if res.data: return res.data[0]
    raise HTTPException(500, detail="Failed")