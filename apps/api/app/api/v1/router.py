from fastapi import APIRouter

from app.api.v1.routes import companies, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(companies.router)

# Chat, campaigns, leads, research, email and analytics routers are added here
# as each phase lands.
