---
title: "Linux编译llama.cpp部署gpt-oss-20b-Q8-gguf"
published: 2025-08-09
description: "在Linux系统上编译llama.cpp源码部署gpt-oss-20b-Q8\\_0.gguf模型，并可通过Cherry Studio接入服务。"
image: "/wp-content/uploads/2025/08/1754739210-d4ab2b97339545a4bc12e4b067611aad.webp"
tags: ["AI","系统运维"]
tagPermalinks: ["/tag/ai/","/tag/sysadmin/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/08/09/linux-llama-deploy-gguf/"
---
## 前言

A100无法推理原生的fp4量化模型，TensorRT-LLM难以部署，故选择了llama.cpp，在使用前记得配置CUDA环境（之前的[教程](/archives/626)有）

## 编译llama.cpp

键入以下命令拉取最新源码并编译llama相关的二进制可执行程序

```
apt-get update
apt-get install pciutils build-essential cmake curl libcurl4-openssl-dev -y
git clone https://github.com/ggml-org/llama.cpp
cmake llama.cpp -B llama.cpp/build \
    -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DLLAMA_CURL=ON -DLLAMA_SERVER=ON
cmake --build llama.cpp/build --config Release -j --clean-first --target llama-cli llama-gguf-split llama-server
```

复制程序到项目根目录便于使用

```
cp llama.cpp/build/bin/llama-* llama.cpp
```

## 拉取gguf

进入[抱脸网](https://huggingface.co/unsloth/gpt-oss-20b-GGUF/tree/main)，选择一个自己想要部署的模型，例如[gpt-oss-20b-Q8\_0.gguf](https://huggingface.co/unsloth/gpt-oss-20b-GGUF/blob/main/gpt-oss-20b-Q8_0.gguf)，如下图点击复制下载链接

![](/wp-content/uploads/2025/08/1754738716-image-1024x514.webp)

新建一个文件夹用于存放gguf并进入

```
mkdir -p gguf/gpt-oss-20b-GGUF | cd gguf/gpt-oss-20b-GGUF/
```

使用wget下载模型

```
wget https://huggingface.co/unsloth/gpt-oss-20b-GGUF/resolve/main/gpt-oss-20b-Q8_0.gguf
```

## 推理gguf模型

```
llama.cpp/llama-server      --model gguf/gpt-oss-20b-GGUF/gpt-oss-20b-Q8_0.gguf     --n-gpu-layers 99     --host 0.0.0.0     --port 8080
```

![](/wp-content/uploads/2025/08/1754739097-image-1024x387.webp)

## 接入Cherry Studio

注意IP+端口，密钥随便填，点击管理会自动给出正在推理的模型

![](/wp-content/uploads/2025/08/1754739114-image.webp)

![](/wp-content/uploads/2025/08/1754739149-image-1024x353.webp)
