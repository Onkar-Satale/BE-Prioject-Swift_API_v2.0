"""
AI Service Router (/analyze, /bot, /failure-assist, /compare, /health-score, /rag/index-episode, /rag/retrieve)
Provides endpoints for API analysis, debugging, auto-fix, RAG memory indexing, and retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.config.settings import logger
from app.dependencies import verify_api_key
from app.schemas.request import (
    AnalyzeRequest,
    BotRequest,
    FailureAssistRequest,
    CompareRequest,
    HealthScoreRequest,
    IndexEpisodeRequest,
    RetrieveEpisodesRequest
)
from app.services.llm_service import (
    generate_analysis,
    generate_bot_response,
    generate_failure_diagnosis,
    generate_history_comparison,
    compute_measurable_health_score,
)
from app.services.rag_service import rag_memory_store

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.post("/analyze")
async def analyze_api(request: Request, req_data: AnalyzeRequest):
    """Executes specialized AI analysis on API request/response pairs (V1)."""
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
    """Processes interactive developer chatbot prompts using contextual API execution history (V1)."""
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

@router.post("/failure-assist")
async def failure_assist_api(request: Request, req_data: FailureAssistRequest):
    """History-Grounded RAG failure diagnosis, root-cause prediction, and confirmed auto-fix (V2)."""
    logger.info(f"Incoming /failure-assist request for status: {req_data.status} on URL: {req_data.url}")
    try:
        result = await generate_failure_diagnosis(req_data)
        return result
    except Exception as e:
        logger.error(f"Error in failure assist route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during failure diagnosis."
        )

@router.post("/compare")
async def compare_history_api(request: Request, req_data: CompareRequest):
    """Side-by-side execution comparison and historical divergence explanation (V2)."""
    logger.info(f"Incoming /compare request between attempts")
    try:
        result = await generate_history_comparison(req_data)
        return result
    except Exception as e:
        logger.error(f"Error in compare history route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during history comparison."
        )

@router.post("/health-score")
async def health_score_api(request: Request, req_data: HealthScoreRequest):
    """Computes a measurable 0-100 API Health Score across 5 key dimensions (V2)."""
    logger.info(f"Incoming /health-score calculation for URL: {req_data.url}")
    try:
        result = compute_measurable_health_score(req_data)
        return result
    except Exception as e:
        logger.error(f"Error in health score calculation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during health score computation."
        )

# ============================================================================
# 🔹 RAG ENDPOINTS: INDEX RESOLUTION EPISODE & RETRIEVE MEMORY
# ============================================================================

@router.post("/rag/index-episode")
async def index_episode_api(request: Request, req_data: IndexEpisodeRequest):
    """
    Indexes a verified resolution episode (Failure -> Diagnosis -> Fix -> Success)
    into the user's persistent RAG memory store.
    """
    logger.info(f"Indexing RAG episode for user {req_data.userId}: {req_data.method} {req_data.url}")
    try:
        episode = rag_memory_store.index_resolution_episode(
            user_id=req_data.userId or "guest",
            method=req_data.method,
            url=req_data.url,
            failed_status=req_data.failedStatus,
            error_snippet=req_data.errorSnippet or "",
            root_cause_layer=req_data.rootCauseLayer or "General",
            applied_fix=req_data.appliedFix or {},
            success_status=req_data.successStatus,
            success_duration=req_data.successDuration or 0,
            custom_id=req_data.customId
        )
        return {"success": True, "indexedEpisode": episode}
    except Exception as e:
        logger.error(f"Error indexing RAG episode: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to index resolution episode.")

@router.post("/rag/retrieve")
async def retrieve_episodes_api(request: Request, req_data: RetrieveEpisodesRequest):
    """
    Retrieves top-k similar historical resolution episodes via vector search + metadata filters.
    """
    logger.info(f"Retrieving RAG episodes for user {req_data.userId}: {req_data.method} {req_data.url}")
    try:
        episodes = rag_memory_store.retrieve_relevant_episodes(
            user_id=req_data.userId or "guest",
            method=req_data.method,
            url=req_data.url,
            status=req_data.status,
            error_text=req_data.errorText or "",
            headers_keys=req_data.headersKeys or [],
            top_k=req_data.topK or 2
        )
        return {"success": True, "episodes": episodes}
    except Exception as e:
        logger.error(f"Error retrieving RAG episodes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve resolution episodes.")