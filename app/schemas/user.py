from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    full_name: str
    password: str
    role: UserRole = UserRole.citizen


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department: Optional[str] = None
    ward_id: Optional[int] = None
    current_load: int = 0

    class Config:
        from_attributes = True
