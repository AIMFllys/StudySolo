"""Knowledge base API routes: /api/knowledge/*."""

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from supabase import AsyncClient

from app.core.deps import get_current_user, get_supabase_client
from app.models.knowledge import DocumentMeta, QueryRequest, QueryResponse
from app.services.knowledge_service import (
    process_document_pipeline,
    query_knowledge_base as run_knowledge_query,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Max file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx", "md", "txt"}


# ── Upload endpoint ──────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentMeta, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Upload a document to the knowledge base.

    Returns immediately with status='processing'.
    The heavy pipeline (parse → chunk → embed → store) runs
    in a background task. Frontend polls GET /api/knowledge/{id}
    to check when status becomes 'ready'.
    """
    user_id = current_user["id"]

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式 .{ext}，支持: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 10MB")

    # Create document record with 'processing' status
    doc_id = str(uuid.uuid4())
    try:
        insert_result = await db.from_("ss_kb_documents").insert({
            "id": doc_id,
            "user_id": user_id,
            "filename": file.filename,
            "file_type": ext,
            "file_size_bytes": len(content),
            "status": "processing",
        }).execute()
    except Exception as e:
        logger.error("Failed to create document record: %s", e)
        raise HTTPException(status_code=500, detail=f"创建文档记录失败: {e}")

    # Schedule background processing — returns immediately
    background_tasks.add_task(
        process_document_pipeline,
        doc_id=doc_id,
        filename=file.filename,
        file_content=content,
        db=db,
    )

    # Return the document immediately with 'processing' status
    result = await db.from_("ss_kb_documents").select("*").eq("id", doc_id).single().execute()
    return result.data


# ── List documents ───────────────────────────────────────────────────────────

@router.get("", response_model=list[DocumentMeta])
@router.get("/", response_model=list[DocumentMeta], include_in_schema=False)
async def list_documents(
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """List all documents in the user's knowledge base."""
    result = (
        await db.from_("ss_kb_documents")
        .select("id,filename,file_type,file_size_bytes,status,total_chunks,total_tokens,created_at,updated_at,error_message")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Get document details ─────────────────────────────────────────────────────

@router.get("/{document_id}")
async def get_document_detail(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Get document details including summary and chunk preview."""
    # Get document
    doc_result = (
        await db.from_("ss_kb_documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="文档不存在")

    # Get summary
    summary_result = (
        await db.from_("ss_kb_document_summaries")
        .select("summary,key_concepts,table_of_contents")
        .eq("document_id", document_id)
        .execute()
    )

    # Get first 5 chunks as preview
    chunks_result = (
        await db.from_("ss_kb_document_chunks")
        .select("chunk_index,content,token_count,metadata")
        .eq("document_id", document_id)
        .order("chunk_index")
        .limit(5)
        .execute()
    )

    return {
        "document": doc_result.data,
        "summary": summary_result.data[0] if summary_result.data else None,
        "chunk_preview": chunks_result.data or [],
    }


# ── Query knowledge base ────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def query_knowledge_base(
    body: QueryRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Search the user's knowledge base for relevant content."""
    return await run_knowledge_query(
        query=body.query,
        user_id=current_user["id"],
        db=db,
        top_k=body.top_k,
        threshold=body.threshold,
    )


# ── Delete document ──────────────────────────────────────────────────────────

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Delete a document and all related chunks/embeddings (CASCADE)."""
    result = (
        await db.from_("ss_kb_documents")
        .delete()
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if result.data is not None and len(result.data) == 0:
        raise HTTPException(status_code=404, detail="文档不存在")
    return {"success": True}
