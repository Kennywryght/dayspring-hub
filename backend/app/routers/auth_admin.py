from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.database import supabase
from app.utils.auth import get_current_user
from app.utils.rate_limiter import rate_limiter
from app.utils.audit_logger import audit_log
from app.config import FRONTEND_URL  # ✅ Import from config
import logging
import re
from datetime import datetime, timedelta
import secrets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth/admin", tags=["Admin Auth"])

# --- Request Models ---
class AdminLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

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
async def admin_login(data: AdminLogin):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        user = res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user.user_metadata.get("role") if user.user_metadata else None
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Not an admin account")

    return {
        "access_token": res.session.access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": role,
            "full_name": user.user_metadata.get("full_name", "Admin")
        }
    }

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
        user = supabase.table("profiles").select("id, email, full_name").eq("email", forgot_request.email).eq("role", "super_admin").execute()
        
        if not user.data:
            await audit_log(
                action="PASSWORD_RESET_REQUEST",
                user_email=forgot_request.email,
                status="NOT_FOUND",
                ip_address=client_ip
            )
            return {"message": "If an account exists, a reset link has been sent"}
        
        user_data = user.data[0]
        reset_token = secrets.token_hex(12)
        token_expiry = datetime.utcnow() + timedelta(hours=24)
        
        try:
            supabase.table("password_reset_tokens").insert({
                "user_id": user_data["id"],
                "token": reset_token,
                "expires_at": token_expiry.isoformat(),
                "ip_address": client_ip,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            # Use FRONTEND_URL from config
            supabase.auth.admin.generate_link(
                "recovery",
                forgot_request.email,
                {"redirect_to": f"{FRONTEND_URL}/reset-password"}
            )
        
        await audit_log(
            action="PASSWORD_RESET_REQUEST",
            user_id=user_data["id"],
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
        
        result = supabase.auth.admin.update_user_by_id(
            token_data["user_id"],
            {"password": reset_request.new_password}
        )
        
        if not result.user:
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
        auth_response = supabase.auth.sign_in_with_password({
            "email": current_user.get("email"),
            "password": change_request.current_password
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        is_valid, errors = validate_password_strength(change_request.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=" | ".join(errors))
        
        result = supabase.auth.admin.update_user_by_id(
            current_user["user_id"],
            {"password": change_request.new_password}
        )
        
        if not result.user:
            raise HTTPException(status_code=400, detail="Failed to change password")
        
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