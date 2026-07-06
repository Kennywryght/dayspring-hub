from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.utils.auth import get_current_user
from app.redis_config import cache_response, invalidate_cache

router = APIRouter(prefix="/teacher", tags=["Teacher"])

@router.get("/classes/")
@cache_response(ttl=600, key_prefix="teacher_classes", user_specific=True)
async def get_my_classes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        return []
    class_ids = current_user.get("class_ids", [])
    if not class_ids:
        return []
    res = supabase.table("classes").select("id, name, grade").in_("id", class_ids).execute()
    return res.data

@router.post("/classes/")
async def add_teacher_class(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can add classes")
    
    # Invalidate teacher classes cache
    invalidate_cache(f"teacher_classes:user_{current_user['user_id']}")
    
    # Add class to teacher
    supabase.table("class_teachers").insert({
        "class_id": class_id,
        "teacher_id": current_user["user_id"]
    }).execute()
    
    return {"message": "Class added successfully"}