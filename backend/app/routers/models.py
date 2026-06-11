import httpx
from fastapi import APIRouter

from app.config import settings
from app.schemas import ModelsResponse

router = APIRouter()

_OLLAMA_FALLBACK = ["llama3.2", "llama3", "mistral", "phi3", "gemma2"]
_GROQ_MODELS = ["llama-3.3-70b-versatile"]


@router.get("/", response_model=ModelsResponse)
async def list_models():
    """Return available models — Groq models first if API key is configured, then local Ollama models."""
    models: list[str] = []

    if settings.groq_api_key:
        models.extend(_GROQ_MODELS)

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            ollama_names = [m["name"] for m in data.get("models", [])]
            models.extend(ollama_names)
    except Exception:
        if not models:
            models.extend(_OLLAMA_FALLBACK)

    return ModelsResponse(models=models or _OLLAMA_FALLBACK)
