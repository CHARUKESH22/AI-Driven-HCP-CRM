from fastapi import APIRouter
from app.api import hcp, interaction, chat

api_router = APIRouter()

# Register sub-routers
api_router.include_router(hcp.router, prefix="/hcp", tags=["HCP"])
api_router.include_router(interaction.router, prefix="/interaction", tags=["Interaction"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
