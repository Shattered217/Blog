---
title: "Jetson Orin TensorRT whl 自编译指南"
published: 2026-01-13
description: "这篇教程将带你，在Orin设备上成功编译出专属的TensorRT包。我们不仅会列出所需的环境参数和构建步骤，更会帮你避开依赖路径、架构兼容性等常见“坑”，确保你能顺利安装并完成核心功能验证。"
image: "/wp-content/uploads/2026/01/1768296864-Embedded_Computing_Homepage-Highlights-GenAI-Lab.jpg"
tags: ["Jetson开发","TensorRT编译"]
tagPermalinks: ["/tag/jetson-development/","/tag/tensorrt-compilation/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/13/jetson-orin-tensorrt-whl-compilation-guide/"
---
## 基础信息

| **类别** | **关键参数** | **记录值** | **备注** |
| --- | --- | --- | --- |
| **基础工具** | CMake / GCC | 4.2.1 / 11.4.0 | 建议 CMake > 3.20 |
| **Python** | Version / Path | 3.12.12 / `.venv` | 确保在虚拟环境下编译 |
| **GPU 环境** | CUDA / cuDNN | 12.6 / 9.3.0 |  |
| **GPU 架构** | CUDA\_ARCH | **sm\_87** (Orin) | 决定硬件兼容性 |
| **TensorRT** | Version | 10.3.0.26 | 构建产物 |

## 构建步骤

拉取项目代码

```
mkdir -p ~/makenv && cd ~/makenv
git clone --recursive --branch release/10.3 https://github.com/NVIDIA/TensorRT.git
cd ~/makenv/TensorRT/
```

创建虚拟环境

```
uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install setuptools
```

创建 pybind

```
export PYTHON_INCLUDE_DIR=$(python3 -c "from sysconfig import get_paths; print(get_paths()['include'])")
export EXT_PATH=~/makenv/external
git clone https://github.com/pybind/pybind11.git $EXT_PATH/pybind11
mkdir -p $EXT_PATH/python3.12/include
ln -s $PYTHON_INCLUDE_DIR/* $EXT_PATH/python3.12/include/
```

构建

```
export TENSORRT_LIBPATH=/usr/lib/aarch64-linux-gnu
export TRT_OSSPATH=~/makenv/TensorRT
cd $TRT_OSSPATH/python
TENSORRT_MODULE=tensorrt PYTHON_MAJOR_VERSION=3 PYTHON_MINOR_VERSION=12 TARGET_ARCHITECTURE=aarch64 ./build.sh
```

whl输出目录

> ~/makenv/TensorRT/python/build/bindings\_wheel/dist/tensorrt-10.3.0-cp312-none-linux\_aarch64.whl

安装

```
uv pip install ~/makenv/TensorRT/python/build/bindings_wheel/dist/tensorrt-10.3.0-cp312-none-linux_aarch64.whl
```

## 测试验证

最小可用性测试

```
python -c "
import tensorrt as trt

print('TensorRT version:', trt.__version__)

logger = trt.Logger(trt.Logger.INFO)
builder = trt.Builder(logger)

network = builder.create_network(
    1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
)

config = builder.create_builder_config()
config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 20)

print('Builder OK')
print('Network OK')
print('Config OK')
"
```
