# Import Python's logging module for application logs
import logging

# Import FastAPI, Request object, and HTTP exceptions
from fastapi import FastAPI, Request, HTTPException

# Used to return JSON responses manually
from fastapi.responses import JSONResponse

# Import rate limiter and default handler
from slowapi import Limiter, _rate_limit_exceeded_handler

# Gets the client's IP address for rate limiting
from slowapi.util import get_remote_address

# Exception raised when rate limit is exceeded
from slowapi.errors import RateLimitExceeded

# Import application settings (loads values from .env)
from app.config.settings import settings

# Import analyze router containing API endpoints
from app.routes.analyze import router as analyze_router

# Configure global logging format and log level
logging.basicConfig(
    level=logging.INFO,  # Log INFO level and above
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'  # Log format
)

# Create a rate limiter (20 requests per minute per IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["20/minute"])

# Create the FastAPI application
app = FastAPI(title="SwiftAPI GenAI Service with Groq")

# Store limiter inside the FastAPI app
app.state.limiter = limiter

# Register handler for rate limit exceeded errors
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware runs before every incoming request
@app.middleware("http")
async def verify_service_token(request: Request, call_next):

    # Skip API key check for the root endpoint
    if request.url.path == "/":
        return await call_next(request)

    # Read x-api-key from request headers
    token = request.headers.get("x-api-key")

    # Compare it with the secret stored in .env
    if token != settings.GENAI_API_SECRET:
        return JSONResponse(
            status_code=401,  # Return Unauthorized
            content={"detail": "Unauthorized. Invalid or missing x-api-key."}
        )

    # Continue to the requested endpoint if token is valid
    return await call_next(request)

# Root endpoint (used for health check)
@app.get("/")

# Allow only 5 requests/minute to this endpoint
@limiter.limit("5/minute")
async def root(request: Request):

    # Return a simple success message
    return {"message": "GenAI service running securely."}

# Register all routes from analyze_router
app.include_router(analyze_router)