---
title: "DeepLearning环境配置教程–OpenCV"
published: 2025-03-14
updated: 2025-12-26
description: "本指南介绍如何构建深度学习环境，使用AnaConda创建虚拟环境，以及安装PyTorch、CUDA和C++编译工具。为避免网络问题，建议购买加速服务，并启用tun模式以优化连接流量。完成后安装Jupyter以完成环"
image: "/wp-content/uploads/2025/03/1FTw5KFD6ApDigX1J1i4KhA.jpg"
tags: ["CUDA安装","OpenCV配置","深度学习环境"]
tagPermalinks: ["/tag/cuda-installation/","/tag/opencv-config-guide/","/tag/deep-learning-environment/"]
category: "Windows"
categoryPermalink: "/windows/"
lang: zh_CN
permalink: "/2025/03/14/deeplearning-opencv-setup/"
---
## 前言

由于深度学习相关的软件包、环境等组件占用较大，建议提前在D盘新建一个Env文件夹用于存放，以下内容都会尽可能将环境放在其它盘

## 环境清单

![](/wp-content/uploads/2025/03/c425eee7d4d1c6878683055fc0bd2f1-1024x973.jpg)

## 安装及使用AnaConda创建虚拟环境

AnaConda是一个Py虚拟环境的管理工具，由于Py软件包之间的版本会相互冲突，所以我们要养成良好的环境管理习惯

[下载地址](https://www.anaconda.com/download/success)

![](/wp-content/uploads/2025/03/image-2.png)

![](/wp-content/uploads/2025/03/image-3.png)

我们需要在自定义的环境文件夹下新建一个Anaconda3的目录，然后修改安装路径

![](/wp-content/uploads/2025/03/image-4.png)

勾选所有直到安装完成即可，然后在cmd中输入conda --version，若有回显则说明安装成功，如没有请检查环境变量

然后我们要进入C://用户/xxx(你的用户名称)，中找到.condarc文件，用记事本打开，并输入

```
envs_dirs:
  - D:\Env\Anaconda3\envs
pkgs_dirs:
  - D:\Env\Anaconda3\pkgs
```

以此实现软件包和环境创建在自定义目录

接下来要通过cmd创建虚拟环境

```
conda create --name DeepLearning python=3.10
conda activate DeepLearning
pip install torch==2.5.0 torchvision==0.20.0 torchaudio==2.5.0 --index-url https://download.pytorch.org/whl/cu124
```

接下来需要安装CUDA和C++生成工具

## 安装CUDA

[CUDA v12.4下载链接](https://alist.shattered.top/d/sky/shareSoftware/DeepLearning/cuda_12.4.0_551.61_windows.exe "CUDA v12.4下载链接")

![](/wp-content/uploads/2025/03/image.png)

![](/wp-content/uploads/2025/03/image-1.png)

切记选择自定义后才可以修改安装位置

安装完成后输入若有回显则表示安装成功

```
nvcc -V
```

## 安装C++编译相关组件

[下载链接](https://alist.shattered.top/d/sky/shareSoftware/DeepLearning/vs_BuildTools.exe)

选择C++并且勾选如图所示的两个组件

![](/wp-content/uploads/2025/03/image-6-1024x550.png)

按需修改安装目录然后安装

![](/wp-content/uploads/2025/03/image-7-1024x550.png)

## 继续安装环境

重新进入cmd然后激活环境

```
conda activate DeepLearning
pip install mmcv-full==1.7.2
```

由于需要从源码编译，故此过程非常非常非常久！耐心等待吧。。。

（也可以直接用我编译好的[下载链接](https://alist.shattered.top/d/sky/shareSoftware/DeepLearning/mmcv_full-1.7.2-cp310-cp310-win_amd64.whl)，编译了一个多小时....失败了两次，所以一共花了三四个小时。。）

安装完后继续安装jupyter即大功告成！

```
pip install jupyter
```
