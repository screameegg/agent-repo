# 知栈 Lobster

知栈 Lobster 是一个面向 AI Agent 的资产管理、技能沉淀与同步协作平台。它不只是一个聊天入口，而是把 Agent 的身份、系统提示词、Skill 文件树、长期记忆、执行目标、平台配置、访问令牌和迁移备份统一管理起来，让个人和团队可以持续积累、复用、迁移和治理自己的 AI 能力。

简单说，知栈解决的是一个越来越常见的问题：Agent 用久之后真正有价值的不是某一次对话，而是它沉淀下来的角色设定、工作方法、项目上下文、可调用技能、长期任务和可迁移资产。知栈把这些内容从零散提示词和本地文件中抽出来，变成可视化、可授权、可同步、可备份的平台资产。

## 项目亮点

- **Agent 资产仓库**：集中管理多个 Agent 的身份、角色定位、系统提示词、模型偏好、头像、技能、记忆、目标和外部关联状态。
- **Skill 文件树**：Skill 不再只是一段 prompt，而是包含 `SKILL.md`、`workflows/`、`references/`、`examples/`、`checklists/`、`scripts/` 的结构化能力包。
- **长期记忆与目标管理**：沉淀事实、偏好、项目背景、工作流经验和长期目标步骤，让 Agent 在跨会话、跨平台、跨机器时继承上下文。
- **Agent Token 接入**：外部 AI Agent 可以通过 `/api/ai/**` 使用 Token 自注册、拉取配置、同步技能/记忆/目标、确认配置事件和导出备份。
- **Token 读写分离**：Token 权限拆分为 `skillRead`、`skillWrite`、`memoryRead`、`memoryWrite`、`goalRead`、`goalWrite`、`configRead`、`agentSync`、`agentRegister`、`backupExport`，可按场景发放只读、同步、迁移等不同权限。
- **轻量读取与按需加载**：AI 可先读取 `config?brief=true` 获取 Skill 文件元数据、记忆和目标摘要，需要正文时再按单个 Skill 或单条记忆拉取，减少上下文浪费。
- **配置变更事件**：平台侧挂载 Skill、修改记忆、调整目标后，会生成 `config_changed` 事件，Agent 轮询后拉取配置并 ack，形成可审计的同步闭环。
- **迁移与备份**：支持 Agent 完整 JSON/ZIP 备份，覆盖身份、挂载关系、Skill 文件内容、长期记忆和目标步骤，适合克隆、恢复、归档和跨环境迁移。
- **团队治理**：提供用户、管理员、Skill 审核、公告、反馈和权限管理，适合团队内部建设可复用的 AI 能力库。
- **一键部署**：前端、后端、MySQL、Redis 由 Docker Compose 统一编排，适合本地试用、私有化部署和团队服务器部署。

## 适合谁

### 个人 AI Agent 用户

如果你已经在 Codex、Claude Code、Cursor、通用 API Agent 或其它 AI 工具里积累了很多提示词、规范、记忆和任务经验，知栈可以把这些内容整理成可检索、可迁移、可复用的资产。换电脑、换模型、换工具时，不需要重新解释背景和重新配置 Agent。

### 团队 AI 能力运营者

团队可以把项目规范、代码评审标准、写作风格、业务资料、接口说明、投放流程、客服口径等沉淀为 Skill Package，再挂载给不同 Agent 使用。新人或新 Agent 接入时，只需要读取平台配置，就能继承同一套能力基线。

### Agent 平台与自动化开发者

知栈提供一套清晰的 AI 接入协议。外部 Agent 可以通过 Token 自注册、同步自身状态、读取平台分配的 Skill 文件树、更新长期记忆和目标，并在平台侧配置变更后自动重载能力。

### 私有化部署场景

项目支持 Docker Compose 部署，数据落在自有 MySQL、Redis 和上传卷中。适合不希望把 Agent 资产、内部 Skill、项目记忆和业务流程托管到第三方 SaaS 的团队。

## 核心概念

### Agent

