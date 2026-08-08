---
title: "RDK-x5 量化部署YOLO v8模型推理摄像头视频流"
published: 2025-09-22
updated: 2026-01-10
description: "将 YOLOv8 模型量化为 RDK X5 可用格式，并在开发板上部署摄像头视频流实时推理。"
image: "/wp-content/uploads/2025/09/1768031798-Gemini_Generated_Image_541q1x541q1x541q-scaled.png"
tags: ["AI"]
tagPermalinks: ["/tag/ai/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/09/22/yolo-v8-rdk-x5-deployment/"
---
## x86端准备模型

首先在x86端准备好你训练好的YOLO模型，下载[此py](https://github.com/D-Robotics/rdk_model_zoo/raw/refs/heads/main/demos/Vision/ultralytics_YOLO/x86/export_monkey_patch.py)，将模型导出为onnx格式。

> 脚本会使用`ultralytics.YOLO`类对YOLO的`pt`模型进行加载, 使用猴子补丁(Monkey Patch)的方法对模型在PyTorch层面进行替换, 进行并调用`ultralytics.YOLO.export`方法对模型进行导出. 导出的ONNX模型会保存在pt模型同级目录下.

```
python export_monkey_patch.py --pt best.pt
```

然后需要一个性能较强的docker环境用于生成专为RDK优化的二进制文件，以下是compose文件

```
version: '3.8'

services:
  ai-toolchain-x5:
    image: openexplorer/ai_toolchain_ubuntu_20_x5_cpu:v1.2.8

    container_name: rdk-toolchain

    volumes:
      - ./rdk_ws:/rdk_ws

    working_dir: /rdk_ws
    stdin_open: true
    tty: true
```

将导出的onnx放入./rdk\_ws目录中，将一些验证集的图片（约几十张）放入./rdk\_ws/cal目录中，然后进入docker交互终端并下载一键YOLO转换脚本

```
sudo docker-compose up -d
sudo docker exec -it rdk-toolchain /bin/bash
wget https://github.com/D-Robotics/rdk_model_zoo/raw/refs/heads/main/demos/Vision/ultralytics_YOLO/x86/mapper.py
```

脚本的参数如下

-   \--onnx 指定输入的原始 ONNX 模型文件路径
-   \--cal-images 指定用于校准的图片数据集路径，以减少精度损失
-   \--quantized 设置量化策略
-   \--optimize-level 设置编译优化的等级，可选-O0 -O1 -O2 -O3，数字越大越好越慢
-   \--jobs 编译线程
-   \--save-cache 保留缓存

我的命令如下，可根据实际修改

```
python3 mapper.py --onnx best.onnx --cal-images cal --jobs 64 --optimize-level O3
```

然后会输出一个.bin的二进制文件，这就是ARM端所需要的特制模型

## RDK端推理模型

可以先安装uv用于环境管理

```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

拉取官方SDK

```
git clone https://github.com/D-Robotics/rdk_model_zoo.git
cd rdk_model_zoo/demos/Vision/ultralytics_YOLO
```

创建一个虚拟环境并激活，以及安装需要的依赖包

```
uv venv --python 3.10 venv
source venv/bin/activate
uv pip install ultralytics
uv pip install hobot_dnn_rdkx5
uv pip install "numpy<2.0"
```

运行测试脚本

```
python3 py/Ultralytics_YOLO_Detect_YUV420SP.py
```

![RDK端推理模型 - RDK-x5 量化部署YOLO v8模型推理摄像头视频流 操作截图](/wp-content/uploads/2025/09/1758529003-image-965x1024.webp)

## 调用免驱摄像头检测

下载[此脚本](https://github.com/Shattered217/RDK-x5-Cam-YOLO/raw/refs/heads/main/realtime_camera_yolo.py)，用于调用摄像头并推理模型的示例文件

```
python realtime_camera_yolo.py --model-path best_bayese_640x640_nv12.bin
```

## 参考文档

官方教程 [rdk\_model\_zoo/demos/Vision/ultralytics\_YOLO/README\_cn.md at main · D-Robotics/rdk\_model\_zoo](https://github.com/D-Robotics/rdk_model_zoo/blob/main/demos/Vision/ultralytics_YOLO/README_cn.md)
