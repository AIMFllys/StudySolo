"""Pydantic models for knowledge-base APIs."""

from pydantic import BaseModel, Field


class DocumentMeta(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    status: str
    total_chunks: int
    total_tokens: int
    created_at: str | None = None
    updated_at: str | None = None
    error_message: str | None = None


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    threshold: float = 0.7


class QueryResult(BaseModel):
    content: str
    similarity: float
    document_id: str
    metadata: dict = Field(default_factory=dict)


class QueryResponse(BaseModel):
    results: list[QueryResult]
    context: str
