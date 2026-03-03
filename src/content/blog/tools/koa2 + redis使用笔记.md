---
id: 1ef3b5b5-5f66-6ad0-9846-ac1b4e440327
title: koa2 + redis使用笔记
alias:
cover:
created_time: 2018-04-18 21:23:14
updated_time: 2018-04-18 21:23:14
categories:
  - nodejs
tags:
excerpt: 安装redisyum install redis启动服务systemctl start redis添加开机启动项systemctl enable redisredis配置修改配置文件 /etc/redis.conf注释掉 bind 127.0.0.1去掉#requirepass foobared的注
published: true
---

### 安装redis

```bash
yum install redis
```

### 启动服务

```bash
systemctl start redis
```

### 添加开机启动项

```bash
systemctl enable redis
```

<!-- more -->

### redis配置

修改配置文件 /etc/redis.conf

- 注释掉 bind 127.0.0.1
- 去掉#requirepass foobared的注释并设置密码

未完
