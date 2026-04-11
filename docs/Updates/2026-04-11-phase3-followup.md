<!-- 编码：UTF-8 -->

# 2026-04-11 补充更新：Phase 3 前端重构后续闭环

## 1. D2 / Task 3.2b-3：workflow components store import 切换完成

继续沿 `Task 3.2` 推进，这一轮只处理 `frontend/src/features/workflow/components/**` 下仍在使用旧 shim 的 store import，保持零行为变更。

### 完成内容
1. **workflow components 全量切到新分组路径**
   - 目标范围：20 个文件、21 处 import
   - 主要替换：
     - `@/stores/use-workflow-store` -> `@/stores/workflow/use-workflow-store`
     - `@/stores/use-settings-store` -> `@/stores/ui/use-settings-store`
2. **不碰其他边界**
   - 不删 shim
   - 不改 `MemoryView.tsx`
   - 不改 EventBus
   - 不改 manifest-first

### 验证结果
- `pnpm --dir frontend test -- src/__tests__/store-path-compat.property.test.ts src/__tests__/workflow-store.property.test.ts src/__tests__/workflow-sync.property.test.ts src/__tests__/integration-fixes.workflow-runbutton.property.test.ts src/__tests__/loop-group-drop.property.test.ts`
- 结果：通过

### 提交
- `b28812b refactor(frontend): migrate workflow component store imports`

## 2. D2 / Task 3.2b-4 + 3.3.1：workflow 主域尾差与 workflow service/server 收口完成

这一步完成了两个紧邻的小闭环：

1. **D2 / 3.2b-4**
   - `frontend/src/features/workflow/utils/edge-actions.ts`
   - 旧 shim import 切到 `@/stores/workflow/use-workflow-store`

2. **Task 3.3.1**
   - `frontend/src/services/workflow.service.ts`
     - 读取类请求统一走共享 helper
   - `frontend/src/services/workflow.server.service.ts`
     - 收薄为 server token / refresh / retry 包装层
   - 新增 / 更新测试：
     - `workflow-service.property.test.ts`
     - `workflow-server-service.property.test.ts`

### 验证结果
- `pnpm --dir frontend test -- src/__tests__/workflow-store.property.test.ts src/__tests__/edge-connection-system.smoke.test.ts src/__tests__/loop-group-drop.property.test.ts src/__tests__/workflow-service.property.test.ts src/__tests__/workflow-server-service.property.test.ts`
- 结果：通过

### 提交
- `2bcd9fd refactor(frontend): finish workflow store and service migration`

## 3. Wave 0：构建基线恢复

在继续前端重构前，先单独修复了当前 `pnpm build` 阻塞。

### 完成内容
1. **恢复 `AdminModelsPageView` 导出**
   - 修复 `frontend/src/features/admin/models/AdminModelsPageView.tsx` 空文件导致的 build blocker
2. **补齐 workspace quota fallback**
   - `frontend/src/app/(dashboard)/workspace/page.tsx`
   - 补齐 daily quota 相关字段，满足当前类型约束

### 结果
- `pnpm --dir frontend build`
- 已越过原先的 admin 导出错误

### 提交
- `29b3954 fix(frontend): restore admin models page export`

## 4. Task 3.3.2：workflow-adjacent service fetchers 收口完成

这一轮继续做 service 统一，但只按服务族推进，不扩成全目录大扫除。

### 完成内容
1. **`api-client.ts` FormData 安全化**
   - 当 `body` 是 `FormData` 时，不再默认注入 `Content-Type: application/json`
2. **`collaboration.service.ts`**
   - 浏览器侧裸 `fetch(..., { credentials: 'include' })` 统一改为 `authedFetch`
3. **`community-nodes.service.ts`**
   - `publishCommunityNode` 迁到 FormData-safe 的统一 helper
4. **`memory.server.service.ts`**
   - 收口到与 `workflow.server.service.ts` 同风格的 server-read helper
5. **`workspace/page.tsx`**
   - quota fallback 类型与真实接口对齐

### 测试
- `pnpm --dir frontend test -- src/__tests__/api-client.property.test.ts src/__tests__/collaboration-service.property.test.ts src/__tests__/community-nodes.service.property.test.ts src/__tests__/memory-server-service.property.test.ts src/__tests__/workflow-service.property.test.ts src/__tests__/workflow-server-service.property.test.ts`
- 结果：`19 passed`

