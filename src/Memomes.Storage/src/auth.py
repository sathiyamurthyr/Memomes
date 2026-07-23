from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from src.config import settings

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validates JWT token using python-jose and returns the decoded payload.
    Extracts user_id, tenant_id, and scopes for ownership and access validation.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"]
        )
        
        # Support both standard claims and possible C# payload overrides
        user_id = payload.get("sub") or payload.get("userId") or payload.get("user_id")
        tenant_id = payload.get("tenantId") or payload.get("tenant_id") or "tenant_default"
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user identification claims.",
            )
            
        return {
            "user_id": str(user_id),
            "tenant_id": str(tenant_id),
            "email": payload.get("email"),
            "role": payload.get("role", "user")
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
