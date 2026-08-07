---
title: "Jetson Orin TensorRT 量化推理 SAM3 示例教程"
published: 2026-01-10
updated: 2026-01-25
description: "这篇教程将手把手带你完成从环境搭建到TensorRT量化推理的全流程，提供有效的避坑指南和优化技巧，让你在边缘上部署SAM3成为可能。"
image: "/wp-content/uploads/2026/01/1768029966-Gemini_Generated_Image_j1sfi6j1sfi6j1sf-scaled.png"
tags: ["Jetson推理","SAM3部署","TensorRT量化"]
tagPermalinks: ["/tag/jetson-inference/","/tag/sam3-deployment/","/tag/tensorrt-quantization/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/10/jetson-orin-tensorrt-sam3-tutorial/"
---
## 本机配置

-   Jetson Orin NX 16G
-   Ubuntu 22.04
-   Jetpack 6.2.1

基本要求：请确保你的 JetPack > 6，SWAP > 20G (很**重要**，不然会 **OOM**)

## 调整最佳性能模式

接下来的操作都需要较高的性能，所以我们通过 jtop 来调整释放最高性能

```
sudo jtop
```

按下 6 键或直接点击 CTRL 进入控制面板

![](/wp-content/uploads/2026/01/1768028418-image-1024x640.png)

将风扇配置调为 cool，Jetson Clocks 开启，能耗模式调整为 MAXN

![](/wp-content/uploads/2026/01/1768028481-image-1024x640.png)

输入以下命令暂时关闭桌面节省内存

```
sudo init 3 # 3 改为 5 或重启恢复桌面
```

## 构建并运行容器环境

首先先拉取我的项目，然后构建基于 pytorch 的深度学习环境

```
git clone -b modelscope https://github.com/Shattered217/SAM3-TensorRT.git
cd SAM3-TensorRT/
sudo docker build -t sam3-trt-aarch64 -f docker/Dockerfile.aarch64 .
```

通过 modelscope 拉取 SAM3 的模型（由于 meta 对 CN 用户不友好，所以如果要去 huggingface 申请仓库访问权限务必使用美国身份，最好主页也跟着改一下，不然大概率被拒

```
sudo apt-get install -y git-lfs # git 拉取大文件必备
git clone https://www.modelscope.cn/facebook/sam3.git
```

运行容器

```
sudo docker run -it --rm \
  --network=host \
  --gpus all \
  --ipc=host \
  --ulimit memlock=-1 \
  --ulimit stack=67108864 \
  --runtime=nvidia \
  --env HF_TOKEN \
  -v "$PWD":/workspace \
  -w /workspace \
  sam3-trt-aarch64 bash
```

## 导出 ONNX

```
python3 python/onnxexport.py
```

注意在导出的脚本中预定义了 prompt 为 “dog”，后期如需修改则要重新导出

## trt 量化编译

```
/usr/src/tensorrt/bin/trtexec --onnx=onnx_weights/sam3_static.onnx --saveEngine=sam3_fp16.plan --fp16 --verbose
```

![](/wp-content/uploads/2026/01/1768030114-image-1024x640.png)

出现 **PASSED** 即测试通过，如果 FAILED 也没事，一般是内存不够导致测试失败了，只要 .plan 生成成功即可

![](/wp-content/uploads/2026/01/1768030191-image-1024x678.png)

## 编译并运行测试程序

编译

```
mkdir cpp/build && cd cpp/build
cmake ..
make
```

由于我们预训练的提示词是 狗 ，所以我们需要准备狗的测试图片，第一个参数的测试集文件夹，第二参数是模型路径，导出图片位于 ./results

```
root@jetson-orin-nx:/workspace/cpp/build# ./sam3_pcs_app test/ ../../sam3_fp16.plan
```

## 效果展示

![](/wp-content/uploads/2026/01/1768030771-image-1024x683.png)

![](/wp-content/uploads/2026/01/1768030787-dog-1024x683.jpeg)

![](/wp-content/uploads/2026/01/1768030838-n02091831_573.jpg)

![](/wp-content/uploads/2026/01/1768030822-n02091831_573.jpg)

特别感谢以下项目

[https://github.com/dataplayer12/SAM3-TensorRT](https://github.com/dataplayer12/SAM3-TensorRT)
