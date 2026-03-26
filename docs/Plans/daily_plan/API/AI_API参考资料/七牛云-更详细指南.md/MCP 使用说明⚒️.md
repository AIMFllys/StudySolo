MCP 使用说明⚒️
最近更新时间: 2025-09-16 11:52:53

前言
本说明文档旨在帮助用户快速了解并高效使用 MCP 接入服务。MCP（模型上下文协议）接入服务是为各类大模型推理服务提供统一、安全、标准化接入与编排的中间层。关于 MCP 协议本身，请参见《什么是 MCP》文档。

产品简介
MCP 接入服务是七牛云 AI 推出的统一模型能力接入与编排平台。它为企业和开发者提供标准协议转换、安全密钥托管、服务聚合、统一管理等能力，帮助用户高效、安全地对接和管理各类 MCP 服务。

适用场景
一步调用LLM推理大模型和多个流行MCP工具，支持开发更复杂的Agent应用
需要灵活编排、聚合多种工具和模型，统一接入和管理，增强服务扩展性
需要集中安全托管多种MCP的敏感密钥，避免在多个用户和终端暴露
本地终端系统多样，难以配置和运行多种代码编写和工具依赖的MCP服务
接入方式总览
⚒️ MCP 支持多种标准协议接入，满足不同业务和系统集成需求：

1、Agent 协议接入
七牛云 AI Agent 协议目前兼容 OpenAI，可以无缝对接到 OpenAI 的生态链中。

地址格式：
https://api.qnaigc.com/v1/agent/instance/${mcp-id}
适用场景：无需本地部署，直接通过兼容 OPENAI 的 Agent 协议接入
1.1、Agent 的多服务聚合
支持在 BaseUrl 中拼接多个 MCP-ID，实现一次聚合多个服务：
https://api.qnaigc.com/v1/agent/group/${mcp-id-1},${mcp-id-2},${mcp-id-3}
2、标准 MCP 协议接入
SSE 协议：
https://api.qnaigc.com/v1/mcp/sse/${mcp-id}
HTTP-Streamable 协议：
https://api.qnaigc.com/v1/mcp/http-streamable/${mcp-id}
适用场景：与本地 MCP 服务更灵活的搭配使用
核心优势
协议标准化：支持 OPENAI、SSE、HTTP-Streamable 等主流协议，屏蔽底层差异
安全托管：API Key、密钥等敏感信息云端托管，终端无需暴露
灵活聚合：支持多服务聚合调用，能力自由组合
统一管理：可视化控制台统一管理所有接入服务
主要功能
MCP 服务接入与协议转换
安全密钥托管与权限管理
支持标准协议（OPENAI、SSE、HTTP-Streamable）对接
多服务聚合与编排
可视化服务管理
详细配置与使用示例
控制台配置 MCP 接入服务
登录七牛云 AI 控制台，进入 MCP 服务管理页面
添加或管理已有的 MCP 服务，获取专属的 MCP-ID
获取接入地址
控制台会为每个 MCP 接入服务生成专属的接入地址，支持多种协议
Agent 协议详细示例
以 curl 为例：

export OPENAI_BASE_URL="https://api.qnaigc.com/v1/agent/instance/${mcp-id}"
export OPENAI_API_KEY="<七牛云 AI API KEY>"
curl "$OPENAI_BASE_URL/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "messages": [{"role": "user", "content": "请调用你支持的三个 MCP 能力，并列举全部能力"}],
        "model": "deepseek-v3-tool"
    }'
注意事项
Agent 协议下无需本地安装任何 MCP 组件，直接调用即可
API Key 请妥善保管，避免泄露
MCP 接入服务本身不直接提供大模型能力，而是作为能力编排与接入中间层
MCP 标准协议接入服务
我们支持标准的 MCP 协议类型，选择对应的 MCP 协议地址配置到 MCP 客户端上即可，这里我们以 Node 的官方 SDK 中使用 HTTPStreamable 为例子：

import { Client } from "@modelcontextprotocol/sdk/client/index"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp"
const serverUrl = '你的 MCP 服务 Url '
const apiKey = '你的七牛云 AI 推理 API Key'
const client = new Client({
  name: 'qiniu-sse-test-client',
  version: '1.0.0'
})
// 这里设置你的七牛云 api key 和 StreamableHTTP 连接地址
const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
  requestInit: { headers: { 'Authorization': `Bearer ${apiKey}` } }
})
async function main() {
  // 开始连接
  await client.connect(transport)
  // 列举 MCP 工具
  const tools = await client.listTools()
  // 查看支持的工具
  console.log(tools)
}
main()
  .then(() => { console.log('Client connected successfully') })
  .catch((error) => { console.error('Error connecting client:', error) })
常见问题
如何获取 MCP-ID？
登录控制台，在 MCP 接入服务详情页可查看和复制
Agent 协议和标准 MCP 协议有何区别？
Agent 协议适合无需本地部署、直接云端调用场景；标准协议适合与本地服务深度集成混排
API Key 泄露怎么办？
立即在控制台重置 API Key，并排查相关调用记录
MCP 接入服务能否直接提供大模型能力？
不能，MCP 接入服务仅作为能力编排与接入中间层，实际模型能力由后端服务提供
联系我们
如有更多问题或建议，请联系七牛云 AI 技术支持。