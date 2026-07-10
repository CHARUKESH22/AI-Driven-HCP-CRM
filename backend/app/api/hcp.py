from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from app.api.deps import get_db
from app.services.db_service import DBService
from app.schemas.hcp import HCP as HCPSchema, HCPCreate, HCPUpdate
from app.models.hcp import HCP as HCPModel

router = APIRouter()

@router.get("/search")
def search_hcps(
    query: str = Query("", description="Search term for doctor name, hospital, specialization, or city"),
    db: Session = Depends(get_db)
):
    """
    Search healthcare professionals.
    Uses fuzzy matched queries on name, hospital, specialization, and city.
    """
    try:
        hcps = DBService.search_hcps(db, query)
        results = []
        for h in hcps:
            # Fetch relationships to identify outstanding follow-ups or last visit dates
            details = DBService.get_hcp_with_relations(db, h.id)
            last_visit = None
            if details["interactions"]:
                last_visit = details["interactions"][0].meeting_date.strftime("%Y-%m-%d")
            
            results.append({
                "id": str(h.id),
                "first_name": h.first_name,
                "last_name": h.last_name,
                "full_name": h.full_name,
                "doctor_name": h.doctor_name,
                "specialization": h.specialization,
                "hospital_name": h.hospital_name,
                "hospital": h.hospital,
                "department": h.department,
                "city": h.city,
                "region": h.region,
                "phone": h.phone,
                "email": h.email,
                "medical_registration": h.medical_registration,
                "experience": h.experience,
                "preferred_visit_time": h.preferred_visit_time,
                "priority": h.priority,
                "products": [p.strip() for p in h.products.split(",") if p.strip()] if h.products else [],
                "notes": h.notes,
                "representative": h.representative,
                "last_visit_date": last_visit
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search HCPs: {str(e)}")

@router.get("/list")
def list_all_hcps(db: Session = Depends(get_db)):
    """
    List all healthcare professionals (for drop-down selection).
    """
    try:
        hcps = DBService.search_hcps(db, "")
        return [
            {
                "id": str(h.id),
                "full_name": h.full_name,
                "doctor_name": h.doctor_name,
                "hospital_name": h.hospital_name,
                "hospital": h.hospital,
                "specialization": h.specialization
            }
            for h in hcps
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve HCP list: {str(e)}")

@router.post("/", response_model=HCPSchema)
def create_hcp(hcp_in: HCPCreate, db: Session = Depends(get_db)):
    """Create a new Healthcare Professional profile."""
    if hcp_in.email:
        existing = db.query(HCPModel).filter(HCPModel.email == hcp_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="HCP with this email already registered.")
    
    db_obj = HCPModel(
        doctor_name=hcp_in.doctor_name,
        specialization=hcp_in.specialization,
        hospital=hcp_in.hospital,
        department=hcp_in.department,
        city=hcp_in.city,
        region=hcp_in.region,
        phone=hcp_in.phone,
        email=hcp_in.email,
        medical_registration=hcp_in.medical_registration,
        experience=hcp_in.experience,
        preferred_visit_time=hcp_in.preferred_visit_time,
        priority=hcp_in.priority,
        products=",".join(hcp_in.products) if hcp_in.products else "",
        notes=hcp_in.notes,
        representative=hcp_in.representative
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=HCPSchema)
def get_hcp(id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific HCP profile by ID."""
    hcp_obj = db.query(HCPModel).filter(HCPModel.id == id).first()
    if not hcp_obj:
        raise HTTPException(status_code=404, detail="Healthcare Professional not found.")
    return hcp_obj

@router.put("/{id}", response_model=HCPSchema)
def update_hcp(id: uuid.UUID, hcp_in: HCPUpdate, db: Session = Depends(get_db)):
    """Update a specific HCP profile by ID."""
    hcp_obj = db.query(HCPModel).filter(HCPModel.id == id).first()
    if not hcp_obj:
        raise HTTPException(status_code=404, detail="Healthcare Professional not found.")
    
    update_data = hcp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "products" and value is not None:
            value = ",".join(value) if value else ""
        setattr(hcp_obj, field, value)
        
    db.commit()
    db.refresh(hcp_obj)
    return hcp_obj

@router.delete("/{id}")
def delete_hcp(id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete an HCP profile by ID."""
    hcp_obj = db.query(HCPModel).filter(HCPModel.id == id).first()
    if not hcp_obj:
        raise HTTPException(status_code=404, detail="Healthcare Professional not found.")
    db.delete(hcp_obj)
    db.commit()
    return {"message": "HCP deleted successfully."}

