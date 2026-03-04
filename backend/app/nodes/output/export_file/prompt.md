文件导出节点 — 将工作流生成的学习内容导出为可下载的文件。

本节点不调用 LLM，而是通过 file_converter 服务将上游输出转换为指定格式。

支持的导出格式：
- PDF（通过 weasyprint，需要系统安装 Cairo/Pango）
- DOCX（通过 python-docx）
- Markdown（原始 .md 文件）

输出格式为 Markdown（文件信息 + 下载链接）。

使用场景：
- 用户完成学习后，想把笔记/总结导出为 PDF 分享
- 长文合并后导出为 Word 文档
- 作为工作流的终端节点

最佳搭配：
- merge_polish → export_file（长文导出）
- summary → export_file（总结导出）
- content_extract ×N → merge_polish → export_file（学习报告）
