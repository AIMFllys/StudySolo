# 📖 StudySolo 节点开发指南

> **本文档面向所有 StudySolo 项目开发者**，详细说明如何新增一个工作流节点（Node），涵盖后端插件实现、前端渲染器、配置注册、以及验证测试的完整流程。

---

## 一、架构总览

### 1.1 "节点 = 插件"哲学

StudySolo 的工作流节点采用 **插件化架构**。每个节点是一个独立的 Python 包，存放在 `backend/app/nodes/` 下的分类子目录中。节点定义即注册——继承 `BaseNode` 就会被引擎自动发现，**无需修改引擎代码**。

```
你只需要做的事：
  1. 创建一个 Python 文件夹  →  后端自动注册
  2. 写一个 prompt.md        →  Prompt 自动加载
  3. 加一行前端注册           →  渲染器自动匹配
  完毕！
```

### 1.2 关键文件索引

| 文件 | 作用 | 新增节点时是否要改 |
|------|------|:--:|
| `nodes/_base.py` | BaseNode 抽象基类 + 自动注册 | ❌ |
| `nodes/_mixins.py` | LLMStreamMixin / JsonOutputMixin | ❌ |
| `nodes/_categories.py` | 节点分类枚举 | ⚠️ 仅当添加新分类时 |
| `nodes/__init__.py` | 自动扫描 + 导出 NODE_REGISTRY | ❌ |
| `engine/executor.py` | 拓扑排序 + 节点调度 | ❌ |
| `engine/context.py` | 上下文流转 | ❌ |
| `engine/sse.py` | SSE 事件格式 | ❌ |
| `config.yaml` | LLM 路由配置 | ✅ 必须添加路由 |
| 前端 `nodes/index.ts` | 渲染器注册表 | ✅ 必须注册渲染器 |
| 前端 `renderers/` | 各类渲染器组件 | ⚠️ 需要特殊 UI 时 |

---

## 二、新增节点：完整步骤

以新增一个 **`quiz_gen`（测验生成器）** 节点为例，完整演示全流程。

### 步骤总览

```
Step 1: 确定分类 → generation
Step 2: 创建后端文件夹 + node.py + prompt.md
Step 3: 在 config.yaml 添加路由
Step 4: 验证后端注册
Step 5: 创建前端渲染器（如需）
Step 6: 在前端注册表添加映射
Step 7: 端到端测试
```

---

### Step 1：确定节点分类

节点分类对应 `nodes/` 下的子目录：

| 分类 | 目录 | 适用场景 |
|------|------|----------|
| `input` | `nodes/input/` | 接收用户输入（trigger_input） |
| `analysis` | `nodes/analysis/` | 分析解析（ai_analyzer, ai_planner） |
| `generation` | `nodes/generation/` | 内容生成（outline_gen, summary, flashcard 等） |
| `interaction` | `nodes/interaction/` | 对话交互（chat_response） |
| `output` | `nodes/output/` | 数据输出（write_db） |

`quiz_gen` 是内容生成类，所以放在 `generation/`。

> 💡 如果现有分类都不合适，可以在 `_categories.py` 中添加新的枚举值，并在 `nodes/` 目录下创建对应子目录。

---

### Step 2：创建后端文件

#### 2.1 创建文件夹结构

```
backend/app/nodes/generation/quiz_gen/
├── __init__.py          ← 空文件，Python 包标记
├── node.py              ← 节点实现（必须）
└── prompt.md            ← System Prompt（LLM 节点必须）
```

#### 2.2 编写 `__init__.py`

```python
# backend/app/nodes/generation/quiz_gen/__init__.py
# 空文件即可
```

#### 2.3 编写 `node.py`

这是节点的核心文件。根据节点类型选择不同模板：

##### 模板 A：标准 LLM 节点（Markdown 输出）

适用于 `summary`、`content_extract`、`outline_gen` 等。

