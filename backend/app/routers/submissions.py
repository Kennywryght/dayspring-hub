from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/submissions", tags=["Submissions"])

# Student: check own submission for an assignment
@router.get("/mine/{assignment_id}/")
async def get_my_submission(assignment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their submission")
    student_id = current_user.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student ID not found")
    sub = supabase.table("submissions").select("*").eq("assignment_id", assignment_id).eq("student_id", student_id).execute()
    if sub.data:
        return sub.data[0]
    return {}  # no submission yet

# Student submit
@router.post("/{assignment_id}/")
async def submit_assignment(
    assignment_id: str,
    file: Optional[UploadFile] = File(None),
    comment: Optional[str] = Form(""),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit")
    
    student_id = current_user.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student profile not found")
    
    assignment = supabase.table("assignments").select("*").eq("id", assignment_id).single().execute()
    if not assignment.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.data["class_id"] != current_user["class_id"]:
        raise HTTPException(status_code=403, detail="Assignment not for your class")
    
    if assignment.data.get("deadline"):
        if datetime.now(timezone.utc) > datetime.fromisoformat(assignment.data["deadline"]):
            raise HTTPException(status_code=400, detail="Deadline has passed")
    
    # check duplicate
    existing = supabase.table("submissions").select("id").eq("assignment_id", assignment_id).eq("student_id", student_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")
    
    file_url = None
    if file:
        filename = file.filename or "submission"
        storage_path = f"submissions/{assignment_id}/{student_id}/{uuid.uuid4()}-{filename}"
        contents = await file.read()
        supabase.storage.from_("learning-materials").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type}
        )
        file_url = supabase.storage.from_("learning-materials").get_public_url(storage_path)
    
    insert_data = {
        "assignment_id": assignment_id,
        "student_id": student_id,
        "file_url": file_url,
        "comment": comment or ""
    }
    result = supabase.table("submissions").insert(insert_data).execute()
    if result.data:
        return result.data[0]
    raise HTTPException(status_code=500, detail="Submission failed")

# Teacher view submissions for an assignment
@router.get("/{assignment_id}/")
async def get_submissions(assignment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view submissions")
    
    assignment = supabase.table("assignments").select("*").eq("id", assignment_id).single().execute()
    if not assignment.data or assignment.data["teacher_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your assignment")
    
    result = supabase.table("submissions").select("*, students(display_name)").eq("assignment_id", assignment_id).execute()
    return result.data