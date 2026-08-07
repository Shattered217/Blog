---
title: "单卡A100通过TensorRT-LLM量化推理Qwen3-8B简单教程"
published: 2025-07-19
description: "这篇文章讲解如何在单卡 A100 上，通过 TensorRT-LLM 实现 Qwen3-8B 模型的量化推理，内容涵盖环境设置、模型转换及推理运行，适合关注高性能计算的开发者。"
image: "/wp-content/uploads/2025/07/1752912947-Gemini_Generated_Image_jwfzf4jwfzf4jwfz-scaled-1.webp"
tags: ["AI","TensorRT"]
tagPermalinks: ["/tag/ai/","/tag/tensorrt/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/19/a100-tensorrt-llm-qwen3-8b/"
series: { slug: "a100-tensorrt-llm", name: "A100 与 TensorRT-LLM 实战", order: 2 }
---
## 拉取TensorRT-LLM的docker镜像+LLM镜像

需要准备好镜像文件和需要量化推理的模型，本次实验的是[Qwen3-8B](https://www.modelscope.cn/models/Qwen/Qwen3-8B/files)

```
sudo docker run --rm -it \
    --ipc=host \
    --ulimit memlock=-1 \
    --ulimit stack=67108864 \
    --gpus=all \
    -v /home/ros/tensorrt-llm/models:/workspace/models \
    -p 8000:8000 \
    nvcr.io/nvidia/tensorrt-llm/release:1.0.0rc3
```

LLM拉取代码

```
sudo apt install git-lfs
git clone https://www.modelscope.cn/Qwen/Qwen3-8B.git
```

## 安装NVIDIA Container Toolkit

由于上面的镜像+模型较大（30G+15G），所以我们现在来安装给docker用的[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)，依次键入以下命令后重启终端即可

```
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update

export NVIDIA_CONTAINER_TOOLKIT_VERSION=1.17.8-1
  sudo apt-get install -y \
      nvidia-container-toolkit=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      nvidia-container-toolkit-base=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container-tools=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container1=${NVIDIA_CONTAINER_TOOLKIT_VERSION}
```

## TensorRT-LLM基本流程

上述内容都拉取安装完毕后，进入到容器的命令行交互界面，执行三个流程

-   [Convert Checkpoint](https://nvidia.github.io/TensorRT-LLM/architecture/checkpoint.html) 将不同框架权重转换为TRT能识别的检查点

```
python /app/tensorrt_llm/examples/models/core/qwen/convert_checkpoint.py \
    --output_dir /workspace/models/Qwen3-8B-checkpoint \
    --model_dir /workspace/models/Qwen3-8B \
    --dtype float16 \
    --tp_size 1 \
    --pp_size 1 \
    --workers 32 \
    --use_parallel_embedding
```

-   保存 build\_config.json 配置文件，后续可以根据需要快速修改
-   [Build TensorRT Engine](https://nvidia.github.io/TensorRT-LLM/architecture/checkpoint.html#build-checkpoint-into-tensorrt-engine) 构建 TensorRT 引擎

```
{
  "tensor_parallel": 1,
  "pipeline_parallel": 1,
  "max_batch_size": 1,
  "max_input_len": 8192,
  "max_output_len": 8192,
  "max_seq_len": 16384,
  "max_num_tokens": 8192,
  "max_beam_width": 1,
  "opt_num_tokens":8192,
  "gemm_plugin": "float16",
  "gpt_attention_plugin": "float16",
  "remove_input_padding": "enable",
  "context_fmha": "enable",
  "log_level": "info"
}
```

```
trtllm-build \
    --output_dir /workspace/models/Qwen3-8B-engine \
    --checkpoint_dir /workspace/models/Qwen3-8B-checkpoint \
    --build_config /workspace/models/build_config.json \
    --workers 32 \
    --cluster_key A100-PCIe-40GB
```

-   推理构建出的TRT引擎

```
python /app/tensorrt_llm/examples/run.py \
    --engine_dir /workspace/models/Qwen3-8B-engine \
    --tokenizer_dir /workspace/models/Qwen3-8B \
    --input_text "Born in north-east France, Soyer trained as a" \
    --max_output_len 128 \
    --log_level info
```

## OpenAI协议通用Server

```
trtllm-serve serve /workspace/models/Qwen3-8B-engine --tokenizer /workspace/models/Qwen3-8B --host 0.0.0.0 --port 8000 --tp_size 1 --pp_size 1 --max_batch_size 1 --max_seq_len 2048 --max_beam_width 1 --max_num_tokens 1024 --log_level info --num_postprocess_workers 16
```

如何使用 ↓

```
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="tensorrt_llm",
)

response = client.chat.completions.create(
    model="TinyLlama-1.1B-Chat-v1.0",
    messages=[{
        "role": "system",
        "content": "you are a helpful assistant"
    }, {
        "role": "user",
        "content": "Where is New York?"
    }],
    max_tokens=20,
)
print(response)
```

接入Cherry Studio ↓

![](/wp-content/uploads/2025/07/1752912933-image-1024x598.webp)

后端似乎还不支持enable\_thinking这个Qwen3首发的参数，所以随便填一个其它的模型名就可以了
