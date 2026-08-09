---
title: "Jetson Orin TorchAudio whl 自编译指南"
published: 2026-01-13
description: "在 Jetson Orin aarch64 环境中编译 TorchAudio whl，配置 libsox 与 CUDA 依赖并验证音频处理功能。"
image: "https://nvcc-v.com/wp-content/uploads/2026/01/1768296864-Embedded_Computing_Homepage-Highlights-GenAI-Lab.jpg"
tags: ["Jetson","AI"]
tagPermalinks: ["/tag/jetson/","/tag/ai/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/13/jetson-orin-torchaudio-compile-guide/"
series: { slug: "jetson-whl-build", name: "Jetson WHL 自编译", order: 3 }
---
## **基础信息**

TorchAudio 与 Torch 版本一致

PyTorch 编译教程请[参考](/2026/01/13/jetson-orin-pytorch-whl-build-guide/)

## 构建步骤

拉取项目代码

```
git clone --recursive --branch v2.7.0 https://github.com/pytorch/audio torchaudio
cd torchaudio
sudo apt-get update && sudo apt-get install -y libsox-dev libimage-exiftool-perl libopus-dev libvpx-dev pkg-config
```

使用编译 PyTorch 的虚拟环境

```
source ../pytorch/.venv/bin/activate
```

构建

```
export USE_CUDNN=1
export CUDNN_INCLUDE_DIR=/usr/include
export CUDNN_LIBRARY=/usr/lib/aarch64-linux-gnu/libcudnn.so
export USE_CUDA=1
export TORCH_CUDA_ARCH_LIST="8.7"
export CUDA_HOME=/usr/local/cuda
export CUDNN_HOME=/usr/lib/aarch64-linux-gnu
export PATH=$CUDA_HOME/bin:$PATH
export CPATH="/usr/include/aarch64-linux-gnu:$CPATH"
export LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:$LIBRARY_PATH"

python3 setup.py bdist_wheel
```

注意：虽然包含了路径，但 CUDNN 总是无法被包含，目前不知道如何解决

> \-- USE\_CUDNN is set to 0. Compiling without cuDNN support

whl 输出路径

> ./torchaudio/torchaudio-2.7.0a0+654fee8-cp312-cp312-linux\_aarch64.whl

安装

```
uv pip install ./dist/torchaudio-2.7.0a0+654fee8-cp312-cp312-linux_aarch64.whl
```

## 验证测试

```
python -c "
import torch; import torchaudio; import torchaudio.transforms as T;
print(f'PyTorch version: {torch.__version__}');
print(f'TorchAudio version: {torchaudio.__version__}');
print(f'Available backends: {torchaudio.list_audio_backends()}');
try:
    from torchaudio.utils import ffmpeg_utils;
    print('FFmpeg build config:', ffmpeg_utils.get_build_config());
except ImportError:
    print('FFmpeg utils not available in this version.');
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
print(f'Using device: {device}');
try:
    melspec = T.MelSpectrogram(sample_rate=16000, n_mels=64).to(device);
    waveform = torch.randn(1, 16000).to(device);
    spec = melspec(waveform);
    print('Successfully ran MelSpectrogram on GPU!');
    print(f'Output shape: {spec.shape}');
except Exception as e:
    print(f'GPU operation failed: {e}')
"
```
