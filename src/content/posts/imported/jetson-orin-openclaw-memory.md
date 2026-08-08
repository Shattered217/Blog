---
title: "Jetson Orin 部署 OpenClaw 开启 Memory Search"
published: 2026-06-14
description: "在 Jetson Orin 上自编译带 CUDA 支持的 llama.cpp，为 OpenClaw Memory Search 部署本地向量模型服务并验证 GPU 推理。"
image: "/wp-content/uploads/2026/06/1781372812-ChatGPT-Image-2026年6月14日-01_46_41.png"
tags: ["Jetson","AI"]
tagPermalinks: ["/tag/jetson/","/tag/ai/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/06/14/jetson-orin-openclaw-memory/"
---
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

![推理模型 - Jetson Orin 部署 OpenClaw 开启 Memory Search 操作截图 1](/wp-content/uploads/2026/06/1781372250-image-1024x976.png)

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

![推理模型 - Jetson Orin 部署 OpenClaw 开启 Memory Search 操作截图 2](/wp-content/uploads/2026/06/1781372551-image-1024x822.png)
