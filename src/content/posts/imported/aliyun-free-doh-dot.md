---
title: "大学生白嫖阿里云服务器搭建私人DOT/DOH"
published: 2023-11-03
updated: 2025-12-26
description: "大学生专属福利！阿里云服务器免费领一年，手把手教你搭建私人DNS加密服务。无需技术基础，跟着教程从零开始配置AdGuard Home，实现全网广告拦截+隐私保护。学会用DoT/DoH加密DNS查询，彻底告别网络追踪"
image: "/wp-content/uploads/2023/11/fm.png"
tags: ["DNS加密","学生优惠","服务器搭建"]
tagPermalinks: ["/tag/dns-encryption/","/tag/student-discounts/","/tag/server-setup/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2023/11/03/aliyun-free-doh-dot/"
---
## 领取服务器（需要学信网）

阿里云-云工开物300大学生优惠券领取地址：[阿里云高校计划\_云工开物\_助力高校科研与教育加速-阿里云 (aliyun.com)](https://university.aliyun.com/)

2核1g 3mbps/年轻量云服务器购买地址：[轻量应用服务器\_web服务器\_个人建站\_弹性计算-阿里云 (aliyun.com)](https://www.aliyun.com/product/swas?scm=20140722.S_card@@%E4%BA%A7%E5%93%81@@172363.S_card0.ID_card@@%E4%BA%A7%E5%93%81@@172363-RL_%E8%BD%BB%E9%87%8F-LOC_search~UND~card~UND~item-OR_ser-V_3-P0_0&source=5176.11533457&userCode=p9e3trrw)

选择新加坡或者香港（限量）的机器，系统镜像选择ubuntu（也可根据个人喜好选择），开通一年即零元。

## 使用轻量应用服务器

开放防火墙TCP-3000和TCP-853端口

设置root登录密码

## root登录SSH

根据此教程安装宝塔

[宝塔开心版8.0.2\_宝塔Linux面板8.0.2 开心\_宝塔 8.0.2 (btkaixin.net)](http://www.btkaixin.net/)

## 登入宝塔面板

进行初始化安装必要环境，然后安装docker

在容器中先拉取镜像

```
adguard/adguardhome
```

然后添加容器

![](http://154.17.6.113/wp-content/uploads/2023/11/image.png)

按照如图所示参数添加容器（重启规则可设置错误时重启）

## 设置Adguard Home 加密连接

登入你的服务器ip:3000的Adg初始化网页，设置网页登录端口为3000，其余默认，登入控制面板

进入设置-加密设置-启用加密

填入服务器名称（即你的域名），以及下方填入证书内容

## 其它设置

由于服务器位于国外，可将上游 DNS 服务器设置为8.8.8.8和1.1.1.1，将能达到更快的响应速度

过滤器-DNS黑名单主要设置这两个，其中第二个对国内广告命中率较高

![](http://154.17.6.113/wp-content/uploads/2023/11/image-1-1024x304.png)

## 宝塔设置反向代理以将二级域名重定向指容器

在宝塔面板中添加站点域名填写解析到当前服务器的域名，例如doh.abc.com，其余默认

然后进入站点设置，填入证书内容并启用SSL，然后添加反向代理，代理名称填入doh，目标URL填入

```
https://127.0.0.1:444
```

以此类推再添加一个DOT站点，注意URL填入

```
https://127.0.0.1:853
```

## 如何使用

Win11可在网络设置中DNS设置直接使用DOH

![](http://154.17.6.113/wp-content/uploads/2023/11/image-2-752x1024.png)

安卓则只能在设置中设置DOT（即私人DNS）
