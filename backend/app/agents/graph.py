import json
import datetime
import re
from typing import Dict, Any, List
from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, END

from app.core.config import settings
from app.agents.state import AgentState
from app.agents.prompts import INTENT_DETECTION_SYSTEM_PROMPT, ENTITY_EXTRACTION_SYSTEM_PROMPT
from app.agents.tools import (
    run_llm_json,
    parse_entities_mock,
    search_hcp_tool,
    log_interaction_tool,
    edit_interaction_tool,
    generate_summary_tool,
    suggest_follow_up_tool
)

# --- GRAPH NODES ---

def intent_detector_node(state: AgentState) -> Dict[str, Any]:
    """
    Analyzes the user's input to detect the user's intent.
    Also extracts entities immediately if the intent is Log Interaction.
    """
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "Log Interaction", "extracted_fields": {}}
        
    latest_msg = messages[-1].content
    intent = "Log Interaction"
    extracted_fields = {}
    
    # 1. Detect Intent
    try:
        intent_data = run_llm_json(INTENT_DETECTION_SYSTEM_PROMPT, latest_msg)
        intent = intent_data.get("intent", "Log Interaction")
    except Exception:
        # Rule-based intent detection fallback
        text_lower = latest_msg.lower()
        if any(keyword in text_lower for keyword in ["search", "find", "who is", "profile of", "show doctor"]):
            intent = "Search HCP"
        elif any(keyword in text_lower for keyword in ["change", "update", "modify", "edit"]):
            intent = "Edit Interaction"
        elif any(keyword in text_lower for keyword in ["summary", "summarize", "recap"]):
            intent = "Generate Summary"
        elif any(keyword in text_lower for keyword in ["follow up", "next visit", "next meeting", "agenda"]):
            intent = "Suggest Follow-up"
        else:
            intent = "Log Interaction"

    # 2. Extract Entities if logging visit
    if intent == "Log Interaction":
        try:
            curr_date_str = datetime.date.today().strftime("%Y-%m-%d")
            system_prompt = ENTITY_EXTRACTION_SYSTEM_PROMPT.format(current_date=curr_date_str)
            extracted_fields = run_llm_json(system_prompt, latest_msg)
        except Exception:
            extracted_fields = parse_entities_mock(latest_msg)

    return {
        "intent": intent,
        "extracted_fields": extracted_fields
    }

def log_interaction_node(state: AgentState) -> Dict[str, Any]:
    """Executes the Log Interaction tool."""
    latest_msg = state["messages"][-1].content
    tool_input = {
        "message": latest_msg,
        "extracted_fields": state.get("extracted_fields", {})
    }
    res = log_interaction_tool(tool_input)
    return {"db_response": res}

def edit_interaction_node(state: AgentState) -> Dict[str, Any]:
    """Executes the Edit Interaction tool."""
    latest_msg = state["messages"][-1].content
    form_state = state.get("current_form_state", {})
    
    # Determine the target interaction ID (usually from state, or fallback)
    interaction_id = form_state.get("id")
    
    # Simple extraction of updated fields from latest message
    # e.g., "Change follow up to tomorrow" -> {"follow_up_date": "YYYY-MM-DD"}
    extracted_edits = {}
    
    # Look for follow up date updates
    if "follow up" in latest_msg.lower():
        # Match next week or similar relative terms
        if "next week" in latest_msg.lower():
            extracted_edits["follow_up_date"] = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        elif "two weeks" in latest_msg.lower() or "2 weeks" in latest_msg.lower():
            extracted_edits["follow_up_date"] = (datetime.date.today() + datetime.timedelta(days=14)).strftime("%Y-%m-%d")
        else:
            # Try to match YYYY-MM-DD
            match = re.search(r"\d{4}-\d{2}-\d{2}", latest_msg)
            if match:
                extracted_edits["follow_up_date"] = match.group(0)
    
    # Look for sample changes
    # e.g. "change samples to 10" or "give 10 samples"
    match_samples = re.search(r"(\d+)\s+sample", latest_msg, re.IGNORECASE)
    if match_samples:
        qty = int(match_samples.group(1))
        # If we have a product discussed in form state, use that, else default
        prods = form_state.get("products_discussed", [])
        prod_name = prods[0] if prods else "GlucoSafe"
        extracted_edits["samples_distributed"] = {prod_name: qty}
        if prod_name not in prods:
            extracted_edits["products_discussed"] = prods + [prod_name]

    if not interaction_id:
        return {"db_response": {"success": False, "error": "I couldn't find an active interaction record to edit. Please log or search an interaction first."}}
        
    res = edit_interaction_tool(interaction_id, extracted_edits)
    return {"db_response": res}

