---
title: "Ubuntu24.04安装多版本CUDA"
published: 2025-07-20
updated: 2026-01-01
description: "在 Ubuntu 24.04 中安装多个 CUDA Toolkit 版本，配置环境变量与命令别名以便快速切换和验证。"
image: "/wp-content/uploads/2025/07/1753006266-Gemini_Generated_Image_9nf0ld9nf0ld9nf0-scaled-1.webp"
tags: ["CUDA","系统运维"]
tagPermalinks: ["/tag/cuda/","/tag/sysadmin/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/20/ubuntu-multi-cuda-setup/"
---
进入[官方下载页](https://developer.nvidia.com/cuda-12-8-0-download-archive?target_os=Linux&target_arch=x86_64&Distribution=Ubuntu&target_version=24.04&target_type=runfile_local)，确认版本无误后开始下载安装

![Ubuntu24.04安装多版本CUDA 操作截图 1](/wp-content/uploads/2025/07/1753000067-image-1024x524.webp)

按空格取消第一个选项（驱动）的勾选，然后选择Install，下一步会出现yes or no选择no

![Ubuntu24.04安装多版本CUDA 操作截图 2](/wp-content/uploads/2025/07/1753000135-image.webp)

等待出现以下代码表示安装成功

```
===========
= Summary =
===========

Driver:   Not Selected
Toolkit:  Installed in /usr/local/cuda-12.8/

Please make sure that
 -   PATH includes /usr/local/cuda-12.8/bin
 -   LD_LIBRARY_PATH includes /usr/local/cuda-12.8/lib64, or, add /usr/local/cuda-12.8/lib64 to /etc/ld.so.conf and run ldconfig as root

To uninstall the CUDA Toolkit, run cuda-uninstaller in /usr/local/cuda-12.8/bin
***WARNING: Incomplete installation! This installation did not install the CUDA Driver. A driver of version at least 570.00 is required for CUDA 12.8 functionality to work.
To install the driver using this installer, run the following command, replacing <CudaInstaller> with the name of this run file:
    sudo <CudaInstaller>.run --silent --driver

Logfile is /var/log/cuda-installer.log
```

然后我们需要配置环境变量以确保两个cuda的共存

```
sudo vim ~/.bashrc
```

添加以下内容来设置

```
alias cuda128='export PATH=/usr/local/cuda-12.8/bin:$PATH; export LD_LIBRARY_PATH=/usr/local/cuda-12.8/lib64:$LD_LIBRARY_PATH'

alias cuda129='export PATH=/usr/local/cuda-12.9/bin:$PATH; export LD_LIBRARY_PATH=/usr/local/cuda-12.9/lib64:$LD_LIBRARY_PATH'
```

修改以下内容选择你需要默认的cuda版本，如果要12.8就替换掉下面的12.9

```
export PATH=/usr/local/cuda-12.9/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda-12.9/lib64:$LD_LIBRARY_PATH
```

验证

```
nvcc --version
cuda128 #用于切换到CUDA12.8版本
nvcc --version
cuda129 #用于切换到CUDA12.9版本
nvcc --version
```

![Ubuntu24.04安装多版本CUDA 操作截图 3](/wp-content/uploads/2025/07/1753000728-image.webp)
