from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
import uuid

router = APIRouter(prefix="/materials", tags=["Materials"])

# ✅ Expanded allowed file types (covers most school documents, images, videos, audio)
ALLOWED_EXTENSIONS = {
    # Documents
    "pdf", "doc", "docx", "txt", "rtf", "odt",
    # Images
    "png", "jpg", "jpeg", "gif", "webp", "bmp",
    # Presentations
    "ppt", "pptx",
    # Spreadsheets
    "xls", "xlsx", "csv",
    # Video
    "mp4", "mov", "avi", "mkv", "webm", "flv",
    # Audio
    "mp3", "wav", "ogg", "wma", "aac",
}

def get_file_extension(filename: str):
    return filename.lower().split(".")[-1] if "." in filename else ""


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
    # ROLE CHECK
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can upload materials")

    # CLASS CHECK
    if not class_id:
        raise HTTPException(status_code=400, detail="class_id is required")

    class_id = class_id.strip()

    if class_id not in current_user.get("class_ids", []):
        raise HTTPException(status_code=403, detail="You are not assigned to this class")

    file_url = None
    audio_url = None
    material_type = "link"

    # =========================
    # FILE UPLOAD
    # =========================
    if file:
        filename = file.filename or ""
        ext = get_file_extension(filename)

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '.{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
            )

        # Determine material type based on extension
        if ext in ("pdf", "doc", "docx", "txt", "rtf", "odt"):
            material_type = "pdf"
        elif ext in ("png", "jpg", "jpeg", "gif", "webp", "bmp"):
            material_type = "image"
        elif ext in ("mp4", "mov", "avi", "mkv", "webm", "flv"):
            material_type = "video"
        elif ext in ("mp3", "wav", "ogg", "wma", "aac"):
            material_type = "audio"
        elif ext in ("ppt", "pptx", "xls", "xlsx", "csv"):
            material_type = "pdf"   # treat as document
        else:
            material_type = "link"

        storage_path = f"materials/{class_id}/{uuid.uuid4()}-{filename}"
        contents = await file.read()

        # ✅ Validate file size (max 50 MB)
        max_size = 50 * 1024 * 1024  # 50 MB
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

        try:
            supabase.storage.from_("learning-materials").upload(
                path=storage_path,
                file=contents,
                file_options={
                    "content-type": file.content_type or "application/octet-stream"
                }
            )
            file_url = supabase.storage.from_("learning-materials").get_public_url(storage_path)

        except Exception as e:
            print("FILE UPLOAD ERROR:", e)
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # =========================
    # AUDIO UPLOAD
    # =========================
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
            print("AUDIO UPLOAD ERROR:", e)
            raise HTTPException(status_code=500, detail=f"Audio upload failed: {str(e)}")

    # =========================
    # DATABASE INSERT
    # =========================
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

    try:
        result = supabase.table("materials").insert(insert_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Database insert failed")

        return result.data[0]

    except Exception as e:
        print("DATABASE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# GET MATERIALS
# =========================
@router.get("/")
async def list_materials(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "teacher":
        if not class_id:
            raise HTTPException(status_code=400, detail="class_id required")

        if class_id not in current_user.get("class_ids", []):
            raise HTTPException(status_code=403, detail="Not your class")

        effective_class_id = class_id

    elif current_user["role"] == "student":
        effective_class_id = current_user.get("class_id")

    elif current_user["role"] == "parent":
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id required")

        if student_id not in current_user.get("student_ids", []):
            raise HTTPException(status_code=403, detail="Not your child")

        student = supabase.table("students").select("class_id").eq("id", student_id).single().execute()

        if not student.data:
            raise HTTPException(status_code=404, detail="Student not found")

        effective_class_id = student.data["class_id"]

    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = (
        supabase.table("materials")
        .select("*")
        .eq("class_id", effective_class_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data


# =========================
# DELETE MATERIAL
# =========================
@router.delete("/{material_id}/")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete")

    mat = supabase.table("materials").select("*").eq("id", material_id).single().execute()

    if not mat.data:
        raise HTTPException(status_code=404, detail="Material not found")

    if mat.data["uploaded_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your material")

    supabase.table("materials").delete().eq("id", material_id).execute()

    return {"message": "Deleted successfully"}