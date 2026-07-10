import uuid
from fastapi import APIRouter, HTTPException, status
from langchain_core.messages import HumanMessage
from typing import Dict, Any

from app.schemas.chat import ChatRequest, ChatResponse
from app.agents.graph import graph

router = APIRouter()

@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat_with_assistant(payload: ChatRequest):
    """
    POST route to communicate with the AI agent.
    Runs the LangGraph state machine to extract fields, detect intent, and execute tools.
    """
    try:
        # Prepare the initial state channel values
        initial_state = {
            "messages": [HumanMessage(content=payload.message)],
            "session_id": payload.session_id or str(uuid.uuid4()),
            "current_form_state": payload.current_form_state or {},
            "extracted_fields": {},
            "intent": None,
            "db_response": None,
            "errors": [],
            "agent_response": None
        }
        
        # Invoke the LangGraph engine
        final_state = graph.invoke(initial_state)
        
        # Check if errors were raised during execution
        errors = final_state.get("errors", [])
        if errors:
            print(f"Agent execution warnings: {errors}")
            
        return ChatResponse(
            message=final_state.get("agent_response") or "I've processed your input.",
            extracted_form_fields=final_state.get("current_form_state") or {},
            intent=final_state.get("intent") or "Log Interaction"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LangGraph Agent failed to execute: {str(e)}"
        )
