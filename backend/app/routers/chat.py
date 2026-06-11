from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas import ChatRequest, ChatResponse
from app.services import rag_service

router = APIRouter()


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Server-Sent Events endpoint — streams tokens as they are generated."""
    return StreamingResponse(
        rag_service.chat_stream(
            request.document_id, request.question, request.model
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        answer, sources = await rag_service.chat(
            request.document_id, request.question, request.model
        )
        return ChatResponse(
            answer=answer,
            sources=sources,
            model=request.model,
            document_id=request.document_id,
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "connection" in msg or "refused" in msg or "timeout" in msg:
            raise HTTPException(
                status_code=503,
                detail="Cannot reach Ollama. Make sure it is running: `ollama serve`",
            )
        raise HTTPException(status_code=500, detail=str(exc))
