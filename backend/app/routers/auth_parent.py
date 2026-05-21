from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import supabase
from app.config import JWT_SECRET, JWT_ALGORITHM
from jose import jwt
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth/parent", tags=["Parent Auth"])

class ParentLogin(BaseModel):
    email: str
    password: str

@router.post("/login/")
async def parent_login(data: ParentLogin):
    try:
        res = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
        user = res.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    profile = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
    if not profile.data or profile.data["role"] != "parent":
        raise HTTPException(status_code=403, detail="Not a parent account")

    parent = supabase.table("parents").select("id").eq("profile_id", user.id).single().execute()
    if not parent.data:
        raise HTTPException(status_code=403, detail="Parent profile missing")

    links = supabase.table("student_parents").select("student_id").eq("parent_id", parent.data["id"]).execute()
    student_ids = [row["student_id"] for row in links.data]

    payload = {
        "sub": user.id,
        "role": "parent",
        "parent_id": parent.data["id"],
        "student_ids": student_ids,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": "parent",
            "full_name": profile.data["full_name"],
            "student_ids": student_ids
        }
    }