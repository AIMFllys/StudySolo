# 2026-04-12 Phase 4 收口与 Phase 5 交接给 Claude Code

> 文档编码：UTF-8（无 BOM） / LF
> 目的：把当前仓库在 `2026-04-12` 的真实进度、边界、测试基线、下一阶段主线与禁区一次性同步清楚，后续可直接交给 Claude Code 接手

---

## 1. 背景与交接目的

当前这条 lane 的目标不是继续扩新功能，也不是继续深挖 `code-review-agent` 的 Phase 4B 细枝末节，而是：

1. 把已经完成的 `code-review-agent` Phase 4B 治理收口稳定下来
2. 把 `final-plan`、更新日志和 `project-context` 与代码真实状态对齐
3. 形成一份足够详细的交接说明，让后续 Claude Code 能直接从 Phase 5 主线起跑

这意味着：

- **不要再把注意力放回“大型重构”**
- **不要再把注意力放回“继续补子 Agent 骨架”**
- **不要默认继续深挖 `code-review-agent` 的 4B 细节**

当前 owner 的合理下一主线已经转为：

- `Task 5.1 Agent Gateway`
- `Task 5.3 根级治理`
- `Task 5.4 文档与代码对齐`
- `Task 5.5 CI/CD 增强`

`Task 5.2 Wiki` 由小陈并行推进，子 Agent 扩展与新骨架迁移不是当前 owner lane。

---

## 2. 当前真实状态总览

截至 `2026-04-12`，当前仓库的阶段判断应以如下结论为准：

- **Phase 0**：完成
- **Phase 1**：完成，契约已冻结
- **Phase 2**：完成，后端核心重构已落地
- **Phase 3**：完成，前端架构重构工程主线已落地，剩少量手动 smoke
- **Phase 4A**：主线完成，节点 manifest-first 与版本治理基线已在位，仅剩 `workflow-meta.ts` 的 deprecate 长尾
- **Phase 4B（当前 owner 侧）**：已在责任边界内收口，不再继续深挖，除非发现阻塞 Gateway 的真实缺口
- **Phase 5**：对当前 owner 而言已可启动，不需要等更多子 Agent 骨架

最重要的现实判断：

1. `code-review-agent` 已经足够作为 Gateway 的**首个集成对象**
2. 当前大头不再是 Agent 内核细化，而是**平台集成、治理、文档对齐和 CI**
3. “其他子 Agent 的骨架/迁移”不是当前 owner 的主线责任

---

## 3. Phase 2 / 3 / 4 已完成事项

### 3.1 Phase 2：后端核心重构

- `backend/app/api/` 已按 `auth / workflow / ai / admin` 等分组重构
- AI Chat 已合并为 `backend/app/api/ai/chat.py`
- Workflow 路由已重组为 `backend/app/api/workflow/`
- LLM 服务主线已切到 `backend/app/services/llm/`
- 后端目录结构已具备作为 Phase 5 Gateway 宿主的稳定基础

### 3.2 Phase 3：前端架构重构

- `frontend/src/features/`、`services/`、`stores/` 新结构已落地
- TypedEventBus 已作为跨域事件通信主线
- workflow 节点渲染已转向 manifest-first
- 当前只剩少量手动 smoke，并不阻塞 Phase 5 平台集成准备

### 3.3 Phase 4A：节点系统单一事实源

- 节点自动发现机制已存在
- `/api/nodes/manifest` 已返回 `display_name / renderer / version / changelog`
- 前端 NodeStore 动态分组已接到 manifest
- 官方节点版本治理基线已形成

### 3.4 Phase 4B：`code-review-agent` 当前 owner 侧已完成闭环

当前已完成的闭环包括：

1. repo-aware 同序风格等价 identifier canonicalization
2. unknown-rule `Title` / `Fix` groundedness canonicalization
3. known-rule ID canonicalization
4. slash-equivalent path canonicalization
5. style-equivalent evidence anchoring canonicalization
6. style-equivalent live finding identity canonicalization
7. live evidence governance truth / display truth separation
8. slash-equivalent live evidence anchoring canonicalization

---

## 4. `code-review-agent` 当前真实能力、边界与残余限制

### 4.1 当前已具备

