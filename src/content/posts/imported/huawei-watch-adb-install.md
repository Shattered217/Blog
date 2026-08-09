---
title: "基于无线adb实现的华为手表独立安装应用"
published: 2023-06-14
updated: 2025-12-26
description: "利用 Shizuku、WearOS 工具箱与无线 ADB，在华为 Watch 3 上脱离电脑安装第三方应用。"
image: "https://nvcc-v.com/wp-content/uploads/2023/06/R-C-1.jpg"
tags: ["开发工具"]
tagPermalinks: ["/tag/dev-tools/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2023/06/14/huawei-watch-adb-install/"
---
## 引

今年年初本人购入一块华为watch3手表，随后便是开始往里面安装各类的软件，经过一些尝试也发现它的防第三方软件机制仅仅是通过自带的 应用安装器 实现防止用户安装。

关于这点，相信大家都可以想到通过adb冻结应用然后再进行安装以实现绕过该机制。

但是这多少会有些不方便，每次都需要手机连接adb再找到该应用进行冻结，然后才能安装。

## 思路

那么我们有没有办法进行更简便的操作呢？

由于该手表的Harmony OS 3.0是基于AOSP11，故可以在不连接电脑的情况下直接开启WiFi ADB（安卓调试桥），然后我们就可以通过shizuku首先通过WiFi ADB进行提权。

## 方法如下：

首先进入设置中的开发人员选项，找到并打开 HDC调试 以及 通过WLAN调试 ，然后进入shizuku，下拉点击启动，授权同意调试后即可（注意每次重启后都需要重新打开WLAN调试，否则shizuku会找不到该选项）

![方法如下： - 基于无线adb实现的华为手表独立安装应用 操作截图](https://nvcc-v.com/wp-content/uploads/2023/06/WearOS-Tools-Screenshot_20230614_094756.png)

接下来安装 小黑屋 ，用于冻结应用

注意在首次安装过程中，会出现屏幕大小问题导致点不到下一步的按钮，此时需要借助 wearos工具箱 ADB连接手机，对DPI进行修改，在权限上选择shizuku，直到完成便可恢复DPI大小。

然后点击右上角的加号，将 用户应用 向左滑，找到 应用安装器 ，冻结即可！

再通过wearos工具箱安装第三方的应用安装器，然后便可快乐独立地安装应用了！

[](/2023/06/14/huawei-watch-adb-install/)[WearOS安装器](https://www.123pan.com/s/dYLUVv-tVr8H)：基于无线adb实现的华为手表独立安装应用

## 补充

注意：冻结 应用安装器 后用完必须解冻，不然系统在重启后会出现 重启两次，并且所有应用的权限授权全部消失，以及所有冻结应用全部解冻 的情况。
