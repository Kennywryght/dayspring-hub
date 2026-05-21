from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import JWT_SECRET, JWT_ALGORITHM
from app.database import supabase

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # ✅ strip any accidental quotes or whitespace from the token
    token = credentials.credentials.strip().strip('"').strip("'")

    try:
        # First try our custom JWT (student / parent)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        role = payload.get("role")
        if role == "student":
            return {
                "user_id": payload["sub"],
                "role": "student",
                "class_id": payload.get("class_id"),
                "display_name": payload.get("display_name"),
                "student_id": payload["sub"]
            }
        elif role == "parent":
            return {
                "user_id": payload["sub"],
                "role": "parent",
                "parent_id": payload.get("parent_id"),
                "student_ids": payload.get("student_ids", [])
            }
        else:
            raise HTTPException(status_code=401, detail="Unknown role")
    except JWTError:
        # Not our custom JWT, try Supabase token (teacher / admin)
        try:
            user_res = supabase.auth.get_user(token)
            user = user_res.user
            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")

            # Read role from metadata — NO database query!
            metadata = user.user_metadata or {}
            role = metadata.get("role")
            full_name = metadata.get("full_name", "")

            if role == "super_admin":
                return {
                    "user_id": user.id,
                    "role": "super_admin",
                    "full_name": full_name
                }
            elif role == "teacher":
                # Get all class_ids from class_teachers table
                try:
                    ct_res = supabase.table("class_teachers").select("class_id").eq("teacher_id", user.id).execute()
                    class_ids = [row["class_id"] for row in ct_res.data] if ct_res.data else []
                except:
                    class_ids = []
                return {
                    "user_id": user.id,
                    "role": "teacher",
                    "class_ids": class_ids,
                    "full_name": full_name
                }
            else:
                raise HTTPException(status_code=403, detail="Not authorised")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=401, detail="Could not validate credentials")