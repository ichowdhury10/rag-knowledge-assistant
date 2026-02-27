"""
RAG Pipeline
------------
Handles PDF ingestion, chunking, embedding, and retrieval.

Components:
  - pypdf                 : PDF text extraction
  - sentence-transformers : local embeddings (all-MiniLM-L6-v2, ~90 MB, no API key)
  - ChromaDB              : persistent vector store
  - LangChain (LCEL)      : retrieval chain orchestration
  - Ollama                : local LLM (no API key)
"""

import os
import shutil
import tempfile
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel

# ── Config ────────────────────────────────────────────────────────────────────

EMBED_MODEL   = "all-MiniLM-L6-v2"
CHROMA_DIR    = "./chroma_store"
CHUNK_SIZE    = 600
CHUNK_OVERLAP = 80
TOP_K         = 4

PROMPT_TEMPLATE = """You are a helpful assistant answering questions about an uploaded document.
Use ONLY the context below to answer. If the answer isn't in the context, say:
"I couldn't find that in the document."

Context:
{context}

Question: {question}

Answer:"""

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_and_chunk(file_path: str) -> list:
    """Load a PDF and split it into overlapping chunks."""
    loader = PyPDFLoader(file_path)
    pages  = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_documents(pages)


def build_vectorstore(chunks: list) -> Chroma:
    """Embed chunks and persist them in ChromaDB."""
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    # Wipe existing store so each upload starts fresh
    if Path(CHROMA_DIR).exists():
        shutil.rmtree(CHROMA_DIR)

    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name="rag_docs",
    )


def get_qa_chain(vectorstore: Chroma, model: str = "llama3.2"):
    """
    Build a retrieval chain using LangChain Expression Language (LCEL).
    Returns a runnable that accepts a question string and produces:
      { "question": str, "context": [Document], "answer": str }
    """
    llm       = OllamaLLM(model=model, temperature=0.1)
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": TOP_K},
    )
    prompt = PromptTemplate(
        template=PROMPT_TEMPLATE,
        input_variables=["context", "question"],
    )

    def format_docs(docs):
        return "\n\n".join(d.page_content for d in docs)

    chain = RunnableParallel(
        context=retriever,
        question=RunnablePassthrough(),
    ).assign(
        answer=(
            lambda x: prompt.format(
                context=format_docs(x["context"]),
                question=x["question"],
            )
        )
        | llm
        | StrOutputParser()
    )

    return chain


def process_pdf(uploaded_file) -> tuple:
    """
    Accept a Streamlit UploadedFile, write it to a temp file,
    chunk and embed it, return (vectorstore, chunk_count).
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(uploaded_file.read())
        tmp_path = tmp.name

    try:
        chunks      = load_and_chunk(tmp_path)
        vectorstore = build_vectorstore(chunks)
    finally:
        os.unlink(tmp_path)

    return vectorstore, len(chunks)
