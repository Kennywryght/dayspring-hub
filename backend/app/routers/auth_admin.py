from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import supabase

router = APIRouter(prefix="/auth/admin", tags=["Admin Auth"])

class AdminLogin(BaseModel):
    email: str
    password: str

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

    # Check role from user metadata (no database query)
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