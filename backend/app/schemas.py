from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    name: str
    size: int
    chunks: int
    uploaded_at: str


class ChatRequest(BaseModel):
    question: str
    document_id: str
    model: str = "llama3.2"


class SourcePassage(BaseModel):
    content: str
    source: str = ""
    page: Optional[int] = None
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourcePassage]
    model: str
    document_id: str


class ModelsResponse(BaseModel):
    models: List[str]
