import logging
from fastapi import APIRouter, Request, HTTPException
from app.schemas.request import AnalyzeRequest, BotRequest
from app.services.llm_service import generate_analysis, generate_bot_response

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze")
async def analyze_api(request: Request, req_data: AnalyzeRequest):
    """
    Calls backend LLM Service to get analysis data matching the given request.
    Includes rate limiting decorators at the main application level.
    """
    logger.info(f"Incoming /analyze request for feature: {req_data.feature}")
    try:
        result = await generate_analysis(req_data)
        return result
    except Exception as e:
        logger.error(f"Error executing analysis route: {str(e)}", exc_info=True)
        # Catch unexpected errors to avoid spilling internal issues
        raise HTTPException(
            status_code=500, 
            detail="An unexpected error occurred while processing the analysis."
        )

@router.post("/bot")
async def bot_api(request: Request, req_data: BotRequest):
    """
    Handles general chat bot interaction, enforcing API-testing related boundaries.
    """
    logger.info(f"Incoming /bot request for user: {req_data.userId}")
    try:
        result = await generate_bot_response(req_data)
        return result
    except Exception as e:
        logger.error(f"Error executing bot route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the chat bot request."
        )

