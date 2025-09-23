from pydantic import BaseModel
from typing import Optional

class Incident(BaseModel):
    city: str
    country: str
    severity: str  # "critical", "moderate", "normal"
    description: str
    latitude: float
    longitude: float
    source: Optional[str] = None
