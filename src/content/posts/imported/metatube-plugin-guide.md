---
title: "Jellyfin和Emby刮削小姐姐插件-MetaTube使用方法"
published: 2023-12-30
description: "Jellyfin和Emby刮削小姐姐插件"
image: "/wp-content/uploads/2023/12/68747470733a2f2f6d657461747562652d636f6d6d756e6974792e6769746875622e696f2f696d616765732f62616e6e65722d6461726b2e706e67.png"
tags: ["Jellyfin","媒体管理","插件教程"]
tagPermalinks: ["/tag/jellyfin/","/tag/media-management/","/tag/plugin-tutorial/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2023/12/30/metatube-plugin-guide/"
---
原文：[https://github.com/metatube-community/jellyfin-plugin-metatube/blob/main/README\_ZH.md](https://github.com/metatube-community/jellyfin-plugin-metatube/blob/main/README_ZH.md)

## Jellyfin

1.  进入 Jellyfin 控制台 > 插件 > 存储库，点击添加
2.  输入存储库名称：MetaTube
3.  适用于中国大陆的存储库URL：[https://cdn.jsdelivr.net/gh/metatube-community/jellyfin-plugin-metatube@dist/manifest.json](https://cdn.jsdelivr.net/gh/metatube-community/jellyfin-plugin-metatube@dist/manifest.json)
4.  在插件目录下找到 MetaTube，点击安装
5.  重启Jellyfin

## Emby

1.  从 Releases 下载 MetaTube 最新插件
2.  解压出 MetaTube.dll 文件
3.  将 dll 文件复制到 Emby 插件目录
4.  重启 Emby 服务

PS：Emby 后续插件更新由计划任务在后台自动完成。

**重启后就可以正常使用了**

**第一步是新添加一个媒体库，不要和普通电影放在一个媒体库里**

内容类型是电影

如果名字不符合规定的话，手动识别一下，名字只写番号

## 自建后端

安装docker-compose

```
apt update
apt install docker-compose -y
```

官方脚本通过docker-compose一键部署后端

```
mkdir metatube-sdk-go && cd metatube-sdk-go
curl -sL https://raw.githubusercontent.com/metatube-community/metatube-sdk-go/main/docker-compose.yaml -o docker-compose.yaml
docker-compose up -d
```

内存模式compose示例

```
version: '3.8'

services:
  metatube:
    image: ghcr.io/metatube-community/metatube-server:latest
    container_name: metatube
    ports:
      - "8080:8080"
    restart: unless-stopped
```
