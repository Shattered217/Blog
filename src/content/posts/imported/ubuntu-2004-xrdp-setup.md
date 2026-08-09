---
title: "Ubuntu20.04 XRDP配置"
published: 2025-10-05
updated: 2026-01-10
description: "在 Ubuntu 20.04 上安装 XRDP，配置默认桌面、会话权限与启动参数，从 Windows 远程连接 Linux 图形界面。"
image: "https://nvcc-v.com/wp-content/uploads/2025/10/1768031767-Gemini_Generated_Image_y0lvmjy0lvmjy0lv-scaled.png"
tags: ["网络","系统运维"]
tagPermalinks: ["/tag/network/","/tag/sysadmin/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/10/05/ubuntu-2004-xrdp-setup/"
---
## 安装XRDP

```
sudo apt update
sudo apt install xrdp xserver-xorg-core xserver-xorg-input-all xorgxrdp
sudo adduser xrdp ssl-cert
sudo systemctl restart xrdp
```

## 配置XRDP

编辑 /etc/xrdp/startwm.sh，在`test -x /etc/X11/Xsession && exec /etc/X11/Xsession` 前添加以下内容

```
unset DBUS_SESSION_BUS_ADDRESS
unset XDG_RUNTIME_DIR
```

指定桌面环境

```
echo gnome-session > ~/.xsession
cat <<EOF > ~/.xsessionrc
export GNOME_SHELL_SESSION_MODE=ubuntu
export XDG_CURRENT_DESKTOP=ubuntu:GNOME
export XDG_CONFIG_DIRS=/etc/xdg/xdg-ubuntu:/etc/xdg
EOF
```

输入以下内容以解决登录需要频繁输入密码

```
sudo tee /etc/polkit-1/localauthority/50-local.d/45-allow-colord.pkla > /dev/null <<'EOF'
[Allow Colord all Users]
Identity=unix-user:*
Action=org.freedesktop.color-manager.create-device;org.freedesktop.color-manager.create-profile;org.freedesktop.color-manager.delete-device;org.freedesktop.color-manager.delete-profile;org.freedesktop.color-manager.modify-device;org.freedesktop.color-manager.modify-profile
ResultAny=no
ResultInactive=no
ResultActive=yes
EOF

sudo tee /etc/polkit-1/localauthority/50-local.d/46-allow-update-repo.pkla > /dev/null <<'EOF'
[Allow Package Management all Users]
Identity=unix-user:*
Action=org.freedesktop.packagekit.system-sources-refresh
ResultAny=yes
ResultInactive=yes
ResultActive=yes
EOF

sudo systemctl restart xrdp
```

## 登录XRDP

Windows搜索RDP即可

![登录XRDP - Ubuntu20.04 XRDP配置 操作截图 1](https://nvcc-v.com/wp-content/uploads/2025/10/1759652603-image.webp)

输入主机的IP、用户名、勾选 允许我保存凭据，然后输入密码后即可进入

![登录XRDP - Ubuntu20.04 XRDP配置 操作截图 2](https://nvcc-v.com/wp-content/uploads/2025/10/1759652626-image.webp)

![登录XRDP - Ubuntu20.04 XRDP配置 操作截图 3](https://nvcc-v.com/wp-content/uploads/2025/10/1759652694-image-1024x576.webp)
