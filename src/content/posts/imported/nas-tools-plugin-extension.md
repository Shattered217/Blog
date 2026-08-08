---
title: "给NAS-Tool添加拓展功能，自定义刷流、索引规则"
published: 2023-10-17
updated: 2025-12-26
description: "为 NAS-Tool 安装第三方插件扩展，配置自定义 PT 站索引与自动刷流规则。"
image: "/wp-content/uploads/2023/10/logo-blue.png"
tags: ["NAS","媒体服务"]
tagPermalinks: ["/tag/nas/","/tag/media-server/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2023/10/17/nas-tools-plugin-extension/"
---
## 安装第三方插件拓展包

安装方法

根据系统执行对应的命令即可，`需要root权限`执行。 也可下载 `shell` 脚本，从脚本内提取安装包，自行替换 `nas-tools` 目录

-   [docker shell（容器内部执行）](https://github.com/Mattoids/nas-tools-plugin#docker-shell%E5%AE%B9%E5%99%A8%E5%86%85%E9%83%A8%E6%89%A7%E8%A1%8C)

```
# 安装
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/install.sh) dockershell
# 卸载
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/unload.sh) dockershell
```

-   [docker（容器外部执行）](https://github.com/Mattoids/nas-tools-plugin#docker%E5%AE%B9%E5%99%A8%E5%A4%96%E9%83%A8%E6%89%A7%E8%A1%8C)

```
# 安装
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/install.sh) docker
# 卸载
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/unload.sh) docker
```

-   [dsm7](https://github.com/Mattoids/nas-tools-plugin#dsm7)

```
# 安装
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/install.sh) dsm7
# 卸载
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/unload.sh) dsm7
```

-   [dsm6](https://github.com/Mattoids/nas-tools-plugin#dsm6)

```
# 安装
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/install.sh) dsm6
# 卸载
bash <(curl -s https://github.com/Mattoids/nas-tools-plugin/raw/master/package/unload.sh) dsm6
```

-   [脚本运行报错的时候尝试下面的命令](https://github.com/Mattoids/nas-tools-plugin#%E8%84%9A%E6%9C%AC%E8%BF%90%E8%A1%8C%E6%8A%A5%E9%94%99%E7%9A%84%E6%97%B6%E5%80%99%E5%B0%9D%E8%AF%95%E4%B8%8B%E9%9D%A2%E7%9A%84%E5%91%BD%E4%BB%A4)

```
# 安装
curl -O https://github.com/Mattoids/nas-tools-plugin/raw/master/package/install.sh && chmod 655 install.sh && ./install.sh docker
# 卸载
curl -O https://github.com/Mattoids/nas-tools-plugin/raw/master/package/unload.sh && chmod 655 unload.sh &&
```

-   添加第三方源

```
https://github.com/Mattoids/nas-tools-plugin/raw/master/source.json
```

![安装第三方插件拓展包 - 给NAS-Tool添加拓展功能，自定义刷流、索引规则 操作截图](/wp-content/uploads/2023/10/image-1024x513.png)

打开第三方插件-点击设置按钮-填入地址-保存即可

## 配置自定义索引器

通过配置此插件以对NT不支持的站点进行索引，搜索影片

![配置自定义索引器 - 给NAS-Tool添加拓展功能，自定义刷流、索引规则 操作截图](/wp-content/uploads/2023/10/image-1-1024x690.png)

第一个框填写你需要添加的站点，第二框填写NT已经支持的站点，用于替换数据，然后点击第三个框，双击复制所有内容，打开JSON处理网站

[在线JSON校验格式化工具（Be JSON）](https://www.bejson.com/)

1.  复制上一步输入框的内容
2.  打开JSON处理站点
3.  粘贴到网站中点【格式化校验】和【Unicode转中文】，修改name为你添加的站点的中文名（随便写也没关系）
4.  点击 【压缩】和【中文转Unicode】，然后复制站点里面的内容
5.  粘贴回上一步的框中（把原有的删除以后再粘贴）
6.  保存
7.  你可以去索引器里面找你的站点了

## 自定义刷流规则

[nas-tools-plugin/sites/brush at master · Mattoids/nas-tools-plugin (github.com)](https://github.com/Mattoids/nas-tools-plugin/tree/master/sites/brush)

打开链接，寻找作者已经适配站点的JSON文件，打开后复制规则内容

```
{"FREE":["//h1[@id='top']/b/font[@class='free']"],"2XFREE":["//h1[@id='top']/b/font[@class='twoupfree']"],"HR":[],"PEER_COUNT":["//div[@id='peercount']/b[1]"]}
```

例如以上为Rousi的规则

我们需要将其嵌套进{"域名":规则}

```
{"rousi.zip":{"FREE":["//h1[@id='top']/b/font[@class='free']"],"2XFREE":["//h1[@id='top']/b/font[@class='twoupfree']"],"HR":[],"PEER_COUNT":["//div[@id='peercount']/b[1]"]}}
```

如果需要添加多个，则在最后一个大括号前加入英文逗号,然后将其它的"域名"+规则复制进去

```
{"hdarea.club":{"FREE":["//h1[@id='top']/b/font[@class='free']"],"2XFREE":["//h1[@id='top']/b/font[@class='twoupfree']"],"HR":[],"PEER_COUNT":["//div[@id='peercount']/b[1]"]},"rousi.zip":{"FREE":["//h1[@id='top']/b/font[@class='free']"],"2XFREE":["//h1[@id='top']/b/font[@class='twoupfree']"],"HR":[],"PEER_COUNT":["//div[@id='peercount']/b[1]"]},"kufei.org":{"FREE":["//h1[@id='top']/b/font[@class='free']"],"2XFREE":["//h1[@id='top']/b/font[@class='twoupfree']"],"HR":[],"PEER_COUNT":["//div[@id='peercount']/b[1]"]}}
```
