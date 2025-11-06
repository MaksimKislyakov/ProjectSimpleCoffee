from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    telephone: int
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