### 构建
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `70c6582 refactor(frontend): unify workflow-adjacent service fetchers`

## 5. Task 3.4 第一批：workflow-local TypedEventBus 已落地

这一轮只迁 workflow 域内部事件，不碰跨域事件。

### 完成内容
1. **新增 typed event bus**
   - `frontend/src/lib/events/event-bus.ts`
2. **迁移 workflow-local 事件**
   - `canvas:tool-change`
   - `canvas:show-modal`
   - `canvas:focus-node`
   - `canvas:add-annotation`
   - `canvas:delete-annotation`
   - `canvas:placement-mode`
   - `workflow:open-node-config`
   - `workflow:close-node-config`
   - `workflow:toggle-all-slips`
3. **兼容 `MemoryView`**
   - 没有改 `frontend/src/app/m/[id]/MemoryView.tsx`
   - `NodeResultSlip.tsx` 保留了对旧 `window` 事件的兼容监听
4. **新增 lint 提醒**
   - `frontend/eslint.config.mjs`
   - workflow 域新增 warning 级规则，限制新代码继续直接发 `CustomEvent`

### 新增测试
- `frontend/src/__tests__/workflow-event-bus.property.test.ts`

### 验证
- `pnpm --dir frontend test -- src/__tests__/workflow-event-bus.property.test.ts src/__tests__/workflow-execution-closure.property.test.ts src/__tests__/integration-fixes.workflow-runbutton.property.test.ts src/__tests__/workflow-store.property.test.ts`
- 结果：通过

### 提交
- `4de7087 refactor(frontend): add workflow typed event bus`

## 6. Task 3.5 预适配：renderer registry 已拆成两层

这一轮只做前端静态 registry 的结构整理，不提前启用 manifest-first。

### 完成内容
1. **`frontend/src/features/workflow/components/nodes/index.ts`**
   - 拆成：
     - `RENDERER_COMPONENTS`
     - `NODE_TYPE_RENDERERS`
   - 保留 `getRenderer(nodeType)` 现有行为
   - 新增：
     - `getRendererByName(...)`
     - `resolveRenderer(...)`
2. **新增测试**
   - `frontend/src/__tests__/node-renderer-registry.property.test.ts`

### 当前未启用的原因
- 后端 `BaseNode.get_manifest()` 还没有返回：
  - `display_name`
  - `renderer`
  - `version`
- 前端 `NodeManifestItem` 也还没补这些字段

### 验证
- `pnpm --dir frontend test -- src/__tests__/node-renderer-registry.property.test.ts`
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `2adc657 refactor(frontend): prepare workflow renderer registry`

## 7. 截至当前的真实状态

截至今天这一批本地提交完成后，可以明确判断：

1. **D2 可视为已完成 workflow 主域收口**
   - stores 新结构已落地
   - workflow 主域的 components / hooks / utils 已完成路径切换
   - `MemoryView.tsx` 仍是显式兼容例外

2. **Task 3.3 已完成当前最值得做的 service consolidation**
   - workflow service / server service 已收薄
   - collaboration / community-node / memory 相关 service 已收口到 `api-client`

3. **Task 3.4 已完成 workflow-local 第一批事件迁移**
   - 但 `node-store:add-node` 与 `studysolo:tier-refresh` 仍未进入第二批

4. **Task 3.5 只完成了前端静态准备**
   - manifest 契约字段尚未真正从后端返回

5. **构建已恢复绿色**
   - `pnpm --dir frontend build` 通过
   - 剩余是 `middleware` -> `proxy` 的 Next.js 弃用 warning

## 8. 下一步建议

按当前真实进度，最合理的后续顺序是：

1. 先补 backend manifest 真契约
   - `display_name`
   - `renderer`
   - `version`
2. 再决定 EventBus 第二批跨域事件是否单独成环
3. 最后再考虑 `MemoryView.tsx` 是否要从兼容例外里收口

## 9. 2026-04-11 晚间补充：backend manifest 真契约已落地

这一轮不再只是“为 manifest-first 做前端静态准备”，而是把 backend manifest 契约真正补齐。

