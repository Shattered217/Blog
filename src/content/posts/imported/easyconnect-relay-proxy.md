---
title: "如何优雅地借助公网服务器访问学校内网(EasyConnect)"
published: 2024-05-10
updated: 2026-02-07
description: "通过公网服务器和 Docker EasyConnect 搭建校园内网中继，提供 SOCKS5 与 HTTP 代理并记录 VNC 配置方法。"
image: "https://nvcc-v.com/wp-content/uploads/2024/05/1200x630wa.png"
tags: ["网络","Docker"]
tagPermalinks: ["/tag/network/","/tag/docker/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2024/05/10/easyconnect-relay-proxy/"
---
## 前言

我们在~因学校~被迫使用EasyConnect的时候，经常会遇到各种各样的问题，比如安卓的系统版本太新，导致软件不兼容从而无法打开，亦或是和自身的系统代理存在冲突，经常需要切换非常麻烦，就想能不能通过一个跳板来将EasyConnect实现分流代理，经过网上简单搜索，还真就找到了这个项目。

## 项目介绍

[docker-easyconnect/docker-easyconnect: 使深信服（Sangfor）开发的非自由的 VPN 软件 EasyConnect 和 aTrust 运行在 docker 或 podman 中，并作为网关和/或提供 socks5、http 代理服务 (github.com)](https://github.com/docker-easyconnect/docker-easyconnect/tree/master)

该项目主要通过docker运行Easyconnect软件，并通过提供 [socks5 和 http 代理](https://github.com/docker-easyconnect/docker-easyconnect/blob/master/doc/usage.md#%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1)服务和[网关](https://github.com/docker-easyconnect/docker-easyconnect/blob/master/doc/usage.md#ip-forward)供宿主机连接使用。

## 使用指南

首先我们需要一台服务器（该容器占用内存大约为300M），并正确安装docker，然后通过ssh输入以下命令（需要自己修改），为了让大家更直观地理解各项参数，我这边贴出UNraid docker管理的图形化界面

```
docker run --rm --device /dev/net/tun --cap-add NET_ADMIN -ti -e PING_ADDR= xxx.edu.cn -e PASSWORD=xxxx -e URLWIN=1 -e SOCKS_USER=xxx -e SOCKS_PASSWD=xxx -v $HOME/.ecdata:/root -p 127.0.0.1:5901:5901 -p 127.0.0.1:1080:1080 -p 127.0.0.1:8888:8888 hagb/docker-easyconnect:7.6.7
```

![使用指南 - 如何优雅地借助公网服务器访问学校内网(EasyConnect) 操作截图 1](https://nvcc-v.com/wp-content/uploads/2024/05/image-1024x514.png)

![使用指南 - 如何优雅地借助公网服务器访问学校内网(EasyConnect) 操作截图 2](https://nvcc-v.com/wp-content/uploads/2024/05/image-2-1024x510.png)

配置docker需要注意的几个点是

-   hagb/docker-easyconnect:7.6.7中的7.6.7是你学校客户端的版本，须确保一致
-   5901是VNC端口，我们可以通过VNC连接容器并使用图形化界面配置登录
-   1080是Socks5代理端口，8888是http代理端口
-   SOCKS\_USER和SOCKS\_PASSWD即Socks的身份验证用户名和密码，开放到公网需要填写
-   PING\_ADDR是不断地ping你的VPN代理的校园网网址，用于保活防止长时间不连接被踢下线
-   同时需要将容器的/root路径映射到宿主机创建的/.ecdata下，以保存登录信息

当容器运行起来后，我们需要下载[VNC](https://www.realvnc.com/en/connect/download/viewer/)进行连接，通过ip:5901进行连接，然后正常配置校园VPN后就可以使用1080（Socks5）或者8888（http）端口进行代理访问了

## 配置🐱访问

1.通过分流实现代理

可以在Github托管自己专属的分流规则，将自己学校的域名加入进去，并通过[订阅转换](https://convert.imgki.com/)将自用的代理整合进一个配置文件

```
DOMAIN-SUFFIX,xxx.edu.cn
```

以上代码表示匹配域名后缀，一般学校会将各个服务网站分配至二级~（三级）~域名，所以一般只需要这一条规则就够了（当然具体也要根据实际情况来看）

2.通过配置文件全局代理

或者仅仅是通过切换配置文件来实现暂时的全局代理，对于访问学校内网需求度不太大的同学也是可以的，以下是以Socks5为例的🐱配置文件

```
proxies:
- name: "socks"
  type: socks5
  server: server #填写你的ip或域名
  port: 1080
  username: username #上面配置docker时填写的用户名
  password: password #上面配置docker时填写的密码
  # skip-cert-verify: true
  udp: true
```
