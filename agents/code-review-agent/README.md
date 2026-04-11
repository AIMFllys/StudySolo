# Code Review Agent

> 状态：🔨 最小可运行样板已落地
> 负责人：小李
> 端口：8001
> 来源：新建

---

## 用途

自动化代码审查 Agent。当前版本只提供 Phase 4B 所需的最小 OpenAI-compatible 骨架，用 deterministic stub 跑通协议、端点和契约测试。

## 当前能力

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`
- non-stream JSON 响应
- SSE stream 响应
- API Key 校验

## 运行

```bash
cd agents/code-review-agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m src.main
```

## 验证

```bash
pytest tests -q
```

## 说明

- 当前 `src/core/agent.py` 不调用外部模型
- 返回结果是可预测的 code review stub
- 后续如果接真实仓库分析或上游 LLM，只需要替换 `src/core/agent.py`

## 参考

- [Agent 开发指南](../README.md)
- [接口协议规范](../../docs/team/refactor/final-plan/agent-architecture.md)
