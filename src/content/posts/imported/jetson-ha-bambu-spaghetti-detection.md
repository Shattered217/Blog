---
title: "基于Jetson与HA的拓竹3D打印机炒面检测方案"
published: 2026-01-01
updated: 2026-01-10
description: "通过Jetson边缘计算设备部署Obico视觉检测服务，结合HA实现全自动监控。当打印机出现挤丝异常时，系统会立即暂停打印并推送通知到你的手机，有效避免耗材浪费。"
image: "/wp-content/uploads/2026/01/1767261352-Gemini_Generated_Image_qnv4cwqnv4cwqnv4-scaled.png"
tags: ["智能家居","AI"]
tagPermalinks: ["/tag/smart-home/","/tag/ai/"]
category: "Jetson"
categoryPermalink: "/linux/jetson/"
lang: zh_CN
permalink: "/2026/01/01/jetson-ha-bambu-spaghetti-detection/"
---
## 前言

由于实验室闲置的板子较多，然后还有两台A1和一台P1S，就尝试在Jetson上端侧部署obico-server实现对炒面的视觉检测。

实际本质就是替换onnxruntime-GPU来实现在Jetson上的高性能推理（实际纯拿CPU硬算也够）

## 安装配置 Home Assistant

安装HA的教程网上有很多了，可以选择适合自己的方式，例如HAOS，这边只是简单演示，故选择使用docker-compose来快速实现

![](/wp-content/uploads/2026/01/1767251853-image-1024x546.png)

首先当然是安装docker-compose

```
sudo apt update
sudo apt install docker-compose -y
```

然后我们新建一个文件夹用来放置compose文件和数据目录

```
version: '3'
services:
  homeassistant:
    image: homeassistant/home-assistant:latest
    container_name: homeassistant
    restart: always
    volumes:
      - ./config:/config
    environment:
      - TZ=Asia/Shanghai
    ports:
      - "8123:8123"
```

在目录下拉取并运行HA

```
sudo docker-compose up -d
```

![](/wp-content/uploads/2026/01/1767252200-image.png)

浏览器进入 IP:8123 ，根据向导页面简单配置一下

![](/wp-content/uploads/2026/01/1767252587-image-1024x519.png)

然后我们接下来需要安装 HACS 以通过 bambu lab 接入 3D打印机

```
sudo docker exec -it homeassistant /bin/bash # 进入容器的命令交互

wget -O - https://get.hacs.vip | bash - # hacs一键安装脚本
```

然后Ctrl+D退出容器，再重启一下容器

```
sudo docker-compose restart
```

进入 设置 - 设备与服务 - 添加集成 - hacs

![](/wp-content/uploads/2026/01/1767253093-image-1024x519.png)

然后就能看到侧边栏多了个 HACS ，进入并且搜索 bambu lab 安装，然后再重启一下HA

![](/wp-content/uploads/2026/01/1767253209-image-1024x519.png)

重启完后再到添加集成里，搜索 bambu lab，根据向导添加打印机即可

![](/wp-content/uploads/2026/01/1767253547-image-1024x519.png)

如图所示添加自定义仓库

![](/wp-content/uploads/2026/01/1767253905-image-1024x519.png)

类型选择 集成，仓库填写

```
https://github.com/nberktumer/ha-bambu-lab-p1-spaghetti-detection
```

然后即可安装炒面检测配套的集成

![](/wp-content/uploads/2026/01/1767254007-image.png)

重启后记得再去集成里面添加一下

![](/wp-content/uploads/2026/01/1767254092-image.png)

