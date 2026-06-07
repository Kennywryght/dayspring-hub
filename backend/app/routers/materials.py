from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import uuid

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.post("/")
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(""),
    file: Optional[UploadFile] = File(None),
    icon: Optional[str] = Form("📚"),
    audio: Optional[UploadFile] = File(None),
    class_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    # Logging for debugging
    print(f"=== POST /materials ===")
    print(f"User role: {current_user['role']}")
    print(f"Received class_id from form: '{class_id}' (type: {type(class_id)})")
    print(f"User's class_ids list: {current_user.get('class_ids', [])}")

    # Role check
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload")

    # Class ID presence check
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")
    
    # Normalize class_id to string (it already is, but ensure no extra whitespace)
    class_id = class_id.strip()
    
    # Authorization: teacher must be assigned to this class
    user_class_ids = current_user.get("class_ids", [])
    if class_id not in user_class_ids:
        print(f"Authorization failed: {class_id} not in {user_class_ids}")
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    # File upload handling
    file_url = None
    material_type = "link"

    if file:
        filename = file.filename or "file"
        if filename.lower().endswith('.pdf'):
            material_type = "pdf"
        elif filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            material_type = "image"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Allowed: PDF, PNG, JPG, JPEG, GIF, WEBP")

        storage_path = f"materials/{class_id}/{uuid.uuid4()}-{filename}"
        contents = await file.read()

        try:
            supabase.storage.from_("learning-materials").upload(
                path=storage_path,
                file=contents,
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
            file_url = supabase.storage.from_("learning-materials").get_public_url(storage_path)
        except Exception as e:
            print(f"File upload error: {e}")
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # Audio upload handling
    audio_url = None
    if audio:
        # Ensure unique filename
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
            print(f"Audio upload error: {e}")
            raise HTTPException(status_code=500, detail=f"Audio upload failed: {str(e)}")

    # Prepare data for Supabase 'materials' table
    insert_data = {
        "title": title,
        "description": description or "",
        "icon": icon,
        "audio_url": audio_url,
        "type": material_type,
        "file_url": file_url,
        "class_id": class_id,
        "uploaded_by": current_user["user_id"]
    }

    # Insert into database
    try:
        result = supabase.table("materials").insert(insert_data).execute()
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to save material - no data returned")
    except Exception as e:
        print(f"Database insert error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/")
async def list_materials(
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

    result = supabase.table("materials").select("*").eq("class_id", effective_class_id).order("created_at", desc=True).execute()
    return result.data

@router.delete("/{material_id}/")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete")

    mat = supabase.table("materials").select("*").eq("id", material_id).single().execute()
    if not mat.data or mat.data["uploaded_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your material")

    supabase.table("materials").delete().eq("id", material_id).execute()
    return {"message": "Deleted"}