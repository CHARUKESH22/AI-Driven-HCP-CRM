import uuid
import datetime
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class InteractionCreate(BaseModel):
    hcp_id: uuid.UUID
    meeting_date: datetime.date
    meeting_time: str = Field(..., description="Meeting time in HH:MM format")
    meeting_type: str = Field(default="In-Person")
    feedback: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    summary: Optional[str] = None
    products_discussed: List[str] = Field(default_factory=list)
    samples_distributed: Dict[str, int] = Field(default_factory=dict)
    follow_up_date: Optional[datetime.date] = None

class InteractionUpdate(BaseModel):
    meeting_date: Optional[datetime.date] = None
    meeting_time: Optional[str] = None
    meeting_type: Optional[str] = None
    feedback: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    summary: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    samples_distributed: Optional[Dict[str, int]] = None
    follow_up_date: Optional[datetime.date] = None

class InteractionResponse(BaseModel):
    id: uuid.UUID
    hcp_id: uuid.UUID
    doctor_name: str
    hospital_name: str
    meeting_date: str
    meeting_time: str
    meeting_type: str
    feedback: Optional[str] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    summary: Optional[str] = None
    products_discussed: List[str] = []
    samples_distributed: Dict[str, int] = {}
    follow_up_date: Optional[str] = None

    class Config:
        from_attributes = True
