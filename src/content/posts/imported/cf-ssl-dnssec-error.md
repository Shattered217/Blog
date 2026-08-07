---
title: "记一次CloudFlare小云朵代理网站SSL错误事故"
published: 2025-07-10
description: "这篇文章记录了一次解决 CloudFlare 网站 SSL 错误的经历。博主排查了源服务器证书、尝试替换证书并搜索解决方法，但发现问题出在 DNSSEC 的配置上。通过修复加密算法配置和调整 CloudFlare"
image: "/wp-content/uploads/2025/07/1752139659-cloudflare-logo-scaled-1.webp"
tags: ["CDN故障","CloudFlare问题","证书验证"]
tagPermalinks: ["/tag/cdn-troubleshooting/","/tag/cloudflare-issues/","/tag/ssl-verification/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/10/cf-ssl-dnssec-error/"
---
今天突然发现走CF CDN的网站出现了SSL问题，很疑惑，因为正常来说应该会到CF的error界面，而不是直接白屏报错

![](/wp-content/uploads/2025/07/1752139287-89229fb38f3b7f0b9f5bbc8ac5040bc8.webp)

先是排查了一下源服务器的证书，发现并没有过期，又换了CF的源服务器证书，还是不行，然后开始网上搜索方法，调整了好几个地方，还是不行。

之后发现边缘证书一直卡“待验证”

然后就突然想到DNSSEC，一查发现，果然是之前配置错了，阿里云把加密算法前面的序号删掉了....所以CF那边写的 算法 13 ，就是对应 ECDSA Curve P-256 with SHA-256 这个选项。

![](/wp-content/uploads/2025/07/1752139386-image.webp)

配置完后到 SSL/TLS - 边缘证书 - 禁用通用SSL证书，等一分钟再打开，然后一般来说就可以验证成功，网站也恢复正常访问。