Agent 是平台管理的智能体主体，包含名称、角色、说明、系统提示词、头像、基座模型、技能数量、记忆数量、目标数量和外部 Token 关联状态。一个用户可以维护多个 Agent，用于研发、运营、写作、数据分析、客服、知识库整理等不同任务。

### Skill Package

Skill Package 是结构化技能包，写入 `skill_package` 和 `skill_file`。它可以在前端技能库中展示、编辑、审核、发布、安装和挂载。推荐结构：

```text
SKILL.md
workflows/usage.md
workflows/config-event-listening.md
references/api.md
examples/request.json
checklists/release.md
scripts/optional-tool.py
```

### Memory

Memory 用来保存 Agent 的长期上下文，包括事实、偏好、工作流、项目背景和经验结论。平台支持按重要程度、类型和来源管理记忆，Agent Token 也可以按权限读取、写入或删除自己的记忆。

### Goal

Goal 用来管理长期任务和执行步骤。Agent 可以把目标拆成 steps，并在任务推进过程中持续同步状态。这样人类用户和 Agent 都能看到当前目标、优先级、截止时间和执行进展。

### Agent Token

Agent Token 是外部 AI 访问知栈的授权凭证。平台只保存 Token 哈希，不保存明文 Token。Token 可以绑定到某个 Agent，也可以在授权范围内用于自注册或迁移。权限按读写拆分，便于最小权限接入。

## Token 读写分离

| 权限 | 用途 |
| --- | --- |
| `agentRegister` | 允许 Agent 使用 Token 自注册并绑定平台 Agent |
| `agentSync` | 允许 Agent 上传身份、技能快照、记忆和目标 |
| `configRead` | 允许 Agent 拉取平台配置、轮询事件并 ack |
| `skillRead` | 允许读取技能快照、挂载关系和 Skill Package 文件树 |
| `skillWrite` | 允许上传或更新 Skill Package，通过 sync 自动挂载匹配的 Skill |
| `memoryRead` | 允许读取 Agent 长期记忆 |
| `memoryWrite` | 允许同步写入或删除 Agent 长期记忆 |
| `goalRead` | 允许读取 Agent 长期目标和步骤 |
| `goalWrite` | 允许同步写入或删除 Agent 长期目标 |
| `backupExport` | 允许导出完整 Agent 备份，用于迁移、克隆和归档 |

常见授权方式：

- **只读拉取 Token**：开启 `configRead`、`skillRead`、`memoryRead`、`goalRead`。适合 Agent 读取平台配置，但不允许写回。
- **正常同步 Token**：开启 `agentRegister`、`agentSync`、`configRead`、`skillRead`、`skillWrite`、`memoryRead`、`memoryWrite`、`goalRead`、`goalWrite`。适合长期运行的 Agent。
- **迁移备份 Token**：在同步权限基础上额外开启 `backupExport`。适合克隆、恢复、跨机器迁移和归档。

## AI Agent 接入流程

生产部署时，前端会通过 Nginx 把同源 `/api` 代理到后端。Agent 通常只需要知道前端站点地址和自己的 Token：

```bash
export LOBSTER_API_BASE_URL="https://your-zhizhan.example.com"
export LOBSTER_AGENT_TOKEN="<AGENT_TOKEN>"
```

推荐流程：

1. 下载并读取接入手册：`GET /docs/ai-agent-api.md`。
2. 调用 `GET /api/ai/token/me` 检查 Token、权限和绑定 Agent。
3. 如果 Token 尚未绑定 Agent，并且具备 `agentRegister`，调用 `POST /api/ai/agents/register` 自注册。
4. 如果要让前端技能库看见 Skill，调用 `POST /api/ai/skills` 上传或更新 Skill Package。
5. 写入技能、记忆或目标前，先调用 `GET /api/ai/agents/{agentId}/config?brief=true` 获取 `syncRevision` 并生成同步预览。
6. 用户确认同步范围后，调用 `POST /api/ai/agents/{agentId}/sync`，并传入 `baseRevision` 和 `confirmSync=true`。
7. Agent 定期调用 `GET /api/ai/agents/{agentId}/events` 轮询 `config_changed`。
8. 发现配置变更后，先拉取 brief 配置，必要时再拉取单个 Skill detail 或单条 memory detail。
9. Agent 应用平台侧配置后，调用 `POST /api/ai/events/{eventId}/ack`。
10. 需要迁移时，调用 `GET /api/ai/agents/{agentId}/backup` 导出完整备份。

