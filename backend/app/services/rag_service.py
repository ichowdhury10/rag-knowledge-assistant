import os
import json
import uuid
import tempfile
from pathlib import Path
from datetime import datetime
from typing import AsyncIterator

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.config import settings
from app.schemas import DocumentResponse, SourcePassage
from app.services.vectorstore import get_vectorstore, delete_collection

_documents: dict[str, dict] = {}

_GROQ_MODELS = {"llama-3.3-70b-versatile", "llama3-70b-8192", "mixtral-8x7b-32768"}

_PROMPT = ChatPromptTemplate.from_template(
    """You are a precise, helpful assistant. Answer the question using ONLY the provided context.
If the context does not contain enough information to answer, say "I don't have enough information on that in the documents."

Context:
{context}

Question: {question}

Answer:"""
)


def _load_registry() -> dict[str, dict]:
    p = Path(settings.documents_file)
    if p.exists():
        with open(p) as f:
            return json.load(f)
    return {}


def _save_registry() -> None:
    with open(settings.documents_file, "w") as f:
        json.dump(_documents, f, default=str)


def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(d.page_content for d in docs)


def _init() -> None:
    global _documents
    _documents = _load_registry()


_init()


def _build_llm(model: str):
    if model in _GROQ_MODELS and settings.groq_api_key:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=model,
            api_key=settings.groq_api_key,
            temperature=0.1,
        )
    return OllamaLLM(
        model=model,
        base_url=settings.ollama_base_url,
        temperature=0.1,
    )


def _process_chunks(chunks, filename: str) -> None:
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["filename"] = filename


# ── Document management ────────────────────────────────────────────────────────

async def upload_document(file_bytes: bytes, filename: str) -> DocumentResponse:
    document_id = uuid.uuid4().hex[:8]
    suffix = Path(filename).suffix.lower()

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")

        pages = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_documents(pages)
        _process_chunks(chunks, filename)

        vs = get_vectorstore(document_id)
        vs.add_documents(chunks)

        doc_info = {
            "id": document_id,
            "name": filename,
            "size": len(file_bytes),
            "chunks": len(chunks),
            "uploaded_at": datetime.now().isoformat(),
        }
        _documents[document_id] = doc_info
        _save_registry()
        return DocumentResponse(**doc_info)
    finally:
        os.unlink(tmp_path)


async def ingest_data_dir() -> list[str]:
    """Load all .txt and .pdf files from data_dir that haven't been ingested yet."""
    data_path = Path(settings.data_dir)
    if not data_path.exists():
        return []

    already_ingested = {d["name"] for d in _documents.values()}
    ingested = []

    for file_path in sorted(data_path.iterdir()):
        if file_path.suffix.lower() not in (".txt", ".pdf"):
            continue
        if file_path.name in already_ingested:
            continue

        file_bytes = file_path.read_bytes()
        await upload_document(file_bytes, file_path.name)
        ingested.append(file_path.name)

    return ingested


def list_documents() -> list[DocumentResponse]:
    return [DocumentResponse(**d) for d in _documents.values()]


def delete_document(document_id: str) -> bool:
    if document_id not in _documents:
        return False
    delete_collection(document_id)
    del _documents[document_id]
    _save_registry()
    return True


# ── Chat ──────────────────────────────────────────────────────────────────────

def _build_chain(document_id: str, model: str):
    vs = get_vectorstore(document_id)
    retriever = vs.as_retriever(search_kwargs={"k": settings.retrieval_k})
    llm = _build_llm(model)
    chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | _PROMPT
        | llm
        | StrOutputParser()
    )
    return chain, retriever


async def chat(
    document_id: str, question: str, model: str
) -> tuple[str, list[SourcePassage]]:
    chain, retriever = _build_chain(document_id, model)
    docs = retriever.invoke(question)
    sources = [
        SourcePassage(
            content=d.page_content,
            source=d.metadata.get("filename", d.metadata.get("source", "")),
            page=d.metadata.get("page"),
            chunk_index=d.metadata.get("chunk_index", 0),
        )
        for d in docs
    ]
    answer = await chain.ainvoke(question)
    return answer, sources


async def chat_stream(
    document_id: str, question: str, model: str
) -> AsyncIterator[str]:
    chain, retriever = _build_chain(document_id, model)

    docs = retriever.invoke(question)
    sources = [
        {
            "content": d.page_content[:500],
            "source": d.metadata.get("filename", d.metadata.get("source", "")),
            "page": d.metadata.get("page"),
            "chunk_index": d.metadata.get("chunk_index", 0),
        }
        for d in docs
    ]
    yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"

    async for token in chain.astream(question):
        yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
