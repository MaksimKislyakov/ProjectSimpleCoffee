from pydantic import BaseModel


class LoginRequest(BaseModel):
    telephone: str | int
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
