---
title: "在PVE上直通核显给群晖搭配alist挂载实现自建影库"
published: 2023-06-14
updated: 2025-12-26
description: "想打造一个能硬解4K原盘、聚合全网云盘资源的私人影库，却苦于技术门槛？别再羡慕别人的完美方案了。本文将手把手教你，如何在PVE虚拟机上安装黑群晖，并直通核显给Jellyfin实现强悍的硬件解码。你将学会通过Alis"
image: "/wp-content/uploads/2023/06/cover.png"
tags: ["NAS","系统运维"]
tagPermalinks: ["/tag/nas/","/tag/sysadmin/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2023/06/14/pve-hack-synology-alist/"
---
## 配合视频教程食用更佳！

[https://www.bilibili.com/video/BV1Hh4y1X7ag/](https://www.bilibili.com/video/BV1Hh4y1X7ag/)

## 思路

在PVE虚拟机平台上安装q35黑群晖，直通核显给群晖用于jellyfin硬解，再通过alist挂载多方云盘，利用CloudDrive对接alist的web dav实现挂载至本地，并由jellyfin进行影视作品的刮削。

## 安装群晖

首先下载引导镜像以及pat文件，本人这边的选择是DS918+ 7.0.1-42218,也可根据自身需求安装其它系统。

[https://pan.quark.cn/s/9793ea3350da](https://pan.quark.cn/s/9793ea3350da)

[](/2023/06/14/pve-hack-synology-alist/)[官方pat文件](https://archive.synology.cn/download/Os/DSM/7.0.1-42218)：在PVE上直通核显给群晖搭配alist挂载实现自建影库

然后将img引导文件上传至local，创建虚拟机，操作系统选择不使用任何介质，机型选择q35，硬盘选择SATA，大小为1G，CPU根据自身情况选择，也可选择host，内存根据自身情况修改，其余没说的默认即可。

选中刚创建的虚拟机，点击硬件，选中硬盘，分离后删除即可。

然后ssh连接PVE

输入**qm importdisk+空格+虚机VMID+空格+刚复制的的固件路径+空格+local-lvm**

(注意我这边不加-lvm是因为lvm空间不够了...正常是需要加上的)

```
qm importdisk 104 /var/lib/vz/template/iso/ds918.img local
```

出现Successful后在web管理页面中就能看到一块未使用的磁盘，双击后设备选择SATA（可勾选SSD仿真）添加即可，同时添加一块不小于20G的硬盘（可勾选SSD仿真）用于安装群晖的系统。同时将BIOS修改为OVMF（UEFI）

然后点击选项修改引导顺序，仅勾选引导盘随后启动即可。

启动后进入控制台选择第二项并回车

![](http://154.17.6.113/wp-content/uploads/2023/06/image-1024x529.png)

![](http://154.17.6.113/wp-content/uploads/2023/06/image-1-1024x223.png)

随后这里会卡住，不必惊慌，这是正确的，然后就是耐心等待，前往路由端查看群晖IP后访问，然后根据提示安装提前下好的pat文件，待群晖重启后即可正常访问并设置基本信息。

## 安装Jellyfin

进入套件中心-设置-套件来源-新增

名称填入 我不是矿神

位置填入 [矿神群晖SPK套件源DSM7.x by IMNKS.COM](https://spk7.imnks.com/)

然后搜索jellyfin，选择第一个进行下载并安装即可。

进入jellyfin后简单设置（注意国家/地区选择 People's Republic of China）

注意在添加媒体库前，需要先前往群晖进入文件夹属性页面，给jellyfin授权，并勾选应用到这个文件夹、子文件夹及文件，不然是看不到文件夹的。

## 设置核显直通

为什么要设置直通硬解？有的人可能会认为我只在家里，内网带宽充足，是不是就不需要了，其实这是个误区，有些mkv后缀名的原盘电影，是必须要核显硬解的，不然是无法播放的，当然你也可以通过第三方客户端实现本地解码。

首先我们先下载PVEtools

1.先删除企业源：
rm /etc/apt/sources.list.d/pve-enterprise.list

2.安装
export LC\_ALL=en\_US.UTF-8
apt update && apt -y install git && git clone https://github.com/ivanhao/pvetools.git

3.启动工具（cd到目录，启动工具）
cd pvetools
./pvetools.sh

然后选择中文-i 配置PCI硬件直通-a 配置开启物理机硬件直通支持-根据提示重启

重启后再进入该页面选择c 配置显卡直通-a 配置物理机显卡直通支持-根据提示重启

![](http://154.17.6.113/wp-content/uploads/2023/06/image-2.png)

返回PVE web界面，选定群晖虚拟机-硬件-添加-PCI设备-设备选择核显-勾选四个钩-添加即可。

![](http://154.17.6.113/wp-content/uploads/2023/06/image-3-1024x512.png)

进入jellyfin-控制台-播放-硬件加速选择QSV或者VAAPI，拉到最下方保存即可实现硬解。

![](http://154.17.6.113/wp-content/uploads/2023/06/image-4-1024x514.png)

## Jellyfin SSL访问

我们不在家时想通过公网实现非常简单，端口转发这里就不多说了，主要是如何配置SSL。

进入jellyfin控制台-联网-允许与此服务器进行远程连接 打钩-将DNS服务商处下载的IIS（pfx文件）证书放入群晖并给予jellyfin访问权限，或者通过证书转换将你的pem证书转换成pfx证书。

在jellyfin中选择证书并且输入证书密码保存后重启即可。

[SSL证书格式转换工具-中国数字证书CHINASSL](https://www.chinassl.net/ssltools/convert-ssl.html)

![](http://154.17.6.113/wp-content/uploads/2023/06/image-5-1024x483.png)

## 挂载云盘

首先在套件中心安装Alist网盘和CloudDrive2，然后登陆alist后台进入管理，根据自身情况登陆适合的网盘，注意选择本地代理。

再进入CloudDrive2添加web dav。服务器填写http://群晖IP:端口/dav，用户名密码即使用alist的。

注意挂载后也要给予权限，然后在jellyfin中添加媒体库即大功告成啦！

## 刮削动漫

添加媒体库 Bangumi

[https://jellyfin-plugin-bangumi.pages.dev/repository.json](https://jellyfin-plugin-bangumi.pages.dev/repository.json)

添加媒体库
