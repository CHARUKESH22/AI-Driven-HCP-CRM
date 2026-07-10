import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class FollowUp(Base):
    __tablename__ = "follow_up"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hcp_id = Column(UUID(as_uuid=True), ForeignKey("hcp_profiles.id", ondelete="CASCADE"), nullable=False)
    interaction_id = Column(UUID(as_uuid=True), ForeignKey("interaction.id", ondelete="SET NULL"), nullable=True)
    follow_up_date = Column(Date, nullable=False, index=True)
    agenda = Column(Text, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    hcp = relationship("HCP", back_populates="follow_ups")
    interaction = relationship("Interaction", back_populates="follow_ups")
