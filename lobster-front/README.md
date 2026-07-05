# 知栈 Frontend

前端发布由后端仓库的 Docker Compose 统一编排。

保持目录结构：

```text
agent-repo/
  lobster-back/
  lobster-front/
```

进入后端仓库执行：

```bash
cd ../lobster-back
cp .env.example .env
docker compose up -d --build
```

前端容器使用 Nginx 托管构建后的静态资源，并通过后端仓库的 `deploy/nginx.conf` 反向代理 `/api` 和 `/uploads`。