# 硅基流动 (SiliconFlow) 兼容接入指南

> 📅 更新日期：2026-02-26  
> 🔗 对应路由链：**全域备用灾备代理层**

## 一、 最新官方配置 (2026)

- **Base URL**: `https://api.siliconflow.cn/v1`
- **官方文档**: [https://docs.siliconflow.cn/](https://docs.siliconflow.cn/)

## 二、 2026 官方可选核心模型

硅基流动作为国内顶尖的开源模型加速池，以其极致的性价比和强悍的并发能力著称，集成了几乎全网所有顶级的开源模型。

| 模型标识 (model id) | 在本项目的应用场景 |
| :--- | :--- |
| `deepseek-ai/DeepSeek-V3` | DeepSeek 官方宕机时的自动灾备。 |
| `deepseek-ai/DeepSeek-R1` | DeepSeek 官方推理大模型排队时的跨池灾备。 |
| `Qwen/Qwen2.5-72B-Instruct` | 阿里云百炼不可用时的降级备用。 |
| `meta-llama/Llama-3.x-405B-Instruct` | 极其庞大且强大的外网顶级开源模型体验兜底。 |

## 三、 与 StudySolo 规划的映射

根据“八平台双层”架构设计，硅基流动处于**第二层（代理聚合层）的补充位置**。
项目默认所有节点必定调用原生大厂的 API 以享受上下文缓存和极低成本。
而当官方 API 出现“Rate Limit”或者崩溃时，`ai_router.py` 的 fallback 逻辑会在 5 秒内切换至 SiliconFlow 相应的同款开源模型接力输出。

**配置环境变量**：
```env
SILICONFLOW_API_KEY=sk-xxxxxxx
```

## 四、 项目中如何调用的代码示例（灾备回滚逻辑）

```python
from openai import AsyncOpenAI
import os
import asyncio

async def resilient_chat_completion(task_messages: list):
    """
    项目内针对 DeepSeek 的高可用灾备路由策略
    """
    try:
        # 1. 优先尝试高缓存命中的原生 DeepSeek
        client_native = AsyncOpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com/v1"
        )
        # 设置强制造型超时：大厂高峰易排队，8秒不能返回首字节视为拥堵
        return await asyncio.wait_for(
            client_native.chat.completions.create(
                model="deepseek-reasoner",
                messages=task_messages,
                stream=True
            ),
            timeout=8.0
        )
    except (asyncio.TimeoutError, Exception) as e:
        print(f"原生 DeepSeek 调用失败或超时，自动切换灾备硅基流动：{e}")
        
        # 2. 灾备切换：调高流基流动的同类型模型
        client_fallback = AsyncOpenAI(
            api_key=os.getenv("SILICONFLOW_API_KEY"),
            base_url="https://api.siliconflow.cn/v1"
        )
        return await client_fallback.chat.completions.create(
            # 使用带提供商前缀的 Model ID
            model="deepseek-ai/DeepSeek-R1",
            messages=task_messages,
            stream=True
        )
```
