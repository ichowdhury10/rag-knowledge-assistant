# RAG Knowledge Assistant

> Upload any document and ask questions about it. Answers are grounded in your document — no hallucinations, no guessing.

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Streaming answers** — tokens stream in real-time via Server-Sent Events
- **Source citations** — click any response to inspect the exact passages that grounded it
- **Multi-document support** — upload and switch between multiple PDFs or text files
- **Groq LLM** — powered by `llama-3.3-70b-versatile` via Groq's free API tier; falls back to local Ollama
- **100% local embeddings** — `all-MiniLM-L6-v2` runs on CPU with no API key
- **Dark / light mode** with persistent preference

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Next.js 14 (App Router · TypeScript)               │
│          Tailwind CSS · Streaming UI · Dark mode                │
└──────────────────────┬──────────────────────────────────────────┘
                       │  REST + Server-Sent Events
┌──────────────────────▼──────────────────────────────────────────┐
│             FastAPI  (Python 3.11)                              │
│  /api/documents   /api/chat/stream   /api/models               │
└──────┬────────────────────────────────────┬─────────────────────┘
       │                                    │
┌──────▼──────┐                   ┌─────────▼──────────────┐
│  ChromaDB   │                   │  Groq API              │
│  (vectors)  │                   │  llama-3.3-70b-versatile│
└──────▲──────┘                   └────────────────────────┘
       │
┌──────┴──────┐
│ sentence-   │
│ transformers│  all-MiniLM-L6-v2 embeddings (local)
└─────────────┘
```

**RAG pipeline**

```
Document ──► chunk (600 chars / 80 overlap) ──► embed ──► ChromaDB
                                                               │
Query ──► embed query ──► cosine similarity search (top-4) ───┘
                                                    │
                                             LLM context ──► streamed answer
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| Orchestration | LangChain (LCEL) |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers (local) |
| Vector store | ChromaDB (persistent) |
| LLM | Groq `llama-3.3-70b-versatile` (free tier) / Ollama fallback |
| Document parsing | pypdf, LangChain TextLoader |
| Containerisation | Docker + Docker Compose |
| CI | GitHub Actions |

---

## Quick Start — Docker

**Prerequisites:** Docker + Docker Compose + a free [Groq API key](https://console.groq.com)

```bash
git clone https://github.com/ichowdhury10/rag-knowledge-assistant.git
cd rag-knowledge-assistant

# Add your Groq key
echo "GROQ_API_KEY=your_key_here" > backend/.env

docker compose up --build
open http://localhost:3000
```

Upload a PDF or text file and start asking questions.

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # add GROQ_API_KEY

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo "API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload a PDF or TXT file |
| `GET` | `/api/documents/` | List indexed documents |
| `DELETE` | `/api/documents/{id}` | Remove a document |
| `POST` | `/api/chat/stream` | Stream an answer (SSE) |
| `POST` | `/api/chat/` | Blocking chat endpoint |
| `GET` | `/api/models/` | List available models |
| `GET` | `/api/health` | Health check |

Docs at `http://localhost:8000/api/docs`.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | `""` | Groq API key — enables `llama-3.3-70b-versatile` |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Embedding model (runs locally) |
| `CHUNK_SIZE` | `600` | Characters per chunk |
| `CHUNK_OVERLAP` | `80` | Overlap between adjacent chunks |
| `RETRIEVAL_K` | `4` | Top-k passages retrieved per query |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama fallback URL |

---

## Project Structure

```
rag-knowledge-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings
│   │   ├── schemas.py           # Pydantic models
│   │   ├── routers/
│   │   │   ├── documents.py     # Upload / list / delete
│   │   │   ├── chat.py          # Streaming + blocking chat
│   │   │   └── models.py        # Model discovery
│   │   └── services/
│   │       ├── rag_service.py   # Chunking → embedding → retrieval → generation
│   │       └── vectorstore.py   # ChromaDB helpers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/          # ChatPanel, Sidebar, SourceDrawer, …
│       ├── hooks/               # useChat (streaming), useDocuments
│       └── lib/                 # API client, types
├── legacy/                      # Original Streamlit prototype
└── docker-compose.yml
```

---

## License

MIT
