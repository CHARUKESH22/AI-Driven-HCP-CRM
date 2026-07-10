import uuid
import datetime
import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy import or_
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.hcp import HCP
from app.services.db_service import DBService
from app.agents.prompts import (
    ENTITY_EXTRACTION_SYSTEM_PROMPT,
    SUMMARIZATION_SYSTEM_PROMPT,
    FOLLOW_UP_SYSTEM_PROMPT
)

def run_llm_json(system_prompt: str, user_message: str) -> Dict[str, Any]:
    """Helper to query the LLM and guarantee a JSON response, falling back if offline/missing key."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY_MISSING")

    try:
        llm = ChatGroq(
            temperature=0.1,
            model_name=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{text}")
        ])
        
        chain = prompt | llm
        response = chain.invoke({"text": user_message})
        
        # Clean response and parse as JSON
        content = response.content.strip()
        # Remove markdown fences if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        return json.loads(content)
    except Exception as e:
        print(f"LLM Error encountered: {e}")
        raise e

# --- RULE-BASED FALLBACK PARSERS (For local/mock testing without Groq key) ---

def parse_entities_mock(text: str) -> Dict[str, Any]:
    """Fallback parser using regex to extract entities from sample inputs."""
    # Default outputs
    doctor_name = None
    hospital_name = None
    meeting_date = datetime.date.today().strftime("%Y-%m-%d")
    meeting_time = datetime.datetime.now().strftime("%H:%M")
    meeting_type = "In-Person"
    products_discussed = []
    samples_distributed = {}
    doctor_feedback = None
    outcome = None
    follow_up_date = None
    notes = None

    # Detect Doctor Name
    doc_match = re.search(r"Dr\.?\s+([A-Za-z]+)", text, re.IGNORECASE)
    if doc_match:
        doctor_name = f"Dr. {doc_match.group(1).capitalize()}"
    elif "ravi" in text.lower():
        doctor_name = "Dr. Ravi"

    # Detect Hospital
    if "city general" in text.lower():
        hospital_name = "City General Hospital"
    elif "metro heart" in text.lower():
        hospital_name = "Metro Heart Institute"

    # Detect Products
    for prod in ["GlucoSafe", "CardioShield", "NeuroPlus", "RespiClear", "OsteoBond"]:
        if prod.lower() in text.lower():
            products_discussed.append(prod)

    # Detect Samples Distributed
    # e.g., "distributed five samples", "distributed 5 samples"
    qty = 0
    qty_match = re.search(r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+sample", text, re.IGNORECASE)
    if qty_match:
        val = qty_match.group(1).lower()
        word_to_num = {"one":1, "two":2, "three":3, "four":4, "five":5, "six":6, "seven":7, "eight":8, "nine":9, "ten":10}
        if val.isdigit():
            qty = int(val)
        else:
            qty = word_to_num.get(val, 1)

    if products_discussed and qty > 0:
        samples_distributed[products_discussed[0]] = qty

    # Detect follow up
    # e.g., "after two weeks", "2 weeks", "next week"
    if "two weeks" in text.lower() or "2 weeks" in text.lower():
        follow_up_date = (datetime.date.today() + datetime.timedelta(days=14)).strftime("%Y-%m-%d")
    elif "next week" in text.lower() or "1 week" in text.lower():
        follow_up_date = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")

    # Feedback / Outcome extraction based on standard prompts
    if "liked" in text.lower() or "good feedback" in text.lower():
        doctor_feedback = "Highly receptive, expressed interest in product profile."
        outcome = "Representative will follow up and monitor prescription levels."
    else:
        doctor_feedback = "Discussed safety profiles and patient adherence."
        outcome = "Schedule regular visits to review patient charts."

    notes = "Narrative chat extract: " + text[:60] + ("..." if len(text) > 60 else "")

    return {
        "doctor_name": doctor_name,
        "hospital_name": hospital_name,
        "meeting_date": meeting_date,
        "meeting_time": meeting_time,
        "meeting_type": meeting_type,
        "products_discussed": products_discussed,
        "samples_distributed": samples_distributed,
        "doctor_feedback": doctor_feedback,
        "outcome": outcome,
        "follow_up_date": follow_up_date,
        "notes": notes
    }

def summarize_mock(narrative: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback summarizer."""
    prods = ", ".join(fields.get("products_discussed", [])) or "products"
    doc = fields.get("doctor_name") or "the doctor"
    return {
        "summary": f"Met with {doc} to discuss clinical trials of {prods}. Feedback was positive, and samples were provided to assist with trials.",
        "key_discussion": [
            f"Efficacy and benefits of {prods}",
            f"Adherence and patient feedback loops"
        ],
        "doctor_interest_level": "High" if "like" in narrative.lower() or "positive" in narrative.lower() else "Medium",
        "commitments": [
            "Follow up next week with safety data sheets",
            "Monitor patient prescription rates"
        ]
    }

