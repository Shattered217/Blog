---
title: "NVIDIA Jetson Orin Nano Super刷机教程-NVMe"
published: 2025-07-02
updated: 2026-02-11
description: "在 NVIDIA Jetson Orin Nano Super 上进行 NVMe 刷机的完整过程。内容包括使用 SDK Manager 安装驱动、配置系统以及设置轻量化桌面和 VNC 远程的方法、"
image: "/wp-content/uploads/2025/07/1751454902-JETSON-ORIN-NANO-4G-DEV-KIT-details-1.webp"
tags: ["Jetson","系统运维"]
tagPermalinks: ["/tag/jetson/","/tag/sysadmin/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2025/07/02/nvidia-jetson-orin-nano-flash/"
---
## 前言

最近在给机器人做视觉+底盘控制，前前后后从Nano B1换到NX，现在又换了Nano Super，刷机刷了好多遍，故出篇文章用来记录刷机流程。

我的Nano Super是亚博智能买的，并且似乎都不带emmc，所以我们只关注于刷进NVMe即可。

## 安装SDK Manager以及驱动

确保电脑上拥有Ubuntu20、22、24中某个版本的虚拟机，虚拟机进入[SDK Manager | NVIDIA Developer](https://developer.nvidia.com/sdk-manager#installation_get_started) 下载.deb Ubuntu版本安装包，进入软件后登录（开发者）账号即可

![](/wp-content/uploads/2025/07/1751437680-image-1024x623.webp)

短接FC REC和GND针脚，插电、开机、成功识别到设备，同时选择是否为开发版

![](/wp-content/uploads/2025/07/1751437864-image-1024x580.webp)

第一步：打三个勾即可，其余不要勾选，以及提供旧版JetPack对的Host主机要求

![](/wp-content/uploads/2025/07/1751437924-image-1024x614.webp)

第二步：只勾选Jetson Linux，暂时只安装裸镜像，软件包可以后续安装

![](/wp-content/uploads/2025/07/1751438040-image-1024x614.webp)

输入Host虚拟机密码以安装必要软件包，接下来就是漫长的下载+烧录过程

![](/wp-content/uploads/2025/07/1751438103-image.webp)

验证并构建完镜像后，进度条到50%时会弹出配置页面，配置账密、选择NVMe后Finish继续坐等刷写

![](/wp-content/uploads/2025/07/1751439211-image-1024x603.webp)

如果烧录到75%弹出“NVIDIA Linux for Tegra”无法连接到理想的主机”，修改USB兼容性为3.1即可解决

![](/wp-content/uploads/2025/07/1751442489-image-1024x334.webp)

烧录完成后拔掉跳线重启

![](/wp-content/uploads/2025/07/1751443579-image-1024x644.webp)

## 安装必要环境

重新进入SDK Manager，第一步保持不变，第二步勾选下面的三个勾

![](/wp-content/uploads/2025/07/1751443719-image-1024x606.webp)

配置Nano信息用于建立连接以安装软件包

![](/wp-content/uploads/2025/07/1751443747-image-1024x593.webp)

然后等待检查通过后开始安装

**Congratulations**!

终于刷完了...

![](/wp-content/uploads/2025/07/1751447209-image-1024x601.webp)

## 配置VNC

安装tigervnc和轻量化桌面并配置

```
sudo apt install tigervnc-standalone-server gnome-panel
```

输入两遍密码后输入n即可

在/home/ros/.vnc创建一个xstartup的文件，内容如下

```
#!/bin/sh

xsetroot -solid grey
autocutsel -fork

XAUTHORITY=$HOME/.Xauthority
export XAUTHORITY

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
export XDG_CURRENT_DESKTOP="GNOME-Flashback:GNOME"
export XDG_MENU_PREFIX="gnome-flashback-"
export QT_STYLE_OVERRIDE=""
export FONTCONFIG_PATH=/etc/fonts
export FONTCONFIG_FILE=/etc/fonts/fonts.conf


gnome-session --session=gnome-flashback-metacity --disable-acceleration-check
```

在/etc/systemd/system/vncserver@.service创建systemctl配置文件

```
[Unit]
Description=VNC Server
After=network.target

[Service]
Type=simple
User=ros
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :%i > /dev/null 2>&1 || :'
ExecStart=/usr/bin/vncserver -geometry 1920x1080 -depth 24 -name vnc -localhost no :%i -fg
ExecStop=/usr/bin/vncserver -kill :%i

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务

```
sudo systemctl daemon-reload
sudo systemctl enable vncserver@1.service
sudo systemctl start vncserver@1.service
sudo systemctl status vncserver@1.service
```

## 安装jtop

```
sudo apt update
sudo apt install python3-pip
sudo pip3 install jetson-stats
sudo systemctl restart jtop.service
sudo jtop
```

更多玩法请见 [Jetson归档 - Shattered217のBlog](/linux/jetson/)
