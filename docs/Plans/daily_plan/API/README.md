# StudySolo API 统一路由规划 · 权威索引

> 📅 创建日期：2026-02-26  
> 🔄 最新更新：2026-02-26  
> 📌 所属模块：API 调用与路由  
> 🎯 定位：**项目内所有 AI API 调用相关设计的唯一权威汇总入口**  
> ⚠️ 本文档具有最终决定权。其余散落文档中如有与本文冲突的旧版 API 描述，均以本文为准。

---

## 📑 目录

- [一、架构演进：从旧到新](#一架构演进从旧到新)
- [二、当前权威架构：八平台双层分治](#二当前权威架构八平台双层分治)
- [三、十路任务分流总矩阵](#三十路任务分流总矩阵)
- [四、节点到模型到平台的完整映射](#四节点到模型到平台的完整映射)
- [五、YAML 配置中心化方案](#五yaml-配置中心化方案)
- [六、容灾降级全景图](#六容灾降级全景图)
- [七、散落文档冲突消解矩阵](#七散落文档冲突消解矩阵)
- [八、后续 ACTION ITEMS](#八后续-action-items)

---

## 一、架构演进：从旧到新

本项目 API 层经历了三次大版本迭代：

| 版本 | 核心策略 | 平台数 | 决策文档 | 状态 |
| :--- | :--- | :---: | :--- | :---: |
| **v0** | 双模型路由（豆包 + 千问） | 2 | `项目深度功能规划.md` §5.1 | ❌ 已废弃 |
| **v1** | 四平台线性优先级（七牛>优云>火山>百炼） | 4 | `多平台AI-API统一路由与容灾规划.md` 旧版 | ❌ 已废弃 |
| **v2 ✅** | **八平台双层分治 + 十路任务分流** | 8 | `多平台AI-API统一路由与容灾规划.md` v2 | ✅ **当前生效** |

### 每次迭代解决了什么问题

| 迭代 | 解决的核心问题 |
| :--- | :--- |
| v0 → v1 | 增加容灾维度，从单平台扩展到四平台线性降级链 |
| v1 → v2 | 引入「原生优先」原则，区分格式严格/推理/长文/搜索/向量化等任务类型，按任务分流而非线性排队 |

---

## 二、当前权威架构：八平台双层分治

### 2.1 三层架构图

```
                      ┌─────────────────────────────────────────┐
                      │        StudySolo AI 路由引擎 v2          │
                      │     (ai_router.py · 任务分类驱动)        │
                      └──────────────┬──────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
═══════════▼══════════════  ═══════════▼══════════════  ═══════════▼══════════════
║  🏠 第一层：原生直连层  ║  ║  🌐 第二层：代理聚合层  ║  ║  🔧 第三层：增值服务层  ║
║  (纯净·满血·低价)      ║  ║  (海外·聚合·灾备)      ║  ║  (独占功能·无替代)     ║
═══════════════════════════  ═══════════════════════════  ═══════════════════════════
```

### 2.2 八大平台身份证

#### 原生直连（5 家） — 工作流默认使用

| # | 平台 | Base URL | 环境变量 | 核心角色 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **阿里云百炼** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `DASHSCOPE_API_KEY` | Qwen 原生宿主 + 向量化/OCR/Rerank 全栈 |
| 2 | **DeepSeek 官方** | `https://api.deepseek.com/v1` | `DEEPSEEK_API_KEY` | 推理之王 + 缓存命中极低价  |
| 3 | **月之暗面 (Moonshot)** | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` | 原生Kimi |
| 4 | **火山引擎** | `https://ark.cn-beijing.volces.com/api/v3` | `VOLCENGINE_API_KEY` | 原生满血豆包模型 |
| 5 | **智谱AI** | `https://open.bigmodel.cn/api/paas/v4` | `ZHIPU_API_KEY` | 原生智谱模型、深度联网搜索 + GLM-OCR |

#### 代理聚合（3 家） — 灾备 / 海外模型 / 独占增值

| # | 平台 | Base URL | 环境变量 | 核心角色 |
| :--- | :--- | :--- | :--- | :--- |
| 6 | **七牛云 AIGC** | `https://api.qnaigc.com/v1` | `QINIU_AI_API_KEY` | 百度搜索 API + 图片/视频/TTS 独占 |
| 7 | **优云智算** | `https://api.compshare.cn/v1` | `COMPSHARE_API_KEY` | 海外旗舰模型独占 (GPT-5.x/Claude-4.x) |
| 8 | **硅基流动** | `https://api.siliconflow.cn/v1` | `SILICONFLOW_API_KEY` | 开源模型加速池 / DS/Qwen 分流灾备 |

### 2.3 两条铁律

> **铁律 1：** 工作流中所有节点默认使用各家 AI 的原生服务。聚合平台仅用于海外模型调用和灾备降级。
>
> **铁律 2：** 要求格式严格（JSON / 结构化输出）的任务，**绝不使用聚合平台**。

---

## 三、十路任务分流总矩阵

| 路由链 | 任务类型 | 首选平台 | 首选模型 | 降级路径 |
| :--- | :--- | :--- | :--- | :--- |
| **A** | 格式严格 (JSON输出) | 百炼 (原生) | `qwen3-turbo` | DeepSeek → 火山 |
| **B** | 深度推理 (CoT) | DeepSeek (原生) | `deepseek-r1` | 百炼 Max → 火山 → 七牛 |
| **C** | 超长文本 (10K-200K) | Moonshot (原生) | `kimi-k2.5` | 百炼 Long → 七牛 |
| **D** | 简单快速 (≤500T) | 百炼 (原生) | `qwen-turbo` | 火山 mini → 七牛 |
| **E** | 海外旗舰 (Pro用户) | 优云智算 (代理) | `gpt-5.1` | 七牛 GPT-4o |
| **F** | 联网搜索 (三级分流) | 见下方详表 | — | 逐级降级 |
| **G** | 多模态向量 (RAG) | 百炼 (原生) | `qwen3-vl-embedding` | `tongyi-vision-flash` |
| **H** | 文本向量 + Rerank | 百炼 (原生) | `text-embedding-v4` / `qwen3-vl-rerank` | 无替代 |
| **I** | 专业 OCR | 智谱 (原生) | `glm-ocr` | 百炼 `qwen-vl-ocr` → 七牛 |
| **J** | 其他增值服务 | 七牛云 (独占) | 图片/视频/TTS | 无替代 |

### 联网搜索三级分流详表 (路由链 F)

| 等级 | 场景 | 平台 | 服务/模型 |
| :--- | :--- | :--- | :--- |
| **深度搜索** | 工作流调研节点 `search_depth: deep` | 智谱AI (原生) | Web Search API + Search Agent |
| **一般搜索** | 工作流普通节点 `search_depth: general` | 七牛云 (代理) | Baidu Search API |
| **普通搜索** | 单独 AI 对话 (非工作流) 默认 | 百炼 (原生) | `qwen3.5-flash` + `enable_search: true` |

### RAG 管线完整链路 (路由链 G + H)

```
用户查询
   │
   ├─ 包含图片/视频 ──→ 多模态向量化 (qwen3-vl-embedding) ──→ pgvector 检索
   │
   └─ 纯文本 ──→ 文本向量化 (text-embedding-v4) ──→ pgvector 检索
                                                        │
                                                   取 Top-K 结果
                                                        │
                                                   重排序 (qwen3-vl-rerank)
                                                        │
                                                   取 Top-N 精排结果
                                                        │
                                                   注入 System Prompt
                                                        │
                                                   LLM 生成最终回答
```

---

## 四、节点到模型到平台的完整映射

> 此表为 `ai_router.py` 的实现蓝图。每个工作流节点在执行时，路由器根据 `node.type` 查此表确定调用链。

### 4.1 工作流核心节点

| 节点 ID | 中文名 | 路由链 | 首选平台 | 首选模型 | Token 消耗 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ai_analyzer` | 需求分析器 | A 格式严格 | 百炼 | `qwen3-turbo` | ~500-1K |
| `ai_planner` | 工作流编排器 | A 格式严格 | 百炼 | `qwen3-turbo` | ~1K-2K |
| `flashcard` | 闪卡生成 | A 格式严格 | 百炼 | `qwen-turbo` | ~300-800 |
| `outline_gen` | 大纲生成 | B 深度推理 | DeepSeek | `deepseek-r1` | ~1K-3K |
| `content_extract` | 知识提炼 | B 深度推理 | DeepSeek | `deepseek-r1` | ~2K-5K |
| `summary` | 总结归纳 | B 深度推理 | DeepSeek | `deepseek-r1` | ~1K-3K |
| `merge_polish` | 润色合并 | C 超长文本 | Moonshot | `kimi-k2.5` | ~3K-8K |
| `intent_classify` | 意图分类 | D 简单快速 | 百炼 | `qwen-turbo` | ~100-300 |

### 4.2 搜索 / RAG / OCR / 增值节点

| 节点 ID | 路由链 | 首选平台 | 首选模型/服务 |
| :--- | :--- | :--- | :--- |
| `deep_search` | F 深度搜索 | 智谱AI | Web Search API |
| `general_search` | F 一般搜索 | 七牛云 | Baidu Search API |
| `chat_search` | F 普通搜索 | 百炼 | `qwen3.5-flash` + enable_search |
| `mm_embed` | G 多模态向量 | 百炼 | `qwen3-vl-embedding` |
| `text_embed` | H 文本向量 | 百炼 | `text-embedding-v4` |
| `rerank` | H 重排序 | 百炼 | `qwen3-vl-rerank` |
| `document_ocr` | I 专业OCR | 智谱 | `glm-ocr` |
| `img_gen` | J 增值 | 七牛云 | Kling |
| `video_gen` | J 增值 | 七牛云 | Kling |
| `tts` | J 增值 | 七牛云 | TTS |

### 4.3 与旧版节点分析的关键差异

> 来源：`daily_plan/core/节点分析.md` §6「节点与模型路由映射」

| 节点 | 旧版绑定模型 | 新版绑定模型 | 变更原因 |
| :--- | :--- | :--- | :--- |
| `ai_analyzer` | 豆包 2.0-pro (火山免费池) | **百炼 `qwen3-turbo`** | 格式严格任务必须走原生，避免聚合平台污染 JSON |
| `ai_planner` | qwen3-turbo (百炼) | **百炼 `qwen3-turbo`** | 不变，但明确走路由链 A |
| `outline_gen` | qwen3-turbo (百炼) | **DeepSeek `deepseek-r1`** | 大纲生成属深度推理，需要 CoT 慢思考 |
| `content_extract` | qwen3-turbo (百炼) | **DeepSeek `deepseek-r1`** | 同上 |
| `flashcard` | 豆包 2.0-pro (火山免费池) | **百炼 `qwen-turbo`** | 闪卡输出为严格 JSON 数组，需原生平台保障 |
| `merge_polish` | qwen3-turbo (百炼) | **Moonshot `kimi-k2.5`** | 超长文本场景，需 256K 上下文窗口 |

---

## 五、YAML 配置中心化方案

> 来源：`daily_plan/core/02-yaml-config-and-markdown-rendering.md`

### 5.1 核心原则

所有模型配置、节点→模型映射、容灾策略均集中在 `config.yaml` 中管理。代码侧通过 `config_loader.py` 加载配置，`ai_router.py` 零硬编码调用。

### 5.2 配置文件结构（关键片段）

```yaml
# config.yaml 顶层结构
platform_tiers:
  native:
    - id: dashscope
      native_models: [qwen-turbo, qwen3-turbo, ..., text-embedding-v4, qwen3-vl-embedding, qwen-vl-ocr]
    - id: deepseek
      native_models: [deepseek-chat, deepseek-reasoner]
    - id: moonshot
      native_models: [kimi-k2.5, moonshot-v1-128k]
    - id: volcengine
      native_models: [doubao-2.0-pro, doubao-seed-2.0-mini]
    - id: zhipu
      native_models: [glm-4, glm-5, web-search-pro, glm-ocr]
  proxy:
    - id: qiniu
    - id: compshare
    - id: siliconflow

task_routing:
  strict_format:    { chain: [dashscope → deepseek → volcengine] }
  reasoning:        { chain: [deepseek → dashscope → volcengine → qiniu] }
  long_context:     { chain: [moonshot → dashscope → qiniu] }
  simple_fast:      { chain: [dashscope → volcengine → qiniu] }
  deep_search:      { chain: [zhipu → qiniu → dashscope(enable_search)] }
  multimodal_embed: { chain: [dashscope(qwen3-vl-embedding) → dashscope(tongyi-flash)] }
  text_embedding:   { chain: [dashscope(text-embedding-v4)] }
  text_rerank:      { chain: [dashscope(qwen3-vl-rerank)] }
  document_ocr:     { chain: [zhipu(glm-ocr) → dashscope(qwen-vl-ocr) → qiniu] }
  # ...
```

### 5.3 代码加载链路

```
config.yaml  ──read──→  config_loader.py  ──inject──→  ai_router.py
                              │
                        resolve $ENV_VARS
                              │
                        lru_cache() 应用生命周期缓存
```

> 完整 YAML 结构和 Python 代码示例见 → [`daily_plan/core/02-yaml-config-and-markdown-rendering.md`](../core/02-yaml-config-and-markdown-rendering.md)

---

## 六、容灾降级全景图

### 6.1 十路降级总表

| 路由链 | 正常通道 | Level 1 | Level 2 | Level 3 极端 |
| :--- | :--- | :--- | :--- | :--- |
| **A. 格式严格** | 百炼 `qwen3-turbo` | DeepSeek `deepseek-v3` | 火山 `doubao-2.0-pro` | 友好错误页 |
| **B. 深度推理** | DeepSeek `deepseek-r1` | 百炼 `qwen3-max` | 火山 `deepseek-r1` → 七牛 | 友好错误页 |
| **C. 超长文本** | Moonshot `kimi-k2.5` | 百炼 `qwen-long` | 七牛 `kimi` | 友好错误页 |
| **D. 简单快速** | 百炼 `qwen-turbo` | 火山 `doubao-mini` | 七牛 `qwen-turbo` | 友好错误页 |
| **E. 海外旗舰** | 优云 `gpt-5.1` | 七牛 `gpt-4o` | — | "高端模型暂不可用" |
| **F. 联网搜索** | 智谱 Web Search | 七牛 百度搜索 | 百炼 enable_search | 禁用联网搜索 |
| **G. 多模态向量** | 百炼 `qwen3-vl-embedding` | 百炼 `tongyi-vision-flash` | — | "向量化暂不可用" |
| **H. 文本向量** | 百炼 `text-embedding-v4` | — | — | "检索暂不可用" |
| **I. 专业 OCR** | 智谱 `glm-ocr` | 百炼 `qwen-vl-ocr` | 七牛 OCR | "文档解析失败" |
| **J. 增值服务** | 七牛云独占 | — | — | "功能暂时不可用" |

### 6.2 跨链路紧急降级

```
格式严格链全挂 → 借用 深度推理链的 DeepSeek-R1
深度推理链全挂 → 借用 格式严格链的 Qwen3-Turbo
超长文本链全挂 → 借用 深度推理链的 DeepSeek-R1 (128K)
简单快速链全挂 → 借用 格式严格链的 Qwen3-Turbo
```

---

## 七、散落文档冲突消解矩阵

以下表格列出了项目中所有涉及 API 调用描述的文档，以及它们与 v2 架构的冲突点和处置方式。

| 散落位置 | 具体内容 | 与 v2 冲突点 | 处置 |
| :--- | :--- | :--- | :--- |
| `global/项目深度功能规划.md` §5.1 | "双模型路由：豆包 + 千问" | ❌ 已过时，实际为八平台 | 以本文为准 |
| `global/项目深度功能规划.md` §5.5 | "四平台优先级路由" | ❌ 已过时，旧版线性排序 | 以本文为准 |
| `global/PROJECT_PLAN.md` §2.1 | 架构图中仅列"火山 + 百炼" | ❌ 缺少 5 个原生平台 | 以本文为准 |
| `技术指导/AI_API参考资料/README.md` | "供应商按路由优先级排列：七牛>优云>火山>百炼" | ❌ 已过时，v2 按任务类型分流 | 以本文为准 |
| `技术指导/AI_API参考资料/01-项目规划映射与选型.md` | "四路模型供应商均走 OpenAI 兼容格式" | ⚠️ 部分过时，实际为八路 | 以本文为准，但 OpenAI SDK 统一调用仍有效 |
| `daily_plan/core/节点分析.md` §6 | "ai_analyzer→豆包，outline→qwen" | ⚠️ 模型绑定已更新 | 参见本文 §4.3 差异表 |
| `daily_plan/core/工作流AI交互规划.md` §2.2 | "ai_analyzer 由豆包 2.0-pro 完成" | ⚠️ 已改为百炼 qwen3-turbo | 以本文为准 |
| `daily_plan/core/02-yaml-config.md` | config.yaml 仅含豆包+千问两模型 | ⚠️ YAML 结构需升级为完整 v2 版 | 执行时以本文 §5.2 为准 |
| `技术指导/核心工作流AI交互/04-RAG.md` | "rerank: 百炼/方舟可选" | ⚠️ 已确定为百炼 `qwen3-vl-rerank` | 以本文为准 |
| `技术指导/混合RAG/02-三层漏斗.md` | 未指定具体 embedding 模型 | ⚠️ 已确定为 `text-embedding-v4` | 以本文为准 |

> **处置原则**：上述旧文档暂不修改（保留历史参考价值），但所有开发实现以本文为唯一依据。

---

## 八、后续 ACTION ITEMS

### 8.1 代码实现清单

| 优先级 | 任务 | 涉及文件 | 备注 |
| :--- | :--- | :--- | :--- |
| **P0** | `ai_router.py` 重构为按任务类型查路由链 | `backend/app/services/ai_router.py` | 从线性遍历 → 任务分流 |
| **P0** | `config.yaml` 升级为 v2 完整版 | `config.yaml` | 含八平台定义 + 十路路由 |
| **P0** | `config_loader.py` 增强（支持 `params` 字段） | `backend/app/core/config_loader.py` | 搜索链需透传 `enable_search` |
| **P1** | 智谱 Web Search API 适配 | `backend/app/services/search/` | Base URL 为 `/v4` 非 `/v1` |
| **P1** | 百炼 Embedding/Rerank 适配 | `backend/app/services/rag/` | 非 Chat Completions 接口 |
| **P1** | 智谱 GLM-OCR + 百炼 Qwen-VL-OCR 适配 | `backend/app/services/ocr/` | 双引擎 OCR |
| **P2** | DeepSeek 超时降级（8s 硬切百炼） | `ai_router.py` | 高峰期排队问题 |
| **P2** | 硅基流动作为 DS/Qwen 分流池接入 | `config.yaml` | 仅灾备，不作首选 |

### 8.2 环境变量 Checklist

```env
# === 原生直连平台（5 家） ===
DASHSCOPE_API_KEY=       # 阿里云百炼 — https://bailian.console.aliyun.com
DEEPSEEK_API_KEY=        # DeepSeek官方 — https://platform.deepseek.com
MOONSHOT_API_KEY=        # 月之暗面Kimi — https://platform.moonshot.cn
VOLCENGINE_API_KEY=      # 火山引擎 — https://console.volcengine.com/ark
ZHIPU_API_KEY=           # 智谱AI — https://open.bigmodel.cn

# === 代理聚合平台（3 家） ===
QINIU_AI_API_KEY=        # 七牛云AIGC — https://portal.qiniu.com
COMPSHARE_API_KEY=       # 优云智算 — https://www.compshare.cn
SILICONFLOW_API_KEY=     # 硅基流动 — https://cloud.siliconflow.cn
```

---

## 📎 关联文档索引

| 类别 | 文档路径 | 说明 |
| :--- | :--- | :--- |
| **全局规划 (权威)** | [`global/多平台AI-API统一路由与容灾规划.md`](../../global/多平台AI-API统一路由与容灾规划.md) | 完整版八平台配置 + YAML + 节点映射 |
| **核心节点设计** | [`core/节点分析.md`](../core/节点分析.md) | 节点 JSON Schema + 状态机（模型绑定以本文为准） |
| **工作流交互** | [`core/工作流AI交互规划.md`](../core/工作流AI交互规划.md) | 付费体系 + RAG + 明暗线（模型选用以本文为准） |
| **YAML 配置** | [`core/02-yaml-config-and-markdown-rendering.md`](../core/02-yaml-config-and-markdown-rendering.md) | 配置加载器代码 + Markdown 渲染（YAML 结构以本文为准） |
| **技术参考** | [`技术指导/AI_API参考资料/`](../../../技术指导/AI_API参考资料/) | 各平台接入指南（优先级排序已过时） |
| **深度技术指导** | [`技术指导/核心工作流AI交互深度技术指导/`](../../../技术指导/核心工作流AI交互深度技术指导/) | 结构化输出/流式协议/RAG 检索策略 |
| **混合 RAG** | [`技术指导/混合RAG知识库技术指导/`](../../../技术指导/混合RAG知识库技术指导/) | 三层漏斗 + pgvector + 缓存优化 |

---

> **一句话总结**：**原生主战、代理辅助、十路分流、按任务分治、每条链路都有降级兜底。本文档是所有 API 调用设计的唯一权威入口。**