```python
"""Quiz generation node — generates learning quizzes."""

from typing import Any, AsyncIterator
from app.nodes._base import BaseNode, NodeInput
from app.nodes._mixins import LLMStreamMixin


class QuizGenNode(BaseNode, LLMStreamMixin):
    # ── 注册元信息（每个字段都必须设置）──────────────
    node_type = "quiz_gen"             # 唯一标识，要与 config.yaml 一致
    category = "generation"            # 所属分类
    description = "根据知识点生成选择题测验"  # 会展示在前端节点面板
    is_llm_node = True                 # 是否需要调用 LLM
    output_format = "markdown"         # "markdown" | "json" | "passthrough"
    icon = "📝"                        # 前端展示图标
    color = "#3b82f6"                  # 前端节点边框颜色

    # ── 执行逻辑 ──────────────────────────────────
    async def execute(
        self,
        node_input: NodeInput,
        llm_caller: Any,
    ) -> AsyncIterator[str]:
        # 1. 构建 messages
        system = self.system_prompt + self.build_context_prompt(
            node_input.implicit_context
        )
        user_msg = self.build_user_message(node_input)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ]

        # 2. 流式调用 LLM
        async for token in self.stream_llm(messages, llm_caller):
            yield token
```

##### 模板 B：LLM 节点 + JSON 输出校验

适用于 `flashcard`、`ai_analyzer`、`ai_planner` 等需要结构化输出的节点。

```python
"""Quiz generation node — generates structured quiz JSON."""

import json
from typing import Any, AsyncIterator

from app.nodes._base import BaseNode, NodeInput, NodeOutput
from app.nodes._mixins import LLMStreamMixin, JsonOutputMixin


class QuizGenNode(BaseNode, LLMStreamMixin, JsonOutputMixin):
    node_type = "quiz_gen"
    category = "generation"
    description = "根据知识点生成选择题测验（JSON 格式）"
    is_llm_node = True
    output_format = "json"            # ← 关键区别
    icon = "📝"
    color = "#f59e0b"

    async def execute(
        self,
        node_input: NodeInput,
        llm_caller: Any,
    ) -> AsyncIterator[str]:
        system = self.system_prompt + self.build_context_prompt(
            node_input.implicit_context
        )
        user_msg = self.build_user_message(node_input)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ]
        async for token in self.stream_llm(messages, llm_caller):
            yield token

    # ── 覆写 post_process 做 JSON 校验 ──────────
    async def post_process(self, raw_output: str) -> NodeOutput:
        try:
            parsed = await self.validate_json(raw_output)
            if not isinstance(parsed, list):
                parsed = [parsed]
            return NodeOutput(
                content=json.dumps(parsed, ensure_ascii=False, indent=2),
                format="json",
                metadata={"quiz_count": len(parsed)},
            )
        except ValueError:
            return NodeOutput(content=raw_output, format="markdown")
```

##### 模板 C：非 LLM 节点

适用于 `trigger_input`、`write_db` 等不需要调用大模型的节点。

```python
"""My utility node — does something without LLM."""

from typing import Any, AsyncIterator
from app.nodes._base import BaseNode, NodeInput


class MyUtilNode(BaseNode):
    node_type = "my_util"
    category = "output"
    description = "执行某个非 LLM 操作"
    is_llm_node = False               # ← 不需要 LLM
    output_format = "passthrough"      # ← 无内容输出
    icon = "🔧"
    color = "#6b7280"

    async def execute(
        self,
        node_input: NodeInput,
        llm_caller: Any,              # 不使用，但签名必须保持一致
    ) -> AsyncIterator[str]:
        # 执行你的逻辑
        result = "操作完成"
        yield result
```

#### 2.4 编写 `prompt.md`

System Prompt 存放在与 `node.py` 同目录的 `prompt.md` 文件中，会被 `BaseNode.system_prompt` 属性自动加载。

