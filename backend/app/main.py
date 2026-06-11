from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents, chat, models
from app.config import settings
from app.services import rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    ingested = await rag_service.ingest_data_dir()
    if ingested:
        print(f"[startup] Auto-ingested {len(ingested)} documents: {ingested}")
    yield


app = FastAPI(
    title="Stevens Unofficial Guide API",
    description="Ask questions about Stevens CS professors, grounded in real student reviews.",
    version="2.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(models.router, prefix="/api/models", tags=["models"])


@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "2.1.0"}