- `GET /health`
- `GET /health/ready`
- `GET /v1/models`
- `POST /v1/chat/completions`
- non-stream / SSE stream
- API Key 校验
- 多文件 unified diff 感知
- 结构化 `review_target / repo_context` 输入治理
- 7 类本地规则审查
- `heuristic / upstream_reserved / upstream_openai_compatible` 三种 backend seam
- 真实 OpenAI-compatible upstream non-stream / streaming 调用
- live upstream findings 治理与 strict fallback
- repo-context forwarding governance
- style-equivalent / slash-equivalent 的关键治理收口

### 4.2 当前明确不做

- 运行时读取本地仓库文件
- embedding / AST / 跨文件推理
- provider usage 透传
- provider model 暴露
- Gateway 本身
- `/api/agents/*` 主后端接入层

### 4.3 当前需要记住的治理语义

- 最终 dedupe identity 已不再使用原始展示文本，而是走 canonical identity truth
- live evidence 的治理真相与展示真相已经拆开
- final finding 的展示仍然遵守 **first-win**：同 identity duplicate 只保留第一条，`Evidence:` / `Fix:` 保留第一条原文
- live evidence anchoring 已支持 slash-equivalent path-like token，但仍拒绝 basename-only、absolute-vs-relative、case mismatch 等宽松匹配

---

## 5. 当前测试基线与验证命令

当前必须以这条命令和结果作为真实基线：

```bash
pytest agents/code-review-agent/tests -q
```

结果：

```text
177 passed
```

如果后续 Claude Code 在继续工作时动到了 `agents/code-review-agent/`，必须至少回到这条基线，不允许回退。

---

## 6. 当前工作区注意事项

当前工作区里存在大量**无关脏文件**。Claude Code 接手时，必须先看 `git status --short`，不要把这些文件混进后续任务：

- `docs/项目规范与框架流程/...`
- `shared/...`
- `frontend/public.zip`
- `frontend/public (2).zip`
- 其他未纳入当前 lane 的随机修改

当前 Claude Code 的默认原则应为：

1. **只 touch 当前任务需要的文件**
2. **只 stage 当前任务明确包含的文件**
3. **不要顺手清理无关脏文件**
4. **所有中文文档继续保持 UTF-8（无 BOM）**

---

## 7. 明确不在 Claude 当前首轮范围内的内容

Claude Code 接手后的第一轮工作，默认**不在范围内**的内容包括：

- 重开 Phase 2 或 Phase 3 的大型重构
- 继续深挖 `code-review-agent` 的 4B 细节
- 给 `code-review-agent` 增加本地仓库读取、embedding、AST、跨文件推理
- 补齐所有其他 Agent 的骨架或迁移
- 一次性实现完整 Wiki 全部内容
- 顺手清理整个仓库的旧文档和脏文件

只有在发现**明确阻塞 Gateway 的真实缺口**时，才允许回头补极小范围的 `code-review-agent` 修正。

---

## 8. Phase 5 任务总览与建议优先顺序

### 8.1 当前 owner 的默认优先级

1. **Task 5.1 Agent Gateway**
2. **Task 5.3 根级治理**
3. **Task 5.4 文档与代码对齐**
4. **Task 5.5 CI/CD 增强**
5. **Task 5.2 Wiki** 由小陈并行

### 8.2 为什么优先做 5.1

因为当前已经具备一个真实可调用的 `code-review-agent`，这意味着：

- 不需要等待更多 Agent 骨架
- 可以直接验证 Agent Gateway 的注册、调用、健康检查、SSE 透传和超时链
- 可以让 Phase 5 从“文档计划”变成“可运行平台主线”

### 8.3 为什么 5.3 / 5.4 / 5.5 紧随其后

因为一旦进入 Gateway 开发，根级治理、文档对齐和 CI 边界就会立刻变成并行协作中的真实问题，不提前收口会导致后续改动互相打架。

---

## 9. 建议 Claude 首轮执行清单

建议 Claude Code 第一轮按下面顺序行动：

1. 只读核实当前仓库真实状态
2. 阅读以下事实源：
   - `docs/team/refactor/final-plan/00-索引.md`
   - `docs/team/refactor/final-plan/phase-4-nodes-and-agents.md`
   - `docs/team/refactor/final-plan/phase-5-integration.md`
   - `docs/Updates/2026-04-12.md`
   - `.agent/skills/project-context/SKILL.md`
   - `agents/code-review-agent/src/core/agent.py`
   - `agents/code-review-agent/tests/test_review_logic.py`
   - `agents/code-review-agent/tests/test_contract.py`