```markdown
<!-- backend/app/nodes/generation/quiz_gen/prompt.md -->

你是一个测验生成专家。根据用户提供的知识点和暗线上下文，生成选择题测验。

每道题包含以下字段：
- question: 题目描述
- options: 4 个选项 (A/B/C/D)
- answer: 正确答案字母
- explanation: 答案解析

输出格式为 JSON 数组：
[
  {
    "question": "以下哪个是...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "B",
    "explanation": "因为..."
  }
]

不要输出任何 JSON 以外的内容。
```

**Prompt 编写规范：**

1. 第一行说明角色定位
2. 明确输出格式和字段要求
3. 提供输出示例
4. 如果是 JSON 输出，必须加上"不要输出任何 JSON 以外的内容"
5. 可以使用中文，Prompt 文件编码统一为 UTF-8

#### 2.5 可选：编写 `validator.py`

如果节点输出需要复杂的结构化校验（超出 `JsonOutputMixin` 的能力），可以添加 Pydantic 模型：

```python
# backend/app/nodes/generation/quiz_gen/validator.py

from pydantic import BaseModel, Field


class QuizItem(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer: str = Field(pattern=r"^[A-D]$")
    explanation: str


class QuizOutput(BaseModel):
    items: list[QuizItem]
```

然后在 `node.py` 的 `post_process()` 中使用：

```python
from .validator import QuizOutput

async def post_process(self, raw_output: str) -> NodeOutput:
    parsed = await self.validate_json(raw_output)
    validated = QuizOutput(items=parsed)  # Pydantic 校验
    # ...
```

---

### Step 3：在 `config.yaml` 添加路由

打开 `backend/config.yaml`，在 `node_routes` 部分添加新节点的路由：

```yaml
# backend/config.yaml

node_routes:
  # ... 已有节点 ...

  quiz_gen:                      # ← 必须与 node_type 完全一致
    route_chain: "A"             # "A" = 格式严格链, "B" = 深度推理链
    default_model: "qwen3-turbo" # 首选模型
    platform: "dashscope"        # 首选平台
```

**路由链选择指南：**

| 链 | 用途 | 特点 | 适合 |
|----|------|------|------|
| **A** | 格式严格链 | 快速响应，禁止代理商 | JSON 输出、闪卡、分析 |
| **B** | 深度推理链 | 深度思考，允许代理商 | 大纲、总结、对话 |

> ⚠️ **必须做这一步**。如果 `config.yaml` 中没有注册路由，`ai_router.py` 会抛出 `AIRouterError: Unknown node type: quiz_gen`。

---

### Step 4：验证后端注册

#### 4.1 重启后端

```bash
# 在 backend/ 目录
uvicorn app.main:app --reload
```

#### 4.2 访问节点清单 API

```bash
curl http://localhost:8000/api/nodes/manifest
```

预期输出中应包含你的新节点：

```json
[
  {"type": "quiz_gen", "category": "generation", "description": "根据知识点生成选择题测验", ...},
  ...
]
```

如果看不到你的节点，检查以下常见问题：

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 节点没出现在清单中 | `node_type` 为空 | 确认 `node_type = "quiz_gen"` 已设置 |
| 导入报错 | 文件路径不对 | 检查文件夹名和 `__init__.py` 是否存在 |
| `ModuleNotFoundError` | 缺少 `__init__.py` | 确保每一级目录都有 `__init__.py` |
| `AIRouterError` | 未配 config.yaml | 在 `node_routes` 中添加路由 |

#### 4.3 快速 Python 验证

```python
# 在 backend/ 目录下执行
python -c "
from app.nodes import NODE_REGISTRY
print('已注册节点:', list(NODE_REGISTRY.keys()))
assert 'quiz_gen' in NODE_REGISTRY, 'quiz_gen 未注册！'
print('✅ quiz_gen 注册成功')
"
```

---

### Step 5：前端渲染器

