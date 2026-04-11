# StudySolo Agent Template

最小可运行的子后端 Agent 样板，目标是先跑通 StudySolo Phase 4B 的三端点协议与契约测试，再由具体 Agent 在 `src/core/agent.py` 中替换成真实逻辑。

## 目录

- `src/main.py`: FastAPI 入口，支持 `python -m src.main`
- `src/router.py`: 统一挂载三端点
- `src/endpoints/`: `health` / `models` / `completions`
- `src/core/agent.py`: 本地 deterministic stub
- `src/schemas/`: OpenAI-compatible request/response models
- `src/middleware/auth.py`: API Key 校验
- `tests/test_contract.py`: 最小契约测试

## 运行

```bash
cd agents/_template
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

## 当前范围

- 只实现 `GET /health`
- 只实现 `GET /v1/models`
- 只实现 `POST /v1/chat/completions`
- 同时支持 non-stream 与 SSE stream
- 不接真实上游 Provider
