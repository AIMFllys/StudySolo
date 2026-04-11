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
