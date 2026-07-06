# app/routers/auth_student.py
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
from app.utils.rate_limiter import rate_limiter
from app.utils.audit_logger import audit_log
from app.config import FRONTEND_URL 
from app.config import JWT_SECRET, JWT_ALGORITHM
from jose import jwt
import bcrypt
import logging
import os
import re
from datetime import datetime, timedelta, timezone
import secrets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/student", tags=["Student Auth"])

# --- Request Models ---
class StudentLogin(BaseModel):
    student_number: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ValidateTokenRequest(BaseModel):
    token: str

# --- Password Validation ---
def validate_password_strength(password: str) -> tuple:
    errors = []
    if len(password) < 6:
        errors.append("Password must be at least 6 characters")
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    
    common_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome']
    if password.lower() in common_passwords:
        errors.append("Password is too common")
    
    return len(errors) == 0, errors

# --- Login Endpoint ---
@router.post("/login/")
async def student_login(data: StudentLogin):
    try:
        logger.info(f"Login attempt for student: {data.student_number}")
        
        # REMOVED: email from select - students table doesn't have email column
        student_res = supabase.table("students").select("id, password_hash, display_name, class_id, grade").eq("student_number", data.student_number).execute()
        
        if not student_res.data:
            logger.warning(f"Student not found: {data.student_number}")
            raise HTTPException(status_code=401, detail="Invalid student number or password")
        
        student = student_res.data[0]
        
        # Check if password_hash exists
        stored_hash = student.get("password_hash")
        if not stored_hash:
            logger.error(f"Student {data.student_number} has no password hash")
            raise HTTPException(status_code=401, detail="Invalid student number or password")
        
        # Verify password
        try:
            stored_hash_bytes = stored_hash.encode('utf-8')
            if not bcrypt.checkpw(data.password.encode('utf-8'), stored_hash_bytes):
                logger.warning(f"Invalid password for student: {data.student_number}")
                raise HTTPException(status_code=401, detail="Invalid student number or password")
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            raise HTTPException(status_code=401, detail="Invalid student number or password")

        # Generate JWT
        payload = {
            "sub": student["id"],
            "role": "student",
            "class_id": student.get("class_id"),
            "display_name": student.get("display_name"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=8)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": student["id"],
                "role": "student",
                "display_name": student.get("display_name"),
                "class_id": student.get("class_id"),
                "grade": student.get("grade")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Student login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

# --- Password Reset Endpoints ---
@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    forgot_request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks
):
    client_ip = request.client.host if request.client else "unknown"
    
    is_allowed, wait_time = rate_limiter.is_allowed(forgot_request.email, client_ip)
    if not is_allowed:
        logger.warning(f"Rate limit exceeded for {forgot_request.email}")
        return {"message": "If an account exists, a reset link has been sent"}
    
    try:
        # Check if student exists with this email
        student = supabase.table("students").select("id, display_name").eq("email", forgot_request.email).execute()
        
        if not student.data:
            await audit_log(
                action="PASSWORD_RESET_REQUEST",
                user_email=forgot_request.email,
                status="NOT_FOUND",
                ip_address=client_ip
            )
            return {"message": "If an account exists, a reset link has been sent"}
        
        student_data = student.data[0]
        reset_token = secrets.token_hex(12)
        token_expiry = datetime.utcnow() + timedelta(hours=24)
        
        try:
            supabase.table("password_reset_tokens").insert({
                "user_id": student_data["id"],
                "token": reset_token,
                "expires_at": token_expiry.isoformat(),
                "ip_address": client_ip,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            frontend_url = os.getenv("FRONTEND_URL", "https://dayspring-hub.vercel.app")
            supabase.auth.admin.generate_link(
                "recovery",
                forgot_request.email,
                {"redirect_to": f"{frontend_url}/reset-password"}
            )
        
        await audit_log(
            action="PASSWORD_RESET_REQUEST",
            user_id=student_data["id"],
            user_email=forgot_request.email,
            status="SENT",
            ip_address=client_ip
        )
        
        return {"message": "Password reset link sent to your email"}
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to process request")

@router.post("/reset-password")
async def reset_password(
    request: Request,
    reset_request: ResetPasswordRequest
):
    client_ip = request.client.host if request.client else "unknown"
    
    try:
        token_record = supabase.table("password_reset_tokens")\
            .select("*")\
            .eq("token", reset_request.token)\
            .eq("used", False)\
            .execute()
        
        if not token_record.data:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        token_data = token_record.data[0]
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        
        if datetime.utcnow() > expires_at:
            await audit_log(
                action="PASSWORD_RESET_ATTEMPT",
                user_id=token_data["user_id"],
                status="TOKEN_EXPIRED",
                ip_address=client_ip
            )
            raise HTTPException(status_code=400, detail="Token has expired")
        
        is_valid, errors = validate_password_strength(reset_request.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=" | ".join(errors))
        
        # Hash new password
        hashed = bcrypt.hashpw(reset_request.new_password.encode('utf-8'), bcrypt.gensalt())
        
        result = supabase.table("students").update({
            "password_hash": hashed.decode('utf-8')
        }).eq("id", token_data["user_id"]).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to update password")
        
        supabase.table("password_reset_tokens")\
            .update({"used": True, "used_at": datetime.utcnow().isoformat(), "used_ip": client_ip})\
            .eq("id", token_data["id"])\
            .execute()
        
        await audit_log(
            action="PASSWORD_RESET_SUCCESS",
            user_id=token_data["user_id"],
            status="SUCCESS",
            ip_address=client_ip
        )
        
        return {"message": "Password reset successfully"}
        
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to reset password")

@router.post("/change-password")
async def change_password(
    request: Request,
    change_request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    client_ip = request.client.host if request.client else "unknown"
    
    try:
        student = supabase.table("students").select("password_hash").eq("id", current_user["user_id"]).single().execute()
        if not student.data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        stored_hash = student.data["password_hash"].encode('utf-8')
        if not bcrypt.checkpw(change_request.current_password.encode('utf-8'), stored_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        is_valid, errors = validate_password_strength(change_request.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=" | ".join(errors))
        
        hashed = bcrypt.hashpw(change_request.new_password.encode('utf-8'), bcrypt.gensalt())
        
        supabase.table("students").update({
            "password_hash": hashed.decode('utf-8')
        }).eq("id", current_user["user_id"]).execute()
        
        await audit_log(
            action="CHANGE_PASSWORD_SUCCESS",
            user_id=current_user["user_id"],
            status="SUCCESS",
            ip_address=client_ip
        )
        
        return {"message": "Password changed successfully"}
        
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to change password")

@router.post("/validate-reset-token")
async def validate_reset_token(request: ValidateTokenRequest):
    try:
        token_record = supabase.table("password_reset_tokens")\
            .select("*")\
            .eq("token", request.token)\
            .eq("used", False)\
            .execute()
        
        if not token_record.data:
            return {"valid": False}
        
        token_data = token_record.data[0]
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        
        if datetime.utcnow() > expires_at:
            return {"valid": False}
        
        return {"valid": True}
        
    except Exception:
        return {"valid": False}