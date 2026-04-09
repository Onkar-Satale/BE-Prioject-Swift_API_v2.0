from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Union

class AnalyzeRequest(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[Union[Dict, list, str, Any]] = None
    status: int = Field(ge=100, le=599, description="HTTP status code must be valid")
    response: Optional[Union[Dict, list, str, Any]] = None
    feature: str = Field("root_cause", description="The type of AI analysis to run")
