import logging  # Logging module

from fastapi import APIRouter, Request, HTTPException  # FastAPI routing and exceptions

from app.schemas.request import AnalyzeRequest, BotRequest  # Request schemas

from app.services.llm_service import generate_analysis, generate_bot_response  # AI service functions

logger = logging.getLogger(__name__)  # Create logger for this file

router = APIRouter()  # Create router

# POST endpoint for API analysis
@router.post("/analyze")
async def analyze_api(request: Request, req_data: AnalyzeRequest):

    # Log incoming request
    logger.info(f"Incoming /analyze request for feature: {req_data.feature}")

    try:
        # Call AI analysis service
        result = await generate_analysis(req_data)

        # Return AI response
        return result

    except Exception as e:
        # Log error with stack trace
        logger.error(f"Error executing analysis route: {str(e)}", exc_info=True)

        # Return 500 error to client
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the analysis."
        )

# POST endpoint for chatbot
@router.post("/bot")
async def bot_api(request: Request, req_data: BotRequest):

    # Log incoming chatbot request
    logger.info(f"Incoming /bot request for user: {req_data.userId}")

    try:
        # Call chatbot service
        result = await generate_bot_response(req_data)

        # Return chatbot response
        return result

    except Exception as e:
        # Log error with stack trace
        logger.error(f"Error executing bot route: {str(e)}", exc_info=True)

        # Return 500 error to client
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the chat bot request."
        )