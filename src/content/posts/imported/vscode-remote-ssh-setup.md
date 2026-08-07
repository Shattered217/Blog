---
title: "vscode基于ssh远程开发配置教程"
published: 2025-06-25
updated: 2026-03-31
description: "这篇文章介绍了如何使用 Visual Studio Code 的 Remote-SSH 插件，实现基于 SSH 的远程开发。内容涵盖创建 SSH 密钥对、导入 Linux 并配置连接设置的详细步骤，帮助用户在本地高"
image: "/wp-content/uploads/2025/06/1750849665-feb3d01245f3e9efe0ee578e2f24c296.webp"
tags: ["开发工具","网络"]
tagPermalinks: ["/tag/dev-tools/","/tag/network/"]
category: "Windows"
categoryPermalink: "/windows/"
lang: zh_CN
permalink: "/2025/06/25/vscode-remote-ssh-setup/"
---
## 前言--为什么需要远程开发？

最近发现同学们开发树莓派、nano、nuc等微电脑时，都是另外连显示屏+键鼠的，亦或是VNC+ssh配合着用，但这绝不是最佳，VNC可能会因为网络波动导致卡顿，所以本次打算介绍vscode上的远程开发插件Remote-SSH，可以理解为在远端安装了vscode，本机电脑只是用作编辑代码和调试，解释器和插件等都是位于远端实现。让你可以在自己的Win上拥有绝佳的开发体验。

## 在Win上创建SSH密钥对

这是为了可以实现免密认证

右键Windows徽标打开终端管理员后输入下面的指令（其中把邮箱改成自己常用的），然后一路回车即可

```
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

![](/wp-content/uploads/2025/06/1750848147-image.webp)

![](/wp-content/uploads/2025/06/1750848616-image.webp)

## 导入到Linux

通过ssh/ftp等，一切你能想到的 能够管理Linux文件的方法，在你的用户目录(例如我的是/home/Shattered)下新建一个.ssh的文件夹，然后将你Win中用户目录下.ssh文件夹的id\_rsa.pub改名成authorized\_keys放入Linux用户目录下的.ssh里

![](/wp-content/uploads/2025/06/1750848860-image-1024x467.webp)

然后重启Linux即可实现密钥登录

可以在 Win 终端输入下面的命令（替换成自己的用户名和ip）测试连接，如果连接失败则尝试搜索Linux开启密钥对登录

```
ssh username@ip
```

![](/wp-content/uploads/2025/06/1750849002-image-1024x224.webp)

如果提示权限错误可在Linux端执行以下命令，赋予文件正确的权限，防止权限太松

```
chmod 700 ~/.ssh
chmod 644 ~/.ssh/authorized_keys
```

## VScode实现Remote-SSH

首先安装Remote-SSH插件

![](/wp-content/uploads/2025/06/1750849191-image.webp)

进入配置编辑，填入以下内容（记得删除注释 不然可能会出问题）

![](/wp-content/uploads/2025/06/1750849254-image-1024x364.webp)

```
Host Pi //自定义名称
    HostName 192.168.101.246  //替换为自己的ip
    User Shattered  //替换为自己的用户名
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_rsa
```

注意，所有的编译器/解释器，甚至包括VScode拓展都是在远程服务器上的，所以可能需要重新安装，然后就可以愉快Code了！
