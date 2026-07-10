import uuid
from sqlalchemy import Column, String, Text, Date, Time, DateTime, ForeignKey, Integer, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

# Association Table for Many-to-Many relationship between Interaction and Product (Products Discussed)
interaction_product_association = Table(
    "interaction_product",
    Base.metadata,
    Column("interaction_id", UUID(as_uuid=True), ForeignKey("interaction.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", UUID(as_uuid=True), ForeignKey("product.id", ondelete="CASCADE"), primary_key=True)
)

class SampleDistribution(Base):
    __tablename__ = "sample_distribution"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interaction_id = Column(UUID(as_uuid=True), ForeignKey("interaction.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    interaction = relationship("Interaction", back_populates="samples_distributed")
    product = relationship("Product")

class Interaction(Base):
    __tablename__ = "interaction"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hcp_id = Column(UUID(as_uuid=True), ForeignKey("hcp_profiles.id", ondelete="CASCADE"), nullable=False)
    meeting_date = Column(Date, nullable=False, index=True)
    meeting_time = Column(Time, nullable=False)
    meeting_type = Column(String(50), nullable=False)  # "In-Person", "Virtual", "Phone", "Email"
    feedback = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    hcp = relationship("HCP", back_populates="interactions")
    products_discussed = relationship(
        "Product",
        secondary=interaction_product_association,
        backref="interactions_discussed"
    )
    samples_distributed = relationship(
        "SampleDistribution",
        back_populates="interaction",
        cascade="all, delete-orphan"
    )
    follow_ups = relationship(
        "FollowUp",
        back_populates="interaction",
        cascade="all, delete-orphan"
    )
