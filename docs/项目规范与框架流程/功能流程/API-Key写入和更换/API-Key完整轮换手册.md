# API Key 完整轮换手册

---

## ⚠️ 安全事故记录

### 事故：SMTP 密码泄露（2026-03-28）

**触发来源**：GitHub 合作安全伙伴 GitGuardian 自动扫描告警（Critical 级别）

**泄露内容**：`SMTP_PASS`（阿里云 DirectMail 真实密码）

**事故原因**：在撰写 `docs/Plans/daily_plan/user_auth/05-email-verification-implementation.md` 时，将真实 SMTP 密码直接写入了 `.env` 示例代码块中，并随文档 Push 至公开 GitHub 仓库（历史 Commit `2c51382`）。虽然后续 Commit 中将其替换为占位符，但 Git 历史不可删除，GitGuardian 扫描全量历史节点，仍然检测到了原始明文。

**风险**：攻击者可使用该密码直连阿里云 DirectMail，以 1037Solo 官方域名身份发送欺诈邮件，消耗配额、损害域名信誉、导致垃圾邮件拉黑。

**处置状态**：
- [ ] 立刻在阿里云控制台重置 `accounts@email.1037solo.com` 的 SMTP 密码 → **最高优先级，当前时刻立执行**
- [ ] 更新生产服务器 `.env` 中的 `SMTP_PASS` 为新密码，并重启后端
- [ ] 更新本地开发 `backend/.env` 中的 `SMTP_PASS`

> ✅ **只要完成第一步（云端重置密码），旧密码即成废字符，攻击窗口立刻关闭。**

