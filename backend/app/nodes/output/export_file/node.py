"""ExportFile node — exports upstream content as downloadable files.

This is a NON-LLM node. It takes upstream Markdown output and converts
it to the user's requested format (PDF, DOCX, or Markdown).

The node yields a result message with the file info and download link.

Typical flows:
  [content_extract] → [merge_polish] → [export_file]
  [summary] → [export_file]
"""

import logging
import os
from typing import Any, AsyncIterator

from app.nodes._base import BaseNode, NodeInput, NodeOutput

logger = logging.getLogger(__name__)


class ExportFileNode(BaseNode):
    node_type = "export_file"
    category = "output"
    description = "将学习成果导出为文件"
    is_llm_node = False
    output_format = "markdown"
    icon = "📥"
    color = "#10b981"

    async def execute(self, node_input: NodeInput, llm_caller: Any) -> AsyncIterator[str]:
        """Export upstream content to file.

        Collects all upstream outputs as the content to export.
        The export format is determined by node_config or defaults to DOCX.
        """
        # Lazy imports
        from app.services.file_converter import convert_file

        # Collect upstream content
        content_parts: list[str] = []
        if node_input.upstream_outputs:
            for uid, out in node_input.upstream_outputs.items():
                content_parts.append(out)

        if not content_parts:
            yield "⚠️ 没有可导出的内容（上游节点无输出）"
            return

        content = "\n\n---\n\n".join(content_parts)

        # Determine export format
        export_format = "docx"
        filename = "学习笔记"
        if node_input.node_config:
            export_format = node_input.node_config.get("format", "docx")
            filename = node_input.node_config.get("filename", "学习笔记")
        
        # Also check label for format hints
        label = (node_input.user_content or "").lower()
        if "pdf" in label:
            export_format = "pdf"
        elif "docx" in label or "word" in label:
            export_format = "docx"
        elif "md" in label or "markdown" in label:
            export_format = "md"

        yield f"📥 正在导出 {export_format.upper()} 文件...\n\n"

        try:
            result = await convert_file(
                content=content,
                format=export_format,
                filename=filename,
            )

            if result.error:
                yield f"⚠️ {result.error}\n\n"

            if result.filepath and os.path.exists(result.filepath):
                size_kb = result.size_bytes / 1024
                yield f"✅ 文件已生成\n\n"
                yield f"- **文件名**: {result.filename}\n"
                yield f"- **格式**: {result.format.upper()}\n"
                yield f"- **大小**: {size_kb:.1f} KB\n"
                yield f"- **路径**: `{result.filepath}`\n\n"

                # Generate download link if API is configured
                if result.download_url:
                    yield f"[📥 点击下载]({result.download_url})\n"
                else:
                    yield f"*文件已保存到服务器，可通过 API 下载。*\n"
            else:
                yield "⚠️ 文件生成失败"

        except Exception as e:
            logger.error("Export file node failed: %s", e)
            yield f"⚠️ 导出出错: {e}"

    async def post_process(self, raw_output: str) -> NodeOutput:
        """Return export results as markdown."""
        content = raw_output
        if content.startswith("📥 正在导出"):
            parts = content.split("\n\n", 1)
            if len(parts) > 1:
                content = parts[1]

        return NodeOutput(
            content=content,
            format="markdown",
            metadata={"source": "export_file"},
        )