完整接入细节见：[AI Agent API 手册](lobster-front/public/docs/ai-agent-api.md)。

## 同步模型

知栈把“平台配置”和“Agent 自身状态”分开处理：

- **平台到 Agent**：用户在前端挂载 Skill、修改记忆、调整目标或更新 Agent 配置后，平台生成 `config_changed` 事件。Agent 轮询事件，拉取 brief 配置，按需下载 Skill 文件正文，应用后 ack。
- **Agent 到平台**：Agent 使用 `/sync` 同步自己的身份、技能快照、长期记忆和目标步骤。涉及技能、记忆或目标写入时，必须先拉取最新配置并提交 `baseRevision`，避免覆盖平台侧新变化。
- **Skill Package 与 Agent Skill 分离**：`POST /api/ai/skills` 创建的是技能库可见的 Skill Package；`sync.skills` 写入的是 Agent 详情页展示用技能快照。
- **brief 优先**：Agent 先用 `config?brief=true` 判断文件是否变化，只在需要时读取 Skill detail，避免把整份技能库塞进上下文。

## 功能模块

- **Agent 仓库**：创建、查看、删除和管理 Agent。
- **Agent 详情**：查看身份、技能、长期记忆、目标步骤和同步配置。
- **技能市场**：搜索、查看、安装和发布 Skill Package。
- **Skill 编辑器**：编辑 Skill 元数据和文件树，支持结构化 Skill 包维护。
- **资产迁移**：导入/导出 Agent JSON/ZIP 备份、长期记忆包和 Skill 文件包。
- **访问令牌**：创建、查看、禁用和删除 Agent Token，并配置细粒度权限。
- **通知中心与管理后台**：支持通知、用户管理、Skill 审核、反馈管理和公告管理。

## 技术架构

```text
agent-repo/
  lobster-front/   # React + TypeScript + Vite Web 控制台
  lobster-back/    # Spring Boot 后端、数据库脚本、部署脚本、Docker Compose
```

前端：React 19、TypeScript、Vite、Tailwind CSS、Zustand、Axios、Monaco Editor、lucide-react。

后端：Java 17、Spring Boot 3.5、MyBatis-Plus、MySQL 8、Redis / Redisson、Sa-Token、Knife4j / OpenAPI、Docker Compose。

## 快速部署

发布版由 `lobster-back/docker-compose.yml` 统一编排，会启动前端、后端、MySQL 和 Redis。

```bash
cd lobster-back
cp .env.example .env
```

编辑 `lobster-back/.env`，至少修改以下配置：

```env
MYSQL_ROOT_PASSWORD=change-this-root-password
MYSQL_PASSWORD=change-this-app-password
REDIS_PASSWORD=change-this-redis-password
LOBSTER_ADMIN_PASSWORD=change-this-admin-password
```

启动：

```bash
docker compose up -d --build
```

默认访问：

```text
http://服务器IP
```

如果服务器 80 端口已被占用，可以在 `.env` 中调整：

```env
FRONTEND_PORT=18080
```

然后访问：

```text
http://服务器IP:18080
```

## 本地开发

### 后端

后端默认读取 `application-dev.yml`。本地开发前需要准备 MySQL 和 Redis，并通过环境变量或本地配置提供连接信息。

```bash
cd lobster-back
mvn spring-boot:run
```

常用环境变量：

```env
MYSQL_URL=jdbc:mysql://localhost:3306/lobster_dev?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
MYSQL_USERNAME=lobster
MYSQL_PASSWORD=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 前端

```bash
cd lobster-front
npm install
npm run dev
```

开发服务默认运行在：

```text
http://localhost:3000
```

前端开发代理在 `lobster-front/vite.config.ts` 中配置，默认把 `/api` 和 `/uploads` 转发到 `http://localhost:8080`。

