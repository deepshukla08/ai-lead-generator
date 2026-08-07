from functools import lru_cache
from typing import Literal

from shared import BaseServiceSettings


class AiServiceSettings(BaseServiceSettings):
    service_name: str = "ai-service"

    llm_provider: Literal["gemini", "groq", "openrouter"] = "gemini"
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384


@lru_cache
def get_settings() -> AiServiceSettings:
    return AiServiceSettings()
