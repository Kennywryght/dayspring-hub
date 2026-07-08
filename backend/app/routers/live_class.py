# app/routers/live_class.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import supabase
from app.utils.auth import get_current_user
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/live-class", tags=["Live Class"])

class StartLiveClassRequest(BaseModel):
    class_id: str

@router.post("/start")
async def start_live_class(
    request: StartLiveClassRequest,
    current_user: dict = Depends(get_current_user)
):
    """Teacher starts a live class session"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can start live classes")
    
    class_id = request.class_id
    
    # Check if there's already an active session for this class
    existing = supabase.table("live_class") \
        .select("*") \
        .eq("class_id", class_id) \
        .eq("is_active", True) \
        .execute()
    
    if existing.data:
        # Return existing session
        return {
            "room_name": existing.data[0]["room_name"],
            "is_active": True,
            "existing_session": True
        }
    
    # Generate unique room name
    room_name = f"dayspring-{class_id[:8]}-{uuid.uuid4().hex[:6]}"
    
    # Create new session
    session_data = {
        "class_id": class_id,
        "teacher_id": current_user["user_id"],
        "room_name": room_name,
        "is_active": True,
        "started_at": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("live_class").insert(session_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to start live class")
    
    return {
        "room_name": room_name,
        "is_active": True,
        "existing_session": False
    }

@router.post("/end/{class_id}")
async def end_live_class(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Teacher ends a live class session"""
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can end live classes")
    
    result = supabase.table("live_class") \
        .update({
            "is_active": False,
            "ended_at": datetime.utcnow().isoformat()
        }) \
        .eq("class_id", class_id) \
        .eq("teacher_id", current_user["user_id"]) \
        .eq("is_active", True) \
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No active live class found")
    
    return {"message": "Live class ended successfully"}

@router.get("/active/{class_id}")
async def get_active_session(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if there's an active live class for a class"""
    result = supabase.table("live_class") \
        .select("*, profiles(full_name)") \
        .eq("class_id", class_id) \
        .eq("is_active", True) \
        .execute()
    
    if not result.data:
        return {"is_active": False}
    
    session = result.data[0]
    return {
        "is_active": True,
        "room_name": session["room_name"],
        "teacher_name": session.get("profiles", {}).get("full_name", "Teacher"),
        "started_at": session["started_at"]
    }

@router.get("/my-active")
async def get_my_active_sessions(
    current_user: dict = Depends(get_current_user)
):
    """Get all active sessions for the current user"""
    if current_user["role"] == "teacher":
        result = supabase.table("live_class") \
            .select("*, classes(name)") \
            .eq("teacher_id", current_user["user_id"]) \
            .eq("is_active", True) \
            .execute()
    else:
        class_id = current_user.get("class_id")
        if not class_id:
            return []
        
        result = supabase.table("live_class") \
            .select("*, profiles(full_name), classes(name)") \
            .eq("class_id", class_id) \
            .eq("is_active", True) \
            .execute()
    
    return result.data