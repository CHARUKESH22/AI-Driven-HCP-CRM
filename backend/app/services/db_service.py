import uuid
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Dict, Any, Optional

from app.models.hcp import HCP
from app.models.product import Product
from app.models.interaction import Interaction, SampleDistribution
from app.models.follow_up import FollowUp

class DBService:
    @staticmethod
    def search_hcps(db: Session, query: str) -> List[HCP]:
        """Search HCPs by name, hospital, specialization, or city (case-insensitive fuzzy match)."""
        if not query:
            return db.query(HCP).limit(10).all()
        
        search_filter = or_(
            HCP.doctor_name.ilike(f"%{query}%"),
            HCP.hospital.ilike(f"%{query}%"),
            HCP.specialization.ilike(f"%{query}%"),
            HCP.city.ilike(f"%{query}%")
        )
        return db.query(HCP).filter(search_filter).all()

    @staticmethod
    def get_hcp_with_relations(db: Session, hcp_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get detailed HCP profile including historical interactions and follow-ups."""
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return None
        
        # Get interactions sorted by date descending
        interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp_id).order_by(desc(Interaction.meeting_date)).all()
        # Get pending follow-ups
        follow_ups = db.query(FollowUp).filter(and_(FollowUp.hcp_id == hcp_id, FollowUp.completed == False)).all()

        return {
            "hcp": hcp,
            "interactions": interactions,
            "follow_ups": follow_ups
        }

    @staticmethod
    def get_product_by_name(db: Session, name: str) -> Optional[Product]:
        """Look up a product by name (case-insensitive)."""
        return db.query(Product).filter(Product.name.ilike(name)).first()

    @staticmethod
    def create_interaction(
        db: Session,
        hcp_id: uuid.UUID,
        meeting_date: datetime.date,
        meeting_time: datetime.time,
        meeting_type: str,
        feedback: Optional[str] = None,
        outcome: Optional[str] = None,
        notes: Optional[str] = None,
        summary: Optional[str] = None,
        products_discussed: List[str] = None,
        samples_distributed: Dict[str, int] = None,
        follow_up_date: Optional[datetime.date] = None
    ) -> Interaction:
        """Create a new interaction visit log, linking products and sample details."""
        interaction = Interaction(
            hcp_id=hcp_id,
            meeting_date=meeting_date,
            meeting_time=meeting_time,
            meeting_type=meeting_type or "In-Person",
            feedback=feedback,
            outcome=outcome,
            notes=notes,
            summary=summary
        )
        db.add(interaction)
        db.flush() # Populate interaction.id

        # 1. Process products discussed
        if products_discussed:
            for p_name in products_discussed:
                prod = DBService.get_product_by_name(db, p_name)
                if prod:
                    interaction.products_discussed.append(prod)

        # 2. Process samples distributed
        if samples_distributed:
            for p_name, qty in samples_distributed.items():
                prod = DBService.get_product_by_name(db, p_name)
                if prod and qty > 0:
                    sample = SampleDistribution(
                        interaction_id=interaction.id,
                        product_id=prod.id,
                        quantity=qty
                    )
                    db.add(sample)

        # 3. Create follow-up automatically if follow-up date is provided
        if follow_up_date:
            follow_up = FollowUp(
                hcp_id=hcp_id,
                interaction_id=interaction.id,
                follow_up_date=follow_up_date,
                agenda=f"Follow up on products discussed: {', '.join(products_discussed or [])}. Details: {outcome or ''}",
                completed=False
            )
            db.add(follow_up)

        db.commit()
        db.refresh(interaction)
        return interaction

    @staticmethod
    def update_interaction(
        db: Session,
        interaction_id: uuid.UUID,
        data: Dict[str, Any]
    ) -> Optional[Interaction]:
        """Update fields of an existing interaction dynamically."""
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return None

        # Standard field updates
        direct_fields = ["meeting_date", "meeting_time", "meeting_type", "feedback", "outcome", "notes", "summary"]
        for field in direct_fields:
            if field in data and data[field] is not None:
                # Handle string conversion for dates/times
                val = data[field]
                if field == "meeting_date" and isinstance(val, str):
                    val = datetime.datetime.strptime(val, "%Y-%m-%d").date()
                elif field == "meeting_time" and isinstance(val, str):
                    try:
                        val = datetime.datetime.strptime(val, "%H:%M").time()
                    except ValueError:
                        val = datetime.datetime.strptime(val, "%H:%M:%S").time()
                setattr(interaction, field, val)

        # Update products discussed if specified
        if "products_discussed" in data and data["products_discussed"] is not None:
            # Clear old products discussed
            interaction.products_discussed.clear()
            for p_name in data["products_discussed"]:
                prod = DBService.get_product_by_name(db, p_name)
                if prod:
                    interaction.products_discussed.append(prod)

        # Update samples distributed if specified
        if "samples_distributed" in data and data["samples_distributed"] is not None:
            # Delete old sample distributions
            db.query(SampleDistribution).filter(SampleDistribution.interaction_id == interaction_id).delete()
            # Add new ones
            for p_name, qty in data["samples_distributed"].items():
                prod = DBService.get_product_by_name(db, p_name)
                if prod and qty > 0:
                    sample = SampleDistribution(
                        interaction_id=interaction.id,
                        product_id=prod.id,
                        quantity=qty
                    )
                    db.add(sample)

        # Update or create follow-up if follow_up_date changes
        if "follow_up_date" in data and data["follow_up_date"] is not None:
            new_date = data["follow_up_date"]
            if isinstance(new_date, str):
                new_date = datetime.datetime.strptime(new_date, "%Y-%m-%d").date()
            
            # Find existing follow-up
            follow_up = db.query(FollowUp).filter(FollowUp.interaction_id == interaction_id).first()
            if follow_up:
                follow_up.follow_up_date = new_date
            else:
                follow_up = FollowUp(
                    hcp_id=interaction.hcp_id,
                    interaction_id=interaction.id,
                    follow_up_date=new_date,
                    agenda=f"Follow up from interaction on {interaction.meeting_date}",
                    completed=False
                )
                db.add(follow_up)

        db.commit()
        db.refresh(interaction)
        return interaction

    @staticmethod
    def get_interaction_details(db: Session, interaction_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get an interaction with structured details for UI serialization."""
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return None
        
        samples = db.query(SampleDistribution).filter(SampleDistribution.interaction_id == interaction_id).all()
        samples_dict = {s.product.name: s.quantity for s in samples if s.product}

        follow_up = db.query(FollowUp).filter(FollowUp.interaction_id == interaction_id).first()

        return {
            "id": interaction.id,
            "hcp_id": interaction.hcp_id,
            "doctor_name": f"Dr. {interaction.hcp.first_name} {interaction.hcp.last_name}" if interaction.hcp else "Unknown",
            "hospital_name": interaction.hcp.hospital_name if interaction.hcp else "Unknown",
            "meeting_date": interaction.meeting_date.strftime("%Y-%m-%d"),
            "meeting_time": interaction.meeting_time.strftime("%H:%M"),
            "meeting_type": interaction.meeting_type,
            "feedback": interaction.feedback,
            "outcome": interaction.outcome,
            "notes": interaction.notes,
            "summary": interaction.summary,
            "products_discussed": [p.name for p in interaction.products_discussed],
            "samples_distributed": samples_dict,
            "follow_up_date": follow_up.follow_up_date.strftime("%Y-%m-%d") if follow_up else None
        }
