# RAG-Powered Knowledge Assistant

Upload any PDF and ask questions about it. Answers are grounded in the document — no hallucinations, no API keys, no data leaving your machine.

## Stack

| Layer | Technology |
|-------|-----------|
| UI | Streamlit |
| Orchestration | LangChain |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers (local) |
| Vector store | ChromaDB |
| LLM | Ollama (local) |
| PDF parsing | pypdf |

## How it works

```
PDF upload → chunking → local embeddings → ChromaDB index
                                                  ↓
User question → embed question → similarity search → top-k passages
                                                          ↓
                                                 Ollama LLM → grounded answer
```

## Local setup

### Prerequisites

- Python 3.9+
- [Ollama](https://ollama.com) installed and running

### 1. Clone and install dependencies

```bash
git clone https://github.com/ichowdhury10/rag-knowledge-assistant.git
cd rag-knowledge-assistant
pip install -r requirements.txt
```

### 2. Pull an Ollama model

```bash
ollama pull llama3.2   # recommended (~2 GB)
# or
ollama pull mistral    # good alternative
```

### 3. Run

```bash
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501), upload a PDF, and start asking questions.

## Docker (full stack)

Runs both the Streamlit app and Ollama in containers:

```bash
docker compose up --build

# In a separate terminal, pull a model into the running Ollama container:
docker compose exec ollama ollama pull llama3.2
```

Then open [http://localhost:8501](http://localhost:8501).

## Project structure

```
rag-knowledge-assistant/
├── app.py               # Streamlit frontend & chat interface
├── rag_pipeline.py      # PDF loading, chunking, embedding, retrieval chain
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```
