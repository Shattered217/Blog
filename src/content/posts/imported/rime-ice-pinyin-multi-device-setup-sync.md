---
title: "Rime 雾凇拼音 多端配置及同步 Win-Android-iOS"
published: 2026-03-18
updated: 2026-06-08
description: "在 Windows、Android 与 iOS 上配置雾凇拼音，并通过 WebDAV 和自动化脚本同步用户词库。"
image: "https://nvcc-v.com/wp-content/uploads/2026/03/1773807566-Gemini_Generated_Image_htcbcrhtcbcrhtcb-scaled.png"
tags: ["开发工具"]
tagPermalinks: ["/tag/dev-tools/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2026/03/18/rime-ice-pinyin-multi-device-setup-sync/"
---
## 前言

由于受够了某🐶拼音输入法长期窥探隐私，内存占用过大，Win 端捆绑软件多等问题，故痛定思痛决定抛弃用了数十年的词库转头选择开源输入法 Rime。（实际扔了后发现也没什么大不了的 😐

## 关于 Rime

-   **Rime (核心)：** 是一套强大的开源输入法框架，它本身不直接写字，只负责“怎么把拼音变成汉字”的逻辑。
-   **各端软件 (前端/壳)：** 为了让你在不同设备上用 Rime，开发者做了不同的壳。Windows 上叫**小狼毫 (Weasel)**，macOS 上叫**鼠须管 (Squirrel)**，Linux 上常用 **Fcitx5-Rime**，安卓上则是**小企鹅输入法**。
-   **雾凇拼音 (配置/词库)：** Rime 刚装好时几乎是“白纸”一张，词库单薄且不好用。**雾凇**是目前最火的一套现成的“装修方案”，它提供了极其强大的词库和聪明的纠错规则，把 Rime 瞬间武装成一个输入法利器。

## Windows 端

这是 Rime 输入法的[下载官网](https://rime.im/download/)

我们先从 Windows 开始，下载小狼毫输入法后安装，最好指定用户文件夹，方便我们管理个人配置，其余暂时不用管，等会都会配置的

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 1](https://nvcc-v.com/wp-content/uploads/2026/03/1773795622-image.png)

进入刚刚配置的用户文件夹一键删除配置

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 2](https://nvcc-v.com/wp-content/uploads/2026/03/1773796047-image-1024x553.png)

安装 雾凇拼音，即下载最新的 [release](https://github.com/iDvel/rime-ice/releases) 中的 full.zip 解压到个人文件夹（亦或是git clone也可以）

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 3](https://nvcc-v.com/wp-content/uploads/2026/03/1773796190-image-1024x556.png)

右键输入法选择重新部署后等待一会

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 4](https://nvcc-v.com/wp-content/uploads/2026/03/1773796296-image.png)

进入 输入法设定，仅保留 雾凇拼音，然后再重新部署一下

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 5](https://nvcc-v.com/wp-content/uploads/2026/03/1773796357-image.png)

接下来我们要编辑用户目录下的 installation.yaml 的 installation\_id 字段为自己电脑的名字以配置同步（主要是方便识别），保存后再重新部署一下然后点击 用户资料同步

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 6](https://nvcc-v.com/wp-content/uploads/2026/03/1773796525-image.png)

然后你会发现在目录下多了个 sync 的文件夹，里面有你的个性化配置，我们需要把这个配置分发出去，同时也需要把其他客户端的同步配置复制进来，Rime 会自动处理并合并多端的配置/词库

![Windows 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 7](https://nvcc-v.com/wp-content/uploads/2026/03/1773796632-image-1024x359.png)

我的同步方案是基于 Openlist-WebDAV，没有的小伙伴可以去领取支持 WebDAV 的免费对象存储（网上很多），也可以达到相同的效果。

由于本人用 Win 端较多，所以脚本主要是围绕 Win 端进行，即 Win 端会通过定时任务拉取多端的配置进行合并，以此保证词库最新，所以别的端只需要拉取一次 Win 端的压缩包就可以了。

[PowerShell 脚本](https://github.com/Shattered217/RIME-Sync-Script/raw/refs/heads/main/Rime_Sync_Windows.ps1) （可以加入计划任务每天自动同步）

## 安卓端

安卓端客户端推荐 [说点啥](https://github.com/BryceWG/BiBi-Keyboard)+[改版小企鹅输入法](https://github.com/BryceWG/fcitx5-android-bibi-keyboard)+[Rime 插件](https://github.com/fcitx5-android/fcitx5-android/releases)(plugin.rime)，前者是语音转文字软件（还有剪切板同步功能），后者小企鹅输入法是 Rime 在安卓上的前端实现，但是说点啥的作者给其加了补丁，长按空格可以联动 说点啥 触发语音转文字，让我们在安卓上输入更优雅

安装 小企鹅输入法 和 Rime插件（下载一般选 armv8\_64 ）后会显示插件已加载

![安卓端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 1](https://nvcc-v.com/wp-content/uploads/2026/03/1773802813-image.png)

![安卓端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 2](https://nvcc-v.com/wp-content/uploads/2026/03/1773802594-image.png)

然后我们也需要配置 雾凇拼音，即[下载 full.zip](https://github.com/iDvel/rime-ice/releases) 到 /storage/emulated/0/Android/data/org.fcitx.fcitx5.android/files/data/rime 并解压

然后返回 小企鹅输入法 的配置页面，进入 输入法，删掉里面自带的 拼音，添加 中州韵

![安卓端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 3](https://nvcc-v.com/wp-content/uploads/2026/03/1773803541-image.png)

然后在点击一个对话框进入输入法页面 点击三个点进入 配置页面，点击 雾凇拼音-重新部署 即可享用，后面用到的 同步 按钮也在这里

![安卓端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 4](https://nvcc-v.com/wp-content/uploads/2026/03/1773803453-image.png)

现在我们来配置安卓端的同步（暂时需要 Root 权限）

修改 installation\_id 为手机型号便于识别，文件位于 /storage/emulated/0/Android/data/org.fcitx.fcitx5.android/files/data/rime/installation.yaml

然后我们只要再写一个同步脚本即可实现数据互通（注意 安卓端脚本无法实现调用软件接口同步，所以需要自己在运行脚本前后手动点击同步）

[安卓脚本链接](https://github.com/Shattered217/RIME-Sync-Script/raw/refs/heads/main/Rime_Sync_Android.sh)（推荐使用 MT-管理器 并且勾选 使用 Root 权限执行）

## iPad/iOS 端

iOS 端已经内置了雾凇拼音，故我们仅需要在 APP Store 下载 [Hamster](https://apps.apple.com/cn/app/%E4%BB%93%E8%BE%93%E5%85%A5%E6%B3%95/id6446617683) ，需要配置的点如下

-   输入方案设置 - 保留 雾凇拼音 和 Easy English Nano
-   RIME - 同步文件夹名称（例如iPad）
-   RIME - 选择同步路径 - 推荐：我的iPad/Hamster/Share

同步方面我们使用快捷指令可以优雅地一键完成

[共享链接](https://github.com/Shattered217/RIME-Sync-Script/raw/refs/heads/main/Rime%E5%90%8C%E6%AD%A5-%E5%85%B1%E4%BA%AB.shortcut)

需要修改的点如下

-   共享文件夹选择实际导出的同步文件夹
-   WebDAV 链接按实际填写
-   替换 WebDAV 密钥为 Base64 编码 进入 [Base64在线编码网站](https://www.toolhelper.cn/EncodeDecode/Base64) 在上方填入 账户:密码，生成的就是密钥，如admin:123为YWRtaW46MTIz，生成出来的密码替换掉xxxx，注意前面的Basic和空格均要保留
-   子路径按实际添加

![iPad/iOS 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 1](https://nvcc-v.com/wp-content/uploads/2026/03/1773806914-f82306b39ab682c7cb1c119eb3be41e3_720-1024x711.png)

![iPad/iOS 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 2](https://nvcc-v.com/wp-content/uploads/2026/03/1773806917-9e9d8ed237e4012e770bfe352dec4fe8_720-1024x711.png)

二遍：

本人后续换了 iPhone，实测 元书输入法 用起来似乎更顺手一点（本身 元书 和 仓 也都是一个作者做的），如果大家想体验的话其实也只需要把快捷指令中 仓 的同步换成 元书 的同步就可以了（当然路径也要修改），整体是大差不差的

![iPad/iOS 端 - Rime 雾凇拼音 多端配置及同步 Win-Android-iOS 操作截图 3](https://nvcc-v.com/wp-content/uploads/2026/03/1780901825-image-466x1024.png)
