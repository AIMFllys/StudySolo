<!-- 编码：UTF-8 -->

# StudySolo 2026-04-11 阶段总结：Phase 4A 官方节点 version/changelog 治理基线

**完成日期**：2026-04-11  
**状态**：Phase 4A 的官方节点版本治理已形成第一版真实基线，但当前仅覆盖显式声明、manifest 契约和测试锁定，不包含升级策略与前端展示  
**覆盖范围**：19 个官方节点类的显式 `version/changelog` 声明、`/api/nodes/manifest` 契约补齐、前端类型同步，以及后端/前端定向测试

## 1. 执行摘要

这轮工作的核心，不是把节点版本体系一次性做成完整平台，而是先解决一个更基础的问题：`version` 字段虽然之前已经存在，但它只是挂在 `BaseNode` 默认值上，既没有每个官方节点的显式声明，也没有任何可演进的 changelog 入口。

本轮完成后，官方节点体系有了第一版可治理基线：

1. 19 个官方节点类全部显式声明 `version = "1.0.0"`
2. 19 个官方节点类全部显式声明 `changelog = {"1.0.0": "初始版本"}`
3. `/api/nodes/manifest` 稳定返回 `changelog`
4. 前端 `NodeManifestItem` 契约已同步 `changelog`
5. 后端测试已锁住“官方节点必须显式声明”的治理要求

与此同时，`community_node` 仍保持在这套官方治理基线之外，不被强行纳入同一版本语义。

## 2. 改动前的真实状态

在本轮开始前，仓库的真实状态是：

1. `backend/app/nodes/_base.py`
   - 已有 `version = "1.0.0"`
2. `/api/nodes/manifest`
   - 已返回 `version`
3. 各官方节点类
   - 没有显式声明自己的 `version`
   - 没有 `changelog`
4. 前端 `NodeManifestItem`
   - 没有 `changelog`

所以，之前的节点“有版本”更准确地说只是“基类有一个默认版本值”，而不是“每个官方节点都已经进入独立治理”。

## 3. 本轮已完成的代码闭环

### 3.1 `BaseNode` 契约补齐

文件：

- `backend/app/nodes/_base.py`

本轮新增：

1. `changelog: ClassVar[dict[str, str] | None] = None`
2. `get_manifest()` 返回 `changelog`

同时保留：

1. `version = "1.0.0"` 默认值

这样做的目的，是在不破坏兼容性的前提下，为未纳入本轮治理的特殊节点保留默认回退。

### 3.2 19 个官方节点类已显式声明版本元数据

本轮覆盖了所有非 `community/node.py` 的官方节点类，共 19 个：

1. analysis
   - `ai_analyzer`
   - `ai_planner`
   - `logic_switch`
   - `loop_map`
2. generation
   - `compare`
   - `content_extract`
   - `flashcard`
   - `merge_polish`
   - `mind_map`
   - `outline_gen`
   - `quiz_gen`
   - `summary`
3. input
   - `knowledge_base`
   - `trigger_input`
   - `web_search`
4. interaction
   - `chat_response`
5. output
   - `export_file`
   - `write_db`
6. structure
   - `loop_group`

每个类都统一显式声明：

1. `version = "1.0.0"`
2. `changelog = {"1.0.0": "初始版本"}`

这轮并没有做差异化版本号，也没有补历史迁移链；重点是先把“显式声明”这一步变成真实代码现状。

### 3.3 `community_node` 继续保持独立体系

文件：

- `backend/app/nodes/community/node.py`

本轮刻意**没有**给它补官方治理基线声明。

当前语义是：

1. `community_node` 不要求显式声明 `changelog`
2. manifest 中返回 `changelog: null`
3. 不修改社区节点自己的存储/API 版本语义

这是刻意边界，不是遗漏。

### 3.4 前端契约只做同步，不做消费

文件：

- `frontend/src/types/workflow.ts`

本轮新增：

1. `NodeManifestItem.changelog: Record<string, string> | null`

但仍然没有进入：

1. NodeStore 展示
2. 节点卡片展示
3. 执行面板展示
4. 版本比较或升级提示

也就是说，这轮只是把前端契约追平后端，不引入新的 UI 语义变化。

## 4. 测试与验证

### 4.1 后端测试

文件：

- `backend/tests/test_node_manifest_contract_property.py`
- `backend/tests/test_node_version_governance_property.py`

锁定内容：

1. manifest 中 `version` 必须是语义化版本字符串
2. 官方节点必须返回非空 `changelog`
3. 官方节点的 `changelog` 必须包含当前 `version`
4. `community_node` 的 `changelog` 必须为 `null`
5. 19 个官方节点类必须在 `__dict__` 中显式声明 `version` 和 `changelog`

实际结果：

- `pytest backend/tests/test_node_manifest_contract_property.py backend/tests/test_node_version_governance_property.py -q`
  - 结果：`3 passed`

### 4.2 前端测试

文件：

- `frontend/src/__tests__/node-manifest.service.property.test.ts`
- `frontend/src/__tests__/node-store-groups.property.test.ts`
- `frontend/src/__tests__/canvas-node-copy.property.test.ts`
- `frontend/src/__tests__/execution-node-copy.property.test.ts`

本轮主要同步了 manifest fixture 的 `changelog` 字段，确保类型和缓存/文案回退逻辑仍然兼容。

实际结果：

- `pnpm --dir frontend test -- src/__tests__/node-manifest.service.property.test.ts src/__tests__/node-store-groups.property.test.ts src/__tests__/canvas-node-copy.property.test.ts src/__tests__/execution-node-copy.property.test.ts`
  - 结果：`4 files passed / 26 tests passed`

## 5. 当前边界与下一步

完成这轮之后，Phase 4A 关于节点版本治理的准确口径是：

1. 官方节点已经形成第一版显式版本治理基线
2. manifest 契约和前端类型已经追平
3. 社区节点仍然是独立体系

但以下内容仍未开始：

1. 节点版本升级/迁移策略
2. changelog 的前端展示
3. 版本比较工具
4. 社区节点与官方节点的统一治理模型

因此，这轮不是“节点版本体系已彻底完成”，而是“已经具备继续向版本治理演进的真实起点”。

## 6. 本轮提交

- `7694e8f feat(nodes): add version governance baseline`