3. 再核对一次 `git status --short`
4. 明确当前任务只围绕 `Phase 5.1 / 5.3 / 5.4 / 5.5`
5. 如果没有新的阻塞性事实，再输出一份**decision-complete** 的 Phase 5 起步计划
6. 若用户允许实施，再从 `Task 5.1 Agent Gateway` 的最小闭环开始

---

## 10. 风险点与禁区

### 10.1 风险点

- 文档与代码真实状态可能再次轻微漂移，因此 Claude 必须先核实再动手
- 当前工作区有无关脏文件，极易误 stage
- `code-review-agent` 已有较大未共享上下文积累，若 Claude 不先读事实源，容易误判“还需要继续做 4B”

### 10.2 禁区

- 不要把 `code-review-agent` 当作下一阶段的主战场
- 不要把“继续补 Agent 骨架”当作当前 owner 的默认任务
- 不要把 Wiki 当作设计源
- 不要在没有确认的前提下顺手重命名目录树、切 monorepo 结构、引入更大的工作区工具链

---

## 11. 建议的文档 / 代码阅读顺序

建议 Claude Code 按下面顺序读：

1. `docs/team/refactor/final-plan/00-索引.md`
2. `docs/team/refactor/final-plan/phase-4-nodes-and-agents.md`
3. `docs/team/refactor/final-plan/phase-5-integration.md`
4. `docs/Updates/2026-04-12.md`
5. `.agent/skills/project-context/SKILL.md`
6. `backend/app/api/router.py`
7. `agents/code-review-agent/src/core/agent.py`
8. `agents/code-review-agent/tests/test_review_logic.py`
9. `agents/code-review-agent/tests/test_contract.py`

这样可以先建立阶段判断，再进入代码与测试层面的真实上下文。

---

## 12. 建议给 Claude 的可直接复制提示词正文

下面这段提示词可以直接复制给 Claude Code：

```text
请深度结合以下事实源，只基于仓库真实状态继续推进，不要重开大重构：

1. docs/team/refactor/final-plan/00-索引.md
2. docs/team/refactor/final-plan/phase-4-nodes-and-agents.md
3. docs/team/refactor/final-plan/phase-5-integration.md
4. docs/Updates/2026-04-12.md
5. .agent/skills/project-context/SKILL.md

你需要先确认以下事实：

- Phase 2 已完成
- Phase 3 已完成
- Phase 4A 主线已完成
- 当前 owner 侧的 code-review-agent Phase 4B 已在责任边界内收口
- 当前 code-review-agent 测试基线为：pytest agents/code-review-agent/tests -q -> 177 passed
- 当前 owner 的下一主线不再是继续深挖 code-review-agent 4B，而是 Phase 5

关键边界：

- 不要碰 Gateway 之外的无关主线
- 不要继续给 code-review-agent 增加本地仓库读取、embedding、AST、跨文件推理
- 不要默认继续补其他 Agent 骨架；那不是当前 owner 主线
- 不要碰无关脏文件，先自己检查 git status --short
- 所有中文文档保持 UTF-8（无 BOM）

你当前的默认目标应是：

1. 深度核实 Phase 5 的当前起点是否已经成熟
2. 围绕 Task 5.1 Agent Gateway 给出一份 decision-complete 的正式实施方案
3. 同时梳理 Task 5.3 / 5.4 / 5.5 的依赖关系、推荐顺序和最小闭环
4. 除非你发现阻塞 Gateway 的真实缺口，否则不要回头继续深挖 code-review-agent 的 4B 细节

你在第一轮回答里优先输出：

- 当前真实状态总结
- 还剩哪些主任务
- 为什么下一步应是 Phase 5.1 / 5.3 / 5.4 / 5.5
- 一份可直接执行的正式计划

如果你认为必须继续动 code-review-agent，请先明确指出具体阻塞点、影响范围和为什么它真的阻塞 Gateway，而不是泛化地建议”继续完善 Agent”。
```

---

## 13. 深度架构分析发现的问题清单

> 本节由 2026-04-12 架构深度分析补充，供后续 Claude Code 在 Phase 5 规划时参考。

