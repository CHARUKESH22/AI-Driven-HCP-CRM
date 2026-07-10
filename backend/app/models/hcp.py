import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class HCP(Base):
    __tablename__ = "hcp_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_name = Column(String(200), nullable=False, index=True)
    specialization = Column(String(150), nullable=False, index=True)
    hospital = Column(String(200), nullable=False, index=True)
    department = Column(String(150), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True, unique=True)
    medical_registration = Column(String(100), nullable=True)
    experience = Column(Integer, nullable=True)
    preferred_visit_time = Column(String(100), nullable=True)
    priority = Column(String(10), nullable=False)
    products = Column(Text, nullable=True)  # Comma-separated product names
    notes = Column(Text, nullable=True)
    representative = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="hcp", cascade="all, delete-orphan")

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