#### 5.1 判断是否需要新渲染器

| 你的节点输出格式 | 使用哪个渲染器 | 需要创建新渲染器吗？ |
|-----------------|--------------|:--:|
| Markdown 文本 | `MarkdownRenderer` | ❌ |
| JSON (通用) | `JsonRenderer` | ❌ |
| 无输出 (非 LLM) | `PassthroughRenderer` | ❌ |
| 特殊交互 UI | 需要自定义 | ✅ |

`quiz_gen` 输出是测验题，需要特殊的选择题交互 UI → **需要新渲染器**。

#### 5.2 创建渲染器组件

```
frontend/src/features/workflow/components/nodes/renderers/QuizRenderer.tsx
```

**渲染器规范：**

```tsx
"use client";

/**
 * QuizRenderer — renders interactive quiz questions.
 * 
 * 文件位置规范：renderers/ 下，文件名为 PascalCase + Renderer.tsx
 * 必须导出命名导出 (non-default export)
 */

import React, { useState, useMemo } from "react";
import type { NodeRendererProps } from "../index";

// 定义节点输出的数据结构
interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const QuizRenderer: React.FC<NodeRendererProps> = ({
  output,
  isStreaming,
}) => {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // 解析 JSON 输出
  const questions: QuizItem[] = useMemo(() => {
    if (!output) return [];
    try {
      const parsed = JSON.parse(output);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }, [output]);

  // ... 选择/提交/查看答案的逻辑 ...

  // ── 三态渲染 ──────
  if (isStreaming && questions.length === 0) {
    return <div className="text-gray-400 text-sm italic">测验生成中...</div>;
  }
  if (questions.length === 0) {
    return <div className="text-gray-400 text-sm italic">等待执行</div>;
  }

  return (
    <div className="space-y-4">
      {/* 渲染你的测验 UI */}
    </div>
  );
};
```

**渲染器必须遵守的规范：**

1. ✅ 使用 `"use client"` 指令
2. ✅ 实现 `NodeRendererProps` 接口
3. ✅ 处理三种状态：`isStreaming`（生成中）、`!output`（等待执行）、正常展示
4. ✅ 使用命名导出 `export const XxxRenderer`（不是 `export default`）
5. ✅ `output` 是字符串，需要自行 `JSON.parse`（JSON 输出）或直接使用（Markdown 输出）
6. ❌ 不要直接调用后端 API，渲染器只负责展示

---

### Step 6：在前端注册表注册

打开 `frontend/src/features/workflow/components/nodes/index.ts`，添加两处：

```typescript
// 1. 添加 import
import { QuizRenderer } from "./renderers/QuizRenderer";

// 2. 在 RENDERER_REGISTRY 中添加映射
const RENDERER_REGISTRY: Record<string, React.FC<NodeRendererProps>> = {
  // ... 已有映射 ...
  
  quiz_gen: QuizRenderer,    // ← 添加这一行
};
```

如果你的节点使用已有渲染器（如 MarkdownRenderer），也需要在这里注册：

```typescript
quiz_gen: MarkdownRenderer,   // 使用现有渲染器
```

> 💡 **这是前端唯一必须修改的文件**。`AIStepNode.tsx` 和其他组件完全不需要改动。

---

### Step 7：端到端测试

#### 7.1 后端启动

```bash
cd backend
uvicorn app.main:app --reload
```

#### 7.2 验证清单接口

```bash
curl http://localhost:8000/api/nodes/manifest | python -m json.tool
```

#### 7.3 前端启动

```bash
cd frontend
npm run dev
```

#### 7.4 工作流执行测试

1. 创建一个工作流
2. 添加 `quiz_gen` 类型的节点
3. 连接上游节点
4. 点击"执行"
5. 验证 SSE 事件流和渲染器展示

---

## 三、完整改动清单 Checklist

新增节点时，按以下清单逐项确认：

