"""
Pydantic Data Models & Validation Schemas
Defines structured input payload requirements for /analyze and /bot AI service endpoints.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Union

class AnalyzeRequest(BaseModel):
    """Payload schema for API analysis and diagnostic endpoints."""
    method: str
    url: str
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[Union[Dict, list, str, Any]] = None
    status: int = Field(ge=100, le=599, description="Valid HTTP status code")
    response: Optional[Union[Dict, list, str, Any]] = None
    feature: str = Field("root_cause", description="AI analysis feature identifier")

class BotRequest(BaseModel):
    """Payload schema for interactive developer assistant chatbot requests."""
    userId: Optional[str] = "guest"
    message: str
    currentApiContext: Optional[Dict[str, Any]] = None
    requestHistory: Optional[list] = Field(default_factory=list)