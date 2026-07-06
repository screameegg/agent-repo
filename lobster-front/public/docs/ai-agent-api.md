# 知栈 AI Agent 接入手册

本文件给智能体下载使用，也可以保存为平台 Skill 的 `SKILL.md` 主手册。智能体通过 Agent Token 调用 `/api/ai/**`，完成自注册、Skill 包上传、状态同步、平台配置拉取、配置变更确认和备份导出。

## 先记住这几个区别

- `POST /api/ai/agents/register`：只创建并绑定 Agent，写入 `agent`，不会创建 Skill Package。
- `POST /api/ai/skills`：创建或更新可被前端看见的 Skill Package，写入 `skill_package` 和 `skill_file`；单独调用它不会挂载到 Agent。
- `POST /api/ai/agents/{agentId}/sync`：同步 Agent 自己的状态快照，写入 `agent_skill`、`agent_memory`、`agent_goal`；如果 `sync.skills[].configJson` 里包含 `code`、`skillCode` 或 `externalSkillId`，并且同 owner 下存在同 code 的 Skill Package，平台会自动写入 `agent_skill_mount` 完成挂载。
- `DELETE /api/ai/agents/{agentId}/memories/{memoryId}`：Agent Token 删除自己可访问 Agent 的指定记忆，需要 `memoryWrite`，这是 Agent 自己提交的状态清理，不会生成给当前 Agent 自己 ack 的 `config_changed` 事件。
- `DELETE /api/ai/agents/{agentId}/goals/{goalId}`：Agent Token 删除自己可访问 Agent 的指定目标，需要 `goalWrite`，这是 Agent 自己提交的状态清理，不会生成给当前 Agent 自己 ack 的 `config_changed` 事件。
- 前端挂载 Skill Package 后，平台写入 `agent_skill_mount`，生成 `sourceType=skill_package` 的 `agent_skill` 展示快照，并创建 pending 的 `config_changed` 事件；AI sync 自动挂载 Skill Package 属于 Agent 自同步写入，不会额外生成给当前 Agent 自己 ack 的事件。
- Agent 学习已挂载 Skill 时，先读 `config?brief=true` 的 `data.skillPackages[].files` 元数据；需要正文时再按单个 Skill 调 detail，不要只读取 `config.data.skills`。
- 业务错误同时检查 HTTP 状态和响应体 `code`；两者应该保持一致。

## 环境变量

生产部署时前端由 nginx 托管静态资源，并把同源 `/api` 代理到后端。`LOBSTER_API_BASE_URL` 使用当前知栈前端站点 origin；在“创建 Agent”弹窗里复制给 AI 的流程会自动填入当前站点地址。

```bash
export LOBSTER_API_BASE_URL="https://your-zhizhan-frontend.example.com"
export LOBSTER_AGENT_TOKEN="<AGENT_TOKEN>"
export LOBSTER_AGENT_ID="<AGENT_ID>"
```

手册下载地址同样使用前端站点：

```bash
curl -L "$LOBSTER_API_BASE_URL/docs/ai-agent-api.md"
```

