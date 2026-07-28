from pydantic import BaseModel, Field  # Pydantic schema and validation
from typing import Dict, Any, Optional, Union  # Type hints

# Request schema for API analysis
class AnalyzeRequest(BaseModel):
    method: str  # HTTP method (GET, POST, etc.)
    url: str  # API URL
    headers: Dict[str, str] = Field(default_factory=dict)  # Request headers
    body: Optional[Union[Dict, list, str, Any]] = None  # Request body
    status: int = Field(ge=100, le=599, description="Valid HTTP status code")  # HTTP status
    response: Optional[Union[Dict, list, str, Any]] = None  # API response
    feature: str = Field("root_cause", description="AI analysis type")  # AI feature to run

# Request schema for chatbot
class BotRequest(BaseModel):
    userId: Optional[str] = "guest"  # User ID (default: guest)
    message: str  # User's message
    currentApiContext: Optional[Dict[str, Any]] = None  # Current API details
    requestHistory: Optional[list] = Field(default_factory=list)  # Previous requests