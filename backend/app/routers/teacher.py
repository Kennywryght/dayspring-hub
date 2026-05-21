from fastapi import APIRouter, Depends
from app.database import supabase
from app.utils.auth import get_current_user

router = APIRouter(prefix="/teacher", tags=["Teacher"])

@router.get("/classes/")
async def get_my_classes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        return []
    class_ids = current_user.get("class_ids", [])
    if not class_ids:
        return []
    res = supabase.table("classes").select("id, name, grade").in_("id", class_ids).execute()
    return res.data