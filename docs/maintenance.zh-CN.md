# 仓库维护

需要 Node.js 22.23.4 及以上版本，CI 使用 Node 22 和 24。安装依赖使用 `corepack pnpm install --frozen-lockfile`。

CI 的 `setup-node` 启用 `check-latest`，避免运行器预装的旧补丁版本低于依赖要求。

## 发布检查

```bash
corepack pnpm release:check
```

该命令依次执行 Astro/Worker 类型检查、源码质量检查、回归测试、站点与 Worker 构建、迁移验证、SEO 审计和两个 Worker 的部署预演。生产 `worker:deploy` 与 `editor:deploy` 都先执行完整检查，任何一步失败就停止。

`validate:source` 与 `validate:build` 是 CI 复用的两个阶段。不要在检查尚未完成时提交推送，也不要通过降低内容审计要求来绕过缺封面等问题。

## 写文章与媒体

`corepack pnpm new-post my-post` 创建草稿，生成上海时区日期和永久链接，拒绝覆盖现有文件。关闭草稿前需要补齐封面、描述和正文；内容 schema 与编辑器保存钩子会校验正式发布要素。

媒体原文件与 AI 输出不入 Git。上传到 R2 后，按明确文件更新元数据：

```bash
corepack pnpm media:manifest media/wp-content/uploads/cover.webp
corepack pnpm media:dimensions media/wp-content/uploads/cover.webp
```

增加 `--check` 只检查是否需要更新，不写文件，有差异时返回退出码 1。不传文件会扫描全部本机媒体或源码引用。更新会保留已有兼容记录，不自动删除历史媒体元数据；提交前仍需检查 diff。

## API 与编辑器配置

阅读量接口从同版本静态资源的文章 sitemap 确认发布路径，不存在的文章不能写库。`VIEW_RATE_LIMIT` 为同一 IP 与文章在每个 Cloudflare 位置限一次写入/60 秒，重复请求返回当前计数。原始 IP 不写入数据库；这属于流量限制，不是全局精确的独立访客统计。预览与生产配置使用不同限流命名空间。

编辑器校验 Access JWT 的 RS256 签名、issuer、audience 和有效期。团队域名与应用 audience 通过 `editor/wrangler.jsonc` 配置；变更 Access 应用后应同步更新。开发绕过需同时满足 `REQUIRE_ACCESS=false` 和 localhost/127.0.0.1。

## 依赖安全维护

```bash
corepack pnpm audit --prod
```

Astro 升级使用 Content Layer，并显式保留 remark/rehype Markdown 渲染链与 Tailwind 3。Vite 继续使用原先的 esbuild CSS 压缩器，避免此次升级同时更换 CSS 语法处理行为。

`pnpm.overrides` 对旧工具链的 `serialize-javascript`、`postcss-selector-parser` 和 `rehype-katex` 使用修复版本，测试覆盖旧 minifier 的序列化兼容性。

`braces@3.0.3` 的 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) 尚无上游修复版本。仓库通过 `patches/braces@3.0.3.patch` 限制解析和 AST 遍历深度为 128，并有深层输入回归测试。按包版本识别的 audit 仍可能报告此项；没有设置全局忽略。上游修复发布后应替换补丁并重新验证。