## 常用命令

```bash
# Docker 部署
cd lobster-back
docker compose ps
docker compose logs -f
docker compose down
docker compose up -d --build

# 前端检查
cd lobster-front
npm run lint
npm run build

# 后端检查
cd lobster-back
mvn test
```

## 安全建议

- 不要提交 `.env`、数据库密码、Redis 密码、Agent Token、管理员密码或真实生产配置。
- Agent Token 只在创建时展示明文，平台保存哈希，不应写入 Skill 文件、记忆、目标或普通日志。
- 备份 JSON/ZIP 包含 Agent 身份、Skill 文件、长期记忆和目标，应按敏感数据处理。
- 给外部 Agent 发放 Token 时优先使用最小权限，只在迁移或克隆场景开启 `backupExport`。
- Agent 执行 Skill 包中的 `scripts/` 前，应按自身运行环境和沙箱策略确认权限。

## 常见问题

### AI 同步了 Skill，但前端技能库看不到

通常是因为只调用了 `/api/ai/agents/{agentId}/sync`。`sync.skills` 写的是 Agent 技能快照，不会创建技能库里的 Skill Package。需要调用 `POST /api/ai/skills`，并使用稳定的 `code`。

### Agent 拉不到 Skill 文件正文

先确认 Token 具备 `configRead` 和 `skillRead`，并且 Skill Package 已挂载到该 Agent。`config?brief=true` 只返回文件元数据，需要正文时调用 `GET /api/ai/skills/{idOrCode}` 或 `/detail`。

### 同步返回 409

写入技能、记忆或目标前没有先拉取最新配置，或 `baseRevision` 已过期。重新调用 `GET /api/ai/agents/{agentId}/config?brief=true`，生成同步预览后再提交 `confirmSync=true`。

## 相关链接

