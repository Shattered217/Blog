---
title: "手动导出 Microsoft Authenticator 中的2FA密钥"
published: 2024-01-29
description: "手动导出 Microsoft Authenticator 中的2FA密钥"
image: "/wp-content/uploads/2024/01/OIP-C.jpg"
tags: ["安全"]
tagPermalinks: ["/tag/security/"]
category: "Android"
categoryPermalink: "/android/"
lang: zh_CN
permalink: "/2024/01/29/export-microsoft-authenticator-2fa/"
---
转载 文章来源[手动导出 Microsoft Authenticator 中的2FA密钥 | 煮饭🍚 (zhufan.net)](https://zhufan.net/2023/10/05/%E6%89%8B%E5%8A%A8%E5%AF%BC%E5%87%BA-microsoft-authenticator-%E4%B8%AD%E7%9A%84%E5%AF%86%E9%92%A5/)

## 前言

我之前一直在使用 Google Authenticator，后因 Microsoft Authenticator 拥有云备份功能，所以转移到后者。云备份功能可以方便的让我们在更换设备以后无痛进行迁移，但是因为 Microsoft Authenticator 本身没有导出密钥的功能，所以导致我一直无法迁移存量数据到新的其他相关应用。今天找到了破解之道，且没搜索到中文相关内容，简单做下翻译水篇文章，希望能帮到更多屈服于微软淫威之下的人。

## 步骤

-   找到数据
    Microsoft Authenticator 中的2FA密钥数据存储路径为 /data/data/com.azure.authenticator/databases/PhoneFactor。由于是在/data/目录下，所以需要手机Root才能查看到。如果你没有Root也不用怕，完全可以迂回的通过云备份功能同步到其他Root后的手机或者模拟器中再进行操作。
-   读取数据
    PhoneFactor 文件本身是Sqlite数据库文件，所以复制文件时候需要复制PhoneFactor-shm和PhoneFactor-wal这两兄弟（如果有），可以通过Sqlite数据库操作软件来查看具体的数据信息。![](https://img.lu/upload/e62474f70b4288d7edfba.png)想要的数据就在 accounts 表中。我这里就直接让chatgpt写了一个导出脚本。

```
import sqlite3
import uuid
import json

# 连接到SQLite数据库
conn = sqlite3.connect('PhoneFactor')
cursor = conn.cursor()

# 执行SQL查询，仅选择account_type为0的行
cursor.execute("SELECT name, username, oath_secret_key FROM accounts WHERE account_type = 0")

result = []

# 遍历查询结果，并创建所需的JSON对象
for row in cursor.fetchall():
    name, username, secret_key = row
    uuid_str = str(uuid.uuid4())
    otpauthstr = f"otpauth://totp/{name}:{username}?secret={secret_key}"
    result.append({
        "uuid": uuid_str,
        "otpauthstr": otpauthstr
    })

# 关闭数据库连接
conn.close()

# 将结果以JSON格式输出
output_json = json.dumps(result, indent=4)
print(output_json)
```

-   copyaccount\_type为1的是微软本身的账户，为0的是手动添加的第三方账户。
-   导入数据
    拿到数据以后我们可以导入到自己想要使用的任意软件了，可以手动输入secret\_key，也可以直接将上面otpauth://开头的url直接生成二维码进行扫码导入。

本文部分内容参考以下链接：

1.  [https://github.com/beemdevelopment/Aegis/issues/186](https://github.com/beemdevelopment/Aegis/issues/186)
