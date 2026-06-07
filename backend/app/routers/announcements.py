from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user

router = APIRouter(prefix="/announcements", tags=["Announcements"])

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    class_id: Optional[str] = None

@router.post("/")
async def create_announcement(data: AnnouncementCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can post")

    # Accept the class_id from the request body
    class_id = data.class_id

    # If class_id is empty or missing, reject
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required (send it in the request body)")

    # Verify the teacher is assigned to this class
    if class_id not in current_user.get("class_ids", []):
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    result = supabase.table("announcements").insert({
        "title": data.title,
        "content": data.content,
        "class_id": class_id,
        "teacher_id": current_user["user_id"]
    }).execute()

    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to post announcement")


@router.get("/")
async def list_announcements(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    effective_class_id = None

    if current_user["role"] == "teacher":
        if not class_id:
            raise HTTPException(status_code=400, detail="class_id query parameter required")
        if class_id not in current_user.get("class_ids", []):
            raise HTTPException(status_code=403, detail="Not your class")
        effective_class_id = class_id

    elif current_user["role"] == "parent":
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id query parameter required")
        if student_id not in current_user.get("student_ids", []):
            raise HTTPException(status_code=403, detail="Not your child")
        student = supabase.table("students").select("class_id").eq("id", student_id).single().execute()
        if not student.data:
            raise HTTPException(status_code=404, detail="Student not found")
        effective_class_id = student.data["class_id"]

    elif current_user["role"] == "student":
        effective_class_id = current_user.get("class_id")

    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    if not effective_class_id:
        raise HTTPException(status_code=400, detail="No class associated")

    result = (
        supabase.table("announcements")
        .select("*")
        .eq("class_id", effective_class_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data