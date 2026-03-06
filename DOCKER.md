# Docker 部署说明

## 本地构建

**在 Mac (M1/M2) 或 ARM 本机构建、要放到 x86 服务器运行时，必须指定平台：**

```bash
docker build --platform linux/amd64 -t astro-blog-x86 .
```

仅在 x86 本机构建且部署到 x86 服务器时可用：

```bash
docker build -t astro-blog .
```

## 本地运行

```bash
docker run -d -p 8080:8080 --name astro astro-blog
```

指定端口与自动重启：

```bash
docker run -d -p 3000:8080 -e PORT=8080 --restart unless-stopped --name astro astro-blog
```

## 使用 Docker Compose

```bash
# 构建并后台运行
docker compose up -d --build

# 查看日志
docker compose logs -f web

# 停止
docker compose down
```

## 导出镜像并上传服务器

**本机：导出为 tar**

```bash
docker save astro-blog -o astro-blog.tar
```

**本机：上传到服务器**

```bash
scp astro-blog.tar 用户@服务器IP:~/
```

**服务器：加载并运行**

```bash
docker load -i ~/astro-blog.tar
docker run -d -p 8080:8080 --restart unless-stopped --name astro astro-blog
```

## 使用镜像仓库（Docker Hub）

**本机：打标签并推送**

```bash
docker tag astro-blog 你的用户名/astro-blog
docker login
docker push 你的用户名/astro-blog
```

**服务器：拉取并运行**

```bash
docker pull 你的用户名/astro-blog
docker run -d -p 8080:8080 --restart unless-stopped --name astro 你的用户名/astro-blog
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `docker images astro-blog` | 查看镜像 |
| `docker ps` | 查看运行中的容器 |
| `docker stop astro` | 停止容器 |
| `docker rm astro` | 删除容器 |
| `docker rmi astro-blog` | 删除镜像 |
| `docker logs -f astro` | 查看容器日志 |

## 常见问题

**`exec format error`**：本机是 ARM（如 Mac M1/M2），服务器是 x86。需按上文用 `--platform linux/amd64` 重新构建后再导出/上传。

**`--platform linux/amd64` 构建卡住或极慢**：在 ARM Mac 上为 amd64 构建会走 QEMU 模拟，CPU/IO 都很慢，`pnpm install` 和 `pnpm build` 可能跑 10～30 分钟，看起来像卡死。可选：

1. **在服务器上构建（推荐）**：把代码上传到服务器（git clone 或 scp 项目），在服务器上执行：
   ```bash
   cd /path/to/astro-learn
   docker build -t astro-blog .
   docker run -d -p 8080:8080 --restart unless-stopped --name astro astro-blog
   ```
2. **本机继续等**：确认 Docker 未退出、无报错，多等一会（尤其是 `RUN pnpm install` / `RUN pnpm build` 两步）。
3. **本机加大资源**：Docker Desktop → Settings → Resources，把 CPU、内存调大后再重试。