最后一步是点击[此链接](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https://github.com/nberktumer/ha-bambu-lab-p1-spaghetti-detection/blob/main/blueprints/spaghetti_detection.yaml)添加自动化蓝图，来实现对3D打印机的自动监测与提醒

![](/wp-content/uploads/2026/01/1767254236-image-1024x519.png)

点击第一个蓝图即可进行配置，当然我们这边还没安装机器学习的服务端，所以暂时先不配置

## 安装 Obico\_ML

上面都是前置的准备工作，这是检测炒面的关键服务，使用onnxruntime来推理视觉模型实现对炒面的检测

在 x86 服务端上，我们只需通过 docker-compose 即可一键拉取运行

```
version: '3.8'

services:
  ha_bambu_lab_p1_spaghetti_detection:
    image: nberk/ha_bambu_lab_p1_spaghetti_detection_standalone:latest
    container_name: ha_bambu_lab_p1_spaghetti_detection
    restart: unless-stopped
    environment:
      - ML_API_TOKEN=bambu_nb
      - TZ=Asia/Shanghai
    ports:
      - "3333:3333"
```

亦或是直接把两个compose文件合并

```
version: '3'
services:
  homeassistant:
    image: homeassistant/home-assistant:latest
    container_name: homeassistant
    restart: always
    volumes:
      - ./config:/config
    environment:
      - TZ=Asia/Shanghai
    ports:
      - "8123:8123"

  ha_bambu_lab_p1_spaghetti_detection:
    image: nberk/ha_bambu_lab_p1_spaghetti_detection_standalone:latest
    container_name: ha_bambu_lab_p1_spaghetti_detection
    restart: unless-stopped
    environment:
      - ML_API_TOKEN=bambu_nb
      - TZ=Asia/Shanghai
    ports:
      - "3333:3333"
```

如果需要 NVIDIA GPU 加速，我们首先需要安装 NVIDIA Container Toolkit

```
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

然后修改 compose 文件，添加 deploy 如下所示

```
ha_bambu_lab_p1_spaghetti_detection:
    image: nberk/ha_bambu_lab_p1_spaghetti_detection_standalone:latest
    container_name: ha_bambu_lab_p1_spaghetti_detection
    restart: unless-stopped
    environment:
      - ML_API_TOKEN=bambu_nb
      - TZ=Asia/Shanghai
    ports:
      - "3333:3333"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

然后重启docker，可以看到日志中已经成功启用了 CUDA

```
sudo docker-compose up -d
sudo docker logs ha_bambu_lab_p1_spaghetti_detection
```

![](/wp-content/uploads/2026/01/1767255612-image-1024x370.png)

如需手动测试可以通过[此脚本](https://github.com/Shattered217/spaghetti_detection/blob/main/test_obico_detection.py)来测试（内嵌了一张炒面图片URL用于测试）

## 安装 Obico\_ML For Jetson Orin

接下来是如何在边缘设备 Jetson Orin 系列上端侧部署，需要 Jetpack > 6，因为 Jetpack 5 可以使用[官方文档](https://www.obico.io/docs/server-guides/platform-specific/jetson_guide/)的方法，也很简单，但由于我手边暂时没有板子跑着5，所以就不测试了

本机配置如下

-   Jetson Orin NX 16G
-   Ubuntu 22.04
-   Jetpack 6.2.1
-   L4T 36.4.7
-   CUDA 12.6.68
-   cuDNN 9.3.0.75
-   TensorRT 10.3.0.30

拉取项目并构建镜像

```
git clone https://github.com/Shattered217/obico-server.git
cd obico-server/ml_api/
bash scripts/build_jetson.sh
```

构建大概需要二十分钟（大部分都是拉取，与网速有关）

![](/wp-content/uploads/2026/01/1767259312-image-1024x640.png)

最后是测试启动容器！一次成功！（没问题可以Ctrl+C先停止）

```
bash scripts/run_jetson.sh
```

![](/wp-content/uploads/2026/01/1767259409-image-1024x640.png)

我们可以编写一个 compose 文件来方便管理这个容器

```
version: '3.8'

services:
  ml-api:
    image: obico-ml-api:jetson
    container_name: obico_ml_api
    runtime: nvidia
    ports:
      - "3333:3333"
    environment:
      - ML_API_TOKEN=bambu_nb
    restart: unless-stopped
```

## 配置自动化

接下来我们回到HA，进入 设置 - 自动化与场景 - 蓝图，选择之前导入的 Bambu 蓝图进行配置

跟着提示按实际填写即可

-   Home Assistant Host HA的地址
-   Obico ML API Host 刚刚配置的Obico ML的地址
-   Obico ML API Auth Token docker中配置的认证密钥 token
-   Printer Print Status Sensor 打印状态
-   Printer Current Stage Sensor 当前阶段
-   Printer Camera Entity 摄像头
-   Printer Pause Button Entity 暂停按钮
-   Printer Resume Button Entity 恢复按钮
-   Printer Stop Button Entity 停止按钮
-   Printer Chamber Light 机箱灯

![](/wp-content/uploads/2026/01/1767260093-image-750x1024.png)

## TG 推送蓝图

上面的蓝图是通过HA官方APP来推送通知，我这边魔改了一个通过TG推送通知并控制的蓝图，通过[此链接](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https://github.com/Shattered217/spaghetti_detection/raw/refs/heads/main/spaghetti_detection.yaml)导入，区别是需要能通过公网来访问HA，其实上面的也需要，不然你在外面岂不是收不到消息了（

![](/wp-content/uploads/2026/01/1767260462-image-721x1024.png)

设置流程多了一个需要去集成中添加 Telegram Bot，注意一定要选择“投票”，即轮询，这样才能接收到用户发送的指令，添加完后在蓝图中就可以选择了

![](/wp-content/uploads/2026/01/1767260540-image.png)
