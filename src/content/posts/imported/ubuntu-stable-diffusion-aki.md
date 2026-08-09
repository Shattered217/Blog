---
title: "Ubuntu 部署 Stable Diffusion 秋叶整合包"
published: 2025-07-20
description: "在 Ubuntu 中安装并运行 Stable Diffusion WebUI 秋叶整合包，涵盖下载、虚拟环境、依赖安装和路径修复。"
image: "https://nvcc-v.com/wp-content/uploads/2025/07/1753007580-00008-3463615227.webp"
tags: ["AI","CUDA"]
tagPermalinks: ["/tag/ai/","/tag/cuda/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/20/ubuntu-stable-diffusion-aki/"
---
## 提示

如果只是想简单运行sd，可以直接运行包内的webui.sh，会自动创建虚拟环境并配置，属于是一键脚本，但是本文主要希望通过cuda12.8+最新的pytorch来运行

## 下载秋叶大佬的整合包

[下载文档](https://bxel2m5tvh.feishu.cn/wiki/UkOuwuc5liaJIbkEIh3cDB6Tnzg) | 解压密码：bilibili-秋葉aaaki，下载cu128的版本

解压命令

```
sudo apt update
sudo apt install p7zip-full
7z x sd-webui-aki-v4.11.1-cu128.7z -pbilibili-秋葉aaaki
```

## 创建并进入虚拟环境

```
conda create -n sd python==3.11
conda activate sd
```

安装cuda12.8的pytorch

```
pip install torch==2.7.1+cu128 torchvision==0.22.1+cu128 --extra-index-url https://download.pytorch.org/whl/cu128
```

安装requirements

```
cd /home/ros/sd-webui-aki-v4.11.1-cu128 # 进入你自己的路径
pip install -r requirements.txt
pip install -r requirements_versions.txt
pip install clip xformers diffusers
```

运行sd程序

```
python webui.py --server-name=0.0.0.0 --api
```

提示有包没安装全，安装就完事了

![创建并进入虚拟环境 - Ubuntu 部署 Stable Diffusion 秋叶整合包 操作截图](https://nvcc-v.com/wp-content/uploads/2025/07/1753002919-image-1024x535.webp)

## 修复路径错误

不知道什么地方程序写错了，导致图片会被创建到‘outputs\\txt2img-images’这个文件夹，\\是Win的目录分隔符，导致网页会读不到创建的图片，所以我们需要创建一个软连接来弥补这个错误

```
cd ~/sd-webui-aki-v4.11.1-cu128
rm -rf outputs/txt2img-images
rm 'outputs\txt2img-images'
mkdir -p outputs/txt2img-images
ln -s ./outputs/txt2img-images 'outputs\txt2img-images'
ls -l | grep 'outputs\\txt2img-images'
```

(二编)亦或是在设置这边改就行了

![修复路径错误 - Ubuntu 部署 Stable Diffusion 秋叶整合包 操作截图 1](https://nvcc-v.com/wp-content/uploads/2025/07/1753007252-image-1024x524.webp)

大功告成！Enjoy it~

![修复路径错误 - Ubuntu 部署 Stable Diffusion 秋叶整合包 操作截图 2](https://nvcc-v.com/wp-content/uploads/2025/07/1753005590-image-1024x524.webp)
