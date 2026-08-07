---
title: "\\[PVE\\]Ubuntu24.04直通A100安装驱动+CUDA+TensorRT教程"
published: 2025-07-19
description: "在PVE系统中，为Ubuntu虚拟机直通 A100 显卡、安装 NVIDIA 驱动、CUDA Toolkit 和 TensorRT。内容涵盖虚拟机设置、环境配置到深度学习工具的完整安装流程。"
image: "/wp-content/uploads/2025/07/1752892481-Gemini_Generated_Image_zbc58ezbc58ezbc5-scaled-1.webp"
tags: ["CUDA安装","PVE直通","TensorRT","显卡驱动"]
tagPermalinks: ["/tag/cuda-installation/","/tag/pve-passthrough/","/tag/tensorrt/","/tag/nvidia-driver/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/19/pve-ubuntu-a100-driver-cuda-tensorrt/"
---
## 前言

本文所有软件包都是基于当前时间点最新的稳定版本，主打一个追新，产品更新迭代很快，希望这个教程可以帮到正在探索的你

## PVE

PVE初始化后安装PVE Tools，可按照网上教程进行配置硬件直通

![](/wp-content/uploads/2025/07/1752882938-image.webp)

## 创建Ubuntu虚拟机

首先下载Ubuntu24.04-desktop的[镜像文件](https://mirrors.tuna.tsinghua.edu.cn/ubuntu-releases/noble/ubuntu-24.04.2-desktop-amd64.iso)，然后在PVE添加虚拟机，需要注意以下几个点

-   BIOS：SeaBIOS（必须！！！）
-   机型：q35
-   处理器类型：host
-   硬盘：勾选SSD仿真（应该不会有人给A100配HDD吧）
-   PCI 设备（A100）：勾选 所有功能、ROM-Bar、PCI-Express

跟着引导走完安装流程，然后记得移除 镜像文件 再重启，进入系统

## 安装NVIDIA Driver

前往[NVIDIA驱动下载页](https://www.nvidia.cn/drivers/lookup/)选择适合的驱动并下载

![](/wp-content/uploads/2025/07/1752883430-image.webp)

输入以下命令安装deb包

```
sudo su
dpkg -i nvidia-driver-local-repo-ubuntu2404-575.57.08_1.0-1_amd64.deb
cp /var/nvidia-driver-local-repo-ubuntu2404-575.57.08/nvidia-driver-local-4C5D6373-keyring.gpg /usr/share/keyrings/
```

输入以下命令开始安装驱动

```
apt update
apt install -y nvidia-driver-575 # 数字要与上面下的deb包对应
echo "blacklist nouveau" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf # 禁用 Nouveau 驱动
echo "options nouveau modeset=0" | sudo tee -a /etc/modprobe.d/blacklist-nouveau.conf # 禁用 Nouveau 驱动
update-initramfs -u
reboot
```

输入以下命令验证驱动安装，若回显正确的信息则说明安装完成（失败请检查虚拟机配置）

```
nvidia-smi
```

![](/wp-content/uploads/2025/07/1752884146-image.webp)

## 安装CUDA Toolkit

下载历史版本的请前往[归档页](https://developer.nvidia.com/cuda-toolkit-archive)自行寻找适合的包安装，最新版前往[latest下载页](https://developer.nvidia.com/cuda-downloads)按下图选择后下载

![](/wp-content/uploads/2025/07/1752884282-image-1024x925.webp)

输入图中的命令，其中 **Driver Installer** 的两条命令分别是安装开源、闭源版本的驱动，一般无特殊需求选择下面的闭源版本即可

```
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda-toolkit-12-9
sudo apt-get install -y cuda-drivers
```

验证安装

```
nvcc -V
```

如果安装成功但是nvcc没有回显，可以在~/.bashrc文件尾添加下面的路径，重新进入Terminal再次输入即可成功验证

```
# CUDA Toolkit paths (managed by update-alternatives)
export PATH=/usr/local/cuda/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
```

## 安装[TensorRT](https://docs.nvidia.com/deeplearning/tensorrt/latest/installing-tensorrt/overview.html)

下载最新的[TensorRT安装包](https://developer.nvidia.com/tensorrt/download/10x)

![](/wp-content/uploads/2025/07/1752886904-image-1024x524.webp)

输入以下命令安装

```
sudo dpkg -i nv-tensorrt-local-repo-ubuntu2404-10.12.0-cuda-12.9_1.0-1_amd64.deb
sudo cp /var/nv-tensorrt-local-repo-ubuntu2404-10.12.0-cuda-12.9/nv-tensorrt-local-A4FCDCCA-keyring.gpg /usr/share/keyrings/
sudo apt update
sudo apt install tensorrt
```

## 配置Python-TRT环境

安装conda

进入[官网](https://www.anaconda.com/download/success)下载安装脚本

![](/wp-content/uploads/2025/07/1752888372-image-1024x524.webp)

运行脚本并安装

```
chmod +x Anaconda3-2025.06-0-Linux-x86_64.sh
./Anaconda3-2025.06-0-Linux-x86_64.sh
```

前三项默认回车即可

![](/wp-content/uploads/2025/07/1752888721-image.webp)

最后询问是否初始化填yes

![](/wp-content/uploads/2025/07/1752888799-image.webp)

重新打开一个Terminal，发现conda已经初始化完成

![](/wp-content/uploads/2025/07/1752888971-image.webp)

如果你不想进入Terminal自动进入base环境，请输入以下命令

```
conda config --set auto_activate_base false
```

现在我们来创建一个名为tensor\_rt的虚拟环境，首先先查看自己的Python版本，我们需要创建相同的Python环境

```
python3 --version
```

![](/wp-content/uploads/2025/07/1752889200-image.webp)

```
conda create -n tensor_rt python=3.12.3
conda activate tensor_rt # 进入名为tensor_rt的虚拟环境
python3 -m pip install --upgrade pip # 更新pip
```

复制系统环境中的trt包到虚拟环境中，首先在虚拟环境中输入以下命令确认虚拟环境包路径

```
python -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())"
```

![](/wp-content/uploads/2025/07/1752891998-image.webp)

确认系统环境的trt包目录

```
ls /usr/lib/python3.12/dist-packages
```

![](/wp-content/uploads/2025/07/1752892074-image.webp)

开始复制

```
cp -r /usr/lib/python3.12/dist-packages/tensorrt* /home/ros/anaconda3/envs/tensor_rt/lib/python3.12/site-packages
```

在conda中验证

```
python -c "import tensorrt as trt; print(trt.__version__)"
```

![](/wp-content/uploads/2025/07/1752892330-image.webp)

大功告成~