def search_hcp_node(state: AgentState) -> Dict[str, Any]:
    """Executes the Search HCP tool."""
    latest_msg = state["messages"][-1].content
    
    # Extract query word (e.g. "Dr. Ravi" -> "Ravi", "Find Jenkins" -> "Jenkins")
    query = latest_msg
    # Clean up standard search prefixes
    query = re.sub(r"(search for|find|who is|show|doctor|dr\.?)\s+", "", query, flags=re.IGNORECASE).strip()
    
    res = search_hcp_tool(query)
    return {"db_response": res}

def generate_summary_node(state: AgentState) -> Dict[str, Any]:
    """Executes the Generate Summary tool."""
    latest_msg = state["messages"][-1].content
    form_state = state.get("current_form_state", {})
    res = generate_summary_tool(latest_msg, form_state)
    return {"db_response": res}

def suggest_follow_up_node(state: AgentState) -> Dict[str, Any]:
    """Executes the Suggest Follow-up tool."""
    form_state = state.get("current_form_state", {})
    res = suggest_follow_up_tool(form_state)
    return {"db_response": res}

def responder_node(state: AgentState) -> Dict[str, Any]:
    """
    Synthesizes the natural language response based on the detected intent
    and tool execution results. Updates the form state if needed.
    """
    intent = state.get("intent")
    db_res = state.get("db_response") or {}
    extracted = state.get("extracted_fields") or {}
    
    agent_response = ""
    updated_form_state = state.get("current_form_state", {}).copy()

    if intent == "Log Interaction":
        if db_res.get("success"):
            saved_int = db_res.get("interaction", {})
            updated_form_state.update(saved_int)
            doc_name = saved_int.get("doctor_name", "the doctor")
            hosp = saved_int.get("hospital_name", "")
            prods = ", ".join(saved_int.get("products_discussed", []))
            
            agent_response = f"I've successfully processed the visit narrative. I matched **{doc_name}** at *{hosp}*, extracted **{prods}** as the products discussed, and set the sample log. A summary has been generated. Please review the populated form on the left and click **Save**."
        else:
            # If DB failed but we extracted values, populate the form so user can save manually
            updated_form_state.update(extracted)
            err = db_res.get("error", "Database connection issue")
            agent_response = f"I successfully extracted the information, but couldn't auto-save to the database ({err}). I have populated the form on the left so you can review and save it manually."

    elif intent == "Search HCP":
        if db_res.get("success") and db_res.get("results"):
            hcps = db_res.get("results", [])
            hcp_list_md = []
            for h in hcps:
                hcp_list_md.append(f"- **{h['doctor_name']}** ({h['specialization']} at *{h['hospital_name']}*)")
            
            agent_response = f"I found the following matching Healthcare Professionals:\n\n" + "\n".join(hcp_list_md) + "\n\nSelect a doctor from the list to view their history or schedule an interaction."
            # Set the first found HCP details in form state
            first_hcp = hcps[0]
            updated_form_state["hcp_id"] = first_hcp["id"]
            updated_form_state["doctor_name"] = first_hcp["doctor_name"]
            updated_form_state["hospital_name"] = first_hcp["hospital_name"]
        else:
            agent_response = f"I couldn't find any doctor matching your search query. Please double-check the name or specialization."

    elif intent == "Edit Interaction":
        if db_res.get("success"):
            saved_int = db_res.get("interaction", {})
            updated_form_state.update(saved_int)
            agent_response = f"I have successfully updated the interaction records. The changes have been synced back to the form on the left."
        else:
            err = db_res.get("error", "Unknown error")
            agent_response = f"I couldn't process the edit request. Reason: {err}"

    elif intent == "Generate Summary":
        if db_res.get("success"):
            sum_data = db_res.get("summary", {})
            summary_p = sum_data.get("summary", "")
            updated_form_state["summary"] = summary_p
            agent_response = f"**Meeting Summary:**\n{summary_p}\n\n**Key Discussion Points:**\n" + "\n".join(f"- {item}" for item in sum_data.get("key_discussion", []))
        else:
            agent_response = "I couldn't generate the summary because the AI model is currently offline. Please write a brief notes paragraph in the form."

    elif intent == "Suggest Follow-up":
        if db_res.get("success"):
            reco = db_res.get("recommendation", {})
            agenda = reco.get("suggested_agenda", "")
            s_date = reco.get("suggested_date", "")
            updated_form_state["follow_up_date"] = s_date
            
            agent_response = f"Based on the meeting outcomes, I recommend scheduling the next visit for **{s_date}**.\n\n**Suggested Agenda:**\n{agenda}\n\n**Key Reminders:**\n" + "\n".join(f"- {item}" for item in reco.get("suggested_reminders", []))
        else:
            agent_response = "I couldn't compute a follow-up recommendation at this time. Standard recommendation is a follow-up visit in 2 weeks."

    else:
        agent_response = "Hello! I'm your AI CRM Assistant. You can describe your meeting in natural language (e.g., 'I met Dr Ravi today...'), and I will automatically extract the doctor, products, samples, and populate the form on the left."

    # Return new state updates
    return {
        "messages": [AIMessage(content=agent_response)],
        "agent_response": agent_response,
        "current_form_state": updated_form_state
    }

