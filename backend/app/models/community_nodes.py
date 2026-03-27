"""Pydantic models for community shared nodes."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CommunityNodeCategory = Literal[
    "academic",
    "analysis",
    "generation",
    "assessment",
    "productivity",
    "other",
]

CommunityNodeOutputFormat = Literal["markdown", "json"]
CommunityNodeModelPreference = Literal["auto", "fast", "powerful"]


class CommunityNodeCreate(BaseModel):
    name: str
    description: str
    icon: str = "Bot"
    category: CommunityNodeCategory = "other"
    prompt: str
    input_hint: str = ""
    output_format: CommunityNodeOutputFormat = "markdown"
    output_schema: dict | None = None
    model_preference: CommunityNodeModelPreference = "auto"


class CommunityNodeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    category: CommunityNodeCategory | None = None
    prompt: str | None = None
    input_hint: str | None = None
    output_format: CommunityNodeOutputFormat | None = None
    output_schema: dict | None = None
    model_preference: CommunityNodeModelPreference | None = None


class CommunityNodePublic(BaseModel):
    id: str
    author_id: str
    author_name: str
    name: str
    description: str
    icon: str
    category: str
    version: str
    input_hint: str
    output_format: str
    output_schema: dict | None = None
    model_preference: str
    knowledge_file_name: str | None = None
    knowledge_file_size: int = 0
    likes_count: int = 0
    install_count: int = 0
    is_liked: bool = False
    created_at: datetime


class CommunityNodeMine(CommunityNodePublic):
    prompt: str
    status: str = "approved"
    reject_reason: str | None = None


class CommunityNodeListResponse(BaseModel):
    items: list[CommunityNodePublic] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    pages: int = 1


class SchemaGenRequest(BaseModel):
    name: str
    description: str
    prompt_snippet: str


class SchemaGenResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    schema_: dict = Field(default_factory=dict, alias="schema", serialization_alias="schema")
    example: dict = Field(default_factory=dict)