**经验教训**：
- **禁止**在任何 `.md` 文档、注释、`.env.example` 中写入真实密钥，哪怕"临时"、"方便测试"也不行。
- 示例文档中统一使用 `<your-smtp-password>` 或 `your_password_here` 格式的占位符。
- 建议在本地配置 [git-secrets](https://github.com/awslabs/git-secrets) 或 [gitleaks](https://github.com/gitleaks/gitleaks) 作为 pre-commit Hook，在 Push 前自动拦截敏感字符串。

---



---

## 目录索引

| # | 密钥名称 | 服务商 | 影响范围 | 轮换优先级 |
|---|---------|-------|---------|-----------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase | 后端全量 DB 访问 | 🔴 最高 |
| 2 | `SUPABASE_ANON_KEY` | Supabase | 前端认证 | 🔴 最高 |
| 3 | `SUPABASE_ACCESS_TOKEN` | Supabase | MCP 工具 | 🔴 最高 |
| 4 | `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub | MCP 工具 | 🔴 最高 |
| 5 | `SMTP_PASS` | 阿里云 DirectMail | 邮件发送 | 🟠 高 |
| 6 | `JWT_SECRET` | 自定义 | 用户会话签名 | 🟠 高 |
| 7 | `CAPTCHA_SECRET` | 自定义 | Canvas 验证码 | 🟡 中 |
| 8 | `DASHSCOPE_API_KEY` | 阿里云百炼 | AI 工作流 | 🟡 中 |
| 9 | `VOLCENGINE_API_KEY` | 火山引擎 | AI 工作流 | 🟡 中 |
| 10 | `DEEPSEEK_API_KEY` | DeepSeek | AI 工作流 | 🟡 中 |
| 11 | `MOONSHOT_API_KEY` | 月之暗面 (Kimi) | AI 工作流 | 🟡 中 |
| 12 | `ZHIPU_API_KEY` | 智谱 AI | AI 工作流 | 🟡 中 |
| 13 | `QINIU_API_KEY` | 七牛云 | AI 工作流 | 🟡 中 |
| 14 | `YOUYUN_API_KEY` | 优云智算 | AI 工作流 | 🟡 中 |
| 15 | `SILICONFLOW_API_KEY` | 硅基流动 | AI 工作流 | 🟡 中 |

---

## 写入位置说明

### 本地开发环境

```bash
# 后端：
StudySolo/backend/.env

# 前端（若不存在则新建）：
StudySolo/frontend/.env.local
```

### 生产环境（阿里云 ECS）
通过宝塔面板 SSH 登录后，直接编辑服务器上对应路径的 `.env` 文件，然后执行热重启：
```bash
pm2 restart studysolo-backend
# 或
systemctl restart studysolo-backend
```

---

## 各密钥详细轮换步骤

---

### 1. Supabase 三件套（SERVICE_ROLE_KEY / ANON_KEY / ACCESS_TOKEN）

> ⚠️ 这三个 Key 共用同一个 Supabase 项目 JWT Secret。轮换 JWT Secret 时会**同时失效** SERVICE_ROLE_KEY 和 ANON_KEY，请同步更新。

**[1a] 轮换 SERVICE_ROLE_KEY 和 ANON_KEY**

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 `Project Settings` → `API`
3. 下方找到 `JWT Settings` → 点击 `Generate New JWT Secret`
4. 确认操作，等待新 JWT Secret 生成
5. 在同一页面的 `Project API Keys` 中，复制新的：
   - `anon public` → 对应 `SUPABASE_ANON_KEY`
   - `service_role secret` → 对应 `SUPABASE_SERVICE_ROLE_KEY`
6. 更新以下所有位置：
   - `backend/.env` 中的 `SUPABASE_SERVICE_ROLE_KEY` 和 `SUPABASE_ANON_KEY`
   - `frontend/.env.local` 中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 生产服务器上同上两个文件
7. 重启前后端服务

```env
# backend/.env
SUPABASE_SERVICE_ROLE_KEY=<新的 service_role key>
SUPABASE_ANON_KEY=<新的 anon key>

# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://hofcaclztjazoytmckup.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<新的 anon key>
```

**[1b] 轮换 SUPABASE_ACCESS_TOKEN（MCP 工具用）**

> 此 Token 独立于上方 JWT，是你 Supabase 账号的个人访问令牌，用于 Antigravity MCP 工具调用。

1. 登录 [Supabase 账号 Token 页面](https://supabase.com/dashboard/account/tokens)
2. 找到旧 Token，点击 `Revoke`
3. 点击 `Generate new token`，填写描述（如 `antigravity-mcp`），生成
4. 复制新 Token，更新 `backend/.env` 中的 `SUPABASE_ACCESS_TOKEN`

```env
SUPABASE_ACCESS_TOKEN=sbp_<新的 token>
```

---

### 2. GitHub Personal Access Token（MCP 工具用）

1. 登录 GitHub → [Settings → Developer Settings → Personal Access Tokens → Fine-grained](https://github.com/settings/tokens?type=beta)
2. 找到旧的 Token（名称如 `antigravity-mcp`），点击 `Delete`  
3. 点击 `Generate new token`，选择 Fine-grained，配置权限：
   - **Repository access**：All repositories 或指定 `StudySolo`、`StudySolo-Dev`
   - **权限最小化原则**：勾选 Contents（Read & Write）、Pull Requests（Read & Write）、Issues（Read & Write）
4. 生成后复制，更新 `backend/.env` 中的 `GITHUB_PERSONAL_ACCESS_TOKEN`

```env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_<新的 token>
```

---

### 3. 阿里云 DirectMail SMTP 密码（邮件服务）

1. 登录 [阿里云控制台](https://www.aliyun.com) → 邮件推送（DirectMail）
2. 进入 `发件人地址管理`
3. 找到 `accounts@email.1037solo.com`，点击 `重置 SMTP 密码`
4. 生成新密码并复制
5. 更新 `backend/.env` 中的 `SMTP_PASS`

```env
SMTP_PASS=<新的 SMTP 密码>
```

---

### 4. JWT_SECRET（用户会话签名）

此 Secret 是自定义字符串，用于服务端 JWT 签名。更换后所有在线用户的会话 Token 立即失效（需要重新登录）。

**生成新 Secret（推荐方式）：**
```bash
# PowerShell 生成 64 位随机 Hex
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
```

更新 `backend/.env`：
```env
JWT_SECRET=<新的 64 位随机字符串>
```

---

### 5. CAPTCHA_SECRET（Canvas 验证码）

同上，自定义随机字符串，和 JWT_SECRET 操作相同，更换后不影响现有登录态。

```bash
# PowerShell 生成方式同上
```

更新 `backend/.env`：
```env
CAPTCHA_SECRET=<新的随机 Hash 字符串>
```

---

### 6. AI 平台 API Keys（8 个）

以下各平台操作逻辑一致：**进入控制台 → 找到 API Key 管理 → 删除旧 Key → 创建新 Key**。

| Key 名称 | 控制台入口 | 备注 |
|---------|-----------|------|
| `DASHSCOPE_API_KEY` | [阿里云百炼控制台](https://bailian.console.aliyun.com/) → API Key 管理 | 用于 Qwen 系列模型 |
| `VOLCENGINE_API_KEY` | [火山引擎控制台](https://console.volcengine.com/) → 方舟 → API Key | 用于 Doubao 系列 |
| `DEEPSEEK_API_KEY` | [DeepSeek Platform](https://platform.deepseek.com/) → API Keys | 用于 DeepSeek 系列 |
| `MOONSHOT_API_KEY` | [Kimi 开放平台](https://platform.moonshot.cn/) → API Keys | 用于 Moonshot 系列 |
| `ZHIPU_API_KEY` | [智谱开放平台](https://open.bigmodel.cn/) → API Keys | 用于 GLM 系列 |
| `QINIU_API_KEY` | [七牛云 AI 平台](https://portal.qiniu.com/) → API Key | 七牛自研模型 |
| `YOUYUN_API_KEY` | [优云智算控制台](https://www.youyun.com/) → API Key | 优云自研模型 |
| `SILICONFLOW_API_KEY` | [SiliconFlow 控制台](https://cloud.siliconflow.cn/) → API Keys | 多模型聚合平台 |

更新 `backend/.env`（对应字段）：
```env
DASHSCOPE_API_KEY=sk-<新的 key>
VOLCENGINE_API_KEY=<新的 key>
DEEPSEEK_API_KEY=sk-<新的 key>
MOONSHOT_API_KEY=sk-<新的 key>
ZHIPU_API_KEY=<新的 key>
QINIU_API_KEY=sk-<新的 key>
YOUYUN_API_KEY=<新的 key>
SILICONFLOW_API_KEY=sk-<新的 key>
```

---

## 轮换后验证 Checklist

```
[ ] 后端启动无报错：uvicorn 正常启动，端口 2038 可访问
[ ] 前端能正常加载：Next.js 2037 端口正常
[ ] Supabase 连接正常：调用任意需认证接口，返回 200
[ ] 邮件发送测试：触发注册/重置密码，收到邮件
[ ] AI 工作流测试：执行一个包含 AI 节点的工作流，成功返回结果
[ ] GitHub MCP 测试：通过 Antigravity 执行一个 GitHub 操作
[ ] Supabase MCP 测试：通过 Antigravity 查询一条数据库记录
```

---

## 生产环境特别注意事项

1. **零停机更新**：先在宝塔面板更新 `.env` 文件，再执行 `pm2 restart`，间隔时间内服务仍正常响应
2. **不要在聊天/文档中粘贴真实 Key**：包括与 AI 助手的对话
3. **更换后立即废弃旧 Key**：在各平台控制台手动删除/撤销，不要保留
4. **前端环境变量生效**：Next.js 前端需重新 `npm run build` 才能使 `NEXT_PUBLIC_*` 变量生效（生产环境）；本地开发 `npm run dev` 重启即可
