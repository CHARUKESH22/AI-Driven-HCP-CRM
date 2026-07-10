from typing import Annotated, Dict, Any, List, Optional, Sequence
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    State definition for the LangGraph agent.
    """
    # Conversation messages
    messages: Annotated[Sequence[BaseMessage], add_messages]
    
    # Session identifiers
    session_id: str
    
    # Traditional Form State (synchronized with the frontend)
    # Holds fields like: doctor_id, doctor_name, hospital, date, time, 
    # products_discussed, samples_distributed, feedback, outcome, follow_up_date, notes
    current_form_state: Dict[str, Any]
    
    # Newly extracted/updated fields from the last user message
    extracted_fields: Dict[str, Any]
    
    # Detected user intent
    intent: Optional[str]
    
    # Database responses or tool outcomes
    db_response: Optional[Dict[str, Any]]
    
    # List of validation or execution errors encountered during the turn
    errors: List[str]
    
    # The final natural language response text for the user
    agent_response: Optional[str]