# --- GRAPH BUILD & COMPILATION ---

builder = StateGraph(AgentState)

# Add Nodes
builder.add_node("intent_detector", intent_detector_node)
builder.add_node("log_interaction", log_interaction_node)
builder.add_node("edit_interaction", edit_interaction_node)
builder.add_node("search_hcp", search_hcp_node)
builder.add_node("generate_summary", generate_summary_node)
builder.add_node("suggest_follow_up", suggest_follow_up_node)
builder.add_node("responder", responder_node)

# Set Entry
builder.set_entry_point("intent_detector")

# Define Routing
def route_intent(state: AgentState) -> str:
    intent = state.get("intent")
    if intent == "Log Interaction":
        return "log_interaction"
    elif intent == "Edit Interaction":
        return "edit_interaction"
    elif intent == "Search HCP":
        return "search_hcp"
    elif intent == "Generate Summary":
        return "generate_summary"
    elif intent == "Suggest Follow-up":
        return "suggest_follow_up"
    return "responder"

builder.add_conditional_edges(
    "intent_detector",
    route_intent,
    {
        "log_interaction": "log_interaction",
        "edit_interaction": "edit_interaction",
        "search_hcp": "search_hcp",
        "generate_summary": "generate_summary",
        "suggest_follow_up": "suggest_follow_up",
        "responder": "responder"
    }
)

# Connect tool execution to Responder
builder.add_edge("log_interaction", "responder")
builder.add_edge("edit_interaction", "responder")
builder.add_edge("search_hcp", "responder")
builder.add_edge("generate_summary", "responder")
builder.add_edge("suggest_follow_up", "responder")
builder.add_edge("responder", END)

graph = builder.compile()
