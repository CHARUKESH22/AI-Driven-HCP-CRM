import uuid
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

class HCPBase(BaseModel):
    doctor_name: str = Field(..., max_length=200)
    specialization: str = Field(..., max_length=150)
    hospital: str = Field(..., max_length=200)
    department: Optional[str] = Field(None, max_length=150)
    city: str = Field(..., max_length=100)
    region: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=150)
    medical_registration: Optional[str] = Field(None, max_length=100)
    experience: Optional[int] = None
    preferred_visit_time: Optional[str] = Field(None, max_length=100)
    priority: str = Field(..., max_length=10)
    products: Optional[List[str]] = None
    notes: Optional[str] = None
    representative: str = Field(..., max_length=150)

    @field_validator('products', mode='before')
    @classmethod
    def parse_products(cls, v):
        if isinstance(v, str):
            if not v:
                return []
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

class HCPCreate(HCPBase):
    pass

class HCPUpdate(BaseModel):
    doctor_name: Optional[str] = Field(None, max_length=200)
    specialization: Optional[str] = Field(None, max_length=150)
    hospital: Optional[str] = Field(None, max_length=200)
    department: Optional[str] = Field(None, max_length=150)
    city: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=150)
    medical_registration: Optional[str] = Field(None, max_length=100)
    experience: Optional[int] = None
    preferred_visit_time: Optional[str] = Field(None, max_length=100)
    priority: Optional[str] = Field(None, max_length=10)
    products: Optional[List[str]] = None
    notes: Optional[str] = None
    representative: Optional[str] = Field(None, max_length=150)

class HCP(HCPBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

    @property
    def full_name(self) -> str:
        return self.doctor_name

    @property
    def hospital_name(self) -> str:
        return self.hospital

    @property
    def first_name(self) -> str:
        parts = self.doctor_name.split(" ")
        return parts[0] if parts else ""

    @property
    def last_name(self) -> str:
        parts = self.doctor_name.split(" ")
        return " ".join(parts[1:]) if len(parts) > 1 else ""

