---
title: "\\[新手向\\]大学生白嫖华为云搭建作业备份网盘"
published: 2024-11-25
description: "文章介绍了大学生如何通过华为云免费获取轻量云服务器，用于搭建个人作业备份网盘。作者分享了从注册账号、申请学习代金券，到购买FlexusL实例云服务器的全过程，并说明如何通过更改安全组设置和登录管理界面使用可道云网盘"
image: "/wp-content/uploads/2024/11/image-21.png"
tags: ["华为云白嫖","可道云网盘","学生云实践"]
tagPermalinks: ["/tag/huawei-cloud-free/","/tag/kodbox-setup/","/tag/student-cloud-practice/"]
category: "Linux"
categoryPermalink: "/linux/"
lang: zh_CN
permalink: "/2024/11/25/huawei-cloud-homework-backup/"
---
## 引

上过大学的都知道，，，我们经常需要去机房上各种上机课，其中不乏工程制图(CAD)，编程，数电，计网等课程，在当堂作业没做完时需要带回寝室继续完成，下节课也需要重新带过来提交，如果用U盘，遗忘或丢失的概率较大，如果放在QQ/微信，可能也会面临文件过期，登录复杂等场景。

## 解决方案

刚好朋友发了我一个白嫖华为云轻量云的羊毛路子，故今天带各位不熟悉linux的同学体验一下，顺便可以当做~ftp网盘~（经测试bug太多...遂换可道云），用来存放一些作业

## 注册账号

首先点开此[链接](https://developer.huaweicloud.com/programs/dev-program.html)，注册登录后选择个人方向

![](/wp-content/uploads/2024/11/image-1024x522.png)

进去后简单填写一些基本信息就可以完成注册

![](/wp-content/uploads/2024/11/image-1-1024x522.png)

## 申请代金券

然后进入[开发者空间](https://developer.huaweicloud.com/space/incentive/program-activity)，选择激励管理-计划权益

![](/wp-content/uploads/2024/11/image-2-1024x522.png)

申请第四项学习代金券（云服务），其它申请没用

代金券发放后可以去购买云服务器了

## 购买服务器

进入华为云Flexus服务购买网址

![](/wp-content/uploads/2024/11/image-3-1024x522.png)

选择购买L实例

-   区域选择中国-香港
-   镜像选择可道云
-   实例规格选择36.80元/月
-   购买九个月
-   确保订单金额为331.20就可以下单购买了

![](/wp-content/uploads/2024/11/image-17-1024x522.png)

购买处可以选择代金券支付

## 续费

代金券还剩下69.80可以补3.80元差价再续费两个月，相当于3.80拿下一年的云服务器

我们进入Flexus云服务，然后进入实例控制面板

![](/wp-content/uploads/2024/11/image-18-1024x522.png)

点击更改安全组放行端口，如下图填写放行全部协议和所有端口

![](/wp-content/uploads/2024/11/image-22-1024x511.png)

![](/wp-content/uploads/2024/11/17f67fbc64bee1308fdd89376a03afb3-1024x572.png)

复制下图箭头的管理网址，进入网盘控制面板

![](/wp-content/uploads/2024/11/image-19-1024x522.png)

设置账号并登录就可以使用你的私有云盘了！

![](/wp-content/uploads/2024/11/image-20-1024x522.png)

可玩性很高，可以自己多尝试！

![](/wp-content/uploads/2024/11/image-21-1024x621.png)
