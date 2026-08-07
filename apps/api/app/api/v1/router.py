from fastapi import APIRouter

from app.api.v1.routes import health

api_router = APIRouter()
api_router.include_router(health.router)

# Feature routers (chat, companies, knowledge, campaigns, leads, research,
# email, analytics) are added here as each phase lands.
