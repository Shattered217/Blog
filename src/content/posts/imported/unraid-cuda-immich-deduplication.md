---
title: "UNRAID下调用cuda实现Immich相似照片去重by Immich-Mediakit"
published: 2025-07-15
description: "这篇文章分享了如何在 UNRAID 系统下，通过 CUDA 调用实现 Immich 的相似照片去重功能，基于 Immich-Mediakit 的实现。"
image: "/wp-content/uploads/2025/07/1752570293-immich-mediakit.webp"
tags: ["NAS","CUDA"]
tagPermalinks: ["/tag/nas/","/tag/cuda/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2025/07/15/unraid-cuda-immich-deduplication/"
---
[上一篇文章](/archives/591 "上一篇文章")介绍了如何在UNRAID下编排部署带GPU加速的Immich容器，这次介绍如何用[immich-mediakit](https://github.com/RazgrizHsu/immich-mediakit)这个项目来实现带GPU加速的相似照片去重

## 修改Immich容器compose文件

主要修改database的port，我们需要将数据库的端口开放出来以便去重服务可以访问

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
    ports:
      - "5432:5432"
```

## Immich-Mediakit容器

新建一个compose文件输入以下内容，重点修改以下几个点

-   /mnt/user/nas/都要修改为自己的路径
-   \- /mnt/user/nas/Photos/immich:/immich:ro是immich的主目录，有thumbs、library等文件夹
-   不要修改qdrant的volumes配置，不然大概率会报错！详细见[Github issue](https://github.com/RazgrizHsu/immich-mediakit/issues/17#issuecomment-3013169653)

```
name: immich-mediakit
services:
  immich-mediakit:
    container_name: immich-mediakit
    hostname: immich-mediakit
    image: razgrizhsu/immich-mediakit:latest-cuda
    restart: unless-stopped
    ports:
      - 8086:8086
    volumes:
      - /mnt/user/nas/immich-mediakit:/app/data                  # mediakit data
      - /mnt/user/nas/immich-mediakit/cache:/root/.cache/torch/  # model cache
      - /mnt/user/nas/Photos/immich:/immich:ro
    env_file:
      - .env
    environment:
      - DASH_DEBUG=false
      - IMMICH_PATH=/immich
    # GPU Support (Linux + NVIDIA GPU only)
    # To enable NVIDIA GPU acceleration:
    # 1. Change image tag to razgrizhsu/immich-mediakit:latest-cuda
    # 2. Uncomment the deploy configuration below
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

    depends_on:
      - qdrant
    healthcheck:
      test: sh -c "curl -f http://localhost:8086/ || exit 1"
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - immich-mediakit

  qdrant:
    container_name: immich-mediakit-qdrant
    image: qdrant/qdrant:dev
    restart: unless-stopped
    ports:
      - 6333:6333
    volumes:
      - qdrant:/qdrant/storage
      #- /mnt/user/nas/immich-mediakit/qdrant:/qdrant/storage
    networks:
      - immich-mediakit

networks:
  immich-mediakit:
    driver: bridge

volumes:
  qdrant:
```

新建一个.env

![](/wp-content/uploads/2025/07/1752568310-image-1024x538.webp)

输入以下内容，重点修改几个地方

-   PSQL\_HOST 输入immich主机的IP，不要输入127.0.0.1
-   其余数据库相关的与自己immich配置对齐，未修改则保持默认即可

```
# MediaKit settings
MKIT_PORT=8086
MKIT_DATA=./data


# Immich library connection (UPLOAD_LOCATION env variable of Immich if you're using Immich with docker compose)
# This folder should contain the 'thumbs', 'library' subfolder from your Immich installation.
IMMICH_PATH=/immich


# PostgreSQL connection to Immich
PSQL_HOST=192.168.101.236
PSQL_PORT=5432
PSQL_DB=immich
PSQL_USER=postgres
PSQL_PASS=postgres

# For different-host setup:
# You must change PSQL_HOST to the IP address of your Immich server
#
# Example:
# Immich running on 192.168.0.100
# MediaKit running on 192.168.0.200
# Change localhost above to 192.168.0.100
```

## 使用Immich-Mediakit

compose up拉取并启动容器，访问http://\[ip\]:8086，等待系统检查全通过即可开始使用

![](/wp-content/uploads/2025/07/1752568655-image.webp)

第一步 点击Fetch获取所有媒体内容

![](/wp-content/uploads/2025/07/1752568736-image-1024x293.webp)

第二步 在Vectors，Quality选择Preview，然后根据自己GPU性能可以选择Batch Size，最后执行Process Assets，开始对内容数据计算并标签

![](/wp-content/uploads/2025/07/1752568774-image-1024x420.webp)

第三步 可以使用默认配置进行Find Similar，亦或是启用Related Tree并关闭Multi Mode，使用相关树来检测并管理照片

![](/wp-content/uploads/2025/07/1752569288-image-1024x514.webp)

![](/wp-content/uploads/2025/07/1752569631-image-1024x514.webp)

如遇到500错误，如，请检查qdrant的volumes配置是否与本文一致，与硬盘格式有关，详细见[issue](https://github.com/RazgrizHsu/immich-mediakit/issues/17#issuecomment-3013169653)

```
Error validating vector storage: Unexpected Response: 500 (Internal Server Error)
Raw response content:
b'{"status":{"error":"Service internal error: 1 of 1 read operations failed:\\n  Service internal error: task 3802 panicked with message \\"called `Result::unwrap()` on an `Err` value: OutputTooSmall { ...'
07:50:16.559|ERRO| Error saving vector for asset 902: Unexpected Response: 500 (Internal Server Error)
Raw response content:
b'{"status":{"error":"Service internal error: 1 of 1 read operations failed:\\n  Service internal error: task
```