### 完成内容
1. `backend/app/nodes/_base.py`
   - `BaseNode` 新增：
     - `display_name`
     - `renderer`
     - `version`
   - `BaseNode.get_manifest()` 已统一返回这三个字段
2. 现有节点类已补齐显式 `display_name`
3. 现有专用 renderer 节点已补齐显式 `renderer`
   - `outline_gen -> OutlineRenderer`
   - `flashcard -> FlashcardRenderer`
   - `compare -> CompareRenderer`
   - `mind_map -> MindMapRenderer`
   - `quiz_gen -> QuizRenderer`
   - `community_node -> CommunityNodeRenderer`
4. `version` 当前统一固定为 `1.0.0`
5. 新增 backend route test
   - `backend/tests/test_node_manifest_contract_property.py`

### 验证
- `pytest backend/tests/test_node_manifest_contract_property.py`
- 结果：通过

### 提交
- `eaeabab feat(backend): extend node manifest metadata contract`

## 10. 2026-04-11 晚间补充：frontend manifest renderer 接线已完成

这一闭环把前端 manifest 数据面对齐到了 backend 新契约，并把 renderer 选择真正接到了 manifest 数据。

### 完成内容
1. `frontend/src/types/workflow.ts`
   - `NodeManifestItem` 新增：
     - `display_name`
     - `renderer`
     - `version`
2. `frontend/src/services/node-manifest.service.ts`
   - 保持 cache / inflight 结构
   - 新增 `peekNodeManifestCache()`
3. `frontend/src/features/workflow/hooks/use-node-manifest.ts`
   - 新增：
     - `findNodeManifestItem(...)`
     - `useNodeManifestItem(...)`
4. 输出渲染入口已切换为：
   - manifest 命中 `renderer` 时优先使用 manifest renderer
   - manifest 缺失或值非法时继续回退静态 registry
5. 新增测试
   - `frontend/src/__tests__/node-manifest.service.property.test.ts`

### 范围说明
- 只接 renderer，不接 label/icon/description 的 UI 去硬编码
- 不改 `workflow-meta.ts`
- 不改节点商店
- 不改节点配置抽屉标题文案来源

### 验证
- `pnpm.cmd test -- src/__tests__/node-manifest.service.property.test.ts src/__tests__/node-renderer-registry.property.test.ts`
- 实际执行中 Vitest 全量一并运行，结果：
  - `39` 个测试文件通过
  - `155` 个测试通过
- `pnpm.cmd build`
  - 结果：通过

### 提交
- `0d87d1a refactor(frontend): align node manifest types and renderer resolution`

## 11. 2026-04-11 晚间补充：跨域 EventBus 第二批已完成

在 workflow-local 第一批之后，这一轮继续把两个跨域业务事件迁到 typed event bus。

### 完成内容
1. `frontend/src/lib/events/event-bus.ts`
   - 新增：
     - `node-store:add-node`
     - `studysolo:tier-refresh`
2. `node-store:add-node`
   - 发射端：
     - `frontend/src/components/layout/sidebar/NodeStoreItem.tsx`
   - 监听端：
     - `frontend/src/features/workflow/hooks/use-canvas-event-listeners.ts`
3. `studysolo:tier-refresh`
   - 发射端：
     - `frontend/src/app/upgrade/_components/RedeemCode.tsx`
   - 监听端：
     - `frontend/src/components/layout/sidebar/UserPanel.tsx`
     - `frontend/src/components/layout/sidebar/WalletPanel.tsx`
4. `frontend/src/__tests__/workflow-event-bus.property.test.ts`
   - 新增了第二批事件覆盖

### 兼容说明
- 没有改 `frontend/src/app/m/[id]/MemoryView.tsx`
- `NodeResultSlip.tsx` 仍保留旧 `workflow:toggle-all-slips` 的 legacy 兼容监听
- 所以 `/m/[id]` 仍不受这一轮迁移影响

### 验证
- `pnpm.cmd test -- src/__tests__/workflow-event-bus.property.test.ts`
- 实际执行中 Vitest 全量一并运行，结果仍为：
  - `39` 个测试文件通过
  - `155` 个测试通过
- `pnpm.cmd build`
  - 结果：通过

### 提交
- `ca47b64 refactor(frontend): migrate cross-domain events to typed bus`

## 12. 当前最新状态（更新版）

截至这轮晚间补充后，今天的本地真实状态应更新为：

