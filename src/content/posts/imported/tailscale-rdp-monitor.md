---
title: "Tailscale 实时监控 Windows RDP 会话"
published: 2025-05-21
description: "使用 Python pywin32 监听 Tailscale 网络中的 Windows RDP 连接与断开事件，并实时推送到 Telegram Bot。"
image: "https://nvcc-v.com/wp-content/uploads/2025/05/1747793667-Python.webp"
tags: ["网络","系统运维"]
tagPermalinks: ["/tag/network/","/tag/sysadmin/"]
category: "Windows"
categoryPermalink: "/windows/"
lang: zh_CN
permalink: "/2025/05/21/tailscale-rdp-monitor/"
---
## 简介

在日常运维、安全审计或远程支持场景中，我们常常会使用 Windows 的远程桌面功能（Remote Desktop Protocol，RDP）。但是，你是否遇到过这样的需求：

-   想知道是否有人正在连接你的 RDP？
-   想实时监控 RDP 的连接和断开事件？
-   希望将这些信息推送给自己，便于第一时间知晓？

出于这样的动机，并且本人和伙伴是通过tailscale组网进行访问Windows，常规的检测难以精准实现，故开发了一个自用的轻量级 RDP 会话监控脚本 —— **[RDP-Monitor](https://github.com/Shattered217/RDP-Monitor/tree/main)**。它通过Python的 `pywin32` 库实现对远程桌面连接/断开事件的监听，并且实时推送至TG Bot。

项目地址：[RDP-Monitor/ at main · Shattered217/RDP-Monitor](https://github.com/Shattered217/RDP-Monitor/tree/main)

## 使用教程

修改文件中的TG配置，BOT\_TOKEN & CHAT\_ID

```
pip install -r requirements.txt
python monitor.py
```

## 效果

![效果 - Tailscale 实时监控 Windows RDP 会话 操作截图](https://nvcc-v.com/wp-content/uploads/2025/05/1747793079-image.webp)
