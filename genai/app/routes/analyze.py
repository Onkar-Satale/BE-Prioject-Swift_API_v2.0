"""
AI Service Router (/analyze and /bot)
Provides endpoints for API analysis/debugging features and conversational AI assistant queries.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.config.settings import logger
from app.dependencies import verify_api_key
from app.schemas.request import AnalyzeRequest, BotRequest
from app.services.llm_service import generate_analysis, generate_bot_response

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.post("/analyze")
async def analyze_api(request: Request, req_data: AnalyzeRequest):
    """
    Executes specialized AI analysis on API request/response pairs (e.g. error translation, security audit, usage tips).
    """
    logger.info(f"Incoming /analyze request for feature: {req_data.feature}")
    try:
        result = await generate_analysis(req_data)
        return result
    except Exception as e:
        logger.error(f"Error executing analysis route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the analysis."
        )

@router.post("/bot")
async def bot_api(request: Request, req_data: BotRequest):
    """
    Processes interactive developer chatbot prompts using contextual API execution history.
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