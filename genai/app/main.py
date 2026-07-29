import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config.settings import settings
from app.routes.analyze import router as analyze_router

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Apply a default rate limit of 20 requests per minute per client
limiter = Limiter(key_func=get_remote_address, default_limits=["20/minute"])

# Create the FastAPI application
app = FastAPI(title="SwiftAPI GenAI Service with Groq")

# Make the limiter available throughout the application
app.state.limiter = limiter

# Return a standard response when the rate limit is exceeded
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Verify that requests originate from the trusted backend service
@app.middleware("http")
async def verify_service_token(request: Request, call_next):

    # Skip authentication for the health check endpoint
    if request.url.path == "/":
        return await call_next(request)

    token = request.headers.get("x-api-key")

    # Reject requests with an invalid or missing API key
    if token != settings.GENAI_API_SECRET:
        return JSONResponse(
            status_code=401,
            content={"detail": "Unauthorized. Invalid or missing x-api-key."}
        )

    # Continue processing the request
    return await call_next(request)

# Health check endpoint
@app.get("/")

# Apply a stricter rate limit to the public endpoint
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "GenAI service running securely."}

# Register application routes
app.include_router(analyze_router)