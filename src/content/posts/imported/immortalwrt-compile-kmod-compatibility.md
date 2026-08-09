---
title: "ImmortalWrt 编译进阶：实现与官方源 kmod 的完美兼容"
published: 2026-01-11
description: "通过对齐内核版本配置，使自编译 ImmortalWrt 固件兼容官方软件源的 kmod 内核模块。"
image: "https://nvcc-v.com/wp-content/uploads/2026/01/1768100612-Gemini_Generated_Image_7jlexa7jlexa7jle-scaled.png"
tags: ["OpenWrt","系统运维"]
tagPermalinks: ["/tag/openwrt/","/tag/sysadmin/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2026/01/11/immortalwrt-compile-kmod-compatibility/"
series: { slug: "immortalwrt-build", name: "ImmortalWrt 编译", order: 2 }
---
## 前言

编译 ImmortalWrt [新手指南](/2025/09/11/cudy-tr3000-immortalwrt-guide/)

之前的文章简单介绍了如何编译以及添加自定义软件源编译 ImmortalWrt，但是面临一个问题即 kmod 尾缀与官方不同，导致不能使用官方源安装 kmod，即使用过程中安装其他需要 kmod 的软件包就需要重新编译，所以我们今天来解决这一痛点

## 准备环境

关于配环境可以参考之前的[文章](/2025/09/11/cudy-tr3000-immortalwrt-guide/)

拉取 ImmortalWrt 24.10.4

```
git clone -b openwrt-24.10 https://github.com/immortalwrt/immortalwrt
cd immortalwrt
git checkout v24.10.4
```

然后我们需要找到官方编译时的配置，浏览器进入以下网址

```
https://downloads.immortalwrt.org/releases/24.10.4/targets/
```

找到自己的设备，例如我的 Cudy tr3000 位于这里

```
https://downloads.immortalwrt.org/releases/24.10.4/targets/mediatek/filogic/
```

拉到最底下，就是我们需要的配置

![准备环境 - ImmortalWrt 编译进阶：实现与官方源 kmod 的完美兼容 操作截图](https://nvcc-v.com/wp-content/uploads/2026/01/1768099674-image-1024x569.png)

我们将它下载到编译目录下，并复制 (注意要找到适合自己的，不要直接复制我的)

```
wget https://downloads.immortalwrt.org/releases/24.10.4/targets/mediatek/filogic/config.buildinfo
cp config.buildinfo .config
```

## 开始编译

然后操作流程与之前的教程类似

```
./scripts/feeds update -a
./scripts/feeds install -a
```

进入菜单选择自己的设备以及软件包

```
make menuconfig
```

编译

```
make download
make -j64
```

## 检查对齐

检查文件 kernel 字段 ./immortalwrt/bin/targets/mediatek/filogic/immortalwrt-24.10.4-xxx.manifest

![检查对齐 - ImmortalWrt 编译进阶：实现与官方源 kmod 的完美兼容 操作截图 1](https://nvcc-v.com/wp-content/uploads/2026/01/1768100172-image.png)

我们再返回之前的页面进入 kmods 文件夹，对比二者一致就算成功了！

![检查对齐 - ImmortalWrt 编译进阶：实现与官方源 kmod 的完美兼容 操作截图 2](https://nvcc-v.com/wp-content/uploads/2026/01/1768100375-image-1024x569.png)

![检查对齐 - ImmortalWrt 编译进阶：实现与官方源 kmod 的完美兼容 操作截图 3](https://nvcc-v.com/wp-content/uploads/2026/01/1768100434-image-1024x278.png)
