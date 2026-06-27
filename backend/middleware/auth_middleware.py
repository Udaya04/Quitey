import os
from typing import Optional
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.services.auth_service import AuthException, AuthService, get_supabase_client
from backend.models.user_model import UserProfile

print("=== AUTH MIDDLEWARE LOADED ===")

# auto_error=False allows us to handle missing token and return a 401 instead of standard FastAPI 403
security = HTTPBearer(auto_error=False)
auth_service = AuthService()

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserProfile:
    if not credentials:
        raise AuthException("Token missing", 401)

    token = credentials.credentials

    try:
        # Verify the token using Supabase client (validates ES256 signed JWTs properly)
        print(f"DEBUG: Attempting to verify token...")
        supabase = get_supabase_client()
        print(f"DEBUG: Got supabase client")
        user_response = supabase.auth.get_user(token)
        print(f"DEBUG: get_user response: {user_response}")

        if not user_response.user:
            print(f"DEBUG: No user in response")
            raise AuthException("Invalid credentials", 401)

        user_id = user_response.user.id
        print(f"DEBUG: User ID: {user_id}")

    except Exception as e:
        # Catch expired token, invalid signature, etc.
        error_msg = str(e).lower()
        print(f"DEBUG: Exception in get_user: {e}")
        if "expired" in error_msg:
            raise AuthException("Token expired", 401)
        raise AuthException("Invalid credentials", 401)

    # Fetch the user profile from database
    try:
        print(f"DEBUG: Fetching profile for user_id: {user_id}")
        user_profile = auth_service.get_profile_by_id(user_id)
        print(f"DEBUG: Got profile: {user_profile}")
        return user_profile
    except Exception as e:
        print(f"DEBUG: Exception in get_profile_by_id: {e}")
        raise AuthException("Invalid credentials", 401)
