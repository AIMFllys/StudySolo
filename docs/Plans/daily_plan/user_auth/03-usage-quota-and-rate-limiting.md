# 用量配额与限流策略 · 实施指南

> 📅 创建日期：2026-02-27  
> 📌 所属模块：user_auth · 用户认证与权限  
> 🔗 关联文档：[02-user-tier-routing-strategy](./02-user-tier-routing-strategy.md) · [01-auth-and-guard-strategy](./01-auth-and-guard-strategy.md) · [vip-01-会员体系设计](./vip-01-membership-system-design.md)  
> 🎯 定位：**用户用量配额管理、API 限流策略、超额处理与前端限流 UI 反馈机制**

---

## 📑 目录

- [一、配额体系总览](#一配额体系总览)
- [二、多维度用量追踪](#二多维度用量追踪)
- [三、限流策略分层](#三限流策略分层)
- [四、超额处理机制](#四超额处理机制)
- [五、前端限流 UI 反馈](#五前端限流-ui-反馈)
- [六、后端实现方案](#六后端实现方案)
- [七、监控与告警](#七监控与告警)

---

## 一、配额体系总览

### 1.1 配额维度矩阵

StudySolo 的配额控制分为**四个维度**，每个维度独立计量、独立重置：

| 维度 | 计量单位 | 重置周期 | 来源 |
|------|---------|---------|------|
| **执行次数** | 次/天 | 每日 UTC+8 00:00 | 工作流完整运行一次算一次 |
| **存储空间** | GB/月 | 不重置，持续占用 | 知识库文件 + 工作流数据 |
| **工作流数量** | 个 | 不重置，持续占用 | 用户创建的工作流总数 |
| **并发数量** | 个 | 实时释放 | 同时运行中的工作流数 |

### 1.2 各 Tier 配额对比

| 配额维度 | 🆓 Free | 💎 Pro | 💠 Pro+ | 👑 Ultra |
|:---|:---:|:---:|:---:|:---:|
| 每日执行次数 | 20 | 50 | 150 | 500 |
| 最大工作流数 | 10 | 50 | 200 | 无限制 |
| 并发运行数 | 2 | 5 | 10 | 100 |
| 存储空间 | 1 GB | 3 GB | 10 GB | 100 GB |
| 单个知识库上限 | 100 MB | 200 MB | 1 GB | 3 GB |
| 增值服务-图片/天 | ❌ | 10 | 50 | 无限制 |
| 增值服务-视频/天 | ❌ | ❌ | 5 | 50 |
| 增值服务-TTS/天 | ❌ | 20 | 100 | 无限制 |

### 1.3 加购叠加规则

所有维度均支持按量加购（详见 [vip-02-payment-and-billing-architecture](./vip-02-payment-and-billing-architecture.md)），加购额度**直接叠加**到当前 Tier 上：

```
实际配额 = 套餐基础配额 + Σ(加购项配额)

例：Pro 用户 + 加购 5GB 存储 + 加购 10 个工作流
  存储 = 3 GB + 5 GB = 8 GB
  工作流 = 50 + 10 = 60 个
```

---

## 二、多维度用量追踪

### 2.1 实时用量数据结构

```typescript
// 前端 TypeScript 类型
interface UserQuota {
  tier: 'free' | 'pro' | 'pro_plus' | 'ultra';
  tierExpiresAt: string | null;
  
  execution: {
    used: number;      // 今日已使用
    limit: number;     // 今日上限（含加购）
    resetAt: string;   // 下次重置时间
  };
  
  workflows: {
    used: number;      // 已创建数量
    limit: number;     // 上限（-1=无限）
  };
  
  concurrent: {
    running: number;   // 当前运行中
    limit: number;     // 并发上限
  };
  
  storage: {
    usedBytes: number;     // 已使用字节
    limitBytes: number;    // 上限字节
    percentage: number;    // 使用百分比
  };
  
  addons: AddOnItem[];     // 加购项列表
}

interface AddOnItem {
  type: 'storage' | 'workflows' | 'concurrent';
  quantity: number;
  expiresAt: string;
  autoRenew: boolean;
}
```

### 2.2 后端用量查询 API

```
GET /api/user/quota
Authorization: Bearer <jwt>

Response:
{
  "tier": "pro",
  "execution": { "used": 23, "limit": 50, "resetAt": "2026-02-28T00:00:00+08:00" },
  "workflows": { "used": 48, "limit": 55 },
  "concurrent": { "running": 2, "limit": 5 },
  "storage": { "usedBytes": 2936012800, "limitBytes": 8589934592, "percentage": 34.2 },
  "addons": [
    { "type": "storage", "quantity": 5, "expiresAt": "2026-03-20", "autoRenew": true },
    { "type": "workflows", "quantity": 5, "expiresAt": "2026-03-20", "autoRenew": true }
  ]
}
```

---

## 三、限流策略分层

### 3.1 四层限流防线

```
┌──────────────────────────────────────────────────────────┐
│                    第 1 层：Nginx 层                       │
│  · 全局 IP 频率限制（10r/s 通用、2r/s AI接口）              │
│  · 登录接口防爆破（5r/m）                                   │
│  · 403 / 429 直接返回                                      │
├──────────────────────────────────────────────────────────┤
│                    第 2 层：FastAPI 中间件                   │
│  · slowapi 限流（按用户ID + IP 双维度）                      │
│  · JWT Tier 校验（从 JWT Claim 读取 tier）                  │
│  · 并发数检查（查 workflow_runs 表 running 数量）            │
├──────────────────────────────────────────────────────────┤
│                    第 3 层：业务逻辑层                       │
│  · 每日执行次数检查（查 user_usage_daily 表）                │
│  · 工作流数量上限检查（count workflows 表）                   │
│  · 存储空间检查（sum 文件大小）                               │
│  · 增值服务配额检查                                          │
├──────────────────────────────────────────────────────────┤
│                    第 4 层：费控降级层                        │
│  · 单用户单日总 Token 硬限制（防刷量攻击）                     │
│  · 单次运行 Token 上限（防 Prompt 注入造成天价账单）           │
│  · 平台级总成本熔断器（日成本达到阈值告警 + 降级）             │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Token 硬限制（防恶意刷量）

即使在配额以内，也需要防止异常的高 Token 消耗：

| Tier | 单次运行 Token 上限 | 单日总 Token 上限 | 超限行为 |
|:---|:---:|:---:|:---|
| Free | 30,000 | 200,000 | 中断执行 + 提示升级 |
| Pro | 80,000 | 1,000,000 | 中断执行 + 邮件通知 |
| Pro+ | 200,000 | 5,000,000 | 警告 + 继续执行 |
| Ultra | 500,000 | 无限制 | 仅记录 |

### 3.3 Nginx 限流配置（已在 PROJECT_PLAN.md 中定义）

```nginx
# 已有配置，此处补充说明
http {
    # 通用 API：每秒 10 次
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    # AI API：每秒 2 次（SSE 长连接消耗资源）
    limit_req_zone $binary_remote_addr zone=ai_api:10m rate=2r/s;
    # 登录：每分钟 5 次
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    # 注册：每分钟 3 次（更严格）
    limit_req_zone $binary_remote_addr zone=register:10m rate=3r/m;
}
```

### 3.4 FastAPI slowapi 配置

```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_user_id_or_ip(request: Request) -> str:
    """优先按用户ID限流，未登录则按IP"""
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"
    return f"ip:{get_remote_address(request)}"

limiter = Limiter(key_func=get_user_id_or_ip)

# 路由级限流示例
@router.post("/api/ai/generate-workflow")
@limiter.limit("5/minute")  # 每分钟最多生成 5 个工作流
async def generate_workflow(request: Request, ...):
    ...

@router.get("/api/workflow/{id}/execute")
@limiter.limit("3/minute")  # 每分钟最多执行 3 次
async def execute_workflow(request: Request, ...):
    ...
```

---

## 四、超额处理机制

### 4.1 超额场景与响应策略

| 超额类型 | HTTP 状态码 | 错误代码 | 用户可见消息 | CTA |
|:---|:---:|:---|:---|:---|
| 每日执行次数用尽 | 429 | `DAILY_LIMIT_EXCEEDED` | "今日执行次数已达上限（20次），明日 00:00 自动恢复" | [升级 Pro →] |
| 工作流数量已满 | 403 | `WORKFLOW_LIMIT` | "工作流数量已达上限（10个），请删除或升级" | [升级 →] [管理工作流 →] |
| 并发数已满 | 429 | `CONCURRENT_LIMIT` | "当前有 2 个工作流正在运行，请等待完成" | [查看运行中 →] |
| 存储空间不足 | 403 | `STORAGE_LIMIT` | "存储空间不足，请清理或升级" | [升级 →] [管理存储 →] |
| 功能未解锁 | 403 | `FEATURE_LOCKED` | "此功能需要 Pro 及以上会员" | [了解 Pro →] |
| Token 硬限制 | 429 | `TOKEN_LIMIT` | "单次运行内容过长，建议拆分工作流" | [查看建议 →] |
| IP 频率限制 | 429 | `RATE_LIMIT` | "请求过于频繁，请稍后重试" | — |

### 4.2 统一错误响应格式

```json
{
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "今日执行次数已达上限（20次），明日 00:00 自动恢复",
    "details": {
      "used": 20,
      "limit": 20,
      "reset_at": "2026-02-28T00:00:00+08:00"
    },
    "upgrade": {
      "url": "/pricing",
      "label": "升级至 Pro，每日 50 次",
      "price": "¥25/月"
    }
  }
}
```

### 4.3 温和提醒阈值

在配额用尽之前，提前在前端显示提醒：

| 使用率 | 提醒方式 | 样式 |
|:---:|:---|:---|
| 70% | 顶栏小黄条 | ⚠️ 今日剩余 6/20 次执行 |
| 90% | 顶栏 + Toast | 🔴 今日仅剩 2/20 次执行，升级 Pro 获取更多 |
| 100% | 阻断弹窗 | 🚫 今日执行次数已用尽 [升级 Pro] [明天再来] |

---

## 五、前端限流 UI 反馈

### 5.1 配额状态栏组件

在 Dashboard 顶部常驻显示用户配额状态：

```
╔════════════════════════════════════════════════════════════════╗
║  ⚡ 今日: 17/20 次  |  📁 工作流: 8/10  |  💾 存储: 0.8/1 GB  ║
║  🔒 Free 版  ·  升级 Pro 解锁满血模型                            ║
╚════════════════════════════════════════════════════════════════╝
```

### 5.2 工作流执行前的配额预检

在用户点击"▶ 运行"之前，前端先调用配额检查API：

```typescript
// hooks/use-quota-check.ts
async function checkQuotaBeforeRun(): Promise<boolean> {
  const quota = await fetchQuota();
  
  // 1. 检查每日次数
  if (quota.execution.remaining <= 0) {
    showUpgradeModal('daily_limit');
    return false;
  }
  
  // 2. 检查并发数
  if (quota.concurrent.running >= quota.concurrent.limit) {
    showConcurrentWarning();
    return false;
  }
  
  // 3. 温和提醒（剩余不多时）
  if (quota.execution.remaining <= 3) {
    showToast(`今日仅剩 ${quota.execution.remaining} 次执行`);
  }
  
  return true;
}
```

### 5.3 功能锁定 UI

对于免费版不可用的功能，在 UI 上显示锁定状态：

```
┌─────────────────────────┐
│  🔍 联网搜索模式         │
│  ○ 基础搜索 (Free ✅)    │
│  ○ 百度搜索+总结 🔒 Pro  │
│  ○ 深度搜索 🔒 Pro+     │
│  ○ Agent 搜索 🔒 Ultra  │
└─────────────────────────┘

┌─────────────────────────┐
│  🧠 模型选择             │
│  自动（系统推荐）✅       │
│  ────────────────────    │
│  DeepSeek-R1    🔒 Pro   │
│  Kimi K2.5      🔒 Pro   │
│  GPT-4o         🔒 Pro   │
│  GPT-5.1        🔒 Pro+  │
│  Claude 4       🔒 Ultra │
└─────────────────────────┘
```

---

## 六、后端实现方案

### 6.1 配额检查中间件链

```python
# backend/app/api/deps.py

from fastapi import Depends, HTTPException
from app.middleware.auth import get_current_user
from app.core.config_loader import get_config

async def require_quota(
    user = Depends(get_current_user),
    action: str = "execute"  # "execute" | "create_workflow" | "upload"
):
    """通用配额检查依赖注入"""
    tier_config = get_config().user_tiers[user.tier]
    
    if action == "execute":
        usage = await get_daily_usage(user.id)
        if usage.execution_count >= tier_config["daily_execution_limit"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "DAILY_LIMIT_EXCEEDED",
                    "message": f"今日执行次数已达上限（{tier_config['daily_execution_limit']}次）",
                    "upgrade": build_upgrade_suggestion(user.tier)
                }
            )
    
    elif action == "create_workflow":
        count = await count_user_workflows(user.id)
        limit = tier_config["max_workflows"]
        if limit != -1 and count >= limit:
            raise HTTPException(status_code=403, ...)
    
    elif action == "upload":
        storage = await get_user_storage(user.id)
        limit_bytes = tier_config["storage_gb"] * 1024 * 1024 * 1024
        if storage >= limit_bytes:
            raise HTTPException(status_code=403, ...)
    
    return user
```

### 6.2 用量记录（每次执行后更新）

```python
# backend/app/services/usage_tracker.py

async def record_execution(
    user_id: str,
    platform: str,
    model: str,
    input_tokens: int,
    output_tokens: int
):
    """记录一次 API 调用的用量"""
    today = datetime.now(timezone(timedelta(hours=8))).date()
    
    # UPSERT 到 user_usage_daily
    await supabase.rpc("upsert_daily_usage", {
        "p_user_id": user_id,
        "p_date": today.isoformat(),
        "p_execution_increment": 1,
        "p_input_tokens": input_tokens,
        "p_output_tokens": output_tokens,
        "p_platform": platform,
        "p_platform_tokens": input_tokens + output_tokens,
        "p_platform_calls": 1
    })
```

对应的数据库存储过程：

```sql
CREATE OR REPLACE FUNCTION upsert_daily_usage(
    p_user_id UUID,
    p_date DATE,
    p_execution_increment INTEGER DEFAULT 0,
    p_input_tokens BIGINT DEFAULT 0,
    p_output_tokens BIGINT DEFAULT 0,
    p_platform TEXT DEFAULT NULL,
    p_platform_tokens BIGINT DEFAULT 0,
    p_platform_calls INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage_daily (user_id, usage_date, execution_count, total_input_tokens, total_output_tokens, platform_usage)
    VALUES (
        p_user_id, p_date, p_execution_increment, p_input_tokens, p_output_tokens,
        CASE WHEN p_platform IS NOT NULL 
            THEN jsonb_build_object(p_platform, jsonb_build_object('tokens', p_platform_tokens, 'calls', p_platform_calls))
            ELSE '{}'::jsonb
        END
    )
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
        execution_count = user_usage_daily.execution_count + p_execution_increment,
        total_input_tokens = user_usage_daily.total_input_tokens + p_input_tokens,
        total_output_tokens = user_usage_daily.total_output_tokens + p_output_tokens,
        platform_usage = user_usage_daily.platform_usage || 
            CASE WHEN p_platform IS NOT NULL THEN
                jsonb_build_object(p_platform, jsonb_build_object(
                    'tokens', COALESCE((user_usage_daily.platform_usage->p_platform->>'tokens')::bigint, 0) + p_platform_tokens,
                    'calls', COALESCE((user_usage_daily.platform_usage->p_platform->>'calls')::integer, 0) + p_platform_calls
                ))
            ELSE '{}'::jsonb
            END,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

---

## 七、监控与告警

### 7.1 关键指标监控

| 指标 | 数据源 | 告警阈值 | 告警方式 |
|------|---------|---------|---------|
| 全站日 Token 消耗 | `user_usage_daily` 聚合 | > ¥200/天 | 邮件 + 飞书 |
| 单用户日 Token 消耗 | `user_usage_daily` | > 500K Token | 日志标记 |
| API 错误率 | 应用日志 | > 5% | 邮件告警 |
| 降级触发次数 | 应用日志 | > 50次/小时 | 飞书告警 |
| 429 频率 | Nginx 日志 | > 100次/分钟 | 立即告警 |

### 7.2 成本熔断器

```python
# backend/app/services/cost_breaker.py

DAILY_COST_THRESHOLD = 500  # 单日总成本超过 ¥500 触发熔断

async def check_cost_breaker():
    """全平台日成本熔断检查"""
    today_cost = await calculate_today_total_cost()
    
    if today_cost > DAILY_COST_THRESHOLD:
        # 紧急降级：所有用户（含付费）降回基础模型
        logger.critical(f"COST BREAKER TRIGGERED: ¥{today_cost}")
        await notify_admin(f"日成本熔断触发，当前 ¥{today_cost}")
        return True  # 触发熔断，切换到极简模式
    
    if today_cost > DAILY_COST_THRESHOLD * 0.8:
        logger.warning(f"Cost approaching threshold: ¥{today_cost}")
        await notify_admin(f"日成本预警：¥{today_cost}，阈值 ¥{DAILY_COST_THRESHOLD}")
    
    return False
```

---

> **一句话总结**：四层限流防线（Nginx→FastAPI→业务逻辑→费控降级）+ 多维度用量追踪（执行/存储/并发/Token）+ 超额温和提醒三阶梯（70%/90%/100%）+ 全站成本熔断器，确保免费用户体验与平台成本的完美平衡。
