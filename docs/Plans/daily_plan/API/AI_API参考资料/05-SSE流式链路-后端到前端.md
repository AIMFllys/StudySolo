# SSE 流式链路（后端到前端）

## 官方参考

- `sse-starlette` 官方仓库（FastAPI/Starlette SSE 实现）  
  https://github.com/sysid/sse-starlette
- MDN EventSource（前端接收 SSE 标准接口）  
  https://developer.mozilla.org/docs/Web/API/EventSource
- MDN EventSource 构造器  
  https://developer.mozilla.org/docs/Web/API/EventSource/EventSource
- FastAPI 参考（Streaming Response 相关入口）  
  https://fastapi.tiangolo.com/em/reference/

> 检索日期：2026-02-26

## 与 StudySolo 规划的对应

- 后端：逐节点执行 AI，token 级流式输出。
- 前端：`EventSource` 持续监听执行流，实时回填画布节点。
- 网关：Nginx 必须关闭缓冲（你现有规划已覆盖 `proxy_buffering off`）。

## 实施要点

1. SSE 响应 `Content-Type` 必须是 `text/event-stream`。
2. 保持心跳或阶段性事件，避免长时静默断链。
3. 前端监听 `open` / `message` / `error`，断线后支持重连。
4. 生产环境避免 GZip 对流式分片造成延迟。

## 最小前端示例

```ts
const es = new EventSource('/api/workflow/123/execute');

es.onmessage = (e) => {
  const payload = JSON.parse(e.data);
  console.log(payload);
};

es.onerror = () => {
  es.close();
};
```