- GitHub 开源地址：[https://github.com/screameegg/agent-repo](https://github.com/screameegg/agent-repo)
- 小红书教程：[https://www.xiaohongshu.com/explore/6a4a4a89000000000702ae33](https://www.xiaohongshu.com/explore/6a4a4a89000000000702ae33)
- 后端部署说明：[lobster-back/README.md](lobster-back/README.md)
- 前端说明：[lobster-front/README.md](lobster-front/README.md)
- AI Agent API：[lobster-front/public/docs/ai-agent-api.md](lobster-front/public/docs/ai-agent-api.md)

---

# Lobster

Lobster is an AI Agent asset management, skill orchestration, and synchronization platform. It helps individuals and teams manage the assets that make an Agent useful over time: identity, system prompts, structured skills, long-term memory, goals, configuration events, access tokens, and portable backups.

Lobster is not another chat window. It is an operational layer for AI Agents. Instead of leaving valuable Agent behavior scattered across local files, prompts, notes, and one-off conversations, Lobster turns those capabilities into assets that can be reviewed, authorized, reused, synchronized, and migrated.

## Why Lobster

- **Agent repository**: Manage multiple Agents with roles, prompts, model preferences, avatars, memories, goals, skills, and token bindings.
- **Structured Skill Packages**: Store reusable Agent capabilities as file trees with `SKILL.md`, workflows, references, examples, checklists, and optional scripts.
- **Long-term memory and goals**: Preserve project context, facts, preferences, workflows, decisions, objectives, and execution steps across sessions and environments.
- **Agent Token API**: Let external Agents register themselves, pull configuration, sync status, update memories and goals, upload skills, ack configuration changes, and export backups through `/api/ai/**`.
- **Read/write permission separation**: Split token capabilities into `skillRead`, `skillWrite`, `memoryRead`, `memoryWrite`, `goalRead`, `goalWrite`, `configRead`, `agentSync`, `agentRegister`, and `backupExport`.
- **Brief-first loading**: Agents can read lightweight file metadata first and fetch full Skill content only when needed, reducing context usage.
- **Portable backups**: Export complete Agent assets as JSON or ZIP, including identity, mounted skills, Skill files, memories, and goals.
- **Private deployment**: Run the full stack with Docker Compose using your own MySQL, Redis, backend, and frontend services.

## Core Model

Lobster separates four important concepts:

- **Agent**: The managed AI worker identity, including role, description, system prompt, model preference, memory count, goal count, and skill state.
- **Skill Package**: A reusable file-tree capability stored in the platform skill library. It is the durable asset humans can review, edit, publish, install, and mount.
- **Agent Skill Snapshot**: A lightweight skill status reported by an Agent through sync. It is useful for display, but it is not the same as a Skill Package.
- **Configuration Event**: A pending platform-side change that tells an Agent to refresh its configuration.

Calling `/sync` with `skills` updates the Agent's displayed skill snapshot. Creating a reusable Skill in the platform requires `POST /api/ai/skills`. Mounting a Skill Package can be done in the frontend or automatically through sync when `configJson.code` matches an owned Skill Package.

## Agent Token Permissions

| Permission | Capability |
| --- | --- |
| `agentRegister` | Self-register and bind an Agent |
| `agentSync` | Upload Agent identity, skill snapshots, memories, and goals |
| `configRead` | Pull configuration, poll events, and ack events |
| `skillRead` | Read skills, mounts, and Skill Package file trees |
| `skillWrite` | Upload or update Skill Packages and auto-mount matched skills through sync |
| `memoryRead` | Read Agent memories |
| `memoryWrite` | Write or delete Agent memories |
| `goalRead` | Read Agent goals and steps |
| `goalWrite` | Write or delete Agent goals |
| `backupExport` | Export complete Agent backups |

Recommended profiles:

- **Read-only pull**: `configRead`, `skillRead`, `memoryRead`, `goalRead`.
- **Normal sync**: `agentRegister`, `agentSync`, `configRead`, `skillRead`, `skillWrite`, `memoryRead`, `memoryWrite`, `goalRead`, `goalWrite`.
- **Migration**: normal sync plus `backupExport`.

## External Agent Flow

1. Download and read `/docs/ai-agent-api.md`.
2. Call `GET /api/ai/token/me` to inspect token permissions and binding state.
3. If needed, call `POST /api/ai/agents/register` to self-register.
4. Upload reusable skills with `POST /api/ai/skills`.
5. Pull `GET /api/ai/agents/{agentId}/config?brief=true` before writing skills, memories, or goals.
6. Generate a sync preview, then submit `/sync` with `baseRevision` and `confirmSync=true`.
7. Poll `/events` for `config_changed`.
8. Pull brief configuration and fetch Skill details only when file content is needed.
9. Apply the platform-side change, then ack the event.
10. Export `/backup` when migration or cloning is required.

Full details are available in [AI Agent API](lobster-front/public/docs/ai-agent-api.md).

## Stack

Frontend: React 19, TypeScript, Vite, Tailwind CSS, Zustand, Axios, Monaco Editor.

Backend: Java 17, Spring Boot 3.5, MyBatis-Plus, MySQL 8, Redis / Redisson, Sa-Token, Knife4j / OpenAPI, Docker Compose.

## Quick Start

```bash
cd lobster-back
cp .env.example .env
```

Update required passwords in `.env`:

```env
MYSQL_ROOT_PASSWORD=change-this-root-password
MYSQL_PASSWORD=change-this-app-password
REDIS_PASSWORD=change-this-redis-password
LOBSTER_ADMIN_PASSWORD=change-this-admin-password
```

Start the stack:

```bash
docker compose up -d --build
```

Open:

```text
http://your-server-ip
```

## Development

```bash
# backend
cd lobster-back
mvn spring-boot:run

# frontend
cd lobster-front
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:3000`.

## Documentation

- Backend deployment: [lobster-back/README.md](lobster-back/README.md)
- Frontend notes: [lobster-front/README.md](lobster-front/README.md)
- AI Agent API: [lobster-front/public/docs/ai-agent-api.md](lobster-front/public/docs/ai-agent-api.md)
