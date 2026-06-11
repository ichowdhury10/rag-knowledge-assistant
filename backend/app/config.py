from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    ollama_base_url: str = "http://ollama:11434"
    chroma_persist_dir: str = "./chroma_store"
    documents_file: str = "./documents.json"
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 600
    chunk_overlap: int = 80
    retrieval_k: int = 4
    groq_api_key: str = ""
    data_dir: str = "../data"

    class Config:
        env_file = ".env"


settings = Settings()