Agent Token 可以放在 `Authorization` 或 `X-Agent-Token`。后端会先读取 `X-Agent-Token`，如果没有该请求头，再读取 `Authorization: Bearer ...`：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "X-Agent-Token: $LOBSTER_AGENT_TOKEN"
```

不要把完整 Token 写入 Skill 文件、记忆、目标或普通日志。

## 权限矩阵

| 权限 | 能力 |
| --- | --- |
| `agentRegister` | Agent 自注册并绑定 Token |
| `agentSync` | Agent 上传角色、技能快照、记忆、目标 |
| `configRead` | 轮询事件、拉取平台配置、确认事件 |
| `skillRead` | 读取 Skill 包、同步技能快照和 config 中的技能文件树 |
| `skillWrite` | 上传 Skill 包、同步技能快照和通过 sync 自动挂载 Skill |
| `memoryRead` | 读取 config 中的记忆 |
| `memoryWrite` | 同步写入和删除 Agent 记忆 |
| `goalRead` | 读取 config 中的目标 |
| `goalWrite` | 同步写入和删除 Agent 目标 |
| `backupExport` | 导出完整备份 |

建议给正常同步 Agent 开启：`agentRegister`、`agentSync`、`configRead`、`skillRead`、`skillWrite`、`memoryRead`、`memoryWrite`、`goalRead`、`goalWrite`。迁移或克隆场景再开启 `backupExport`。

## 后端数据结构对应关系

| 数据表 | 由谁写入 | 作用 | Agent Token 能否直接写 |
| --- | --- | --- | --- |
| `agent` | `POST /api/ai/agents/register`、`POST /api/ai/agents/{agentId}/sync` | Agent 身份、角色、提示词和模型等主体信息 | 能 |
| `skill_package` | `POST /api/ai/skills`、`PUT /api/ai/skills/{id}` | 前端技能库里可见、可挂载的技能包元数据 | 能 |
| `skill_file` | `POST /api/ai/skills`、`PUT /api/ai/skills/{id}` | Skill Package 文件树，例如 `SKILL.md`、`workflows/`、`references/`、`examples/`、`checklists/`、`scripts/` | 能 |
| `agent_skill_mount` | 登录态前端接口 `POST /api/agents/{agentId}/skill-mounts`，或 AI sync 根据 `configJson.code` 自动匹配 | Agent 和 Skill Package 的正式挂载关系 | 能通过 sync 自动匹配写入，不能直接调用登录态接口 |
| `agent_skill` | `sync.skills` 或挂载服务自动生成 | Agent 详情页展示用技能快照 | 能写自报快照，不能当作技能包 |
| `agent_config_event` | 人类用户或平台侧的挂载、卸载、记忆、目标、角色等配置变更 | Agent 轮询后拉取完整配置的通知 | 只能轮询和 ack |

因此，创建 Agent、创建 Skill Package、挂载 Skill Package 是三个不同动作。只注册 Agent 或只同步 `sync.skills`，前端技能库不会出现可挂载技能；只上传 Skill Package，Agent 配置里也不会出现 `skillPackages`。如果要让 Agent Token 侧自动挂载，先上传 Skill Package，再在 `sync.skills[].configJson` 里稳定带上同一个 `code`。

## AI 如何读取已挂载 Skill 文件树

Agent 不通过 `skills` 学习 Skill。`skills` 是 Agent 详情页展示快照，通常只有名称、描述、挂载状态，不包含完整文件。真正给 AI 使用的 Skill Package 文件在 `GET /api/ai/agents/{agentId}/config` 返回的 `data.skillPackages[].files` 中。

读取协议：

1. Token 需要同时具备 `configRead` 和 `skillRead`。缺少 `skillRead` 时，`skills`、`skillMounts`、`skillPackages` 都会被裁剪为空数组。
2. 周期性调用 `GET /api/ai/agents/{agentId}/events`，建议 30-60 秒一次；连续失败时退避。没有 pending 事件时不要拉 config。
3. 发现 pending 的 `config_changed` 后，先调用 `GET /api/ai/agents/{agentId}/config?brief=true`，不要先 ack。brief 配置会返回 Skill 文件名、路径和大小，不返回 `content`。
4. 对每个 `skillPackages[]` 按 `code` 建立本地缓存。相同 `code` 的新返回覆盖旧缓存，不要追加成重复 Skill。
5. brief 配置里的 `skillPackages[].files[]` 只用于判断本地缓存是否过期。缺少内容或文件大小变化时，再调用 `GET /api/ai/skills/{idOrCode}` 或 `GET /api/ai/skills/{idOrCode}/detail` 拉取单个 Skill Package 全文。
6. 如果事件 payload 明确给了单条资源 id，例如 `{"reason":"memory_created","payload":{"memoryId":"2074046610721259521"}}`，优先调用 `GET /api/ai/agents/{agentId}/memories/{memoryId}` 拉取这一条记忆，而不是为了 1 条记忆拉完整配置全文。
7. 按单个 Skill detail 返回的 `files[].path` 还原目录结构。`path` 使用 `/`，根目录必须优先寻找 `SKILL.md`。
8. 先读每个 Skill 的根 `SKILL.md`。`SKILL.md` 应该是触发条件、边界和文件索引，不应该是巨型全量手册。
9. 根据 `SKILL.md` 的索引按需读取 `workflows/`、`references/`、`examples/`、`checklists/`。当前任务用不到的长文档不要提前塞进上下文。
10. `scripts/` 只能当作可选工具或示例。只有 Skill 明确要求、用户/运行环境允许、且沙箱策略允许时才能执行。
11. Agent 确认已经应用平台侧配置变更后，再调用 `POST /api/ai/events/{eventId}/ack`。ack 后该事件不会再次出现在 events 里。

推荐 Skill Package 文件结构：

```text
SKILL.md
workflows/usage.md
workflows/config-event-listening.md
references/interface.md
examples/request.json
checklists/quality.md
scripts/optional-tool.py
```

目录职责：

- `SKILL.md`：小而稳定的入口，写触发条件、必须先读的顺序、安全边界和文件索引。
- `workflows/`：放可执行流程，例如配置监听、同步预览、发布验证、故障处理步骤。
- `references/`：放长参考资料，例如 API、领域规则、数据结构、迁移说明。
- `examples/`：放请求、响应、配置或最小案例。
- `checklists/`：放完成前检查清单和质量门禁。
- `scripts/`：放可选脚本或工具，默认不自动执行。

如果把本手册内容保存为平台 Skill，不要把整份手册直接塞进单个 `SKILL.md`。应把根 `SKILL.md` 做成索引，把接入流程放到 `workflows/`，把 API 明细放到 `references/`，把 curl 或 JSON 样例放到 `examples/`，把发布前检查放到 `checklists/`。

## 同步预览和范围选择

Agent 在提交包含 `skills`、`memories`、`goals` 的 `/sync` 请求，或更新 Skill Package 的完整 `files` 前，必须先生成同步预览。同步预览要把本地准备写入的数据和 `GET /api/ai/agents/{agentId}/config?brief=true` 返回的线上数据放在一起比较；需要 Skill 文件正文时，再按单个 Skill 调 detail 接口，并展示这些信息：

- 将新增、更新、删除、跳过哪些 Skill、记忆、目标或 Skill 文件。
- 是否是全量同步，还是只同步 Skill、只同步记忆、只同步目标、只更新 Agent 身份。
- 本次使用的 `baseRevision`、目标 Agent、目标 Skill Package `code`，以及是否会触发自动挂载。
- 可能覆盖、删除或重复的数据，尤其是 Skill Package 更新时完整文件树中缺失的文件。

展示同步预览后，让用户选择：全量同步、只同步 Skill、只同步记忆、只同步目标、只更新 Agent 身份、取消同步。只有用户确认范围后，才提交带 `confirmSync=true` 的写入请求。无法交互的自动化任务也要把预览写入日志或输出，让调用方能审计实际写入内容。

## 平台迁移策略

不同 AI 平台迁移 Skill 的方式不完全一样，不要把一种平台的读取方式硬套到所有平台：

- Codex：通常可以读取工作区文件、运行测试和编辑代码。迁移知栈 Skill 时，优先写程序或脚本读取本地 `SKILL.md`、`workflows/`、`references/`、`examples/`、`checklists/`，生成完整 Skill 文件树和同步预览，再按用户选择提交。
- Claude Code：通常有自己的 Skill 加载、项目说明和工具约定。迁移时先保留 `SKILL.md` 的触发条件、读取顺序、安全边界，再把平台专用说明放进合适的项目指令或 Skill 文件，不要假设它会自动读取知栈的 API 手册。
- 通用 Agent：如果只能调用 HTTP API，就使用本手册的 `/api/ai/**` 接口；如果不能安全读取本地文件树，就让用户上传 ZIP/JSON 备份或显式提供文件内容。

能由 AI 自动读取配置并生成同步预览的场景，可以直接写程序完成预览和 payload 组装；当权限不足、文件缺失、覆盖风险不清楚或用户没有选择同步范围时，停止写入并要求用户确认。

## 推荐接入流程

1. 读取 `LOBSTER_API_BASE_URL` 和 `LOBSTER_AGENT_TOKEN`。
2. 调用 `GET /api/ai/token/me` 检查 Token、权限和绑定 Agent。
3. 如果 `agentId` 为空，并且有 `agentRegister`，调用 `POST /api/ai/agents/register` 自注册，并保存返回的 `data.agent.id`。
4. 如果要让人类用户在前端看见并挂载你的技能，立即调用 `POST /api/ai/skills` 上传或更新 Skill Package，并用 `GET /api/ai/skills` 验证列表可见。
5. 同步 `skills`、`memories` 或 `goals` 前，必须调用 `GET /api/ai/agents/{agentId}/config?brief=true` 拉取线上配置，读取 `data.syncRevision`，生成同步预览，并让用户选择全量同步、只同步 Skill、只同步记忆、只同步目标或取消。
6. 调用 `POST /api/ai/agents/{agentId}/sync` 同步 Agent 身份、记忆、目标；如果请求体包含 `skills`、`memories` 或 `goals`，必须带 `baseRevision=data.syncRevision` 和 `confirmSync=true`。如果要自动挂载刚上传的 Skill Package，在 `sync.skills[].configJson` 里带上对应 `code`。
7. AI 通过 `/sync` 上传自己的状态、记忆、目标/任务状态后，不需要再等待或确认由这次上传产生的 ack。`ack` 只用于处理平台侧或人类用户修改造成的 pending `config_changed`，例如用户在前端挂载/卸载 Skill、编辑 Agent 身份、编辑记忆或目标。
8. 如果要删除已过期或重复记忆，调用 `DELETE /api/ai/agents/{agentId}/memories/{memoryId}`；如果要删除已过期或重复目标，调用 `DELETE /api/ai/agents/{agentId}/goals/{goalId}`；这是 Agent 自己提交的状态清理，不会生成给当前 Agent 自己 ack 的配置事件。
9. 人类用户也可以在前端 Agent 详情页手动把 Skill Package 挂载到 Agent。后端登录态接口是 `POST /api/agents/{agentId}/skill-mounts`，Agent Token 不直接调用这个登录态接口。
10. Agent 周期性调用 `GET /api/ai/agents/{agentId}/events`。
11. 有 pending 的 `config_changed` 时，调用 `GET /api/ai/agents/{agentId}/config?brief=true`。
12. 根据 brief 配置和事件 payload 按需调用单条接口：`GET /api/ai/agents/{agentId}/memories/{memoryId}` 或 `GET /api/ai/skills/{idOrCode}`。
13. Agent 按 Skill detail 的 `files[].path` 还原文件树，先读根 `SKILL.md`，再按索引按需读取 `workflows/`、`references/`、`examples/`、`checklists/`；`scripts/` 默认不执行。
14. 确认已应用平台侧配置变更后，调用 `POST /api/ai/events/{eventId}/ack`。

按顺序执行这些请求：

1. 下载并读取手册。

```bash
curl -L "$LOBSTER_API_BASE_URL/docs/ai-agent-api.md"
```

2. Token 自检。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

3. 如果 `token/me` 返回的 `data.agentId` 为空，注册 Agent，并把返回的 `data.agent.id` 写入 `LOBSTER_AGENT_ID`。注册请求通常不要传 `skills`，除非你只是要在 Agent 详情里展示自报能力。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/register" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Agent",
    "role": "研发助手",
    "description": "通过 Agent Token 自注册的平台智能体。"
  }'
```

4. 上传或更新真正的 Skill Package。这个请求创建前端技能库可见的技能包，不会自动挂载到 Agent。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/skills" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Repository Reader Skill",
    "code": "repository-reader",
    "description": "读取仓库目录并总结模块职责。",
    "version": "1.0.0",
    "visibility": "private",
    "publishStatus": "draft",
    "runtimeEnvironments": ["shell"],
    "coreCapabilities": ["read-repo", "summarize-structure"],
    "files": [
      {
        "nodeType": "file",
        "name": "SKILL.md",
        "path": "SKILL.md",
        "language": "markdown",
        "content": "# Repository Reader Skill\n\n## 什么时候使用\n需要熟悉项目结构、模块职责或接口入口时使用。\n\n## 文件索引\n- workflows/usage.md：执行仓库读取流程。\n- references/interface.md：读取目录、模块、接口字段说明。\n- examples/request.json：请求样例。\n- checklists/quality.md：完成前检查。\n\n## 安全边界\n只读取仓库文件，不上传密钥、Token 或用户隐私数据。\n"
      },
      {
        "nodeType": "file",
        "name": "usage.md",
        "path": "workflows/usage.md",
        "language": "markdown",
        "content": "# 使用流程\n\n1. 确认用户要读取的仓库范围。\n2. 扫描目录和入口文件。\n3. 汇总模块职责、接口和风险点。\n"
      },
      {
        "nodeType": "file",
        "name": "interface.md",
        "path": "references/interface.md",
        "language": "markdown",
        "content": "# 接口说明\n\n这里放较长的接口、目录和领域说明。"
      },
      {
        "nodeType": "file",
        "name": "request.json",
        "path": "examples/request.json",
        "language": "json",
        "content": "{\"example\":\"read repository root and summarize modules\"}"
      },
      {
        "nodeType": "file",
        "name": "quality.md",
        "path": "checklists/quality.md",
        "language": "markdown",
        "content": "# 完成检查\n\n- 已说明读取范围。\n- 已避免输出密钥或隐私。\n- 已列出不确定项。\n"
      }
    ]
  }'
```

5. 验证 Skill Package 已经创建，前端技能库应能看到这个 `code`。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/skills" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

6. 如果只同步 Agent 名称、角色等主体信息，可以直接调用 sync。这里的 `skills` 不是必填；不要用它代替 Skill Package 创建。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/sync" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Agent",
    "role": "研发助手"
  }'
```

7. 如果要同步 `skills`、`memories` 或 `goals`，先拉取平台配置并保存返回的 `data.syncRevision`。Agent 必须先对比线上已有 `skills`、`memories`、`goals` 和 `skillPackages`，生成同步预览，让用户选择同步范围，确认不会重复上传或误覆盖。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/config" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

8. 带上刚才的 revision 和确认标记后，再同步技能快照、记忆或目标。下面的 `baseRevision` 示例值需要替换成上一步返回的 `data.syncRevision`。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/sync" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "baseRevision": "REPLACE_WITH_CONFIG_SYNC_REVISION",
    "confirmSync": true,
    "skills": [
      {
        "name": "Repository Reader",
        "description": "读取仓库目录并总结模块职责。",
        "sourceType": "agent-sync",
        "mountStatus": "active",
        "configJson": {
          "code": "repository-reader",
          "version": "1.0.0"
        }
      }
    ],
    "memories": [
      {
        "title": "项目结构",
        "content": "后端在 lobster-back，前端在 lobster-front。",
        "memoryType": "fact",
        "importance": 9,
        "source": "agent-sync"
      }
    ]
  }'
```

9. 如果上一步 `sync.skills[].configJson` 带了已上传 Skill Package 的 `code`，后端会自动创建 `agent_skill_mount` 和展示快照；这是 AI 自同步写入，不会额外生成给当前 Agent 自己 ack 的待确认配置事件。也可以由人类用户在前端 Agent 详情页手动挂载 Skill Package，人工挂载会生成 pending 配置事件。

10. 轮询配置变更事件。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/events" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

11. 如果返回 pending 的 `config_changed`，先拉取轻量配置并读取 `skillPackages[].files` 元数据；这是 AI 判断本地挂载 Skill 缓存是否要刷新的入口。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/config?brief=true" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

12. 如果需要文件正文，按单个 Skill 拉取 detail；如果事件 payload 给了 `memoryId`，按单条记忆接口拉取。

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/skills/<SKILL_ID_OR_CODE>/detail" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"

curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/memories/<MEMORY_ID>" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

13. Agent 确认已应用配置后，再确认事件。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/events/<EVENT_ID>/ack" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

## Token 自检

Token 自检也必须带 Agent Token。二选一即可：

方式一，使用 Bearer Token：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

方式二，使用专用请求头：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "X-Agent-Token: $LOBSTER_AGENT_TOKEN"
```

如果两个请求头同时存在，后端优先使用 `X-Agent-Token`。

返回示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tokenId": "2068",
    "ownerId": "2067",
    "agentId": "2069",
    "permissions": "{\"skillRead\":true,\"skillWrite\":true,\"configRead\":true}"
  }
}
```

`agentId` 为空表示 Token 未绑定 Agent；如果有 `agentRegister` 权限，可以自注册。前端 Agent 卡片会根据有效 Token 绑定关系显示“已关联”或“未关联”。

## Agent 自注册

注册只负责创建 `agent` 并把 Token 绑定到该 Agent。请求体里的 `skills`、`memories`、`goals` 会走同步子资源逻辑，其中 `skills` 写入的是 `agent_skill` 展示快照，不会创建 `skill_package` 或 `skill_file`。

普通接入建议先只注册身份：

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/register" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Agent",
    "role": "研发助手",
    "description": "通过 Agent Token 自注册的平台智能体。",
    "systemPrompt": "优先遵循现有项目结构，接口变更前确认前后端契约。"
  }'
```

如果确实需要在 Agent 详情页立即展示自报能力，可以额外传 `skills`，但这仍然不是 Skill Package：

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/register" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Agent",
    "role": "研发助手",
    "skills": [
      {
        "name": "Repository Reader",
        "description": "读取仓库目录并总结模块职责。",
        "sourceType": "agent-sync",
        "mountStatus": "active",
        "configJson": {
          "externalSkillId": "repository-reader",
          "version": "1.0.0"
        }
      }
    ],
    "memories": [
      {
        "title": "接入方式",
        "content": "使用知栈 Agent Token 同步。",
        "memoryType": "fact",
        "importance": 8,
        "source": "agent-bootstrap"
      }
    ],
    "goals": [
      {
        "title": "保持平台配置同步",
        "description": "轮询 events，拉取 config，应用后 ack。",
        "goalStatus": "running",
        "priority": 9
      }
    ]
  }'
```

注册成功后保存返回的 `data.agent.id`。后续同步、拉取配置、轮询事件、导出备份都使用这个 ID。注册后如果要创建前端可见技能，继续调用 `POST /api/ai/skills`。

## 同步 Agent 状态

只同步 Agent 主体信息时，可以直接调用 `/sync`：

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/sync" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Agent",
    "role": "研发助手"
  }'
```

如果同步请求包含 `skills`、`memories` 或 `goals`，必须先拉取平台配置，确认线上已有技能、记忆和目标后，再带 `baseRevision` 和 `confirmSync=true` 提交：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/config" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/sync" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "baseRevision": "REPLACE_WITH_CONFIG_SYNC_REVISION",
    "confirmSync": true,
    "skills": [
      {
        "name": "Repository Reader",
        "description": "读取仓库目录并总结模块职责。",
        "sourceType": "agent-sync",
        "mountStatus": "active",
        "configJson": {
          "code": "repository-reader",
          "version": "1.0.0"
        }
      }
    ],
    "memories": [
      {
        "title": "项目结构",
        "content": "后端在 lobster-back，前端在 lobster-front。",
        "memoryType": "fact",
        "importance": 9,
        "source": "agent-sync"
      }
    ]
  }'
```

同步状态注意事项：

- `sync.skills` 本身仍是 Agent 自报能力，不是 Skill Package 文件树。
- 含 `skills`、`memories` 或 `goals` 的同步请求必须先调用 `GET /config`，生成同步预览，让用户选择全量同步、只同步 Skill、只同步记忆、只同步目标或取消；确认后把返回的 `data.syncRevision` 原样放到 `baseRevision`，并设置 `confirmSync=true`。
- 如果平台配置在拉取后又被修改，`baseRevision` 会失效，后端返回 `409`；此时重新拉取 config、重新对比后再提交。
- 请求里的 `configJson` 推荐传 JSON 对象；后端也兼容历史 JSON 字符串。
- 如果 `sync.skills[].configJson` 里包含 `code`、`skillCode` 或 `externalSkillId`，且同 owner 下存在同 code 的 Skill Package，平台会自动挂载该 Skill Package。
- 平台按 `agentId + name + sourceType + configJson` 去重。保持 `configJson` 稳定，避免重复技能。
- 目标在前端按“执行任务”展示。它可以很快完成，也可以长期推进；AI 不需要维护整体百分比。
- 目标更新优先使用 config 返回的 `goals[].id`。如果未带 id，平台会按 `agentId + title + description + goalStatus + priority + dueTime` 跳过精确重复目标，避免 AI 重复上传相同目标。
- AI 可以在同一个目标下持续同步 `steps` 作为执行记录：每一步写 `title`、`description`、`status`、`sortOrder`，可选 `updatedAt`。前端只在有步骤时按完成数推导进度；没有步骤时只显示状态和“等待 AI 同步执行步骤”。
- 长任务建议每次完成一个阶段就复用同一个 `goals[].id` 更新步骤，不要为了记录进展创建重复目标。
- AI 通过 `/sync` 写入自己的技能快照、记忆、目标或自动挂载匹配 Skill Package 后，不需要 ack 这次写入；ack 只用于平台侧或人类用户造成的 pending 配置变更。
- 不要把 `sourceType` 写成 `skill_package`，这个值由前端挂载后平台自动生成。
- 如果你的目标是让前端技能库出现一个新技能，不要调用 `sync.skills`，要调用 `POST /api/ai/skills`。


删除过期或重复记忆时，使用 AI 侧删除接口。该接口需要 `memoryWrite`，只能删除当前 Token 可访问 Agent 下的记忆；后端会软删除 `agent_memory`，减少 `memoryCount`。这是 Agent 自己提交的状态清理，不会生成给当前 Agent 自己 ack 的 `config_changed` 事件。

```bash
curl -X DELETE "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/memories/$MEMORY_ID" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

删除过期或重复目标时，使用 AI 侧目标删除接口。该接口需要 `goalWrite`，只能删除当前 Token 可访问 Agent 下的目标；后端会软删除 `agent_goal`，减少 `goalCount`。这是 Agent 自己提交的状态清理，不会生成给当前 Agent 自己 ack 的 `config_changed` 事件。

```bash
curl -X DELETE "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/goals/$GOAL_ID" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```
## 上传或更新 Skill 包

如果你希望人类用户能在前端技能库看见并挂载你的技能，必须上传 Skill Package。这个接口只创建或更新 `skill_package` 和 `skill_file`，不会创建 `agent_skill_mount`，也不会生成 `config_changed` 事件。

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/skills" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Repository Reader Skill",
    "code": "repository-reader",
    "description": "读取仓库目录并总结模块职责。",
    "version": "1.0.0",
    "visibility": "private",
    "publishStatus": "draft",
    "runtimeEnvironments": ["shell"],
    "coreCapabilities": ["read-repo", "summarize-structure"],
    "files": [
      {
        "nodeType": "file",
        "name": "SKILL.md",
        "path": "SKILL.md",
        "language": "markdown",
        "content": "# Repository Reader Skill\n\n## 什么时候使用\n需要熟悉项目结构、模块职责或接口入口时使用。\n\n## 文件索引\n- workflows/usage.md：执行仓库读取流程。\n- workflows/config-event-listening.md：平台配置变更后重载文件树。\n- references/interface.md：读取目录、模块、接口字段说明。\n- examples/request.json：请求样例。\n- checklists/quality.md：完成前检查。\n\n## 安全边界\n只读取仓库文件，不上传密钥、Token 或用户隐私数据。\n"
      },
      {
        "nodeType": "file",
        "name": "usage.md",
        "path": "workflows/usage.md",
        "language": "markdown",
        "content": "# 使用流程\n\n1. 确认用户要读取的仓库范围。\n2. 扫描目录和入口文件。\n3. 汇总模块职责、接口和风险点。\n"
      },
      {
        "nodeType": "file",
        "name": "config-event-listening.md",
        "path": "workflows/config-event-listening.md",
        "language": "markdown",
        "content": "# 配置监听\n\n1. 定时轮询 events。\n2. 发现 config_changed 后先拉取 config?brief=true。\n3. 需要正文时按单个 Skill detail 或 memory detail 拉取。\n4. 应用完成后再 ack。\n"
      },
      {
        "nodeType": "file",
        "name": "interface.md",
        "path": "references/interface.md",
        "language": "markdown",
        "content": "# 接口说明\n\n这里放较长的接口、目录和领域说明。"
      },
      {
        "nodeType": "file",
        "name": "request.json",
        "path": "examples/request.json",
        "language": "json",
        "content": "{\"example\":\"read repository root and summarize modules\"}"
      },
      {
        "nodeType": "file",
        "name": "quality.md",
        "path": "checklists/quality.md",
        "language": "markdown",
        "content": "# 完成检查\n\n- 已说明读取范围。\n- 已避免输出密钥或隐私。\n- 已列出不确定项。\n"
      }
    ]
  }'
```

`POST /api/ai/skills` 会按同一 owner 下的 `code` upsert。`code` 已存在时更新，不重复创建。

上传后用列表接口确认技能已经创建：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/skills" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

如果需要读取完整文件树，再调用详情接口：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/skills/<SKILL_ID>" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

此时技能已在前端技能库可见，但还没有挂载到任何 Agent。挂载可以由登录态前端完成，对应后端接口是 `POST /api/agents/{agentId}/skill-mounts`，请求体包含 `skillId`、`mountStatus`、`configJson`。也可以由 AI sync 自动完成：在 `sync.skills[].configJson` 里带上这个 Skill Package 的 `code`。前端人工挂载成功后，后端会写入 `agent_skill_mount`、生成 `sourceType=skill_package` 的 `agent_skill` 快照，并创建 pending 的 `config_changed` 事件；AI sync 自动挂载只写入挂载关系和快照，不生成给当前 Agent 自己 ack 的事件。

文件树规则：

- `files` 是完整期望文件树。更新时只传新增文件会导致旧文件被替换掉。
- 只需要传 `nodeType=file` 的文件；后端会按 `path` 自动补齐文件夹。
- `path` 使用 `/`，不能为空，不能包含 `..`。
- 不传 `files` 或传空数组时，后端会生成默认 `SKILL.md`，生产同步不要这样做。

## 单个 Skill 文件过大怎么办

不要把所有内容塞进一个很长的 `SKILL.md`。平台 Skill 应该拆成“入口 + 流程 + 参考 + 样例 + 检查”的文件树：

```text
SKILL.md
workflows/usage.md
workflows/config-event-listening.md
references/api.md
references/domain.md
examples/requests.json
examples/responses.json
checklists/release.md
scripts/check_contract.py
```

规划方式：

- `SKILL.md`：只写用途、触发条件、输入输出、安全边界、读取顺序和文件索引。它是路由入口，不是大百科。
- `workflows/`：放 Agent 要执行的步骤，例如监听 `config_changed`、同步预览、上传 Skill Package、发布验证。
- `references/`：放完整长文档，比如接口手册、业务术语、设计背景。
- `examples/`：放请求、响应和配置样例。
- `checklists/`：放发布前、完成前、质量门禁类清单。
- `scripts/`：放脚本示例。Agent 拉取后不要默认执行脚本，必须按自己的沙箱策略判断。
- Agent 读取时先读每个 Skill 的 `SKILL.md`。只有任务需要时，再按 `SKILL.md` 的路径索引读取 `workflows/`、`references/`、`examples/`、`checklists/`。

这样可以避免上下文被单个大文件挤满，也能让挂载后的 Agent 明确知道下一步该读哪个文件。

## 轮询平台配置变更

当前 Agent 轮询 pending 事件：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/events" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

事件示例：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "2068000000000000001",
      "agentId": "2067000000000000001",
      "eventType": "config_changed",
      "eventStatus": "pending",
      "status": "pending",
      "payloadJson": "{\"reason\":\"skill_mounted\",\"payload\":{\"skillId\":\"2066\"}}",
      "createdAt": "2026-06-20"
    }
  ]
}
```

处理顺序必须是：

1. 拉取 events。
2. 如果存在 pending 的 `config_changed`，调用 `config?brief=true` 拉取轻量配置。
3. Agent 根据 brief 配置、事件 payload 和本地缓存决定是否调用单条 memory/detail 接口。
4. Agent 按 Skill detail 的 `files` 重建并重载 Skill 文件树，再应用平台侧配置变更。
5. 对已处理事件逐条 ack。

事件响应里 `status` 是兼容旧手册/客户端的别名，值与 `eventStatus` 一致；新接入优先读取 `eventStatus`。

不要在应用平台侧配置变更前 ack，否则该事件不会再次出现在 events 里。不要把自己的 `/sync` 上传结果当成需要 ack 的配置事件。

确认事件：

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/events/<EVENT_ID>/ack" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

## 拉取平台配置

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/config?brief=true" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

需要 `configRead` 权限。返回内容会按权限裁剪：

- 没有 `skillRead` 权限：`skills`、`skillMounts`、`skillPackages` 都是空数组。
- 没有 `memoryRead` 权限：`memories` 是空数组。
- 没有 `goalRead` 权限：`goals` 是空数组。

brief 返回结构示例，`files` 中不会包含 `content`：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "syncRevision": "2d2d12c2d8a0e8f6a5c5b1f6d0a7f9d1",
    "agent": {
      "id": "2069",
      "name": "Local Agent",
      "role": "研发助手",
      "description": "通过 Agent Token 自注册的平台智能体。"
    },
    "skills": [
      {
        "id": "3001",
        "name": "Repository Reader Skill",
        "sourceType": "skill_package",
        "mountStatus": "active"
      }
    ],
    "skillMounts": [
      {
        "id": "4001",
        "agentId": "2069",
        "skillId": "3001",
        "name": "Repository Reader Skill",
        "mountStatus": "active",
        "configJson": "{\"skillId\":\"3001\",\"code\":\"repository-reader\",\"version\":\"1.0.0\"}"
      }
    ],
    "skillPackages": [
      {
        "id": "3001",
        "name": "Repository Reader Skill",
        "code": "repository-reader",
        "files": [
          {
            "nodeType": "file",
            "name": "SKILL.md",
            "path": "SKILL.md",
            "language": "markdown",
            "size": 2560
          },
          {
            "nodeType": "file",
            "name": "usage.md",
            "path": "workflows/usage.md",
            "language": "markdown",
            "size": 1280
          },
          {
            "nodeType": "file",
            "name": "interface.md",
            "path": "references/interface.md",
            "language": "markdown",
            "size": 960
          },
          {
            "nodeType": "file",
            "name": "quality.md",
            "path": "checklists/quality.md",
            "language": "markdown",
            "size": 512
          }
        ]
      }
    ],
    "memories": [],
    "goals": []
  }
}
```

Agent 应这样应用配置：

- `syncRevision`：保存为下一次包含 `skills`、`memories` 或 `goals` 的 sync 请求里的 `baseRevision`；如果本地还没完成对比，不要提交写入。
- `agent`：更新本地角色名、职责描述、模型偏好等身份信息。
- `skills`：展示快照。不要只靠它学习文件内容。
- `skillMounts`：读取平台挂载关系、挂载状态和配置 JSON。
- `skillPackages`：brief 下只返回已挂载 Skill 的文件元数据，用于判断本地缓存是否需要刷新；学习文件正文时调用单个 Skill detail。
- `memories`：合并到长期记忆。
- `goals`：更新发展方向和执行任务。目标可以长期存在，AI 应复用 `goals[].id` 持续同步 `steps`，不需要填写整体百分比。

Skill 文件树处理规则：

- brief 下按 `skillPackages[].files[].path` 对比本地缓存；需要正文时调用 `GET /api/ai/skills/{idOrCode}` 或 `/detail`。
- 优先读取根目录 `SKILL.md`。
- 按 `SKILL.md` 的索引按需读取 `workflows/`、`references/`、`examples/`、`checklists/`；当前任务不需要的长文件不要提前加载。
- `scripts/` 默认不执行，只在 Skill 明确要求且运行环境允许时作为工具使用。
- 对相同 `skillPackages[].code` 做覆盖更新，避免重复学习同一个 Skill。
- 如果 `skillPackages` 为空，优先检查 Token 是否有 `skillRead`、Skill Package 是否已挂载到 Agent、`sync.skills[].configJson.code` 是否和 Skill Package 的 `code` 一致。

## 一次完整轮询示例

```bash
EVENTS_JSON="$(curl -sS -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/events" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN")"

echo "$EVENTS_JSON"
```

如果返回里存在 pending 的 `config_changed`，先拉取轻量配置：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/config?brief=true" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

如果事件 payload 给出了单条记忆 id，或 brief 配置显示某个 Skill 文件缓存缺失/大小变化，只拉取对应资源：

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/memories/<MEMORY_ID>" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"

curl -X GET "$LOBSTER_API_BASE_URL/api/ai/skills/<SKILL_ID_OR_CODE>/detail" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

Agent 必须先应用平台侧配置变更，再 ack；不要把自己的 `/sync` 上传结果当成需要 ack 的配置事件：

```bash
curl -X POST "$LOBSTER_API_BASE_URL/api/ai/events/<EVENT_ID>/ack" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

## 导出备份

```bash
curl -X GET "$LOBSTER_API_BASE_URL/api/ai/agents/$LOBSTER_AGENT_ID/backup" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

需要 `backupExport`。返回完整 Agent 资产 JSON 快照，包含 Agent 身份、同步技能、平台搭配、Skill 文件内容、记忆和目标，可用于迁移、克隆或给人类在前端“资产迁移”页面导入。

前端“资产迁移”还提供 ZIP 导出/导入：

- JSON：适合 API 调试、Agent 自己拉取、脚本处理。
- ZIP：适合完整迁移和长期备份，结构为 `manifest.json`、`agent.json`、`memories.json`、`goals.json`、`mounts.json`、`skills/{code}/skill.json`、`skills/{code}/{path}`。
- ZIP 中每个 Skill 的文件内容是独立文件，不只是路径引用。
- 如果只迁移局部资产，前端还提供“长期记忆包”和“Skill 文件包”：记忆包用于把背景、偏好、决策复制给其它 Agent；Skill ZIP 文件包用于在 Skill 编辑器导入/导出完整文件树。

## 排障流程

### AI 同步了几个 Skill，但前端技能库或挂载弹窗看不到

按顺序检查：

1. 是否只调用了 `POST /api/ai/agents/{agentId}/sync` 或在注册请求里传了 `skills`。这只写 `agent_skill` 展示快照，不会创建 `skill_package`。
2. 是否调用了 `POST /api/ai/skills`，并固定传入 `code`。这个接口才会写 `skill_package` 和 `skill_file`。
3. 是否用 `GET /api/ai/skills` 验证上传后的 Skill Package 在当前 Token owner 下可见。
4. Token 自检返回的 `ownerId` 是否和前端登录用户一致。同一用户的 `private` Skill 可以挂载；其他用户只能挂载 `public + published` Skill。
5. 更新 Skill 时是否传了完整 `files`。只传新增文件会让旧文件被替换掉。

### 前端显示挂载成功，但 Agent 页面或本地看不到正确配置

按顺序检查：

1. Token 是否有 `configRead` 和 `skillRead` 权限。
2. `LOBSTER_AGENT_ID` 是否是 Token 绑定的 `agentId`。
3. 是否真的写入了 `agent_skill_mount`。只有上传 Skill Package 不会让 config 返回 `skillPackages`；需要前端手动挂载，或 AI sync 通过 `configJson.code` 自动匹配挂载。
4. 是否先 ack 了平台侧配置变更事件。ack 后 events 不再返回该事件，可以直接调用 config 兜底拉取；AI 自己的 `/sync` 写入不需要 ack。
5. config 返回的 `skillPackages` 是否为空。学习文件树必须读 `skillPackages[].files`。
6. Agent 是否只读了 `skills`。`skills` 是展示快照，不包含完整文件树。
7. Agent 是否按 `code` 覆盖本地旧版本，而不是追加成重复技能。

### 出现重复或错误数据

按顺序检查：

1. `sync.skills[].configJson` 是否稳定。自报快照去重会使用 `agentId + name + sourceType + configJson`，自动挂载也会读取其中的 `code`、`skillCode` 或 `externalSkillId`。
2. `POST /api/ai/skills` 是否固定 `code`。Skill Package 按 `ownerId + code` upsert，不固定 code 会生成多个包。
3. 是否把平台挂载生成的 `sourceType=skill_package` 快照又通过 `sync.skills` 回传。不要同步回传平台挂载快照。
4. 是否误传空 `files`，导致平台只剩默认 `SKILL.md`。
5. 是否把 `agent_skill` 当作 Skill Package 使用。真正的 Skill 文件内容只在 `skill_package + skill_file` 里。
6. 重复目标是否没有复用 `goals[].id`。更新已有目标时带上 id；长期任务的进展写入同一目标的 `steps`，不要创建多个同名目标；确实要清理重复目标时调用 `DELETE /api/ai/agents/{agentId}/goals/{goalId}`。
7. `SKILL.md` 是否有清晰索引。大文件拆到 `workflows/`、`references/`、`examples/`、`checklists/` 后，主文件必须告诉 Agent 何时读取哪个文件。

## 错误处理

统一响应结构：

```json
{
  "code": 403,
  "message": "令牌缺少权限：skillRead",
  "data": null
}
```

调用方必须检查响应体 `code`：

```bash
curl -sS -X GET "$LOBSTER_API_BASE_URL/api/ai/token/me" \
  -H "Authorization: Bearer $LOBSTER_AGENT_TOKEN"
```

常见错误：

- `401`：Token 缺失、无效或过期。停止同步并要求重新发放 Token。
- `403`：缺少权限或访问了不属于该 Token 的 Agent。调用 token/me 检查权限。
- `404`：Agent、事件或 Skill 不存在。重新拉取 token/me、config 和 Skill 列表。
- `400`：请求体不完整或路径非法。检查必填字段，例如 `name`、`role`、`title`、`files[].path`。
- `409`：同步前未拉取平台配置、未带 `baseRevision`、未设置 `confirmSync=true`，或平台配置已在拉取后变化。重新调用 `GET /api/ai/agents/{agentId}/config?brief=true`，对比 `skills`、`memories`、`goals`、`skillPackages` 后再提交。

## 安全边界

- 不把完整 Agent Token 写入 Skill 文件、记忆、目标或普通日志。
- 上传 Skill 只上传工具说明、脚本示例和接口样例，不上传用户敏感配置。
- 备份 JSON 包含记忆和目标，应按敏感数据处理。
- Agent 拉取到的 `scripts/` 是示例脚本，执行前必须按自己的沙箱策略做权限控制。
