---
title: "给你的EMBY添加一点小插件"
published: 2023-08-12
updated: 2025-12-26
description: "给你的EMBY赋予一起看和弹幕功能！"
image: "/wp-content/uploads/2023/08/image-1.png"
tags: ["Docker教程","EMBY插件","媒体服务器"]
tagPermalinks: ["/tag/docker-tutorial/","/tag/emby-plugins/","/tag/media-server/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2023/08/12/emby-plugins-guide/"
---
## 前言

本教程仅适用于docker EMBY用户，群晖套件版的可以参考，整体思路是大差不差的。

## VideoTogether插件（[VideoTogether | 一起看视频](https://videotogether.github.io/zh-cn/)）

此插件可以赋予你的媒体库多人在线同步观看视频的体验。

![](http://154.17.6.113/wp-content/uploads/2023/08/image.png)

仅需多端输入相同的房间号、密码即可同步观影，体验还是相当流畅的。

## 弹幕插件（[Emby 弹幕扩展 (movie.kg)](https://danmaku.movie.kg/)）

为EMBY提供弹幕拓展服务，非常有用的追番功能！

![](http://154.17.6.113/wp-content/uploads/2023/08/image-1-1024x513.png)

![](http://154.17.6.113/wp-content/uploads/2023/08/image-2-1024x971.png)

可选的功能也很多，本地化的哔哩哔哩追番体验！

## 如何安装

首先SSH连接你的docker宿主机，然后获取你的EMBY 容器的ID

```
docker ps -a
```

![](http://154.17.6.113/wp-content/uploads/2023/08/image-3.png)

然后进入该容器（注意要替换成自己的ID）

```
docker exec -it e71123794726 /bin/ash
```

然后编辑EMBY的index文件

```
vi /system/dashboard-ui/index.html
```

![](http://154.17.6.113/wp-content/uploads/2023/08/image-4-1024x555.png)

方向键拉到最底下，键入i开启编辑模式在</div>和</body>之间加入相应JS代码即可。

VideoTogether插件

```
<script src="https://2gether.video/release/extension.website.user.js"></script>
```

弹幕插件

```
<script type="text/javascript" src="https://danmaku.movie.kg/ext.js"></script>
<link rel="stylesheet" href="https://danmaku.movie.kg/ext.css"/>
```

注意格式对齐，然后esc，输:wq即可保存退出，重启容器即可体验！
