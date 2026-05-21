from pydantic import BaseModel
from typing import Optional

class UserOut(BaseModel):
    id: str
    full_name: str
    role: str
    class_id: Optional[str] = None