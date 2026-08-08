---
title: "在 Jetson 上通过容器 trt 推理 YOLO26 指南"
published: 2026-01-17
updated: 2026-06-09
description: "在 Jetson 上使用 jetson-containers 构建 PyTorch 与 TensorRT 环境，完成 YOLO26 导出和 TensorRT 推理验证。"
image: "/wp-content/uploads/2026/01/1768647505-Gemini_Generated_Image_e5ctiee5ctiee5ct-scaled.png"
tags: ["Jetson","TensorRT"]
tagPermalinks: ["/tag/jetson/","/tag/tensorrt/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/17/jetson-container-trt-yolo26-inference-guide/"
---
## 前言

上篇[教程](/2026/01/17/yolo26-jetson-orin-tensorrt-inference/)是通过虚拟环境来管理环境，这篇教程尝试通过容器技术来构建高大全的镜像以此来推理 YOLO

## 构建容器

注意煮包的运行环境是 JetPack 6.2.1 \[L4T 36.4.7\]，如果不符需要寻找适合自己的镜像 JP

```
# 查看 L4T 版本
cat /etc/nv_tegra_release
jetson_release
```

示例如下

![构建容器 - 在 Jetson 上通过容器 trt 推理 YOLO26 指南 操作截图 1](/wp-content/uploads/2026/01/1768638436-image-1024x526.png)

如果 L4T \['>=35'\] 前往 [jetson-containers/packages/pytorch at master · dusty-nv/jetson-containers](https://github.com/dusty-nv/jetson-containers/tree/master/packages/ml/pytorch)

如果 L4T \['<=35'\] 前往 [jetson-containers/packages/ml/l4t/l4t-pytorch at master · dusty-nv/jetson-containers](https://github.com/dusty-nv/jetson-containers/tree/master/packages/ml/l4t/l4t-pytorch)

根据文档的要求选择适合的镜像，使用以下代码来运行，例如匹配我的版本是 2.7-r36.4.0

```
# 安装容器工具
git clone https://github.com/dusty-nv/jetson-containers
bash jetson-containers/install.sh

# 指定版本拉取并运行容器
jetson-containers run dustynv/pytorch:2.7-r36.4.0

# 自动选择适合的镜像
jetson-containers run $(autotag pytorch)
```

如果没找到合适的镜像进行 build 的话可能会遇到以下报错，原因是 Jetson Orin （或更老）上的 docker 不支持 --gpus=all 这个参数

![构建容器 - 在 Jetson 上通过容器 trt 推理 YOLO26 指南 操作截图 2](/wp-content/uploads/2026/01/1768638805-image-1024x579.png)

选择自己喜欢的文件编辑器修改 /etc/docker/daemon.json，在 "default-runtime" 和 "runtimes" 字段中与下面保持一致，然后重新 build，放心，优秀的 docker 有缓存机制，会自中断点后构建，不会重来

```
{
    "default-runtime": "nvidia",
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

## 推理 YOLO

等待拉取完成后就会进入容器的命令交互界面

![推理 YOLO - 在 Jetson 上通过容器 trt 推理 YOLO26 指南 操作截图 1](/wp-content/uploads/2026/01/1768645543-image-1024x579.png)

```
mkdir -p /root/yolo
cd /root/yolo

apt-get update && apt-get install -y libgl1 libglib2.0-0
pip3 install ultralytics -i https://pypi.tuna.tsinghua.edu.cn/simple
pip3 install "numpy<2" "opencv-python<4.10" -i https://pypi.tuna.tsinghua.edu.cn/simple
```

验证

```
yolo check
```

![推理 YOLO - 在 Jetson 上通过容器 trt 推理 YOLO26 指南 操作截图 2](/wp-content/uploads/2026/01/1768646743-image.png)

使用 Pytorch 推理

```
yolo predict model=yolo26n.pt source='https://ultralytics.com/images/bus.jpg'
```

> Speed: 6.1ms preprocess, 143.9ms inference, 15.2ms postprocess per image at shape (1, 3, 640, 480)

构建 TensorRT 推理引擎

```
pip3 install onnxslim -i https://pypi.tuna.tsinghua.edu.cn/simple
yolo export model=yolo26n.pt format=engine half=True device=0
# onnxruntime 报错不用管
```

推理引擎

```
yolo predict task=detect model=yolo26n.engine source='https://ultralytics.com/images/bus.jpg'
```

> Speed: 6.4ms preprocess, 5.2ms inference, 13.4ms postprocess per image at shape (1, 3, 640, 640)
