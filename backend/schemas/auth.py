from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    user_id: int
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
