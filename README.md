# 知栈 Lobster

知栈是一个面向 AI Agent 的资产管理与协作平台，用来统一管理智能体身份、技能包、长期记忆、执行目标、同步配置和迁移备份。它的目标不是再做一个聊天窗口，而是让个人和团队把 Agent 积累出来的能力沉淀下来、迁移出去、复用起来。

## 教程

- GitHub 开源地址：[https://github.com/screameegg/agent-repo](https://github.com/screameegg/agent-repo)
- 小红书教程：[https://www.xiaohongshu.com/explore/6a4a4a89000000000702ae33?xsec_token=ABXeNFH3yUmhNx5X4kQNJmT5zTnzAXeQs6tAgniKc7cug=&xsec_source=pc_user](https://www.xiaohongshu.com/explore/6a4a4a89000000000702ae33?xsec_token=ABXeNFH3yUmhNx5X4kQNJmT5zTnzAXeQs6tAgniKc7cug=&xsec_source=pc_user)

## 适合谁

### 个人智能体管理

把自己常用的 Agent 配置、系统提示词、技能、记忆和目标保存成可管理资产。换电脑、换模型、换工具时，不需要从零重新配置；也能清楚看到每个 Agent 记住了什么、会用哪些技能、当前正在推进什么目标。

### 智能体迁移与备份

支持导出和导入 Agent 资产，包括身份信息、技能挂载、Skill 文件树、长期记忆和目标步骤。适合把本地实验迁移到服务器，把个人 Agent 升级成团队模板，或者在不同运行环境之间复制一套成熟的 Agent 能力。

### 团队智能体协作与写作

团队可以把项目规范、写作风格、资料整理流程、接口说明和交付标准做成 Skill Package，让多个 Agent 共享同一套能力基线。适合研发文档、运营内容、方案撰写、知识库整理和多角色 Agent 协作。

## 核心能力

- **Agent 管理**：创建和维护多个智能体身份，集中管理角色、提示词、模型偏好、头像、记忆、目标和同步状态。
- **Skill 能力库**：用文件树形式保存可复用技能，支持 `SKILL.md`、参考资料、示例和脚本说明，不只保存一段提示词。
- **记忆管理**：沉淀事实、偏好、项目背景和经验，支持 Agent 在不同会话和环境之间继承上下文。
- **目标与步骤**：把长期任务拆成可跟踪目标和执行步骤，让人和 Agent 都能看到进度。
- **Agent Token 接入**：外部 Agent 可以通过 Token 注册、拉取配置、同步状态、读写记忆和目标。
- **迁移备份**：导出完整 Agent 资产，支持克隆、恢复、环境迁移和长期归档。
- **团队治理**：提供用户、权限、Skill 审核和公告管理，便于团队内部沉淀和复用 AI 能力。

## 仓库结构

```text
agent-repo/
  lobster-front/   # 前端应用，提供 Web 控制台
  lobster-back/    # 后端服务、部署脚本和数据库初始化脚本
```

<details>
<summary>技术部署 / 点击查看</summary>

## 技术栈

### 前端

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios

### 后端

- Spring Boot
- MyBatis-Plus
- MySQL
- Redis / Redisson
- Sa-Token
- Docker Compose

## 快速部署

发布版由 `lobster-back/docker-compose.yml` 统一编排。

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

启动服务：

```bash
docker compose up -d --build
```

默认访问地址：

```text
http://服务器IP
```

如果服务器的 80 端口已被占用，可以在 `.env` 中调整：

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

前端开发代理在 `lobster-front/vite.config.ts` 中配置，默认把 `/api` 和 `/uploads` 转发到 `http://localhost:8080`。如果后端运行端口不同，需要同步调整代理目标。

## 常用命令

### Docker 部署

```bash
cd lobster-back
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose down
docker compose up -d --build
```

### 前端检查

```bash
cd lobster-front
npm run lint
npm run build
```

### 后端检查

```bash
cd lobster-back
mvn test
```

## 环境变量与敏感信息

- 不要提交 `.env`、数据库密码、Redis 密码、Agent Token、管理员密码或真实生产配置。
- 使用 `.env.example` 作为配置模板。
- 上传文件目录 `uploads/` 不进入 Git，由部署环境或 Docker volume 持久化。
- 构建产物、依赖目录和日志文件已在根目录 `.gitignore` 中排除。

## 常见问题

### 前端接口 502 或上传头像失败

确认后端服务正在运行，并检查前端代理或 Nginx 是否把 `/api` 转发到正确的后端端口。

```bash
cd lobster-back
docker compose logs -f backend
```

### 上传后的图片访问不到

确认 Nginx 配置包含 `/uploads/` 反向代理，并检查后端上传目录是否存在。

```bash
cd lobster-back
docker compose exec backend ls -la /app/uploads
```

### Docker Compose 启动失败

先确认 `lobster-back/.env` 中已经设置必填密码：

```env
MYSQL_ROOT_PASSWORD=
MYSQL_PASSWORD=
REDIS_PASSWORD=
LOBSTER_ADMIN_PASSWORD=
```

</details>

## 相关文档

- 后端部署说明：`lobster-back/README.md`
- 前端说明：`lobster-front/README.md`
- AI Agent API：`lobster-front/public/docs/ai-agent-api.md`