### 13.1 高优先级问题

#### 问题 13.1.1：前端 `fetch` 调用未统一收口

**严重程度**：高

**现状**：

文档 `02-模块边界规范.md` 第 2.3 节明确规定：
> “所有 API 调用必须通过 `services/` 层”
> “使用 `api-client.ts` 提供的 `authedFetch` 而非裸 `fetch`”

但实际代码检查发现，前端 `features/workflow/hooks/` 中存在多处直接使用 `fetch()` 的代码：

```
frontend/src/features/workflow/components/panel/WorkflowPromptInput.tsx:39
  → const res = await fetch('/api/ai/generate-workflow', { ... })

frontend/src/features/workflow/hooks/use-create-workflow-action.ts:25
  → const response = await fetch('/api/workflow', { ... })

frontend/src/features/workflow/hooks/use-stream-chat.ts:132
  → const res = await fetch('/api/ai/generate-workflow', { ... })

frontend/src/features/workflow/hooks/use-stream-chat.ts:251
  → const res = await fetch('/api/ai/chat-stream', { ... })

frontend/src/features/workflow/hooks/use-workflow-execution.ts:106
  → const response = await fetch(`/api/workflow/${id}/execute`, { ... })

frontend/src/features/workflow/hooks/use-workflow-sync.ts:185
  → void fetch(`/api/workflow/${currentWorkflowId}`, { ... })
```

**影响**：

1. 认证一致性无法保障——部分请求可能缺少 token 刷新重试逻辑
2. 错误处理不一致——绕过了 `parseApiError` 统一错误解析
3. 代码审查边界模糊——新代码可能继续沿用错误模式

**建议修复**：

1. 在 Phase 5 中增加”前端 fetch 统一收口”任务
2. 或在现有 Phase 4/5 中补充 CI 检查规则，禁止 `features/` 中出现裸 `fetch`

---

#### 问题 13.1.2：缺少前端 Feature 间隔离自动化检查

**严重程度**：高

**现状**：

`02-模块边界规范.md` 第 2.1 节规定：
> “Feature 之间通过 public API 通信，不直接导入内部组件”

第 7 节提到违规处理：
> “Feature 间直接导入 → Code review 拒绝”

但 **没有自动化检查机制**——ESLint `import/no-restricted-paths` 规则未配置，依赖人工 code review 发现违规。

当前 Feature 模块：

| 模块 | 路径 | Owner |
|------|------|-------|
| workflow | `features/workflow/` | 羽升 |
| admin | `features/admin/` | 羽升 |
| auth | `features/auth/` | 羽升 |
| knowledge | `features/knowledge/` | 待定 |
| settings | `features/settings/` | 待定 |

**影响**：

1. `features/workflow` 可能无意间导入 `features/admin` 的内部组件
2. Feature 边界逐渐模糊，随项目增长风险增加
3. Code review 依赖人工发现，可靠性低

**建议修复**：

Phase 5 Task 5.3 中提到的 ESLint 规则应优先实施：

```json
{
  “rules”: {
    “import/no-restricted-paths”: [“error”, {
      “zones”: [
        {
          “target”: “./src/features/admin/”,
          “from”: “./src/features/workflow/”
        },
        {
          “target”: “./src/features/workflow/”,
          “from”: “./src/features/admin/”
        }
      ]
    }]
  }
}
```

或在 CI 中添加简单的 grep 检查：

```bash
grep -r “from '@/features/admin” frontend/src/features/workflow/ && exit 1
```

---

### 13.2 中优先级问题

#### 问题 13.2.1：`workflow-meta.ts` 的职责边界模糊

**严重程度**：中

**现状**：

文档声明 `workflow-meta.ts` 正在”deprecate 长尾”中，但：

1. 文件仍达 **410 行**
2. 前端代码中有 **9 处直接引用**
3. 包含 `NODE_TYPE_META`（节点元数据）、`STATUS_META`（状态样式）、节点端口定义等

**问题**：

1. 文档说”正在逐步废弃”，但没有明确的时间线和替代方案
2. Phase 4 文档提到”不再作为当前 blocker”，但实际代码高度依赖
3. 这造成”文档-代码不一致”，AI 编程时可能产生混乱
4. 新开发者无法判断应该参考 manifest 还是 `workflow-meta.ts`
5. 节点元数据存在潜在的双源头风险

