---
title: "记一次CloudFlare小云朵代理网站SSL错误事故"
published: 2025-07-10
description: "复盘 Cloudflare 代理站点出现 SSL 错误的排查过程，定位 DNSSEC 算法配置问题并给出修复方法。"
image: "/wp-content/uploads/2025/07/1752139659-cloudflare-logo-scaled-1.webp"
tags: ["网络","安全"]
tagPermalinks: ["/tag/network/","/tag/security/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/10/cf-ssl-dnssec-error/"
---
今天突然发现走CF CDN的网站出现了SSL问题，很疑惑，因为正常来说应该会到CF的error界面，而不是直接白屏报错

![记一次CloudFlare小云朵代理网站SSL错误事故 操作截图 1](/wp-content/uploads/2025/07/1752139287-89229fb38f3b7f0b9f5bbc8ac5040bc8.webp)

先是排查了一下源服务器的证书，发现并没有过期，又换了CF的源服务器证书，还是不行，然后开始网上搜索方法，调整了好几个地方，还是不行。

之后发现边缘证书一直卡“待验证”

然后就突然想到DNSSEC，一查发现，果然是之前配置错了，阿里云把加密算法前面的序号删掉了....所以CF那边写的 算法 13 ，就是对应 ECDSA Curve P-256 with SHA-256 这个选项。

![记一次CloudFlare小云朵代理网站SSL错误事故 操作截图 2](/wp-content/uploads/2025/07/1752139386-image.webp)

配置完后到 SSL/TLS - 边缘证书 - 禁用通用SSL证书，等一分钟再打开，然后一般来说就可以验证成功，网站也恢复正常访问。
