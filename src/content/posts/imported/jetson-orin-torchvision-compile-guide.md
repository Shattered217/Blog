---
title: "Jetson Orin TorchVision whl 自编译指南"
published: 2026-01-13
description: "这份指南，将带你一步步从源码构建出torchvision whl。从环境变量设置、依赖库安装到最终测试验证，跟随指南，你将彻底摆脱依赖困境，在边缘设备上自主部署完整的PyTorch视觉生态。"
image: "/wp-content/uploads/2026/01/1768296864-Embedded_Computing_Homepage-Highlights-GenAI-Lab.jpg"
tags: ["深度学习","边缘计算"]
tagPermalinks: ["/tag/%e6%b7%b1%e5%ba%a6%e5%ad%a6%e4%b9%a0/","/tag/%e8%be%b9%e7%bc%98%e8%ae%a1%e7%ae%97/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/13/jetson-orin-torchvision-compile-guide/"
---
## 基础信息

TorchVision 与 Torch 版本[对照表](https://github.com/pytorch/vision?tab=readme-ov-file#installation)

| `torch` | `torchvision` | Python |
| --- | --- | --- |
| `main` / `nightly` | `main` / `nightly` | `>=3.10`, `<=3.14` |
| `2.9` | `0.24` | `>=3.10`, `<=3.14` |
| `2.8` | `0.23` | `>=3.9`, `<=3.13` |
| `2.7` | `0.22` | `>=3.9`, `<=3.13` |
| `2.6` | `0.21` | `>=3.9`, `<=3.12` |

PyTorch 编译教程请[参考](/2026/01/13/jetson-orin-pytorch-whl-build-guide/)

## 构建步骤

拉取项目代码

```
git clone --recursive --branch v0.22.0 https://github.com/pytorch/vision torchvision
cd torchvision
sudo apt-get update && sudo apt-get install -y libjpeg-dev libpng-dev libwebp-dev libavcodec-dev libavformat-dev libswscale-dev ffmpeg
```

使用编译 PyTorch 的虚拟环境

```
source ../pytorch/.venv/bin/activate
uv pip install numpy pillow
```

构建

```
export CPATH="/usr/include/aarch64-linux-gnu:/usr/local/cuda/include:$CPATH"
export LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/local/cuda/lib64:$LIBRARY_PATH"
export LD_LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/local/cuda/lib64:$LD_LIBRARY_PATH"
export FORCE_CUDA=1
export TORCH_CUDA_ARCH_LIST="8.7"

python3 setup.py bdist_wheel
```

whl 输出路径

> ./torchvision/dist/torchvision-0.22.0+9eb57cd-cp312-cp312-linux\_aarch64.whl

安装

```
uv pip install ./dist/torchvision-0.22.0+9eb57cd-cp312-cp312-linux_aarch64.whl
```

## 测试验证

```
python -c "
import torch
import torchvision
print(f'Torchvision Version: {torchvision.__version__}')
input_tensor = torch.rand(5, 4).cuda()
scores = torch.rand(5).	cuda()
try:
    torchvision.ops.nms(input_tensor, scores, 0.5)
    print('✅ CUDA Operators: SUCCESS')
except Exception as e:
    print(f'❌ CUDA Operators: FAILED, error: {e}')
from torchvision.io import image
print('✅ Basic Image IO: Functional')
"
```
