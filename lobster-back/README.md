# Lobster 一键部署

Lobster 是一个 Agent / Skill 备份、同步、审核与管理平台。发布版使用 Docker Compose 一键启动前端、后端、MySQL 和 Redis。

## 目录要求

服务器上保持前后端仓库同级：

```text
agent-repo/
  lobster-back/
  lobster-front/
```

进入后端目录执行部署命令：

```bash
cd lobster-back
```

## 环境要求

- Docker 24+
- Docker Compose v2+
- 服务器开放 `80` 端口

## 快速启动

```bash
cp .env.example .env
```

编辑 `.env`，至少修改以下密码：

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

或使用脚本：

```bash
sh deploy/start.sh
```

访问：

```text
http://服务器IP
```

## 默认管理员

管理员账号由 `.env` 控制：

```env
LOBSTER_ADMIN_LOGIN_ID=admin
LOBSTER_ADMIN_USERNAME=admin
LOBSTER_ADMIN_PASSWORD=change-this-admin-password
```

首次启动时后端会按配置初始化管理员。

## 服务说明

Compose 会启动：

- `mysql`：MySQL 8.4，保存业务数据
- `redis`：Redis 7.4，保存登录态、验证码、限流数据
- `backend`：Spring Boot 后端，内部端口 `8080`
- `frontend`：Nginx 托管前端静态资源，对外暴露 `80`

前端 Nginx 会反向代理：

- `/api/*` 到后端
- `/uploads/*` 到后端上传资源

## 常用命令

查看服务：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

查看后端日志：

```bash
docker compose logs -f backend
```

停止服务：

```bash
docker compose down
```

重新构建并启动：

```bash
docker compose up -d --build
```

## 数据与上传文件

数据使用 Docker volume 持久化：

- `lobster_mysql_data`
- `lobster_redis_data`
- `lobster_uploads`

停止容器不会删除数据。只有执行下面命令才会删除数据：

```bash
docker compose down -v
```

## 配置说明

`.env` 常用配置：

```env
FRONTEND_PORT=80
SQL_INIT_MODE=always
CAPTCHA_REQUIRED=false
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=5MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=5MB
```

如果服务器 80 端口被占用，可以改：

```env
FRONTEND_PORT=18080
```

然后访问：

```text
http://服务器IP:18080
```

## 常见问题

### 前端打开后接口 502

检查后端是否启动成功：

```bash
docker compose logs -f backend
```

重点看 MySQL、Redis 连接配置和 `.env` 密码。

### MySQL 一直 unhealthy

检查 `.env` 是否设置了 `MYSQL_ROOT_PASSWORD`，并查看日志：

```bash
docker compose logs -f mysql
```

### Redis 一直 unhealthy

检查 `.env` 是否设置了 `REDIS_PASSWORD`：

```bash
docker compose logs -f redis
```

### 上传图片访问不到

确认 Nginx 配置仍然包含 `/uploads/` 反向代理，并检查后端上传目录 volume：

```bash
docker compose exec backend ls -la /app/uploads
```

### 修改代码后没有生效

重新构建：

```bash
docker compose up -d --build
```
