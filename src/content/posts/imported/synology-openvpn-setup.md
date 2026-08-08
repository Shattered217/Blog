---
title: "基于群晖VPN Server的OpenVPN服务端部署教程"
published: 2023-12-02
updated: 2025-12-26
description: "在群晖 VPN Server 上配置 OpenVPN 服务端和客户端，并通过静态路由实现不同地点设备之间的安全访问。"
image: "/wp-content/uploads/2023/12/OIP.jpg"
tags: ["NAS","网络"]
tagPermalinks: ["/tag/nas/","/tag/network/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2023/12/02/synology-openvpn-setup/"
---
## 前言

由于博主OpenWrt更新，导致原本位于OP上的OpenVPN Server莫名其妙无法启动，又由于高版本安卓目前只兼容IKEv2/IPsec，路由上没有合适的软件包去部署，故选择使用群晖的套件来部署OpenVPN Server，同时也可以为有群晖但没有软路由的同学提供一些参考。

## 实现步骤

-   下载并安装

首先对于群晖是没办法在套件中心直接下载VPN Server的，我们需要在非大陆的群晖官网下载spk

[下載中心 | 群暉科技 Synology Inc.](https://www.synology.com/zh-hk/support/download)

这里选择香港地区的官网，我们首先要选择NAS相关，再选择自己的NAS机型，注意然后要选择正确的版本号，再搜索套件（Ctrl+F），不然是安装不上的。

![实现步骤 - 基于群晖VPN Server的OpenVPN服务端部署教程 操作截图 1](/wp-content/uploads/2023/12/image-3-1024x115.png)

下载后打开群晖套件中心，选择手动安装，然后选择刚刚下载好的spk，安装好后打开VPN Server。

-   设置

打开VPN Server后，先检查权限页面是否给齐。然后选择OpenVPN，勾选启动OpenVPN服务器，通讯协议选择TCP（经个人测试UDP会有一些问题），勾上允许客户端访问服务器的LAN，其余可以保持默认，点击应用后，导出配置文件。

![实现步骤 - 基于群晖VPN Server的OpenVPN服务端部署教程 操作截图 2](/wp-content/uploads/2023/12/image-2-1024x575.png)

-   使用

用记事本打开.ovpn文件

```
remote YOUR_SERVER_IP 1194
```

将第四行的YOUR\_SERVER\_IP改为你的ddns域名

```
redirect-gateway def1
```

同时删掉第20行的这个#，保存后导入客户端就可以愉快使用了！

## 挂载SMB！

首先需要获取群晖root权限

[群晖DSM7.0以上开启ROOT权限教程\_NAS存储\_什么值得买 (smzdm.com)](https://post.smzdm.com/p/allev300/#:~:text=1%E3%80%81%E7%99%BB%E5%BD%95%E7%BE%A4%E6%99%96%EF%BC%8C%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF%E2%9E%A1%E7%BB%88%E7%AB%AF%E6%9C%BA%E5%92%8CSNMP%2C%E5%8B%BE%E9%80%89%E5%90%AF%E5%8A%A8ssh%E5%8A%9F%E8%83%BD%E3%80%82%202%E3%80%81%E5%BC%80%E6%89%93ssh%E5%B7%A5%E5%85%B7%EF%BC%8C%E8%BF%99%E9%87%8C%E4%BD%BF%E7%94%A8%E7%9A%84%E6%98%AFfinalshell%EF%BC%8C%E7%99%BB%E5%BD%95%E7%BE%A4%E6%99%96%E3%80%82,3%E3%80%81%E8%BE%93%E5%85%A5sudo%20-i%E7%84%B6%E5%90%8E%E8%BE%93%E5%85%A5%E7%BE%A4%E6%99%96%E7%99%BB%E5%BD%95%E5%AF%86%E7%A0%81%E8%BF%9B%E5%85%A5root%E6%9D%83%E9%99%90%E3%80%82)

然后通过root登录ssh

```
cd ..
cd etc/samba/
vim smb.conf
```

在末尾输入（其中192.168.101.0替换为自己群晖所在的子网）

```
hosts allow=192.168.101.0/24 10.8.0.0/24 127.0.0.1
interfaces =192.168.101.0/24 10.8.0.0/24
```

保存后在群晖控制面板中关闭再开启smb服务

![挂载SMB！ - 基于群晖VPN Server的OpenVPN服务端部署教程 操作截图 1](/wp-content/uploads/2023/12/image-4-1024x496.png)

然后在Windows资源管理器中输入\\\\192.168.x.x（你的群晖IP）就可以访问目录资源了

![挂载SMB！ - 基于群晖VPN Server的OpenVPN服务端部署教程 操作截图 2](/wp-content/uploads/2023/12/image-5-1024x540.png)

## 体验

使用体验是很好的，配合软路由的OpenClash，你可以在连上OpenVPN后同时访问内“外”网资源。
