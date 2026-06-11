from fastapi import APIRouter, UploadFile, HTTPException

from app.schemas import DocumentResponse
from app.services import rag_service

router = APIRouter()

_ALLOWED_EXTENSIONS = {".pdf", ".txt"}


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if f".{ext}" not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail="Only PDF and TXT files are supported."
        )

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB).")

    return await rag_service.upload_document(content, file.filename)


@router.get("/", response_model=list[DocumentResponse])
def list_documents():
    return rag_service.list_documents()


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str):
    if not rag_service.delete_document(document_id):
        raise HTTPException(status_code=404, detail="Document not found.")
