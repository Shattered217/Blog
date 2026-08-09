---
title: "从 WordPress 迁移到 Astro 的一些心得"
slug: "wordpress-to-astro-cloudflare-migration"
published: "2026-08-09"
updated: "2026-08-09"
draft: true
description: "记录本站从 WordPress 迁移到 Astro 与 Cloudflare Workers 的过程，以及文章、图片、旧链接、动态功能和编辑体验迁移时遇到的问题与解决方法。"
tags:
- "开发工具"
- "系统运维"
category: "Linux"
lang: "zh_CN"
categoryPermalink: "/linux/"
permalink: "/2026/08/09/wordpress-to-astro-cloudflare-migration/"
tagPermalinks:
- "/tag/dev-tools/"
- "/tag/sysadmin/"
---

## 前言

本站之前一直使用 WordPress，写文章和传图片确实很方便，但是越用感觉越卡，而且国内云后面也不打算续费了，所以打算往静态网站 + Serverless 上面靠。

目前博客使用 Astro + Fuwari 构建，少量交互由 Svelte 完成，最后部署到 Cloudflare Workers。图片放在 R2，浏览量和友链申请使用 D1，搜索使用 Pagefind，评论交给 Giscus。

## 迁移过程

### 问题一：文章并不是导出来就能用

这次一共迁移了 45 篇文章。虽然可以通过 WordPress REST API 获取正文，但是里面还混着区块编辑器生成的 HTML、短代码和一些历史格式，直接转换以后经常会出现代码块错位或者多余标签。

最后使用 Turndown 将 HTML 转成 Markdown，再通过脚本统一处理标题、时间、分类和标签，并在构建后检查每篇文章是否能够正常生成。

### 问题二：图片不适合全部塞进 Git

WordPress 中共有 2404 个媒体文件，大约 411 MiB，如果全部提交到仓库，不仅仓库会越来越大，后续部署也会比较麻烦。

所以图片被单独上传到 Cloudflare R2，同时由 Worker 继续提供原来的 `https://nvcc-v.com/wp-content/uploads/` 路径。

### 问题三：迁移后不能让旧链接全部失效

原来的文章链接使用 `/年/月/日/slug/` 格式，分类、标签和归档也已经被搜索引擎收录。如果迁移时直接换成新路径，之前积累的收录基本就寄了。

因此 Astro 继续生成相同的文章地址，无法保留的页面再使用 301 重定向处理，同时补齐 Canonical、Sitemap、RSS、404 页面和 IndexNow，尽量让搜索引擎感受不到这次迁移。

### 问题四：静态博客也需要动态功能

纯静态页面不能直接保存浏览量和友链申请，所以这部分使用 Worker API + D1 完成，原来的历史浏览量也一并导入。评论迁移到 Giscus，站内搜索则由 Pagefind 在构建时生成索引，不再单独维护搜索服务。

### 问题五：写 Markdown 没有后台方便

文章变成 Markdown 以后，修改记录和备份都更加直观，但是每次写文章都要手动处理 Frontmatter、图片和 Git 也挺麻烦。

最后又部署了一个 Sveltia CMS 编辑器，让它直接连接 GitHub 和 R2，并使用 Cloudflare Access 限制访问。现在依然可以在网页里写文章和上传图片。

## 总结

终于把几年堆积下来的屎山换掉了（
