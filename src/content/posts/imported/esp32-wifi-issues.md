---
title: "ESP32连不上wifi的解决方案"
published: 2025-02-07
description: "学习单片机网络时遇到WiFi连接问题，建议将SSID改为英文或数字，选择混合加密并开启WiFi5兼容模式，最后附上MicroPython网络排查状态。"
image: "/wp-content/uploads/2025/02/61w5cKenUL._AC_SL1500_.jpg"
tags: ["MCU","网络"]
tagPermalinks: ["/tag/mcu/","/tag/network/"]
category: "MCU"
categoryPermalink: "/mcu/"
lang: zh_CN
permalink: "/2025/02/07/esp32-wifi-issues/"
---
今天现在学习到单片机网络相关的知识，发现死活连不上wifi，折腾了一会总结了几个可供参考 排查的要点

-   WiFi名称（SSID）改成英文或数字，不要带中文
-   加密方式选择混合加密（WPA/WPA2）
-   打开WiFI5兼容模式

本人一开始进行了上面两个操作，也试过手机开热点，都不行，最后只能被迫打开WiFi5兼容，这会导致此WLAN下的所有设备无法使用WiFi6，属于最无奈的解决方法

下面附MicroPython的网络排查状态

```
wlan.status() //返回无线连接的当前状态
```

-   `STAT_IDLE` – 没有连接，没有活动-1000
-   `STAT_CONNECTING` – 正在连接-1001
-   `STAT_WRONG_PASSWORD` – 由于密码错误而失败-202
-   `STAT_NO_AP_FOUND` – 失败，因为没有接入点回复,201
-   `STAT_GOT_IP` – 连接成功-1010
-   `STAT_ASSOC_FAIL` – 203
-   `STAT_BEACON_TIMEOUT` – 超时-200
-   `STAT_HANDSHAKE_TIMEOUT` – 握手超时-204
