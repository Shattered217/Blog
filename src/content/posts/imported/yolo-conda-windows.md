---
title: "Windows 使用Anaconda 搭建 YOLO环境 教程"
published: 2025-08-08
description: "在 Windows 上安装 Anaconda、CUDA 与 PyTorch，创建可运行 YOLO 的 GPU 开发环境。"
image: "/wp-content/uploads/2025/08/1754640927-Gemini_Generated_Image_s0n0tcs0n0tcs0n0.webp"
tags: ["AI","开发工具"]
tagPermalinks: ["/tag/ai/","/tag/dev-tools/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/08/08/yolo-conda-windows/"
---
## 安装Anaconda

为了良好的管理我们的各类环境，首先我们先在c以外的盘创建一个env的文件夹，接下来所有的环境都会安装于此，例如我现在创建在 D:\\env 。

进入[官网](https://www.anaconda.com/download/success)下载conda安装包

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 1](/wp-content/uploads/2025/08/1754552600-image-1024x562.webp)

一路next，直到这边修改安装路径到env

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 2](/wp-content/uploads/2025/08/1754552932-image.webp)

如果你的电脑没有任何Python环境，可以全部勾选

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 3](/wp-content/uploads/2025/08/1754553008-image.webp)

接下来一路next直到Finish，然后准备添加环境变量，搜索 环境变量 并打开

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 4](/wp-content/uploads/2025/08/1754553252-image-1024x875.webp)

根据自己的路径添加以下四条变量

```
D:\env\anaconda3
D:\env\anaconda3\Library\usr\bin
D:\env\anaconda3\Library\bin
D:\env\anaconda3\Scripts
```

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 5](/wp-content/uploads/2025/08/1754553465-image-1024x638.webp)

打开cmd输入conda -V，若有回显则安装成功

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 6](/wp-content/uploads/2025/08/1754553506-image.webp)

接下来要修改环境/包的安装路径以及换源

首先进入C盘找到 用户 文件夹，进入自己电脑用户名的文件夹，找到.condarc文件用记事本打开

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 7](/wp-content/uploads/2025/08/1754553836-image.webp)

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 8](/wp-content/uploads/2025/08/1754553865-image-1024x815.webp)

添加实际的路径用于指定安装环境/包的路径，防止过度占用C盘

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 9](/wp-content/uploads/2025/08/1754553980-image.webp)

添加以下内容进行换源，防止网络问题导致环境拉不下来

![安装Anaconda - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 10](/wp-content/uploads/2025/08/1754554104-image.webp)

```
channels:
  - defaults
default_channels:
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/r
  - https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/msys2
custom_channels:
  conda-forge: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  msys2: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  bioconda: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  menpo: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  pytorch: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  pytorch-lts: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  simpleitk: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud
  deepmodeling: https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/
envs_dirs:
  - D:\env\anaconda3\envs
pkgs_dirs:
  - D:\env\anaconda3\pkgs
```

然后在cmd输入conda init完成初始化，conda至此便安装完成

## 安装CUDA环境

首先先在[NVIDIA APP](https://www.nvidia.cn/software/nvidia-app/)更新最新版的显卡驱动，安装完成后记得重启电脑

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 1](/wp-content/uploads/2025/08/1754554016-image-1024x734.webp)

cmd输入nvidia-smi，确保CUDA Version>12.9

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 2](/wp-content/uploads/2025/08/1754554653-image-1024x547.webp)

接下来进入官网下载最新版[CUDA Toolkit](https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64)安装包，注意版本与上面的CUDA Version一致

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 3](/wp-content/uploads/2025/08/1754554740-image-1024x562.webp)

选择自定义

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 4](/wp-content/uploads/2025/08/1754554773-image.webp)

更改安装位置

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 5](/wp-content/uploads/2025/08/1754554855-image.webp)

安装完成后cmd输入nvcc -V，有回显则安装成功

![安装CUDA环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 6](/wp-content/uploads/2025/08/1754555417-image.webp)

## 构建YOLO虚拟环境

键入以下命令创建名为yolo的conda环境

```
conda create --name yolo python=3.11
```

输入y并回车

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 1](/wp-content/uploads/2025/08/1754556658-image.webp)

输入以下命令激活虚拟环境（注意路径前面的括号则代表激活成功）

```
conda activate yolo
```

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 2](/wp-content/uploads/2025/08/1754556759-image.webp)

进入[PyTorch官网](https://pytorch.org/get-started/locally/)安装GPU版本的PyTorch包，确保选项无误复制安装命令到cmd

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 3](/wp-content/uploads/2025/08/1754556882-image-1024x558.webp)

经过漫长的等待，安装成功

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 4](/wp-content/uploads/2025/08/1754558320-image-1024x510.webp)

输入以下命令检验CUDA是否可用

```
python -c "import torch; print(f'CUDA 是否可用: {torch.cuda.is_available()}')"
```

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 5](/wp-content/uploads/2025/08/1754558568-image-1024x97.webp)

安装YOLO包

```
pip install ultralytics
```

![构建YOLO虚拟环境 - Windows 使用Anaconda 搭建 YOLO环境 教程 操作截图 6](/wp-content/uploads/2025/08/1754558854-image-1024x74.webp)

## 简单使用YOLO

累了，歇会，见下一篇文章吧