1. **Task 3.5 不再只是“前端预适配”**
   - backend manifest 真契约已返回：
     - `display_name`
     - `renderer`
     - `version`
   - frontend 输出渲染已真正接到 manifest `renderer`

2. **Task 3.4 第二批跨域事件也已完成**
   - `node-store:add-node`
   - `studysolo:tier-refresh`

3. **Phase 3 当前剩余边界明显收缩**
   - `MemoryView.tsx` 仍是显式保留例外
   - compat shim 继续保留
   - `workflow-meta.ts` 还没有进入真正的 manifest-first 去硬编码阶段

4. **本地提交链继续增加**
   - `eaeabab feat(backend): extend node manifest metadata contract`
   - `0d87d1a refactor(frontend): align node manifest types and renderer resolution`
   - `ca47b64 refactor(frontend): migrate cross-domain events to typed bus`

因此，今天这条主线已经从“stores / services / workflow-local EventBus / renderer 预适配”进一步推进到：

- backend manifest 契约真实落地
- frontend renderer manifest-first 最小运行时闭环完成
- 跨域 EventBus 第二批完成
- 测试与构建继续维持绿色

## 13. 2026-04-11 夜间补充：节点配置抽屉已切到 manifest-first 文案

在 backend manifest 契约、renderer 接线和跨域 EventBus 第二批完成后，这一轮继续只处理一个很小的前端 UI 闭环：节点配置抽屉文案来源。

### 完成内容
1. 新增纯函数 helper
   - `frontend/src/features/workflow/components/node-config/resolve-node-config-copy.ts`
2. 文案解析规则固定为：
   - 标题：`node.data.label -> manifest.display_name -> workflow-meta.label`
   - 描述：`manifest.description -> workflow-meta.description`
3. `frontend/src/features/workflow/components/node-config/NodeConfigDrawer.tsx`
   - 抽屉 header 已切到 manifest-first 文案
4. `frontend/src/features/workflow/components/node-config/NodeConfigFormContent.tsx`
   - 顶部能力摘要卡片已复用同一套文案解析逻辑
5. 新增测试
   - `frontend/src/__tests__/node-config-copy.property.test.ts`

### 范围说明
- 不改 icon / theme
- 不改节点商店
- 不改右侧面板
- 不改 `MemoryView.tsx`

### 验证
- `pnpm --dir frontend test -- src/__tests__/node-config-copy.property.test.ts src/__tests__/node-manifest.service.property.test.ts`
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `36e6d20 refactor(frontend): prefer manifest copy in node config drawer`

## 14. 2026-04-11 夜间补充：节点商店已切到 manifest-first 文案与搜索

在节点配置抽屉闭环之后，这一轮继续推进节点商店默认视图，但仍然只处理 display_name / description，不扩到 icon/theme 或其它 UI。

### 完成内容
1. 新增节点商店纯函数 helper
   - `frontend/src/components/layout/sidebar/resolve-node-store-copy.ts`
   - 提供：
     - `resolveNodeStoreCopy(...)`
     - `matchesNodeStoreQuery(...)`
2. `frontend/src/components/layout/sidebar/NodeStoreDefaultView.tsx`
   - 顶层统一持有 `useNodeManifest()`
   - 搜索过滤、分类计数、列表渲染已改为复用 manifest-first helper
3. `frontend/src/components/layout/sidebar/NodeStoreItem.tsx`
   - 列表项标题、副标题和 tooltip 顶部短文案已切到 manifest-first
4. 新增测试
   - `frontend/src/__tests__/node-store-copy.property.test.ts`

### 保留边界
- `workflow-meta.ts` 继续保留 icon / theme / 扩展说明职责
- 不改右侧面板
- 不改画布节点标题
- 不改 `MemoryView.tsx`

### 验证
- `pnpm --dir frontend test -- src/__tests__/node-store-copy.property.test.ts src/__tests__/node-manifest.service.property.test.ts src/__tests__/workflow-event-bus.property.test.ts`
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `560969c refactor(frontend): prefer manifest copy in node store`

## 15. 当前最新状态（再次更新）

截至这两次 UI 文案闭环完成后，Phase 3 当前最准确的判断应进一步更新为：

