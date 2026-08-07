---
title: "Jetson Orin 部署 OpenClaw 开启 Memory Search"
published: 2026-06-14
description: "你的Jetson Orin刚部署好记忆搜索，结果发现llama.cpp在ARM上死活不调用CUDA——推理速度慢到像在用CPU跑大模型。别急着换硬件，问题出在官方预编译产物上。实测自编译CUDA支持后，batch"
image: "/wp-content/uploads/2026/06/1781372812-ChatGPT-Image-2026年6月14日-01_46_41.png"
tags: ["CUDA加速","Jetson推理","llama.cpp"]
tagPermalinks: ["/tag/cuda-acceleration/","/tag/jetson-inference/","/tag/llama-cpp/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/06/14/jetson-orin-openclaw-memory/"
---
AI智能摘要

你的Jetson Orin刚部署好记忆搜索，结果发现llama.cpp在ARM上死活不调用CUDA——推理速度慢到像在用CPU跑大模型。别急着换硬件，问题出在官方预编译产物上。实测自编译CUDA支持后，batch size直接拉到1024，GPU占用飙满，推理延迟骤降。但你知道编译时那个\`CMAKE\_CUDA\_ARCHITECTURES=87\`的参数设错了会有多致命吗？这篇手把手教程把坑都踩平了，照着做就能让小龙虾的记忆搜索跑出桌面级性能——省下你至少三天瞎折腾的时间。

— AI 生成的文章内容摘要

主播最近把小龙虾迁移到 Orin NX 上了，然后发现小龙虾的记忆搜索功能依托的是 node.llama.cpp，但是在 ARM 设备上编译出的产物似乎不支持 CUDA 加速，故决定自编译以支持高性能计算推理

## 编译llama.cpp

键入以下命令拉取最新源码并编译llama相关的二进制可执行程序

```
apt-get update
apt-get install pciutils build-essential cmake curl libcurl4-openssl-dev -y
git clone https://github.com/ggml-org/llama.cpp

cmake -S llama.cpp -B llama.cpp/build \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DGGML_CUDA=ON \
    -DCMAKE_CUDA_ARCHITECTURES=87 \
    -DLLAMA_CURL=ON \
    -DLLAMA_SERVER=ON

cmake --build llama.cpp/build -j$(nproc) \
    --target llama-cli llama-gguf-split llama-server
```

复制程序到工作区便于使用，以及下载模型

```
mkdir -p llama-ws
cp llama.cpp/build/bin/llama-* llama-ws

wget -O llama-ws/embeddinggemma-300m-qat-Q8_0.gguf \
  "https://huggingface.co/ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/resolve/main/embeddinggemma-300m-qat-Q8_0.gguf"
```

## 推理模型

进入工作区运行命令推理即可，然后可以让小龙虾写一个 systemctl 启动项，方便管理，并让它自己把记忆搜索的服务接入 http://127.0.0.1:8080 这个端点就行

```
cd llama-ws
./llama-server --model /home/ros/llama.cpp/embeddinggemma-300m-qat-Q8_0.gguf --embedding --n-gpu-layers 99 --batch-size 1024 --ubatch-size 1024 --cache-ram 0 --host 127.0.0.1 --port 8080
```

![](/wp-content/uploads/2026/06/1781372250-image-1024x976.png)

当然如果你实在想自己接 大概就是这样（ 位于文件 openclaw.json 的 agent.defaults 字段下面

```
"memorySearch": {
        "enabled": true,
        "sources": [
          "memory",
          "sessions"
        ],
        "provider": "openai-compatible",
        "fallback": "none",
        "remote": {
          "baseUrl": "http://127.0.0.1:8080/v1",
          "apiKey": "llama-local"
        },
        "model": "embeddinggemma-300m-qat-Q8_0.gguf"
      }
```

设置 1024 的 batchsize 基本能够使用，如果不够后面自己再调大吧，运行占用如下

![](/wp-content/uploads/2026/06/1781372551-image-1024x822.png)
