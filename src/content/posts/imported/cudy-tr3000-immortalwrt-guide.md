---
title: "Cudy TR3000 v1 编译 ImmortalWrt 24.10"
published: 2025-09-11
updated: 2026-01-10
description: "记录 Cudy TR3000 v1 本地编译 ImmortalWrt 24.10 的环境准备、源码配置、软件源定制和固件构建步骤。"
image: "https://nvcc-v.com/wp-content/uploads/2025/09/1768031947-Gemini_Generated_Image_8ugg808ugg808ugg-scaled.png"
tags: ["OpenWrt","网络"]
tagPermalinks: ["/tag/openwrt/","/tag/network/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/09/11/cudy-tr3000-immortalwrt-guide/"
series: { slug: "immortalwrt-build", name: "ImmortalWrt 编译", order: 1 }
---
## 配置环境

使用官方的一键脚本安装必要的编译软件包

```
sudo bash -c 'bash <(curl -s https://build-scripts.immortalwrt.org/init_build_environment.sh)'
```

亦或是使用APT自行安装

```
sudo apt update -y
sudo apt full-upgrade -y
sudo apt install -y ack antlr3 asciidoc autoconf automake autopoint binutils bison build-essential \
  bzip2 ccache clang cmake cpio curl device-tree-compiler ecj fastjar flex gawk gettext gcc-multilib \
  g++-multilib git gnutls-dev gperf haveged help2man intltool lib32gcc-s1 libc6-dev-i386 libelf-dev \
  libglib2.0-dev libgmp3-dev libltdl-dev libmpc-dev libmpfr-dev libncurses-dev libpython3-dev \
  libreadline-dev libssl-dev libtool libyaml-dev libz-dev lld llvm lrzsz mkisofs msmtp nano \
  ninja-build p7zip p7zip-full patch pkgconf python3 python3-pip python3-ply python3-docutils \
  python3-pyelftools qemu-utils re2c rsync scons squashfs-tools subversion swig texinfo uglifyjs \
  upx-ucl unzip vim wget xmlto xxd zlib1g-dev zstd
```

## 编译默认纯净固件

拉取ImmortalWrt 24.10分支代码

```
git clone -b openwrt-24.10 --single-branch --filter=blob:none https://github.com/immortalwrt/immortalwrt
```

更新并安装软件源

```
./scripts/feeds update -a
./scripts/feeds install -a
```

进入可视化菜单编辑配置信息

```
make menuconfig
```

前三项如图所示，即为Cudy TR3000 256M v1的固件选项，注意 空格是选择，双击esc是返回上一页

![编译默认纯净固件 - Cudy TR3000 v1 编译 ImmortalWrt 24.10 操作截图 1](https://nvcc-v.com/wp-content/uploads/2025/09/1757574973-image-867x1024.webp)

主菜单双击esc后回车保存配置

![编译默认纯净固件 - Cudy TR3000 v1 编译 ImmortalWrt 24.10 操作截图 2](https://nvcc-v.com/wp-content/uploads/2025/09/1757575111-image.webp)

下载编译软件包源码后开始编译，注意64是CPU核心数，可按自身配置自行决定

```
make download
make -j64
```

固件保存位置位于

```
/immortalwrt/bin/targets/mediatek/filogic/immortalwrt-mediatek-filogic-cudy_tr3000-256mb-v1-squashfs-sysupgrade.bin
```

## 添加自定义软件源以及定制OP固件

执行以下命令添加momo和nikki的软件源仓库

```
echo "src-git momo https://github.com/nikkinikki-org/OpenWrt-momo.git;main" >> "feeds.conf.default"
echo "src-git nikki https://github.com/nikkinikki-org/OpenWrt-nikki.git;main" >> "feeds.conf.default"
```

注意添加后需要重新执行

```
./scripts/feeds update -a
./scripts/feeds install -a
```

然后进入菜单勾选需要的软件包

```
make menuconfig
```

例如Argon主题位于 LuCI > Themes，双击空格选中Argon主题即可

![添加自定义软件源以及定制OP固件 - Cudy TR3000 v1 编译 ImmortalWrt 24.10 操作截图](https://nvcc-v.com/wp-content/uploads/2025/09/1757575755-image-1024x300.webp)

nikki和momo位于 LuCI > Application，找到后双击选中即可，需要的依赖如kmod也会自动勾选

其余软件包可根据自身需要自行决定，如upnp等

如需要F50等CPE USB供网，请在Kernel modules > USB Support选择以下软件包，注：usb网口为eth1

-   kmod-usb-core
-   kmod-usb-net
-   kmod-usb-net-cdc-ether
-   kmod-usb-net-rndis
-   kmod-usb3

保存后即可开始编译了

```
make download
make -j64
```

## 如何刷写？

已是OpenWrt系统直接在 系统 > 备份与升级 > 刷写新的固件，选择bin文件即可