1. backend manifest 契约已真实落地
2. renderer-first 的最小运行时接线已完成
3. 节点配置抽屉已切到 manifest-first 文案
4. 节点商店默认视图已切到 manifest-first 文案与搜索
5. 跨域 EventBus 第二批已完成
6. `MemoryView.tsx`、compat shim 与 `workflow-meta.ts` 的结构性职责仍然保留

换句话说，当前剩余的前端 Phase 3 边界已经进一步收缩到：

- 右侧面板等剩余 UI 文案是否继续渐进接 manifest
- 画布节点本体是否要进入更敏感的实例标题/描述来源收口
- `MemoryView.tsx` 是否未来单独成环处理

## 16. 2026-04-11 深夜补充：执行面板组已切到 manifest-first 文案

在节点配置抽屉和节点商店之后，这一轮继续只处理一个很小的执行态 UI 闭环：右侧面板焦点文案与执行列表输入标签的名称回退。

### 完成内容
1. 新增执行面板纯函数 helper
   - `frontend/src/features/workflow/utils/execution-node-copy.ts`
   - 提供：
     - `resolveExecutionNodeCopy(...)`
     - `buildExecutionNodeNameMap(...)`
2. `frontend/src/components/layout/sidebar/RightPanelContent.tsx`
   - 焦点标题与描述已切到 manifest-first 回退
   - `trace.nodeName` 继续保留最高优先级
3. `frontend/src/features/workflow/components/execution/ExecutionTraceDrawer.tsx`
   - 执行列表所依赖的 `nodeNameMap` 已改为复用同一套名称回退
4. 新增测试
   - `frontend/src/__tests__/execution-node-copy.property.test.ts`

### 范围说明
- 不改 `TraceStepItem` 主标题语义
- 不改 `NodeResultSlip.tsx`
- 不改 `AIStepNode.tsx`
- 不改 `MemoryView.tsx`

### 验证
- `pnpm --dir frontend test -- src/__tests__/execution-node-copy.property.test.ts src/__tests__/workflow-right-panel.property.test.ts src/__tests__/node-manifest.service.property.test.ts`
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `cf90a66 refactor(frontend): prefer manifest copy in execution panels`

## 17. 2026-04-11 深夜补充：画布节点卡片描述已切到 manifest-first

在执行面板组之后，这一轮继续推进画布节点本体，但仍然只处理描述文案来源，不改变实例标题语义。

### 完成内容
1. 新增画布节点描述纯函数 helper
   - `frontend/src/features/workflow/components/nodes/resolve-canvas-node-description.ts`
2. `frontend/src/features/workflow/components/nodes/AIStepNode.tsx`
   - 普通节点描述已切到：
     - `manifest.description -> workflow-meta.description`
   - 社区节点描述已切到：
     - `input_hint -> manifest.description -> '社区共享的封装 AI 节点'`
   - 节点标题继续直接使用实例 `label`
3. 新增测试
   - `frontend/src/__tests__/canvas-node-copy.property.test.ts`

### 范围说明
- 不改 `canvas-node-factory.ts`
- 不改 `NodeInputBadges.tsx`
- 不改 `NodeResultSlip.tsx`
- 不改 `MemoryView.tsx`

### 验证
- `pnpm --dir frontend test -- src/__tests__/canvas-node-copy.property.test.ts src/__tests__/node-manifest.service.property.test.ts`
- `pnpm --dir frontend build`
- 结果：通过

### 提交
- `135ee6b refactor(frontend): prefer manifest descriptions in canvas nodes`

## 18. 当前最新状态（再次补充）

截至这两次深夜补充后，Phase 3 关于 manifest-first UI 文案的推进已经扩展为五个连续小闭环：

1. 输出渲染入口已接入 manifest `renderer`
2. 节点配置抽屉已切到 manifest-first 文案
3. 节点商店默认视图已切到 manifest-first 文案与搜索
4. 执行面板组已切到 manifest-first 文案与名称回退
5. 画布节点卡片描述已切到 manifest-first

当前仍明确保留、不应混做的边界包括：

- `frontend/src/app/m/[id]/MemoryView.tsx`
- compat shim
- `workflow-meta.ts` 的 icon / theme / inputs / outputs / 结构性元数据职责
- `canvas-node-factory.ts` 的实例默认标题语义
- `NodeResultSlip.tsx` 的上游输入标签名称回退
