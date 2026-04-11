# 2026-04-11 Phase 4B：code-review-agent findings 纯文本输出模板稳定化总结

## 1. 背景

在 `Phase 4B` 的 repo-aware 前置输入能力落地之后，`code-review-agent` 已经能够从最后一条 `user` 消息里解析：

- `<review_target path="...">...</review_target>`
- `<repo_context path="...">...</repo_context>`

但当时的 assistant 文本输出仍然偏“可读优先”，还没有形成稳定、可依赖的固定模板：

1. `Summary` 字段顺序不够严格
2. `Context files supplied` 只有在大于 0 时才出现
3. `Findings` 的字段标签不够稳定
4. 无命中场景只有一句话，没有固定块结构
5. findings 排序主要按发现顺序，不利于后续消费和回归锁定

因此这一轮不扩协议、不做 JSON findings，而是先把纯文本输出模板稳定化。

## 2. 本轮目标

本轮目标是把 `code-review-agent` 的输出固定为**稳定的纯文本三段式**：

1. 保持 `Summary / Findings / Limitations`
2. 不改 `POST /v1/chat/completions` 契约
3. 不引入新的 response 字段
4. 通过测试锁死字段顺序、无命中形态和 findings 排序

## 3. 已完成的代码闭环

核心文件：
- `agents/code-review-agent/src/core/agent.py`

本轮已完成：

### 3.1 Summary 字段顺序固定

现在 `Summary` 固定输出：

1. `- Input type: ...`
2. `- Files reviewed: N`
3. `- Reviewed lines: N`
4. `- Context files supplied: N`
5. `- Findings found: N`

当结构化输入里提供了 `review_target path` 时，额外输出：

6. `- Review target path: ...`

说明：
- `Context files supplied` 现在即使为 `0` 也固定输出
- `Reviewed lines` 对 unified diff 的含义是“reviewed added lines”

### 3.2 Findings 模板固定

当存在 findings 时，每条 finding 统一输出：

1. `Title`
2. `Rule ID`
3. `Severity`
4. `File`
5. `Evidence`
6. `Fix`

当没有 findings 时，统一输出：

- `- None`
- `  Note: No deterministic findings...`

说明：
- `File:` 行现在始终存在
- 没有文件路径时固定输出 `<none>`

### 3.3 findings 排序稳定化

排序规则固定为：

1. `severity`：`high -> medium -> low`
2. `file_path`
3. `line_number`
4. `position`
5. `rule_id`

这样做的目的不是改变审查逻辑，而是降低同一份输入在不同演进阶段里的文本漂移。

## 4. 本轮测试收口

核心测试文件：

- `agents/code-review-agent/tests/test_review_logic.py`
- `agents/code-review-agent/tests/test_contract.py`

本轮锁定了以下场景：

1. legacy snippet 输出的 `Summary` 字段顺序固定
2. `Context files supplied: 0` 始终存在
3. 结构化 `review_target path` 下，snippet findings 稳定输出 `File: path:line`
4. headerless diff + `review_target path` 时，文件路径不再回落到 `<unknown>`
5. no-findings 场景固定输出 `- None + Note`
6. multi-file diff findings 排序稳定
7. contract test 锁定 `Rule ID / Severity / File` 等字段标签

验证结果：

- `pytest agents/code-review-agent/tests -q`
  - `31 passed`

## 5. 当前边界

本轮仍然没有进入以下范围：

1. 不改 HTTP response shape
2. 不新增 JSON findings
3. 不改 request/response schema
4. `repo_context` 不单独产出 findings
5. 不做跨文件控制流分析
6. 不接外部 LLM

因此当前正确口径是：

1. `code-review-agent` 的纯文本输出模板已经稳定
2. 这提高了后续消费、回归测试和文档说明的一致性
3. 但它仍然不是结构化 findings API，也还不是完整 repo-aware 审查

## 6. 提交

- `af52b7e feat(code-review-agent): stabilize findings text format`
