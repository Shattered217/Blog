---
title: "Jetson Orin Nano编译ONNX Runtime GPU"
published: 2025-11-03
updated: 2026-06-09
description: "在 Jetson Orin Nano 上从源码编译并运行 Immich 深度学习模块的全过程，介绍了如何构建支持 CUDA 的 ONNX Runtime。"
image: "/wp-content/uploads/2025/11/1768031675-Gemini_Generated_Image_z76cp0z76cp0z76c-scaled.png"
tags: ["GPU加速","深度学习","编译环境"]
tagPermalinks: ["/tag/gpu-acceleration/","/tag/%e6%b7%b1%e5%ba%a6%e5%ad%a6%e4%b9%a0/","/tag/compilation-environment/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2025/11/03/jetson-orin-onnx-gpu/"
---
[本机实验配置](https://github.com/Shattered217/Jetson-Orin-Nano-Wheels?tab=readme-ov-file#%EF%B8%8F-system-requirements) (Release中有编译好的whl)

## 编译环境准备

最新版ONNX需要 CMake > 3.28, GCC 11

升级 CMake

```
sudo apt purge cmake -y
sudo apt install -y apt-transport-https ca-certificates gnupg software-properties-common wget
wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | \
  gpg --dearmor - | sudo tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ jammy main' | \
  sudo tee /etc/apt/sources.list.d/kitware.list >/dev/null
sudo apt update
sudo apt install -y cmake
cmake --version
```

![](/wp-content/uploads/2025/11/1762158110-image.webp)

升级 GCC 到 11

```
sudo apt update
sudo apt install -y gcc-11 g++-11
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-10 100
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-11 110
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-10 100
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-11 110
gcc --version
```

![](/wp-content/uploads/2025/11/1762158124-image.webp)

## 编译ONNX

```
git clone --recursive https://github.com/microsoft/onnxruntime
cd onnxruntime
./build.sh --config Release \
  --update --build --parallel --build_wheel \
  --use_tensorrt --use_cuda \
  --cuda_home /usr/local/cuda \
  --cudnn_home /usr/lib/aarch64-linux-gnu \
  --tensorrt_home /usr/lib/aarch64-linux-gnu \
  --cmake_extra_defines CMAKE_CUDA_ARCHITECTURES=87
```

编译到90%+会失败，不用担心，只是测试失败了，删除测试就好了（

```
rm -f onnxruntime/test/providers/cpu/nn/conv_fp16_test.cc
cmake --build build/Linux/Release --config Release -j$(nproc)
./build.sh --config Release \
  --update --build --parallel --build_wheel --skip_tests \
  --use_tensorrt --use_cuda \
  --cuda_home /usr/local/cuda \
  --cudnn_home /usr/lib/aarch64-linux-gnu \
  --tensorrt_home /usr/lib/aarch64-linux-gnu
```

![](/wp-content/uploads/2025/11/1762173021-image.webp)

## 安装并测试ONNXruntime-GPU

我这里使用的是UV管理环境

```
uv pip install ~/onnxruntime/build/Linux/Release/dist/onnxruntime_gpu-*

```

![](/wp-content/uploads/2025/11/1762173310-image.webp)

测试代码

```
python3 - <<'EOF'
import onnxruntime as ort
print("ONNX Runtime:", ort.__version__)
print("Available providers:", ort.get_available_providers())
print("Default device:", ort.get_device())
EOF
```

恭喜 TensorRT 和 CUDA 都已启用加速（在Jetson平台上这条 W：警告⚠️可以忽略）

![](/wp-content/uploads/2025/11/1762173484-image.webp)

## 推理immich-machine-learning

安装UV

```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

拉取代码

```
git clone https://github.com/immich-app/immich.git
cd immich/machine-learning
```

找到pyproject.toml修改依赖文件，将 cuda = \["onnxruntime-gpu>=1.17.0,<2"\] 中的 -gpu 删掉，以及注释掉以下代码

```
#[[tool.uv.index]]
#name = "cuda12"
#url = "https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/#onnxruntime-cuda-12/pypi/simple/"
#explicit = true
#
#[tool.uv.sources]
#onnxruntime-gpu = { index = "cuda12" }
```

然后执行代码安装CPU版本的onnxruntime，目的是马上替换我们上面编译好的GPU版本

```
uv sync --extra cuda
source .venv/bin/activate
uv pip uninstall onnxruntime
uv pip install ~/onnxruntime/build/Linux/Release/dist/onnxruntime_gpu-*
```

在目录下新建一个.env就可以开始跑了

```
export MACHINE_LEARNING_GPU_ACCELERATION=cuda
export NVIDIA_VISIBLE_DEVICES=all
export IMMICH_PORT=3003
```

启动项目

```
python3 -m immich_ml
```

![](/wp-content/uploads/2025/11/1762176481-image-1024x343.webp)