```
□ 后端
  □ 创建 nodes/<分类>/<节点名>/ 文件夹
  □ 创建 __init__.py（空文件）
  □ 创建 node.py（继承 BaseNode，设置所有必须的 ClassVar）
  □ 创建 prompt.md（LLM 节点必须）
  □ 可选：创建 validator.py（需要 Pydantic 校验时）
  □ 在 config.yaml 的 node_routes 添加路由
  □ 重启后端，访问 /api/nodes/manifest 确认注册

□ 前端
  □ 可选：创建 renderers/XxxRenderer.tsx
  □ 在 nodes/index.ts 的 RENDERER_REGISTRY 添加映射
  □ 不需要改 AIStepNode.tsx
  □ 不需要改 WorkflowCanvas.tsx
  □ 不需要改 engine/ 或 hooks/

□ 测试
  □ 后端：节点出现在 /api/nodes/manifest
  □ 后端：Python 可以 from app.nodes import NODE_REGISTRY; assert '<节点名>' in NODE_REGISTRY
  □ 前端：节点在画布中正确渲染
  □ 端到端：工作流执行 SSE 事件流正常
```

---

## 四、BaseNode 类变量参考

| 变量 | 类型 | 必须 | 说明 |
|------|------|:----:|------|
| `node_type` | `str` | ✅ | 唯一标识，如 `"quiz_gen"`。必须与 `config.yaml` 一致 |
| `category` | `str` | ✅ | `"input" \| "analysis" \| "generation" \| "interaction" \| "output"` |
| `description` | `str` | ✅ | 中文描述，展示在前端节点面板 |
| `is_llm_node` | `bool` | ✅ | 是否需要调用大模型 |
| `output_format` | `str` | ✅ | `"markdown" \| "json" \| "passthrough"` |
| `icon` | `str` | ⚠️ | Emoji 图标，默认 `"⚙️"` |
| `color` | `str` | ⚠️ | 16 进制颜色，默认 `"#6366f1"` |

## 五、BaseNode 方法参考

| 方法 | 是否必须覆写 | 默认行为 | 何时覆写 |
|------|:--:|------|------|
| `execute()` | ✅ **必须** | — | 所有节点 |
| `post_process()` | ❌ 可选 | 直接透传为 `NodeOutput(content=raw, format=output_format)` | JSON 节点需要校验时 |
| `build_user_message()` | ❌ 可选 | 拼接上游输出 + 当前 label | 需要自定义消息格式时 |
| `build_context_prompt()` | ❌ 可选 | 注入暗线上下文 JSON | 需要特殊上下文格式时 |
| `system_prompt` (property) | ❌ 自动 | 从 `prompt.md` 加载 | 一般不覆写，直接编辑 `prompt.md` |

## 六、可用 Mixin 参考

| Mixin | 作用 | 使用方式 |
|-------|------|----------|
| `LLMStreamMixin` | 封装 LLM 流式调用 | `async for token in self.stream_llm(messages, llm_caller): yield token` |
| `JsonOutputMixin` | 三级 JSON 修复（直接解析 → 去代码围栏 → 提取首尾括号） | `parsed = await self.validate_json(raw_output)` |

### 使用多个 Mixin

```python
class MyNode(BaseNode, LLMStreamMixin, JsonOutputMixin):
    # 同时继承两个 Mixin
    ...
```

---

## 七、数据流全链路

新增节点后，整个数据流如下：