**影响**：

- 新节点开发时，不确定应该在哪里定义元数据
- manifest-first 转型可能不彻底

**建议修复**：

1. 在 Phase 4 收尾阶段明确 deprecate 路线图（如”3 个月内完成迁移”）
2. 或承认当前 `workflow-meta.ts` 作为”前端运行时补充元数据缓存”的合理地位，更新文档
3. 明确哪些字段从 manifest 读取，哪些字段保留在 `workflow-meta.ts`

---

#### 问题 13.2.2：Agent Gateway vs 主后端 LLM 路由职责重叠

**严重程度**：中

**现状**：

1. 主后端有 `services/llm/router.py` 负责多平台 AI 模型路由
2. Phase 5 计划中的 Agent Gateway 也有路由选择职责
3. `agent-architecture.md` 未明确 Agent 调用 AI 的方式

**潜在冲突**：

1. 当子后端 Agent 需要调用 AI 时，是通过自己的 API Key 调用，还是复用主后端的路由？
2. 如果每个 Agent 独立调用 AI Provider，则多了一层重复的路由逻辑

**建议修复**：

在 Phase 5 设计 Agent Gateway 时，明确以下边界：

1. Agent 调用 AI 的方式（独立调用 vs 通过主后端代理）
2. 如果独立调用，Agent 自己管理 API Key 和路由
3. 如果代理调用，主后端负责路由选择和计费

---

#### 问题 13.2.3：后端节点层对服务层存在反向依赖

**严重程度**：中

**现状**：

根据 `模块边界规范.md` 第 5.2 节依赖规则：
> “nodes/ ← 禁止依赖 api/, services/”

但代码检查发现：

```python
# backend/app/nodes/community/node.py:11
from app.services.community_node_queries import get_node_with_prompt

# backend/app/nodes/input/knowledge_base/node.py:79
from app.services.knowledge_service import ...

# backend/app/nodes/input/web_search/node.py:55
from app.services.search_service import search_web, format_search_results

# backend/app/nodes/output/export_file/node.py:109
from app.services.file_converter import export_txt
```

**问题**：

1. 节点直接导入服务层，违反依赖方向
2. 这是一种”上帝类”倾向——节点承担了过多职责

**影响**：

1. 节点难以独立测试（需要 mock 整个服务层）
2. 节点层和服务层边界模糊，未来可能进一步耦合

**建议修复**：

1. 在引擎层注入服务依赖，节点通过 `node_input.implicit_context` 或回调获取服务能力
2. 或明确标记这些为”工具型节点”，在规范中单独定义其边界
3. 至少在文档中明确这是已知的例外情况

---

### 13.3 低优先级问题

#### 问题 13.3.1：`shared/` 模块实际使用率极低

**严重程度**：低

**现状**：

1. `shared/` 作为 Git submodule 存在，有完整的类型定义和文档
2. 但检查 `backend/` 和 `frontend/src/` 后发现：**实际代码中没有任何 `from shared` 的导入**
3. 这是一个”幽灵模块”——存在但未被使用

**问题**：

1. 文档中多处提到 `shared/` 作为”跨项目共享类型”的重要组件
2. 实际前端类型定义仍全部在 `frontend/src/types/` 中
3. 后端使用 Pydantic 模型，TypeScript 类型无法直接共享

**影响**：

1. 维护成本：需要持续更新一个未使用的模块
2. 认知负担：新人会被”共享层”概念迷惑

**建议修复**：

1. 要么真正启用 `shared/`（前端从 `shared/src/types/` 导入类型）
2. 要么删除文档中关于 `shared/` 实际用途的描述，明确其为”Platform Monorepo 协作预留位”

---

#### 问题 13.3.2：Agent 目录结构与规范文档存在偏差

**严重程度**：低

**现状**：

`04-子后端Agent规范.md` 描述 Agent 应有以下结构：

```
agents/[agent-name]/src/
├── middleware/auth.py
├── schemas/
│   ├── request.py
│   └── response.py
└── ...
```

但 `agents/code-review-agent/` 实际结构与文档有差异：

1. 未发现独立的 `schemas/` 目录
2. 核心逻辑在 `src/core/agent.py` 中，结构扁平化

**问题**：

