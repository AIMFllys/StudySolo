# StudySolo 当前状态

> 最后更新：2026-03-03
> 这是唯一一份需要随开发过程不断更新的文件。每次开新对话，把这份文件作为上下文的第一段喂给 AI。

## 已完成的模块和功能

### ✅ MVP 核心（全部完成）

- **认证系统**：注册/登录/登出/Token刷新，Cookie-based JWT，前端 middleware 路由守卫
- **工作流 CRUD**：创建/读取/更新/删除工作流，Supabase RLS 用户隔离
- **AI 双阶段生成**：AI_Analyzer 需求分析 → AI_Planner 工作流规划，Pydantic 验证 + 重试
- **工作流执行引擎**：拓扑排序 → 逐节点 AI 调用 → SSE 流式输出
- **AI 多模型路由**：config.yaml 配置中心 → 8 家 AI 平台 → 双链容灾降级
- **前端画布**：@xyflow/react 工作流可视化，AIStepNode 自定义节点
- **Zustand Store**：工作流状态管理，节点/连线/执行状态
- **三层防抖同步**：UI(0ms) → IndexedDB(500ms) → Supabase(4s)
- **前端布局**：Sidebar、Navbar、MobileNav、RightPanel、BottomDrawer
- **部署脚本**：Nginx 配置、PM2 前端、Gunicorn 后端
- **提示词注入防护**：正则过滤 + 沙箱标记
- **config.yaml 配置中心**：AI 模型/节点路由/容灾配置

### ✅ 集成缺陷修复（10 处，全部完成）

- Nginx 域名 → Sidebar 贯通 → 新建工作流 → 代码高亮 → 流式防闪烁 → RightPanel → BottomDrawer → RunButton → PromptInput → 自动保存

### ✅ 管理后台 Admin Panel（基础完成）

- 数据库迁移（6 张 Admin 表） → 后端认证 API → JWT 中间件 → 前端路由隔离 → Shell 布局 → Dashboard → 10 个管理模块

### ✅ 插件化节点架构（v0.2.001，2026-03-03 完成）

- **节点插件系统** (`nodes/`)
  - `BaseNode` 抽象基类 + `__init_subclass__` 自动注册
  - `LLMStreamMixin` + `JsonOutputMixin` 复用 Mixin
  - 9 个节点各自独立文件夹（`node.py` + `prompt.md`）
  - 按 input / analysis / generation / interaction / output 分类

- **新执行引擎** (`engine/`)
  - `executor.py`：从 NODE_REGISTRY 动态查找节点（消除 if/else）
  - `context.py`：基于 Edge 的精确上下文传递（替代全量拼接）
  - `sse.py`：SSE 事件格式化

- **前端渲染器注册表** (`nodes/index.ts`)
  - `getRenderer(nodeType)` 动态匹配 5 种渲染器
  - `AIStepNode.tsx` 改为动态委托

- **通用工具** (`utils/`)
  - `token_counter.py`：tiktoken 精确中文计数
  - `output_truncator.py`：按句子边界截断

- **节点清单 API**：`GET /api/nodes/manifest`
- **开发者文档**：`nodes/CONTRIBUTING.md`

### ✅ 规范文档（已创建 + 持续更新）

- `docs/architecture.md` — 项目地图（含 nodes/engine 新模块）
- `docs/naming.md` — 命名规范
- `docs/design.md` — UI 与设计规范
- `docs/api.md` — 接口契约
- `docs/progress.md` — 当前状态（本文件）
- `nodes/CONTRIBUTING.md` — 节点开发指南

## 已知问题和技术债

1. **prompt.md 内容待迁移**：当前 `prompt.md` 是简化版，需要从 `models/ai.py` 的 `SYSTEM_PROMPTS` 字典迁移完整原始 Prompt 内容
2. **tiktoken 依赖未安装**：`utils/token_counter.py` 需要 `pip install tiktoken`
3. **write_db 节点空壳**：`output/write_db/node.py` 暂为透传，真实 DB 写入逻辑待实现
4. **旧引擎文件保留**：`services/workflow_engine.py` 未删除，仅导入切换。待确认稳定后可安全删除
5. **前端 Supabase 导入不一致**：部分文件用 `createClient`，部分用 `createServerClient`，需统一
6. **缺少错误边界**：前端组件缺少 React Error Boundary，AI 调用失败可能白屏
7. **缺少 loading 状态**：部分页面缺少 Suspense fallback 和骨架屏
8. **测试覆盖不足**：属性测试已写但集成测试缺失

## 下一步计划

1. 迁移 `models/ai.py` 中的完整 Prompt 到各 `prompt.md`
2. 添加 `tiktoken` 到 `requirements.txt`
3. 实现 `write_db` 节点真实 DB 写入逻辑
4. 前端 `fetchNodeManifest()` 对接 `/api/nodes/manifest` 动态面板
5. 部署到阿里云 ECS 生产环境
6. 端到端测试验证全流程
