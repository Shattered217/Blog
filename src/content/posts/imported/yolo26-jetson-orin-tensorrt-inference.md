---
title: "Jetson Orin 使用 TensorRT 推理 YOLO26"
published: 2026-01-17
updated: 2026-06-10
description: "在 Jetson Orin 上配置 PyTorch 与 TensorRT 环境，将 YOLO26 导出为 TensorRT 引擎并完成推理验证。"
image: "/wp-content/uploads/2026/01/1768636472-Gemini_Generated_Image_iwzs2biwzs2biwzs-scaled.png"
tags: ["Jetson","TensorRT"]
tagPermalinks: ["/tag/jetson/","/tag/tensorrt/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/17/yolo26-jetson-orin-tensorrt-inference/"
---
## 引

还在为边缘端推理掉帧而头疼？YOLO26 + Jetson Orin 或许是目前的终极解决方案。支持全链路量化加速，专为边缘侧算力优化。不用改底层代码，几行命令实现 TensorRT 加速——极简的 YOLO 部署指南。

## 搭建环境

YOLO26 的推理需要 PyTorch（带 CUDA ）和 ultralytics 的包，关于前者可以参考我之前的自编译教程

> [Jetson Orin PyTorch whl 自编译指南](/2026/01/13/jetson-orin-pytorch-whl-build-guide/)

<iframe loading="lazy" class="wp-embedded-content" sandbox="allow-scripts" security="restricted" style="position: absolute; visibility: hidden;" title="《 Jetson Orin PyTorch whl 自编译指南 》—Shattered217のBlog" src="/2026/01/13/jetson-orin-pytorch-whl-build-guide/embed/#?secret=2hNleHcwml#?secret=U071gYsMkw" data-secret="U071gYsMkw" width="600" height="338" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe>

> [Jetson Orin TorchVision whl 自编译指南](/2026/01/13/jetson-orin-torchvision-compile-guide/)

<iframe loading="lazy" class="wp-embedded-content" sandbox="allow-scripts" security="restricted" style="position: absolute; visibility: hidden;" title="《 Jetson Orin TorchVision whl 自编译指南 》—Shattered217のBlog" src="/2026/01/13/jetson-orin-torchvision-compile-guide/embed/#?secret=CBOjhkj7RG#?secret=qg2nTX2W43" data-secret="qg2nTX2W43" width="600" height="338" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe>

如果不想自编译，可以在 [NVIDIA Developer Forums](https://forums.developer.nvidia.com/t/pytorch-for-jetson/72048) 下载官方提供的预编译 torch 和 torchvision，下面给出安装方案

![搭建环境 - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图](/wp-content/uploads/2026/01/1774501393-image-1024x525.png)

```
curl -LsSf https://astral.sh/uv/install.sh | sh  # 首先安装 UV，安装过的可跳过
mkdir -p yolo26
cd yolo26
uv venv .venv --python 3.10 # 创建一个工作区以及虚拟环境
uv pip install ultralytics # 安装 YOLO 官方的超集包
wget https://nvidia.box.com/shared/static/zvultzsmd4iuheykxy17s4l2n91ylpl8.whl -O torch-2.3.0-cp310-cp310-linux_aarch64.whl
wget https://nvidia.box.com/shared/static/u0ziu01c0kyji4zz3gxam79181nebylf.whl -O torchvision-0.18.0a0+6043bc2-cp310-cp310-linux_aarch64.whl
uv pip uninstall torch
uv pip uninstall torchvision
uv pip install torch-2.3.0-cp310-cp310-linux_aarch64.whl
uv pip install torchvision-0.18.0a0+6043bc2-cp310-cp310-linux_aarch64.whl
uv pip install "numpy<2"
# 下载并安装GPU版本的 torch torchvision 以及降级 numpy
```

如果既不想自编译也没有合适的版本 怎么办呢？别急，还可以通过 container 来跑 [dusty-nv/jetson-containers: Machine Learning Containers for NVIDIA Jetson and JetPack-L4T](https://github.com/dusty-nv/jetson-containers) （与本文相关性不太大，后期可能专门出一期教程）

教程已出 /2026/01/17/jetson-container-trt-yolo26-inference-guide/

这里我还是根据自编译的 whl 来跑，因为自由度更高，我也分享了 whl 在 [GitHub](https://github.com/Shattered217/Jetson-Orin-Nano-Wheels) 上，如果 JetPack 为 6.2.x 都可以尝试安装

```
curl -LsSf https://astral.sh/uv/install.sh | sh  # 首先安装 UV，安装过的可跳过

mkdir -p yolo26
cd yolo26
uv venv .venv --python 3.10 # 创建一个工作区以及虚拟环境

uv pip install ultralytics # 安装 YOLO 官方的超集包

wget https://github.com/Shattered217/Jetson-Orin-Wheels/releases/download/6.2.1rc1/torch-2.3.0a0+git97ff6cf-cp310-cp310-linux_aarch64.whl
wget https://github.com/Shattered217/Jetson-Orin-Wheels/releases/download/6.2.1rc1/torchvision-0.18.0-cp310-cp310-linux_aarch64.whl

uv pip install torch-2.3.0a0+git97ff6cf-cp310-cp310-linux_aarch64.whl
uv pip install torchvision-0.18.0-cp310-cp310-linux_aarch64.whl
# 安装 torch 包
```

## 验证 YOLO

```
source .venv/bin/activate
yolo check
```

![验证 YOLO - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图](/wp-content/uploads/2026/01/1768634609-image-1024x705.png)

## 推理 YOLO26

```
# 在虚拟环境下运行
yolo predict model=yolo26n.pt source='https://ultralytics.com/images/bus.jpg'
```

![推理 YOLO26 - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图 1](/wp-content/uploads/2026/01/1768634848-image.png)

![推理 YOLO26 - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图 2](/wp-content/uploads/2026/01/1768634866-bus-768x1024.jpg)

竟然要 143.8ms ?别急，接下来我们将使用 TensorRT 量化加速模型

## 推理 YOLO26 TRT

首先需要安装 onnx

```
uv pip install onnx onnxslim
```

关于 TensorRT，可以通过软链接指向系统的 TRT 包命令如下（但需要虚拟环境与系统的 Python 版本统一，即3.10，不然会报错，如果版本不匹配或其他问题导致的链接失败，请参考 [自编译指南](/2026/01/13/jetson-orin-tensorrt-whl-compilation-guide/)）

```
ln -sf /usr/lib/python3.10/dist-packages/tensorrt* $(python3 -c 'import site; print(site.getsitepackages()[0])')/
python3 -c "import tensorrt; print(f'TensorRT version: {tensorrt.__version__}')"
```

回显版本则说明链接成功

![推理 YOLO26 TRT - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图 1](/wp-content/uploads/2026/01/1768635370-image.png)

然后我们可以开始导出 TRT engine（会报错 onnxruntime-GPU 的问题，不用在意，如果硬要装也可以，[自编译](/2025/11/03/jetson-orin-onnx-gpu/) [Jetson Zoo预编译](https://elinux.org/Jetson_Zoo#ONNX_Runtime) [煮包预编译](https://github.com/Shattered217/Jetson-Orin-Nano-Wheels/releases/tag/6.2.1rc1)。另外，煮包的 Github 预编译仓库里面也有 TRT 的预编译包，安装就不用软链接了，不过并没有什么大区别）

```
yolo export model=yolo26n.pt format=engine half=True device=0
```

![推理 YOLO26 TRT - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图 2](/wp-content/uploads/2026/01/1768635775-image-1024x837.png)

导出成功后然后我们可以继续推理了

```
yolo predict task=detect model=yolo26n.engine source='https://ultralytics.com/images/bus.jpg'
```

![推理 YOLO26 TRT - Jetson Orin 使用 TensorRT 推理 YOLO26 操作截图 3](/wp-content/uploads/2026/01/1768635917-image-1024x228.png)

可以看到 推理速度已经达到个位数了，实验非常成功 ✌️
