# agent-repo

知栈 / Lobster 是一个 Agent 与 Skill 管理平台，用于管理 AI Agent 身份、Skill 能力包、访问令牌、同步数据和平台审核流程。仓库采用前后端分离结构，前端负责 Web 控制台，后端提供认证、Agent 管理、Skill 市场、文件上传和 AI Agent API。

## 功能概览

- Agent 管理：创建、编辑和查看 Agent 身份、头像、角色、系统提示词、记忆和目标。
- Skill 管理：创建 Skill 包、维护文件树、发布审核、市场展示和安装管理。
- AI Agent API：通过 Agent Token 让外部 Agent 注册、同步配置、读写记忆和目标。
- 账户中心：用户资料、头像上传、访问令牌和权限管理。
- 管理后台：用户管理、Skill 审核和公告管理。
- 一键部署：使用 Docker Compose 启动前端、后端、MySQL 和 Redis。

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

## 目录结构

```text
agent-repo/
  lobster-front/   # 前端应用，提供 Web 控制台
  lobster-back/    # 后端服务、部署脚本和数据库初始化脚本
```

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

## 相关文档

- 后端部署说明：`lobster-back/README.md`
- 前端说明：`lobster-front/README.md`
- AI Agent API：`lobster-front/public/docs/ai-agent-api.md`
