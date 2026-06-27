from fastapi import APIRouter, Depends
from backend.models.user_model import UserSignUpRequest, UserLoginRequest, UserProfile, AuthResponse
from backend.services.auth_service import AuthService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

@router.post("/signup", response_model=AuthResponse)
async def signup(body: UserSignUpRequest):
    result = auth_service.sign_up(body)
    return result

@router.post("/login", response_model=AuthResponse)
async def login(body: UserLoginRequest):
    result = auth_service.login(body)
    return result

@router.get("/me", response_model=UserProfile)
async def me(current_user: UserProfile = Depends(get_current_user)):
    return current_user
