from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    telephone: str | int
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
