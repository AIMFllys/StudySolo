# AI API 官方参考资料（StudySolo）

> 更新时间：2026-02-26（北京时间）  
> 编码：UTF-8  
> 适用阶段：项目规划 / 技术预研 / 开发实施

> ⚠️ **【API 路由规划已过时警告】**  
> 本目录及下方描述中的“四平台优先级”排序机制已失效废弃。  
> 最新策略已升级为 **八平台按任务独立路由分化**。  
> 请**严格参考最新最权威 [API 统一路由规划 · 权威索引](../README.md) 文档**！

## 目录

### 基础规划
- [01-项目规划映射与选型.md](./01-项目规划映射与选型.md)

### 协议与 SDK
- [02-OpenAI-统一SDK与Responses接口.md](./02-OpenAI-统一SDK与Responses接口.md)

### 供应商接入（基于八大平台双层架构）
- [03-火山方舟-Ark-OpenAI兼容接入.md](./03-火山方舟-Ark-OpenAI兼容接入.md)
- [04-阿里云百炼-DashScope-OpenAI兼容接入.md](./04-阿里云百炼-DashScope-OpenAI兼容接入.md)
- [06-七牛云-QNAIGC-OpenAI兼容接入.md](./06-七牛云-QNAIGC-OpenAI兼容接入.md)
- [07-优云智算-Compshare-OpenAI兼容接入.md](./07-优云智算-Compshare-OpenAI兼容接入.md)
- [08-DeepSeek-OpenAI兼容接入.md](./08-DeepSeek-OpenAI兼容接入.md)
- [09-Moonshot-Kimi-OpenAI兼容接入.md](./09-Moonshot-Kimi-OpenAI兼容接入.md)
- [10-智谱AI-Zhipu-OpenAI兼容接入.md](./10-智谱AI-Zhipu-OpenAI兼容接入.md)
- [11-硅基流动-SiliconFlow-OpenAI兼容接入.md](./11-硅基流动-SiliconFlow-OpenAI兼容接入.md)

### 传输层
- [05-SSE流式链路-后端到前端.md](./05-SSE流式链路-后端到前端.md)

### 综合指南
- [多模型API接入与使用指南.md](./多模型API接入与使用指南.md)

## 说明

本目录收录与 StudySolo 直接相关的 AI API 官方资料和接入指南：

- **协议层**：OpenAI API / openai Python SDK
- **原生直连层 (Native)**：
  1. 阿里云百炼 DashScope (格式稳定)
  2. DeepSeek (深度推理)
  3. Kimi (超长文本)
  4. 火山方舟 (短小快)
  5. 智谱 AI (OCR 与 深搜)
- **代理聚合层 (Proxy)**：
  6. 七牛云 QNAIGC (聚合代理)
  7. 优云智算 Compshare (海外链路)
  8. 硅基流动 SiliconFlow (容灾池)
- **传输层**：SSE（FastAPI + sse-starlette + EventSource）

> 🔗 **全局规划文档**：`docs/Plans/global/多平台AI-API统一路由与容灾规划.md`
