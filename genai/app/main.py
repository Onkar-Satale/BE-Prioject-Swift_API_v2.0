"""
FastAPI Application Initialization
Configures logging, rate limiting (SlowAPI), service token verification middleware (x-api-key),
and registers analysis/chatbot API routers.
"""

import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config.settings import settings
from app.routes.analyze import router as analyze_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Global rate limiter keying by remote client IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["20/minute"])

app = FastAPI(title="SwiftAPI GenAI Service with Groq")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def verify_service_token(request: Request, call_next):
    """
    Middleware verifying secret x-api-key header on incoming requests to restrict access
    strictly to the SwiftAPI Node.js backend.
    """
    if request.url.path == "/":
        return await call_next(request)

    token = request.headers.get("x-api-key")
    if token != settings.GENAI_API_SECRET:
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized. Invalid or missing x-api-key."}
        )

    return await call_next(request)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    """Health check endpoint for deployment monitoring."""
    return {"message": "GenAI service running securely."}

app.include_router(analyze_router)