from fastapi import APIRouter, Depends
from schemas.auth_schemas import LoginRequest, TokenResponse
from services.auth_service import AuthService
from api.v1.dependencies import get_auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return await auth_service.authenticate(data.telephone, data.password)