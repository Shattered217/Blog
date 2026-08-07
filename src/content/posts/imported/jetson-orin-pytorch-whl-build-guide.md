---
title: "Jetson Orin PyTorch whl 自编译指南"
published: 2026-01-13
updated: 2026-06-08
description: "本文将为你提供一份详尽的whl自编译指南，教你编译出专为Orin架构优化的PyTorch包。告别通用版本的限制，获得最适合你边缘计算设备的深度学习框架。"
image: "/wp-content/uploads/2026/01/1768296864-Embedded_Computing_Homepage-Highlights-GenAI-Lab.jpg"
tags: ["Jetson","AI"]
tagPermalinks: ["/tag/jetson/","/tag/ai/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/13/jetson-orin-pytorch-whl-build-guide/"
series: { slug: "jetson-whl-build", name: "Jetson WHL 自编译", order: 1 }
---
## 基础信息

| **类别** | **关键参数** | **记录值** | **备注** |
| --- | --- | --- | --- |
| **基础工具** | CMake / GCC | 4.2.1 / 11.4.0 | 建议 CMake > 3.20 |
| **Python** | Version / Path | 3.12.12 / `.venv` | 确保在虚拟环境下编译 |
| PyTorch | Version | 2.7.0 |  |
| **JetPack** | Version | 6.2.1 | 需对应 JetPack 版本 |
| **GPU 架构** | CUDA\_ARCH | **sm\_87** (Orin) | 决定硬件兼容性 |
| **C++ ABI** | CXX11\_ABI | **1** (ON) | 影响第三方库链接 |
| **加速库** | Flash Attention | **ON** | 决定 Transformer 推理性能 |

## 构建步骤

拉取项目代码

```
git clone --recursive --branch v2.7.0 http://github.com/pytorch/pytorch
cd pytorch
sudo apt update && sudo apt-get install python3-pip cmake libopenblas-dev libopenmpi-dev -y
```

创建并激活虚拟环境

```
uv venv .venv --python 3.12
uv pip install -r requirements.txt
uv pip install scikit-build
source .venv/bin/activate
```

构建

```
export PYTORCH_BUILD_VERSION=2.7.0
export PYTORCH_BUILD_NUMBER=1
export TORCH_CUDA_ARCH_LIST="8.7"

export USE_NCCL=0             # 关闭 Jetson 用不上的模块
export USE_DISTRIBUTED=0
export USE_QNNPACK=0
export USE_PYTORCH_QNNPACK=0

export CUDA_HOME=/usr/local/cuda
export PATH=$CUDA_HOME/bin:$PATH
export LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH
export USE_PRIORITIZED_TEXT_FOR_LD=1

export MAX_JOBS=$(nproc)
python3 setup.py bdist_wheel
```

whl 输出路径

> ./pytorch/dist/torch-2.7.0-cp312-cp312-linux\_aarch64.whl

安装

```
uv pip install ./dist/torch-2.7.0-cp312-cp312-linux_aarch64.whl
```

## 测试验证

```
python -c"import torch
print(torch.cuda.is_available())"
```
