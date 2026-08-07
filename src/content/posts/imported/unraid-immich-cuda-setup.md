---
title: "UNRAID部署Immich并启用cuda加速"
published: 2025-07-11
description: "这篇文章讲述了如何在 UNRAID 系统中配置 Immich，并启用 CUDA 加速功能。内容包括安装 Docker Compose、编辑配置文件以及调用 GPU。"
image: "/wp-content/uploads/2025/07/1752212557-65d97ac1c14b36223.png_fo742.webp"
tags: ["CUDA加速","Immich应用","UNRAID部署"]
tagPermalinks: ["/tag/cuda-acceleration/","/tag/immich-application/","/tag/unraid-deployment/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/11/unraid-immich-cuda-setup/"
---
## 安装并配置docker-compose

如图所示

![](/wp-content/uploads/2025/07/1752211255-image-1024x442.webp)

创建一个immich的compose项目

![](/wp-content/uploads/2025/07/1752211624-image-1024x524.webp)

编辑compose文件

![](/wp-content/uploads/2025/07/1752211665-image-1024x553.webp)

注意以下几个点

-   本文件只适用于有NVIDIA显卡的用户
-   算力需要>5.3 [cuda算力查询地址](https://developer.nvidia.com/cuda-legacy-gpus)
-   驱动程序>= 545
-   Data Base放在SSD上的用户请注释掉DB\_STORAGE\_TYPE: 'HDD'
-   修改所有/mnt/user/nas/Photos为自己适合的路径

```
name: immich

services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:release
    # extends:
    #   file: hwaccel.transcoding.yml
    #   service: cpu # set to one of [nvenc, quicksync, rkmpp, vaapi, vaapi-wsl] for accelerated transcoding
    volumes:
      - /mnt/user/nas/Photos/libraries:/usr/src/app/libraries
      - /mnt/user/nas/Photos/immich:/usr/src/app/upload
      - /etc/localtime:/etc/localtime:ro
    environment:
      - MACHINE_LEARNING_GPU_ACCELERATION=cuda
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - '2283:2283'
    depends_on:
      - redis
      - database
    restart: always
    healthcheck:
      disable: false
    runtime: nvidia

  immich-machine-learning:
    container_name: immich_machine_learning
    # For hardware acceleration, add one of -[armnn, cuda, rocm, openvino, rknn] to the image tag.
    # Example tag: ${IMMICH_VERSION:-release}-cuda
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}-cuda
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities:
                - gpu
    volumes:
      - /mnt/user/nas/Photos/model-cache:/cache
    restart: always
    healthcheck:
      disable: false

  redis:
    container_name: immich_redis
    image: docker.io/valkey/valkey:8-bookworm@sha256:fec42f399876eb6faf9e008570597741c87ff7662a54185593e74b09ce83d177
    healthcheck:
      test: redis-cli ping || exit 1
    restart: always

  database:
    container_name: immich_postgres
    image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: immich
      POSTGRES_INITDB_ARGS: '--data-checksums'
      # Uncomment the DB_STORAGE_TYPE: 'HDD' var if your database isn't stored on SSDs
      DB_STORAGE_TYPE: 'HDD'
    volumes:
      - /mnt/user/nas/Photos/postgres:/var/lib/postgresql/data
    restart: always
```

保存后点击COMPOSE UP，等待镜像拉取并启动

## 检查GPU状态

进入immich\_server和immich\_machine\_learning的控制台输入

```
nvidia-smi
```

输出显卡信息代表容器调用GPU成功

![](/wp-content/uploads/2025/07/1752212691-image.webp)

## 访问并配置immich

浏览器进入http://\[ip\]:2283，以访问immich，初始化配置后，进入主面板，单击右上角头像-系统管理-设置-机器学习设置-智能搜索-CLIP 模型改为

```
XLM-Roberta-Large-Vit-B-16Plus
```

![](/wp-content/uploads/2025/07/1752212440-image-1024x889.webp)

进入immich\_machine\_learning日志界面，如果识别日志包含CUDA字样表示启用成功

![](/wp-content/uploads/2025/07/1752212502-e3bc0f54dc94ffe5a6a677b1bea49d80-1024x600.webp)

机器学习设置-视频转码设置-硬件加速-加速器API 选择 NVENC

![](/wp-content/uploads/2025/07/1752212423-image-1024x304.webp)
