# Shattered217 Blog

`nvcc-v.com` 的静态博客源码，基于 [Fuwari](https://github.com/saicaca/fuwari) 和 Astro。

## 架构

- Astro 在构建阶段生成完整 HTML，文章不依赖客户端渲染。
- Cloudflare Pages 托管 HTML、CSS、JavaScript、RSS 和 Sitemap。
- Cloudflare R2 保存 WordPress 媒体文件。
- Pages Function 将原来的 `/wp-content/uploads/...` 路径映射到 R2，并在边缘缓存响应。
- Pagefind 提供静态全文搜索，Giscus 提供新评论。

所有 WordPress 文章、分类、标签和媒体 URL 都保持原路径。未知路径返回真正的 `404`，不会回退到首页。

## 本地开发

```bash
corepack pnpm install
corepack pnpm dev
```

完整检查和构建：

```bash
corepack pnpm check
corepack pnpm type-check
corepack pnpm build
```

要连同 Pages Function 和本地 R2 一起预览：

```bash
corepack pnpm exec wrangler pages dev dist
```

## WordPress 导入

从公开 REST API 重新导入最多 100 篇已发布文章：

```bash
corepack pnpm import-wordpress 100
```

媒体源文件位于本地 `media/wp-content/uploads/`，该目录不会提交到 Git。媒体清单可重新生成：

```bash
corepack pnpm media:manifest
```

## Cloudflare Pages 与 R2

Wrangler 配置使用两个 R2 存储桶：

- 正式环境：`nvcc-v-media`
- 预览环境：`nvcc-v-media-preview`
- Pages Function 绑定名：`MEDIA`

登录 Cloudflare、创建存储桶并上传正式媒体：

```bash
corepack pnpm exec wrangler login
corepack pnpm exec wrangler r2 bucket create nvcc-v-media
corepack pnpm exec wrangler r2 bucket create nvcc-v-media-preview
corepack pnpm media:upload
```

上传预览环境媒体时指定存储桶：

```bash
R2_BUCKET=nvcc-v-media-preview corepack pnpm media:upload
```

Cloudflare Pages 项目连接 `Shattered217/Blog`，使用以下构建设置：

- 构建命令：`corepack pnpm build`
- 输出目录：`dist`
- Node.js：22

`wrangler.jsonc` 是 Pages Function 和 R2 绑定的配置源。

## Giscus

Giscus 要求 Discussions 仓库公开。启用 Discussions 并安装 Giscus App 后，在 Pages 构建环境中设置：

```text
PUBLIC_GISCUS_REPO_ID
PUBLIC_GISCUS_CATEGORY_ID
```

变量修改后需要重新部署，文章评论按 pathname 映射。

## 推荐的 Cloudflare 设置

- 启用 Web Analytics，观察 Core Web Vitals 和真实访问性能。
- 启用 Crawler Hints，帮助支持 IndexNow 的搜索引擎发现更新。
- 保持 Brotli、HTTP/3 和 TLS 1.3 开启。
- 暂不引入 KV、D1 或 Durable Objects；静态内容和评论不需要数据库。
- 如需浏览量统计，再单独使用 Workers Analytics Engine 或 Durable Objects，避免给文章请求增加无意义的动态依赖。

## 许可

主题部分沿用 Fuwari 的 MIT License，详见 `LICENSE`。
