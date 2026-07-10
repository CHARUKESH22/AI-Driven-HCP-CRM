import uuid
import datetime
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db
from app.services.db_service import DBService
from app.schemas.interaction import InteractionCreate, InteractionUpdate, InteractionResponse
from app.models.product import Product

router = APIRouter()

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    """
    List pharmaceutical products catalog (for checkboxes and selection).
    """
    try:
        products = db.query(Product).order_by(Product.name).all()
        return [{"id": str(p.id), "name": p.name, "description": p.description} for p in products]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load products: {str(e)}")

@router.get("", response_model=List[InteractionResponse])
def list_all_interactions(db: Session = Depends(get_db)):
    """
    List all logged interactions (global history).
    """
    try:
        from sqlalchemy import desc
        from app.models.interaction import Interaction
        interactions = db.query(Interaction).order_by(desc(Interaction.meeting_date)).all()
        results = []
        for item in sorted(interactions, key=lambda x: (x.meeting_date, x.meeting_time), reverse=True):
            details = DBService.get_interaction_details(db, item.id)
            if details:
                results.append(details)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load interactions: {str(e)}")

@router.post("", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
def create_interaction(payload: InteractionCreate, db: Session = Depends(get_db)):
    """
    Create a new HCP interaction log in the database.
    """
    try:
        # Parse time string HH:MM to datetime.time
        try:
            meet_time = datetime.datetime.strptime(payload.meeting_time, "%H:%M").time()
        except ValueError:
            meet_time = datetime.datetime.strptime(payload.meeting_time, "%H:%M:%S").time()
            
        interaction = DBService.create_interaction(
            db=db,
            hcp_id=payload.hcp_id,
            meeting_date=payload.meeting_date,
            meeting_time=meet_time,
            meeting_type=payload.meeting_type,
            feedback=payload.feedback,
            outcome=payload.outcome,
            notes=payload.notes,
            summary=payload.summary,
            products_discussed=payload.products_discussed,
            samples_distributed=payload.samples_distributed,
            follow_up_date=payload.follow_up_date
        )
        
        details = DBService.get_interaction_details(db, interaction.id)
        if not details:
            raise HTTPException(status_code=404, detail="Failed to fetch created interaction details.")
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save interaction: {str(e)}")

@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_interaction(
    interaction_id: uuid.UUID,
    payload: InteractionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update details of an existing interaction log.
    """
    try:
        # Prepare fields
        update_data = payload.model_dump(exclude_unset=True)
        updated = DBService.update_interaction(db, interaction_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Interaction record with ID {interaction_id} not found.")
            
        return DBService.get_interaction_details(db, updated.id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to edit interaction: {str(e)}")

@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve details of a specific interaction visit log.
    """
    details = DBService.get_interaction_details(db, interaction_id)
    if not details:
        raise HTTPException(status_code=404, detail=f"Interaction record with ID {interaction_id} not found.")
    return details

@router.get("/history/{hcp_id}", response_model=List[InteractionResponse])
def get_interaction_history(hcp_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Retrieve list of past interactions with a specific Healthcare Professional.
    """
    try:
        relations = DBService.get_hcp_with_relations(db, hcp_id)
        if not relations:
            raise HTTPException(status_code=404, detail=f"HCP with ID {hcp_id} not found.")
            
        results = []
        for item in relations["interactions"]:
            details = DBService.get_interaction_details(db, item.id)
            if details:
                results.append(details)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve interaction history: {str(e)}")

@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a specific interaction log by ID.
    """
    try:
        from app.models.interaction import Interaction
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            raise HTTPException(status_code=404, detail="Interaction record not found.")
        db.delete(interaction)
        db.commit()
        return {"message": "Interaction record deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete interaction: {str(e)}")