```
用户输入 "学习机器学习"
     │
     ▼
[前端] POST /workflow/{id}/execute
     │
     ▼
[api/workflow.py] 调用 engine/executor.py
     │
     ▼
[executor.py] topological_sort(nodes, edges) → 确定执行顺序
     │
     ▼
for node_id in order:
     │
     ├── NodeClass = NODE_REGISTRY["quiz_gen"]    ← 从注册表查找
     │        └── 就是你写的 QuizGenNode
     │
     ├── node_input = NodeInput(                  ← 构建输入
     │       user_content = "学习机器学习",
     │       upstream_outputs = {"node_1": "大纲...", "node_2": "知识点..."},
     │       implicit_context = {...}
     │   )
     │
     ├── async for token in node.execute(input, call_llm):
     │       yield sse_event("node_token", {"node_id": "xxx", "token": token})
     │
     ├── result = await node.post_process(full_output)
     │       ← JSON 校验 / 格式化
     │
     └── yield sse_event("node_done", {"node_id": "xxx", "full_output": result.content})
     
     │
     ▼
[前端] use-workflow-execution.ts 监听 SSE
     │
     ├── onNodeToken → 追加到 output buffer
     ├── onNodeDone  → 标记完成
     │
     ▼
[AIStepNode.tsx]
     │
     ├── const Renderer = getRenderer("quiz_gen")  ← 从注册表查找
     │        └── 就是你写的 QuizRenderer
     │
     └── <Renderer output={...} isStreaming={...} />  ← 自动渲染
```

---

## 八、常见问题

### Q: 我的节点执行时报 `AIRouterError: Unknown node type`？

**A:** 你忘了在 `config.yaml` 的 `node_routes` 中添加路由。`node_type` 值必须完全一致。

### Q: 节点注册了但前端展示为空白？

**A:** 检查 `nodes/index.ts` 是否在 `RENDERER_REGISTRY` 中注册了你的节点类型。如果没有注册，会降级使用 `MarkdownRenderer`，但 JSON 输出会显示为原始文本。

### Q: prompt.md 修改后不生效？

**A:** `system_prompt` 属性每次都从文件重新读取，一般不需要重启。但如果后端有文件缓存，重启 uvicorn 即可。

### Q: 非 LLM 节点也需要 `llm_caller` 参数？

**A:** 是的，`execute()` 的签名是统一的，非 LLM 节点忽略这个参数即可。这是为了让引擎调度逻辑保持统一，不需要对不同节点做特殊处理。

### Q: 我需要在节点里访问数据库？

**A:** 当前架构中 `execute()` 没有直接传入 DB 连接。如需数据库访问，可以：
1. 在 `node.py` 中导入 `app.core.database.get_db`
2. 在 `execute()` 内部创建 DB 会话
3. 未来考虑将 DB 连接加入 `NodeInput` 或通过依赖注入传入

### Q: 怎么给节点添加自定义配置参数？

**A:** 在 `node.py` 中添加 ClassVar：

```python
class QuizGenNode(BaseNode, LLMStreamMixin):
    node_type = "quiz_gen"
    max_questions: ClassVar[int] = 10    # 自定义参数
    difficulty: ClassVar[str] = "medium"
```

这些参数会自动出现在 `get_manifest()` 的输出中（需要在 `_base.py` 的 `get_manifest` 方法中添加）。

---

## 九、已有节点一览

| 类型 | 节点 | 分类 | LLM | 输出格式 |
|------|------|------|:---:|---------|
| `trigger_input` | 触发器 | input | ❌ | passthrough |
| `ai_analyzer` | 需求分析 | analysis | ✅ | json |
| `ai_planner` | 工作流规划 | analysis | ✅ | json |
| `outline_gen` | 大纲生成 | generation | ✅ | markdown |
| `content_extract` | 知识提炼 | generation | ✅ | markdown |
| `summary` | 总结归纳 | generation | ✅ | markdown |
| `flashcard` | 闪卡生成 | generation | ✅ | json |
| `chat_response` | 对话回复 | interaction | ✅ | markdown |
| `write_db` | 写库 | output | ❌ | passthrough |

---

> 📌 **核心原则**：新增节点 = 新增文件夹 + 配置路由 + 注册渲染器。  
> 不修改引擎、不修改基类、不修改 AIStepNode。  
> 每个节点是独立插件，互不影响。
