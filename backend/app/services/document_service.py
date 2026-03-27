"""Facade for document parsing and export services."""

from app.services.file_converter import (
    ConvertedFile,
    convert_file,
    export_docx,
    export_markdown,
    export_pdf,
    export_txt,
)
from app.services.file_parser import ParsedDocument, ParsedSection, parse_file


def parse_document(filename: str, content: bytes) -> ParsedDocument:
    """Parse an uploaded document into structured sections."""
    return parse_file(filename, content)


async def convert_document(
    content: str,
    format: str = "md",
    filename: str = "export",
) -> ConvertedFile:
    """Convert markdown content to the requested file format."""
    return await convert_file(content=content, format=format, filename=filename)


__all__ = [
    "ConvertedFile",
    "ParsedDocument",
    "ParsedSection",
    "convert_document",
    "convert_file",
    "export_docx",
    "export_markdown",
    "export_pdf",
    "export_txt",
    "parse_document",
    "parse_file",
]