- 文档作为”规范”，应该与模板严格一致
- 或者模板应更新为规范所描述的结构

**建议修复**：

同步 `_template` 和 `code-review-agent` 的实际结构与规范文档，三者保持一致。

---

#### 问题 13.3.3：测试覆盖与文档描述不完全匹配

**严重程度**：低

**现状**：

1. Phase 2 文档声称”现有测试链已通过”，但提到 `test_ai_routing_property.py` 为 “skipped”
2. Phase 4B 文档提到测试基线数字在不同位置不一致（`110 passed` vs `177 passed`）
3. 文档中未明确哪些测试是必须通过的”门禁测试”

**问题**：

1. 测试基线描述模糊
2. Skipped 测试没有说明原因或计划

**影响**：

1. 无法判断代码质量是否达标
2. 可能掩盖潜在问题

**建议修复**：

1. 统一文档中的测试数字
2. 对 skipped 测试添加说明或移除
3. 明确定义”门禁测试”清单

---

#### 问题 13.3.4：`workflow.service.ts` vs `workflow.server.service.ts` 职责差异不明确

**严重程度**：低

**现状**：

1. 两个文件并存，文档称”重复已显著收薄”
2. 但实际仍有两个独立文件，新开发者难以判断何时用哪个

**问题**：

- 文档未明确说明两者的使用场景差异

**建议修复**：

1. 明确文档说明两者的使用场景（`workflow.service.ts` 用于客户端，`workflow.server.service.ts` 用于 SSR）
2. 或进一步合并为一个文件，通过参数控制行为

---

### 13.4 AI 编程冗余分析

根据对代码的审查，发现以下可能被视为”AI 编程冗余”的部分：

| 位置 | 内容 | 行数 | 是否冗余 | 说明 |
|------|------|------|---------|------|
| `backend/app/services/ai_router.py` | compat shim | 3行 | 否 | 必要的向后兼容层 |
| `backend/app/services/llm_caller.py` | compat shim | 2行 | 否 | 必要的向后兼容层 |
| `backend/app/services/llm_provider.py` | compat shim | 2行 | 否 | 必要的向后兼容层 |
| `frontend/src/stores/use-*.ts` | compat shim | 各~100字节 | 否 | 文档明确的兼容策略 |
| `frontend/src/features/workflow/constants/workflow-meta.ts` | 节点元数据 | 410行 | 部分冗余 | 等待 manifest-first 完全落地 |

**结论**：

1. 当前项目中的”兼容层 shim”是有意设计的，不属于 AI 编程冗余
2. 真正需要关注的是 `workflow-meta.ts` 的去留问题（已在问题 13.2.1 分析）
3. 项目整体没有发现明显的 AI 编程冗余问题

---

### 13.5 问题汇总与建议优先级

| 优先级 | 问题编号 | 问题简述 | 建议纳入阶段 |
|--------|---------|---------|-------------|
| **高** | 13.1.1 | 前端 fetch 未统一收口 | Phase 5 或立即修复 |
| **高** | 13.1.2 | 缺少 Feature 隔离检查 | Phase 5 Task 5.3 |
| **中** | 13.2.1 | workflow-meta.ts 职责模糊 | Phase 4 收尾明确 |
| **中** | 13.2.2 | Agent Gateway vs LLM Router 职责重叠 | Phase 5 设计时明确 |
| **中** | 13.2.3 | 节点层对服务层的反向依赖 | Phase 5 或长期治理 |
| **低** | 13.3.1 | shared 模块使用率低 | 文档同步即可 |
| **低** | 13.3.2 | Agent 目录结构文档偏差 | 文档同步即可 |
| **低** | 13.3.3 | 测试数字不一致 | 文档同步即可 |
| **低** | 13.3.4 | workflow service 双文件职责模糊 | 文档同步即可 |

---

### 13.6 积极评价

项目架构在以下方面表现出色：

1. **分 Phase 执行策略**：避免了大规模重构的风险
2. **明确的契约冻结机制**：Phase 1 奠定了良好基础
3. **四层 Agent 兼容性设计**：符合业界最佳实践
4. **Manifest-First 节点系统**：解决了”七处重复定义”的核心问题
5. **兼容层 shim 策略**：平滑过渡，减少破坏性变更
6. **代码与文档同步性**：整体保持较高的一致性
