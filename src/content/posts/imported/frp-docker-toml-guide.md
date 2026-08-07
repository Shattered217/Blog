---
title: "frp 0.61 docker(toml配置)新手指北-教程"
published: 2025-02-11
description: "本文介绍了frp内网穿透的配置，适用于将必要服务映射到无公网环境的学校服务器。文中详细阐述了frps（服务端）和frpc（客户端）的配置，包括TCP和HTTP流量转发、docker-compose设置及相关鉴权、安"
image: "/wp-content/uploads/2025/02/10-1701342297.jpeg"
tags: ["Docker部署","frp内网穿透","TOML配置"]
tagPermalinks: ["/tag/docker-deployment/","/tag/frp-internal-penetration/","/tag/toml-configuration/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/02/11/frp-docker-toml-guide/"
---
## 引

由于本人即将把服务器搬去无公网环境的学校，故研究了一下frp内网穿透，用于映射一些必要的服务出去，但发现网上大部分都是Windows环境下的ini配置，和toml配置相差极大，故在折腾了一段时间后写此篇文章用以记录

## 简介

[frp](https://github.com/fatedier/frp)分为frps和frpc，前者是服务端，后者是客户端，frp可以转发多种流量，但本文章仅说明最常用的两种流量转发，即TCP和HTTP。

TCP可以近似看做端口转发，直接将端口的流量进行透明数据转发，而HTTP则近似于nginx反向代理，所以服务端可以只用一个端口根据域名将不同的网站转发到不同的后端

## Frps配置

docker-compose配置

```
version: "3.3"
services:
  frps:
    image: snowdreamtech/frps:0.61
    container_name: frps
    hostname: frps
    restart: always
    network_mode: host
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./conf/frps.toml:/etc/frp/frps.toml:ro
      - ./logs:/frp/logs
```

frps.toml配置

```
# 监听地址
bindAddr = "0.0.0.0"
# 监听端口
bindPort = 7000
# 监听 KCP 协议端口
kcpBindPort = 7000
# 监听 HTTP 协议端口
vhostHTTPPort = 8080
# 监听 HTTPS 协议端口
vhostHTTPSPort = 4443

# 允许代理绑定的服务端端口
allowPorts = [
  { start = 2000, end = 3000 },
  { single = 3001 },
  { single = 3003 },
  { start = 4000, end = 50000 }
]

# 鉴权配置
## 鉴权方式
auth.method = "token"
## Token
auth.token = "xxxxxxxxxx" #自行修改

# 日志配置
log.to = "/frp/logs/frps.log"
log.level = "debug"
log.maxDays = 180
log.disablePrintColor = false

subdomainHost = "abc.com"  #自行修改

# 仪表盘配置
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "xxxxxxxxx"  #自行修改

# 是否提供 Prometheus 监控接口
enablePrometheus = true

# 允许客户端设置的最大连接池大小
transport.maxPoolCount = 1000
```

以上配置中token、域名和password需要自行修改，域名填一级域名即可，后面HTTP反向代理会用到此域名的二级域名用于区分不同的网站

## Frpc配置

docker-compose配置

```
version: '3.3'
services:
  frpc:
    image: snowdreamtech/frpc:0.61
    container_name: frpc
    restart: always
    network_mode: host
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./conf:/etc/frp:ro
      - ./logs:/frp/logs
      - /root/.acme.sh/xxxxxx:/etc/ssl #证书路径自行配置
```

frpc.toml配置

```
# 连接配置
## 连接服务端的地址
serverAddr = "x.x.x.x" #服务端IP
## 连接服务端的端口
serverPort = 7000

# 鉴权配置
## 鉴权方式
auth.method = "token"
## Token
auth.token = "xxxxxxxxx"

# 日志日志
## 日志路径
log.to = "/frp/logs/frpc.log"
## 日志级别
log.level = "info"
## 日志文件最多保留天数
log.maxDays = 30
## 禁用标准输出中的日志颜色
log.disablePrintColor = false

includes = ["/etc/frp/confd/*.toml"]
```

自行修改配置，与服务端对应，然后在/etc/frp中新建/confd文件夹，以后需要添加配置在此文件夹内新建xxx.toml即可，以下给出TCP和HTTP的toml示例

```
[[proxies]]
### 连接名称
name = "Home Assistant"
### 连接类型
type = "tcp"
localIP = "192.168.101.194"
localPort = 8123
remotePort = 8122
### 是否启用加密功能，启用后该代理和服务端之间的通信内容都会被加密传输
transport.useEncryption = false
### 是否启用压缩功能，启用后该代理和服务端之间的通信内容都会被压缩传输
transport.useCompression = false
```

-   localIP表示本地局域网IP
-   localPort表示本地端口
-   remotePort表示远程端口，按以上示例即访问服务端IP:8122

```
## HTTP 连接
[[proxies]]
### 连接名称
name = "EMBY"
### 连接类型
type = "https"
### 子域名列表，用户访问服务端此域名的流量会被转发到对应的本地服务
subdomain = "emby"
### 是否启用加密功能，启用后该代理和服务端之间的通信内容都会被加密传输
#transport.useEncryption = false
### 是否启用压缩功能，启用后该代理和服务端之间的通信内容都会被压缩传输
#transport.useCompression = false

[proxies.plugin]
type = "https2http"
localAddr = "192.168.101.236:8091"

# HTTPS 证书相关的配置
crtPath = "/etc/ssl/*.abc.com.cer"
keyPath = "/etc/ssl/*.abc.com.key"
hostHeaderRewrite = "127.0.0.1"
requestHeaders.set.x-from-where = "frp"
```

此类型为https，subdomain表示二级域名，如示例即emby.abc.com，localAddr即局域网中需要反代的ip:端口，下面证书按照自己映射的填写，建议申请通配符域名证书，最后浏览器输入emby.abc.com:4443即可成功访问（注意服务端中http和https的端口不同）
