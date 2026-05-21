from fastapi import APIRouter, Depends
from app.database import supabase
from app.utils.auth import get_current_user

router = APIRouter(prefix="/parent", tags=["Parent"])

@router.get("/students/")
async def get_my_students(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "parent":
        return []
    student_ids = current_user.get("student_ids", [])
    if not student_ids:
        return []
    # Fetch students details
    result = supabase.table("students").select("id, student_number, display_name, class_id").in_("id", student_ids).execute()
    return result.data