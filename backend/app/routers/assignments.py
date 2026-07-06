from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
from app.redis_config import cache_response, invalidate_cache, invalidate_all_assignments
import uuid

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/")
async def create_assignment(
    title: str = Form(...),
    description: Optional[str] = Form(""),
    icon: Optional[str] = Form("📝"),
    audio: Optional[UploadFile] = File(None),
    deadline: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    class_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")

    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")
    if class_id not in current_user.get("class_ids", []):
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    # Invalidate caches
    invalidate_all_assignments()
    invalidate_cache(f"assignments:class_{class_id}*")

    file_url = None
    if file:
        filename = file.filename or "assignment_file"
        storage_path = f"assignments/{class_id}/{uuid.uuid4()}-{filename}"
        contents = await file.read()
        try:
            supabase.storage.from_("learning-materials").upload(
                path=storage_path,
                file=contents,
                file_options={"content-type": file.content_type}
            )
            file_url = supabase.storage.from_("learning-materials").get_public_url(storage_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    audio_url = None
    if audio:
        audio_filename = f"audio/{uuid.uuid4()}.webm"
        audio_contents = await audio.read()
        try:
            supabase.storage.from_("learning-materials").upload(
                path=audio_filename,
                file=audio_contents,
                file_options={"content-type": "audio/webm"}
            )
            audio_url = supabase.storage.from_("learning-materials").get_public_url(audio_filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Audio upload failed: {str(e)}")

    insert_data = {
        "title": title,
        "description": description or "",
        "icon": icon,
        "audio_url": audio_url,
        "class_id": class_id,
        "teacher_id": current_user["user_id"],
        "deadline": deadline if deadline else None,
        "file_url": file_url
    }
    result = supabase.table("assignments").insert(insert_data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Failed to create assignment")

@router.get("/")
@cache_response(ttl=300, key_prefix="assignments", class_specific=True)
async def list_assignments(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
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

    result = supabase.table("assignments").select("*").eq("class_id", effective_class_id).order("created_at", desc=True).execute()
    return result.data

@router.delete("/{assignment_id}/")
async def delete_assignment(assignment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete")
    ass = supabase.table("assignments").select("class_id").eq("id", assignment_id).single().execute()
    if not ass.data or ass.data.get("teacher_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your assignment")
    
    # Invalidate caches
    invalidate_all_assignments()
    if ass.data.get("class_id"):
        invalidate_cache(f"assignments:class_{ass.data['class_id']}*")
    
    supabase.table("assignments").delete().eq("id", assignment_id).execute()
    return {"message": "Deleted"}