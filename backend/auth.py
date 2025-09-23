from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

CLERK_JWT_VERIFY_URL = "https://api.clerk.dev/v1/tokens/verify"
security = HTTPBearer()


async def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    import logging
    token = credentials.credentials
    logging.info(f"Received Clerk JWT: {token}")
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            CLERK_JWT_VERIFY_URL,
            headers={"Authorization": f"Bearer {token}"}
        )
        logging.info(f"Clerk verify response: {response.text}")
        if response.status_code != 200 or not response.json().get("active"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Clerk token",
            )
        return {
            "sub": response.json().get("sub"),
            "email": response.json().get("email"),
        }
