# ☁️ 阿里云百炼 (DashScope) - OpenAI 兼容接入指南

> **文档更新**: 2026-03
> **核心目标**: 提供阿里云大模型（如 Qwen 系列）通过 OpenAI 协议的标准接入方案，以便在应用中无缝切换和集成。

---

## 🔗 官方参考资料

- [Model Studio 总览](https://help.aliyun.com/zh/model-studio/what-is-model-studio)
- [OpenAI 兼容 Chat API 参考指南](https://help.aliyun.com/zh/model-studio/developer-reference/compatibility-of-openai-with-dashscope)
- [OpenAI 兼容 Embedding 接口](https://help.aliyun.com/zh/model-studio/developer-reference/embedding-interfaces-compatible-with-openai)
- [OpenAI 兼容 Responses API 接口](https://help.aliyun.com/zh/model-studio/developer-reference/compatibility-with-openai-responses-api)

---

## 🎯 `StudySolo` 项目配置映射

在本项目中，百炼平台的接入配置（中国内地部署模式）约定如下：

> [!IMPORTANT]
> - **BASE_URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
> - **API_KEY**: 依赖于环境变量配置
> - **默认模型**: `qwen3-turbo` *(注：建议根据最新的《可选模型列表》，后续将高频调用的默认模型升级至 `qwen3.5-flash` 或 `qwen3.5-plus` 以获得更好性价比)*

---

## ⚠️ 接入排坑与关键点

1. **区域隔离机制**：API Key 与部署区域（如：中国内地部署 / 新加坡全球部署）强绑定，不可跨区域混用。当前默认使用北京区接入点。
2. **极简迁移**：使用标准 OpenAI SDK 时，只需替换参数：`api_key`、`base_url`、`model`。其余调用语法与标准的 OpenAI 完全一致。
3. **能力预留 (RAG / 知识库)**：百炼兼容 `Embedding` API，为后续开发 RAG（检索增强生成）与长记忆功能预留了原生兼容能力。
4. **Agent 特性支持**：如后续涉及复杂 Agent 工具链调用功能开发，可评估百炼专有的 Responses 兼容接口。

---

## 💻 最小化接入示例

### Python (基于 OpenAI SDK)

```python
import os
from openai import OpenAI

# 1. 初始化客户端
client = OpenAI(
    api_key=os.environ.get("DASHSCOPE_API_KEY", "your-dashscope-key"),  # 填入阿里云百炼获取的 API Key
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",      # 百炼 OpenAI 兼容端点
)

# 2. 发起对话请求
response = client.chat.completions.create(
    model="qwen3.5-plus", # 替换为你想要调用的模型名称
    messages=[
        {"role": "system", "content": "你是一个严谨的 AI 助手。"},
        {"role": "user", "content": "请给我一个全栈开发学习计划"}
    ],
    temperature=0.7,
)

# 3. 输出结果
print(response.choices[0].message.content)
```

### TypeScript / Node.js (基于 OpenAI SDK)

鉴于目前我们在做 Web/前端 项目，以下是对应的 TS/JS 版本接入示例：

```typescript
import OpenAI from "openai";

// 1. 初始化客户端
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "your-dashscope-key",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

async function main() {
  // 2. 发起对话请求
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "你是一个优秀的助手。" },
      { role: "user", content: "请用 Node.js 写一个请求百炼 API 的示例。" }
    ],
    model: "qwen3.5-plus", 
  });

  // 3. 输出结果
  console.log(completion.choices[0].message.content);
}

main();
```