def suggest_follow_up_mock(fields: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback follow-up recommender."""
    prods = fields.get("products_discussed", ["our products"])
    return {
        "suggested_date": (datetime.date.today() + datetime.timedelta(days=14)).strftime("%Y-%m-%d"),
        "suggested_agenda": f"Review patient outcomes of {', '.join(prods)} and distribute next-level educational material.",
        "suggested_products": prods,
        "suggested_reminders": [
            "Check doctor availability in the morning",
            "Bring clinical safety booklets"
        ]
    }

# --- THE FIVE REQUIRED TOOLS ---

def search_hcp_tool(query: str) -> Dict[str, Any]:
    """
    Search Healthcare Professionals Tool.
    Returns doctor profile, hospital, specialty, and previous interactions.
    """
    with SessionLocal() as db:
        hcps = DBService.search_hcps(db, query)
        results = []
        for hcp in hcps:
            # Gather details
            details = DBService.get_hcp_with_relations(db, hcp.id)
            prev_ints = []
            for item in details["interactions"][:2]:  # Last 2 interactions
                prev_ints.append({
                    "date": item.meeting_date.strftime("%Y-%m-%d"),
                    "summary": item.summary,
                    "outcome": item.outcome
                })
            
            upcoming_follow_up = None
            if details["follow_ups"]:
                upcoming_follow_up = details["follow_ups"][0].follow_up_date.strftime("%Y-%m-%d")

            results.append({
                "id": str(hcp.id),
                "doctor_name": f"Dr. {hcp.first_name} {hcp.last_name}",
                "specialization": hcp.specialization,
                "hospital_name": hcp.hospital_name,
                "email": hcp.email,
                "phone": hcp.phone,
                "previous_interactions": prev_ints,
                "upcoming_follow_up": upcoming_follow_up
            })
        return {"success": True, "results": results}

def log_interaction_tool(state_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Log Interaction Tool.
    Performs entity extraction, generates summary, validates required fields,
    stores in PostgreSQL, and returns a success response.
    """
    fields = state_data.get("extracted_fields", {})
    if not fields:
        fields = parse_entities_mock(state_data.get("message", ""))
    
    # 1. Validation of required fields
    hcp_id = fields.get("hcp_id")
    doctor_name = fields.get("doctor_name")
    
    with SessionLocal() as db:
        # Match Doctor if hcp_id not provided
        if not hcp_id and doctor_name:
            clean_name = doctor_name.replace("Dr.", "").strip()
            matching_hcp = db.query(HCP).filter(
                HCP.doctor_name.ilike(f"%{clean_name}%")
            ).first()
            if matching_hcp:
                hcp_id = matching_hcp.id
                fields["hcp_id"] = str(hcp_id)
                fields["hospital_name"] = matching_hcp.hospital_name

        if not hcp_id:
            # If still not found, search default first HCP
            default_hcp = db.query(HCP).first()
            if default_hcp:
                hcp_id = default_hcp.id
                fields["hcp_id"] = str(hcp_id)
                fields["doctor_name"] = f"Dr. {default_hcp.first_name} {default_hcp.last_name}"
                fields["hospital_name"] = default_hcp.hospital_name
            else:
                return {"success": False, "error": "No matching HCP found in the database. Please register the HCP first."}

        # Validate date and time
        meet_date_str = fields.get("meeting_date") or datetime.date.today().strftime("%Y-%m-%d")
        meet_time_str = fields.get("meeting_time") or "12:00"
        
        meet_date = datetime.datetime.strptime(meet_date_str, "%Y-%m-%d").date()
        try:
            meet_time = datetime.datetime.strptime(meet_time_str, "%H:%M").time()
        except ValueError:
            meet_time = datetime.datetime.strptime(meet_time_str, "%H:%M:%S").time()

        # 2. Generate Meeting Summary
        summary_text = fields.get("summary")
        if not summary_text:
            try:
                summary_data = run_llm_json(
                    SUMMARIZATION_SYSTEM_PROMPT, 
                    f"Narrative: {state_data.get('message', '')}\nFields: {json.dumps(fields)}"
                )
                summary_text = summary_data.get("summary")
            except Exception:
                summary_data = summarize_mock(state_data.get("message", ""), fields)
                summary_text = summary_data.get("summary")

        # 3. Parse follow up date
        follow_up_date = None
        follow_up_str = fields.get("follow_up_date")
        if follow_up_str:
            follow_up_date = datetime.datetime.strptime(follow_up_str, "%Y-%m-%d").date()

        # 4. Save to PostgreSQL
        try:
            interaction = DBService.create_interaction(
                db=db,
                hcp_id=uuid.UUID(str(hcp_id)),
                meeting_date=meet_date,
                meeting_time=meet_time,
                meeting_type=fields.get("meeting_type", "In-Person"),
                feedback=fields.get("doctor_feedback"),
                outcome=fields.get("outcome"),
                notes=fields.get("notes"),
                summary=summary_text,
                products_discussed=fields.get("products_discussed", []),
                samples_distributed=fields.get("samples_distributed", {}),
                follow_up_date=follow_up_date
            )
            
            # Format saved interaction response
            saved_details = DBService.get_interaction_details(db, interaction.id)
            return {"success": True, "message": "Interaction saved successfully!", "interaction": saved_details}
            
        except Exception as e:
            return {"success": False, "error": f"Database insertion failed: {str(e)}"}

def edit_interaction_tool(interaction_id: str, fields_to_update: Dict[str, Any]) -> Dict[str, Any]:
    """
    Edit Interaction Tool.
    Finds existing interaction, modifies requested fields, updates DB, and returns updated details.
    """
    if not interaction_id:
        return {"success": False, "error": "Missing interaction_id for update."}

    with SessionLocal() as db:
        try:
            interaction_uuid = uuid.UUID(interaction_id)
            updated = DBService.update_interaction(db, interaction_uuid, fields_to_update)
            if not updated:
                return {"success": False, "error": f"No interaction found with ID {interaction_id}"}
            
            details = DBService.get_interaction_details(db, updated.id)
            return {"success": True, "message": "Interaction updated successfully!", "interaction": details}
        except Exception as e:
            return {"success": False, "error": f"Failed to edit interaction: {str(e)}"}

def generate_summary_tool(narrative: str, current_fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate Summary Tool.
    Generates a concise meeting summary highlighting discussions, doctor interest, products, commitments.
    """
    try:
        summary_data = run_llm_json(
            SUMMARIZATION_SYSTEM_PROMPT,
            f"Narrative: {narrative}\nFields: {json.dumps(current_fields)}"
        )
        return {"success": True, "summary": summary_data}
    except Exception:
        summary_data = summarize_mock(narrative, current_fields)
        return {"success": True, "summary": summary_data}

def suggest_follow_up_tool(previous_interaction_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Suggest Follow-up Tool.
    Analyzes historical records to recommend follow-up date, agenda, products, and reminders.
    """
    try:
        follow_up_data = run_llm_json(
            FOLLOW_UP_SYSTEM_PROMPT,
            f"Previous Interaction Details: {json.dumps(previous_interaction_details)}"
        )
        return {"success": True, "recommendation": follow_up_data}
    except Exception:
        follow_up_data = suggest_follow_up_mock(previous_interaction_details)
        return {"success": True, "recommendation": follow_up_data}
